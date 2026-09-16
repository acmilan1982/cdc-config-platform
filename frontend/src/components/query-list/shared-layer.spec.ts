import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * 公共层结构契约（SHARED_COMPONENT_DESIGN §7.5.3、§7.3.2、§7.3.3、§8）：
 * 1) 常驻 Spinner 的几何规则在公共层内**只有一份文本来源**（两个组件各自 scoped 作用域内声明完全一致）；
 *    颜色一律 currentColor，不写死颜色，保证与按钮文字色一致且随主题变化。
 * 2) 第一轮明确「推迟到第二个消费者出现再做」的 3 个 composable 与「合并进结果面板」的薄包装组件
 *    在本轮**不得存在**（连空文件/别名/占位都不允许）。
 */

const QUERY_LIST_DIR = resolve(process.cwd(), 'src/components/query-list')
const SRC_DIR = resolve(process.cwd(), 'src')

function source(file: string): string {
  return readFileSync(join(QUERY_LIST_DIR, file), 'utf8')
}

function styleOf(file: string): string {
  const style = source(file).match(/<style[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? ''
  return style.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** 剥离 `@media` 块（单层嵌套），只保留基础层规则。 */
function withoutMedia(file: string): string {
  return styleOf(file).replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '')
}

function spinnerRule(file: string): string {
  return withoutMedia(file).match(/\.ql-btn-spinner\s*\{([^}]*)\}/)?.[1] ?? ''
}

function normalize(rule: string): string {
  return rule
    .split(';')
    .map((decl) => decl.trim())
    .filter((decl) => decl !== '')
    .sort()
    .join(';')
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

describe('常驻 Spinner 唯一几何来源与 currentColor（§7.5.3）', () => {
  it('两个组件各只有一条核心几何规则（不重复声明、不层层覆盖）', () => {
    for (const file of ['QueryListActions.vue', 'QueryListRefreshToolbar.vue']) {
      expect(withoutMedia(file).match(/\.ql-btn-spinner\s*\{/g) ?? [], file).toHaveLength(1)
      expect(withoutMedia(file).match(/\.ql-btn-spinner\.is-visible\s*\{/g) ?? [], file).toHaveLength(1)
    }
  })

  it('reduced-motion 只覆盖动画本身，不复制几何声明', () => {
    for (const file of ['QueryListActions.vue', 'QueryListRefreshToolbar.vue']) {
      const style = styleOf(file)
      const media = style.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*)\}\s*$/)
      expect(media, file).not.toBeNull()
      const overrides = [...media![1]!.matchAll(/([.#][\w-]+)[^{]*\{([^}]*)\}/g)]
      expect(overrides.length, file).toBeGreaterThan(0)
      for (const [, selector, body] of overrides) {
        if (selector === '.ql-btn-spinner') {
          // 仅停止动画：不得在媒体查询里再声明 width/height/opacity/visibility 等几何或可见性
          expect(body, file).toMatch(/animation:\s*none/)
          expect(body, file).not.toMatch(/width|height|opacity|visibility|position|margin/)
        }
      }
    }
  })

  it('两份核心几何规则逐声明完全一致（同一文本来源的两个 scoped 副本）', () => {
    const actions = spinnerRule('QueryListActions.vue')
    const toolbar = spinnerRule('QueryListRefreshToolbar.vue')
    expect(actions).not.toBe('')
    expect(normalize(toolbar)).toBe(normalize(actions))
  })

  it('指示器颜色只取 currentColor，不写死颜色值', () => {
    for (const file of ['QueryListActions.vue', 'QueryListRefreshToolbar.vue']) {
      const rule = spinnerRule(file)
      expect(rule, file).toMatch(/border:\s*2px solid currentColor/)
      expect(rule, file).toMatch(/border-top-color:\s*transparent/)
      expect(rule, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(rule, file).not.toMatch(/\brgba?\(/)
    }
  })

  it('指示器几何为绝对定位 + 12px + 只切换 opacity/visibility（不参与内容流）', () => {
    const rule = spinnerRule('QueryListActions.vue')
    expect(rule).toMatch(/(^|;)\s*position:\s*absolute\s*(;|$)/)
    expect(rule).toMatch(/(^|;)\s*width:\s*12px\s*(;|$)/)
    expect(rule).toMatch(/(^|;)\s*height:\s*12px\s*(;|$)/)
    expect(rule).toMatch(/left:\s*var\(--ql-btn-spinner-inset,\s*2px\)/)
    expect(rule).toMatch(/(^|;)\s*opacity:\s*0\s*(;|$)/)
    expect(rule).toMatch(/(^|;)\s*visibility:\s*hidden\s*(;|$)/)
    expect(rule).not.toMatch(/display\s*:\s*none/)
  })
})

describe('第一轮冻结决策的可执行校验（§7.3.2 / §7.3.3 / §8）', () => {
  const DEFERRED = [
    'useQueryListAppliedQuery.ts',
    'useQueryListSingleFlightRequest.ts',
    'useQueryListVisibleAutoRefresh.ts',
  ]

  it('推迟到第二轮消费者的 3 个 composable 在 src 下不存在任何文件（含占位）', () => {
    const files = walk(SRC_DIR)
    for (const name of DEFERRED) {
      const hits = files.filter((f) => f.endsWith(name))
      expect(hits, `${name} 不应存在`).toEqual([])
    }
  })

  it('源码中不出现这 3 个被推迟 composable 的导入或引用', () => {
    const bare = /useQueryListAppliedQuery|useQueryListSingleFlightRequest|useQueryListVisibleAutoRefresh/
    const files = walk(SRC_DIR).filter((f) => !f.endsWith('shared-layer.spec.ts'))
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(bare)
    }
  })

  it('合并进结果面板正文区的薄包装组件不得存在（StableTableContainer 不单独成组件）', () => {
    expect(existsSync(join(QUERY_LIST_DIR, 'StableTableContainer.vue'))).toBe(false)
    const files = walk(SRC_DIR).filter((f) => !f.endsWith('shared-layer.spec.ts'))
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/StableTableContainer/)
    }
  })

  it('公共层只暴露批准的 6 个组件与 1 个 composable 入口', () => {
    const index = source('index.ts')
    const components = [...index.matchAll(/from '\.\/(QueryList\w+)\.vue'/g)].map((m) => m[1])
    expect(components.sort()).toEqual([
      'QueryListActions',
      'QueryListPageShell',
      'QueryListQueryPanel',
      'QueryListRefreshToolbar',
      'QueryListResultPanel',
      'QueryListTooltipHost',
    ])
    expect(index).toMatch(/export \{ useQueryListTooltip, QUERY_LIST_TOOLTIP_DELAY_MS \}/)
    const vueFiles = readdirSync(QUERY_LIST_DIR).filter((f) => f.endsWith('.vue'))
    expect(vueFiles.sort()).toEqual(
      components.map((c) => `${c}.vue`).sort(),
    )
  })

  it('组件目录仅含获批组件与其声明文件（无额外组件、无样式/工具散件）', () => {
    const entries = readdirSync(QUERY_LIST_DIR).filter((f) => !f.endsWith('.spec.ts'))
    expect(entries.sort()).toEqual(
      [
        'QueryListActions.vue',
        'QueryListPageShell.vue',
        'QueryListQueryPanel.vue',
        'QueryListRefreshToolbar.vue',
        'QueryListResultPanel.vue',
        'QueryListTooltipHost.vue',
        'index.ts',
        'types.ts',
      ].sort(),
    )
  })

  it('composable 目录仅含 Tooltip 控制器', () => {
    const entries = readdirSync(resolve(SRC_DIR, 'composables/query-list'))
    expect(entries.sort()).toEqual(['useQueryListTooltip.spec.ts', 'useQueryListTooltip.ts'].sort())
  })
})
