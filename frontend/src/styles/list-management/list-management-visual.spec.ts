import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * 公共列表管理模板第二阶段静态契约（第三步扩至两个接入页）。
 *
 * 只断言源码文本与启用范围，不涉及 CSS 求值或布局：jsdom 不实现层叠与几何，
 * 视觉等价由真实浏览器回归承接。回归目标为四项：
 *   1. 四个公共类确实存在于唯一公共源，且取值为已确认的等价预设；
 *   2. 探针端管理与数据源管理通过 `<style scoped src>` 显式接入，旧同义私有类与规则已移除；
 *   3. 除这两个接入页外没有其他页面挂载公共类或引用公共源（零泄漏）；
 *   4. 公共规则全仓唯一来源，无重复副本。
 */

const STYLE_DIR = resolve(process.cwd(), 'src/styles/list-management')
const CSS_PATH = join(STYLE_DIR, 'list-management-visual.css')
const SRC_DIR = resolve(process.cwd(), 'src')
const VIEWS_DIR = join(SRC_DIR, 'views')
const PAGE_PATH = join(VIEWS_DIR, 'client-config/ClientConfigPage.vue')
const DATA_SOURCE_PAGE_PATH = join(VIEWS_DIR, 'data-source/DataSourcePage.vue')

const CSS_RELATIVE = 'styles/list-management/list-management-visual.css'
const PAGE_RELATIVE = 'views/client-config/ClientConfigPage.vue'
const DATA_SOURCE_PAGE_RELATIVE = 'views/data-source/DataSourcePage.vue'
const PAGE_STYLE_IMPORT =
  '<style scoped src="@/styles/list-management/list-management-visual.css"></style>'

const CLASSES = ['lmt-q-field', 'lmt-q-label', 'lmt-result-count', 'lmt-add-button']
/** 探针页与数据源页被替换掉的私有同义类（公共源与页面均不得再出现）。 */
const OLD_PRIVATE_CLASSES = [
  'cc-q-group',
  'cc-q-label',
  'cc-result-count',
  'cc-btn-add',
  'ds-q-group',
  'ds-q-label',
  'ds-result-count',
  'ds-add-button',
]

function read(file: string): string {
  return readFileSync(file, 'utf8')
}

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '')
}

function css(): string {
  return stripComments(read(CSS_PATH))
}

function rules(text: string): Array<{ selector: string; body: string }> {
  return [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: (m[1] ?? '').trim(),
    body: (m[2] ?? '').trim(),
  }))
}

function selectors(rule: { selector: string }): string[] {
  return rule.selector.split(',').map((s) => s.trim())
}

function findRule(selector: string): { selector: string; body: string } {
  const hit = rules(css()).find((r) => selectors(r).includes(selector))
  expect(hit, `缺规则：${selector}`).toBeDefined()
  return hit!
}

function norm(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

function relative(file: string): string {
  return file.slice(SRC_DIR.length + 1)
}

describe('公共列表管理模板第二阶段公共层契约', () => {
  it('1. 公共源存在，且只包含四个已确认的 lmt- 类', () => {
    expect(existsSync(CSS_PATH)).toBe(true)
    const found = [...new Set(css().match(/\.lmt-[\w-]+/g) ?? [])].sort()
    expect(found).toEqual(CLASSES.map((c) => `.${c}`).sort())
  })

  it('2. 查询字段组：内联弹性布局、垂直居中、6px 组内间距、不收缩', () => {
    const field = norm(findRule('.lmt-q-field').body)
    expect(field).toContain('display: inline-flex')
    expect(field).toContain('align-items: center')
    expect(field).toContain('gap: 6px')
    expect(field).toContain('flex: 0 0 auto')

    const label = norm(findRule('.lmt-q-label').body)
    expect(label).toContain('flex: 0 0 auto')
    expect(label).toContain('font-size: 13px')
    expect(label).toContain('color: var(--el-text-color-regular)')
    expect(label).toContain('white-space: nowrap')
  })

  it('3. 结果摘要与探针页原私有规则逐值等价', () => {
    const count = norm(findRule('.lmt-result-count').body)
    expect(count).toContain('font-size: 14px')
    expect(count).toContain('font-weight: 600')
    expect(count).toContain('color: var(--el-text-color-primary)')
  })

  it('4. 新增主按钮保留普通、悬停/聚焦、按下与禁用态守卫', () => {
    const base = findRule('.lmt-add-button:not(.is-disabled)')
    expect(norm(base.body)).toContain('background: #09090b')
    expect(norm(base.body)).toContain('border-color: #09090b')
    expect(norm(base.body)).toContain('color: #ffffff')
    expect(norm(base.body)).toContain('border-radius: 6px')
    expect(norm(base.body)).toContain('font-weight: 500')

    const hoverFocus = findRule('.lmt-add-button:not(.is-disabled):hover')
    expect(selectors(hoverFocus).sort()).toEqual([
      '.lmt-add-button:not(.is-disabled):focus',
      '.lmt-add-button:not(.is-disabled):hover',
    ])
    expect(norm(hoverFocus.body)).toContain('background: #27272a')
    expect(norm(hoverFocus.body)).toContain('border-color: #27272a')
    expect(norm(hoverFocus.body)).toContain('color: #ffffff')

    const active = findRule('.lmt-add-button:not(.is-disabled):active')
    expect(norm(active.body)).toContain('background: #18181b')
    expect(norm(active.body)).toContain('border-color: #18181b')
    expect(norm(active.body)).toContain('color: #ffffff')

    // 所有按钮规则均由 `:not(.is-disabled)` 守卫：禁用态不换色，沿用 Element Plus 视觉。
    for (const rule of rules(css()).filter((r) => r.selector.includes('lmt-add-button'))) {
      for (const sel of selectors(rule)) {
        expect(sel).toContain(':not(.is-disabled)')
      }
    }
  })

  it('5. 公共源无全局元素选择器、无 !important、无 @import、无 Element Plus 裸选择器', () => {
    const text = css()
    expect(text).not.toContain('!important')
    expect(text).not.toContain('@import')
    for (const rule of rules(text)) {
      for (const sel of selectors(rule)) {
        expect(sel.startsWith('.lmt-'), sel).toBe(true)
        expect(sel, sel).not.toMatch(/(^|[\s,>+~])(:root|html|body|\*)([\s,>+~:.[#]|$)/)
        expect(sel, sel).not.toContain('.el-')
      }
    }
  })

  it('6. 两个接入页均以 scoped src 显式接入四个公共类，且各自旧私有类已移除', () => {
    for (const [path, label] of [
      [PAGE_PATH, '探针端管理'],
      [DATA_SOURCE_PAGE_PATH, '数据源管理'],
    ] as const) {
      const page = read(path)
      expect(page, label).toContain(PAGE_STYLE_IMPORT)
      for (const cls of CLASSES) {
        expect(page, `${label} ${cls}`).toContain(`class="${cls}"`)
      }
    }
    const probePage = read(PAGE_PATH)
    for (const oldClass of ['cc-q-group', 'cc-q-label', 'cc-result-count', 'cc-btn-add']) {
      expect(probePage, oldClass).not.toContain(oldClass)
    }
    const dataSourcePage = read(DATA_SOURCE_PAGE_PATH)
    for (const oldClass of ['ds-q-group', 'ds-q-label', 'ds-result-count', 'ds-add-button']) {
      expect(dataSourcePage, oldClass).not.toContain(oldClass)
    }
  })

  it('7. 只有两个接入页挂载公共类或引用公共源（其余页面零泄漏）', () => {
    const vueFiles = walk(VIEWS_DIR).filter((file) => file.endsWith('.vue'))
    const mounted = vueFiles
      .filter((file) => read(file).includes('lmt-'))
      .map(relative)
      .sort()
    expect(mounted).toEqual([PAGE_RELATIVE, DATA_SOURCE_PAGE_RELATIVE].sort())
    const imported = vueFiles
      .filter((file) => read(file).includes('styles/list-management/list-management-visual.css'))
      .map(relative)
      .sort()
    expect(imported).toEqual([PAGE_RELATIVE, DATA_SOURCE_PAGE_RELATIVE].sort())
  })

  it('8. 公共规则与类名全仓唯一来源，无重复副本', () => {
    const files = walk(SRC_DIR).filter((file) => file.endsWith('.css') || file.endsWith('.vue'))
    const hits = files.filter((file) => read(file).includes('lmt-')).map(relative).sort()
    expect(hits).toEqual([CSS_RELATIVE, PAGE_RELATIVE, DATA_SOURCE_PAGE_RELATIVE].sort())
  })

  it('9. 旧同义私有选择器未在任何样式或页面源码中重新出现', () => {
    const files = walk(SRC_DIR).filter((file) => file.endsWith('.css') || file.endsWith('.vue'))
    for (const oldClass of OLD_PRIVATE_CLASSES) {
      const selectorRe = new RegExp(`\\.${oldClass}\\s*\\{`)
      const offenders = files.filter((file) => selectorRe.test(read(file))).map(relative)
      expect(offenders, oldClass).toEqual([])
    }
  })
})
