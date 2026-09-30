import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { LT_MAIN_TABLE_CLASS, LT_TABLE_VISUAL_TOKENS } from './index'

/**
 * 列表表格视觉模板公共层静态契约（SHARED_COMPONENT_DESIGN §7.1 断言 1–12）。
 *
 * 本文件只断言「源码文本」，不涉及 CSS 求值、层叠、选择器实际匹配数或几何：
 * jsdom 不实现层叠与布局，这些运行时事实按 §2.5 / §7.4 / §7.5 由真实浏览器承接。
 */

const LIST_TABLE_DIR = resolve(process.cwd(), 'src/styles/list-table')
const SRC_DIR = resolve(process.cwd(), 'src')

const CSS_FILE = 'list-table-visual.css'
const CONSTANTS_FILE = 'index.ts'
const CSS_PATH = join(LIST_TABLE_DIR, CSS_FILE)

const ROOT_CLASS = 'lt-main-table'
const ROOT_CLASS_SELECTOR = `.${ROOT_CLASS}`

/**
 * 除根类外**唯一**允许出现在公共源里的 `lt-` 辅助/opt-in 类（§12.7(2)、§13.3）。
 * 第 11 条据此断言集合恰好相等；第 13/14 条据此扫描业务页面挂载情况。
 * 拼接构造避免本测试文件的源码被「唯一来源」扫描误计入。
 */
const HELPER_CLASSES = [
  ['lt-row-action', '__', 'cell'].join(''),
  ['lt-row-action', '__', 'ellipsis'].join(''),
  ['lt-row', '-highlight'].join(''),
  ['lt-row-highlight', '__row'].join(''),
]

/** 表级 / 行级两级 opt-in 类（§13.3）：分别用于启用可选预设与标记被固定行。 */
const ROW_HIGHLIGHT_OPT_IN_TABLE_CLASS = ['lt-row', '-highlight'].join('')
const ROW_HIGHLIGHT_OPT_IN_ROW_CLASS = ['lt-row-highlight', '__row'].join('')

/** 作用域首段中允许出现的类：根类本身，以及可与根类并列的 opt-in 类（第 6 条）。 */
const REGISTERED_OPT_IN_CLASSES = [ROOT_CLASS, ROW_HIGHLIGHT_OPT_IN_TABLE_CLASS]

const EXPECTED_TOKENS = [
  '--lt-table-width',
  '--lt-border-color',
  '--lt-header-bg-color',
  '--lt-header-text-color',
  '--lt-header-font-size',
  '--lt-header-font-weight',
  '--lt-header-letter-spacing',
  '--lt-header-cell-padding',
  '--lt-body-cell-padding',
]

/** 逐令牌公共默认值：全部取自参考实现既有值，不得发明新视觉值（§4.4）。 */
const EXPECTED_DEFAULTS: Record<string, string> = {
  '--lt-table-width': '100%',
  '--lt-border-color': '#f4f4f5',
  '--lt-header-bg-color': '#ffffff',
  '--lt-header-text-color': '#71717a',
  '--lt-header-font-size': '12px',
  '--lt-header-font-weight': '600',
  '--lt-header-letter-spacing': '0.01em',
  '--lt-header-cell-padding': '11px 0',
  '--lt-body-cell-padding': '12px 0',
}

/** 公共层不得选择的业务类名前缀（§4.3 / §4.6 L5）。 */
const FORBIDDEN_PREFIXES = [
  '.data-table',
  '.naming-table',
  '.dss-',
  '.toff-',
  '.cc-',
  '.config-table',
  '.ds-',
  '.empty-',
  '.query-',
  '.q-',
]

/**
 * 扫描标记一律以拼接构造，避免本测试文件自身的源码被「唯一来源」扫描误计入。
 * `CONSUME_ROOT` 对应 CSS 中最小的一组消费形态；`ROOT_RULE_RE` 匹配根类规则开括号。
 */
const CONSUME_ROOT = ['var(', '--lt-table-width'].join('')
const ROOT_RULE_RE = /\.lt-main-table\s*\{/

function read(file: string): string {
  return readFileSync(join(LIST_TABLE_DIR, file), 'utf8')
}

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '')
}

function css(): string {
  return stripComments(readFileSync(CSS_PATH, 'utf8'))
}

/** 扁平 CSS 规则拆分（本预设无嵌套块，仅顶层规则）。 */
function rules(text: string): Array<{ selector: string; body: string }> {
  return [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: (m[1] ?? '').trim(),
    body: m[2] ?? '',
  }))
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

describe('列表表格视觉模板公共层契约（§4.1 / §6）', () => {
  it('1. 公共根类与导出键存在', () => {
    expect(existsSync(CSS_PATH)).toBe(true)
    expect(existsSync(join(LIST_TABLE_DIR, CONSTANTS_FILE))).toBe(true)
    expect(LT_MAIN_TABLE_CLASS).toBe(ROOT_CLASS)
    expect(css()).toContain(ROOT_CLASS_SELECTOR)
  })

  it('2. 令牌清单恰好 9 个且名称与批准设计逐一相符', () => {
    expect([...LT_TABLE_VISUAL_TOKENS]).toEqual(EXPECTED_TOKENS)
    expect(LT_TABLE_VISUAL_TOKENS).toHaveLength(9)
  })

  it('3. 每个令牌的消费点都带内联默认值，且默认值与批准设计一致', () => {
    const text = css()
    for (const token of EXPECTED_TOKENS) {
      const fallback = EXPECTED_DEFAULTS[token]!
      expect(text, `${token} 缺内联回退`).toContain(`${['var(', token].join('')}, ${fallback})`)
    }
  })

  it('4. 公共层不声明任何 --lt-* 的值（只允许出现在 var() 内联回退中）', () => {
    expect(css()).not.toMatch(/--lt-[\w-]+\s*:/)
  })

  it('5. 不存在裸 Element Plus 选择器，也不存在 :root / html / body / * 规则', () => {
    for (const { selector } of rules(css())) {
      if (/\.el-table/.test(selector)) {
        expect(selector, selector).toContain(ROOT_CLASS_SELECTOR)
      }
      expect(selector, selector).not.toMatch(/(^|[\s,>+~])(:root|html|body|\*)([\s,>+~:.]|$)/)
    }
  })

  it('6. 每条 :deep(...) 均由 .lt-main-table 限定（可与已登记 opt-in 类并列）', () => {
    const deep = rules(css()).filter((r) => r.selector.includes(':deep('))
    expect(deep.length).toBeGreaterThan(0)
    for (const { selector } of deep) {
      // 作用域首段必须以根类开头；允许根类与其**已登记**的 opt-in 类并列（如
      // `.lt-main-table.lt-row-highlight`），但不得出现根类以外的其它前置类。
      const lead = selector.split(/\s+/)[0] ?? ''
      const leadClasses = lead.match(/\.[\w-]+/g) ?? []
      expect(lead.startsWith(ROOT_CLASS_SELECTOR), selector).toBe(true)
      expect(leadClasses[0], selector).toBe(ROOT_CLASS_SELECTOR)
      for (const cls of leadClasses) {
        expect(REGISTERED_OPT_IN_CLASSES, selector).toContain(cls.replace(/^\./, ''))
      }
    }
  })

  it('7. 不出现任何禁止的业务类名前缀', () => {
    const text = css()
    for (const prefix of FORBIDDEN_PREFIXES) {
      expect(text, prefix).not.toContain(prefix)
    }
  })

  it('8. 不出现业务文案、业务列名或状态语义命名', () => {
    const text = css()
    expect(text).not.toMatch(/数据源|快照|同步对象|停用|异常|序号|角色|主机|端口|用户名/)
    expect(text).not.toMatch(/\bSOURCE\b|\bTARGET\b/)
    expect(text).not.toMatch(/success|warning|danger/)
  })

  it('9. 公共源为纯 CSS，不含路由元数据、页面自动识别或隐式启用入口', () => {
    const text = css()
    expect(text).not.toMatch(/@import/)
    expect(text).not.toMatch(/\.vue\b/)
    expect(text).not.toMatch(/router|route\b/)
    expect(text).not.toMatch(/meta\./)
    // 常量模块同样不得引入任何模块或副作用
    expect(read(CONSTANTS_FILE)).not.toMatch(/^\s*import\b/m)
  })

  it('10. 不含 !important', () => {
    expect(css()).not.toMatch(/!important/)
  })

  it('11. 内部辅助类恰好为已登记的 opt-in 类（除根类外无其他 lt- 类选择器）', () => {
    // §12.7(2)：`css().match(/\.lt-[\w-]+/g)` 的匹配结果本身包含根类，必须先剔除根类，
    // 否则「辅助类恰好 N 个」的断言会多计根类。
    const allClasses = [...new Set(css().match(/\.lt-[\w-]+/g) ?? [])]
    const helperClasses = allClasses.filter((name) => name !== ROOT_CLASS_SELECTOR).sort()
    expect(helperClasses).toEqual(HELPER_CLASSES.map((c) => `.${c}`).sort())
    // 等价兜底：允许集合为「根类 + 全部已登记辅助类」，不得出现未登记的类。
    expect(allClasses.sort()).toEqual(
      [ROOT_CLASS_SELECTOR, ...HELPER_CLASSES.map((c) => `.${c}`)].sort(),
    )
  })

  it('13. opt-in 辅助类在业务页面中只有探针端主列表挂载（未启用页零泄漏，§12.4/§12.7(3)）', () => {
    // 拼接构造扫描标记，避免本测试文件自身被计入。
    const token = ['lt-row-action', '__'].join('')
    const VIEWS_DIR = resolve(SRC_DIR, 'views')
    const mounted = walk(VIEWS_DIR)
      .filter((file) => file.endsWith('.vue'))
      .filter((file) => readFileSync(file, 'utf8').includes(token))
      .map(relative)
    expect(mounted).toEqual(['views/client-config/ClientConfigPage.vue'])
  })

  it('12. 公共预设规则在全 frontend/src 中只有唯一来源文件', () => {
    const hits: string[] = []
    for (const file of walk(SRC_DIR)) {
      const text = stripComments(readFileSync(file, 'utf8'))
      if (ROOT_RULE_RE.test(text) || text.includes(CONSUME_ROOT)) hits.push(relative(file))
    }
    expect(hits).toEqual([`styles/list-table/${CSS_FILE}`])
  })

  it('14. §13.3 单行固定高亮两级 opt-in 类仅探针端主列表挂载（其余页面零泄漏）', () => {
    // 项目负责人已授权**唯一**页面级接入：`/config/client` 主列表（CLIENT-CONFIG-OPTIONAL-ROW-
    // HIGHLIGHT-PUBLIC-PRESET-ADOPTION-001）。两级类在该页显式挂载，**其余任何页面**（含
    // `/config/data-source`）不得挂载——否则本断言失败，可抓到意外扩散。
    const VIEWS_DIR = resolve(SRC_DIR, 'views')
    const vueFiles = walk(VIEWS_DIR).filter((file) => file.endsWith('.vue'))
    const EXPECTED = ['views/client-config/ClientConfigPage.vue']
    // 表级类（`lt-row-highlight` 亦为行级类前缀，故同时命中只挂行级的文件）。
    const tableMounted = vueFiles
      .filter((file) => readFileSync(file, 'utf8').includes(ROW_HIGHLIGHT_OPT_IN_TABLE_CLASS))
      .map(relative)
      .sort()
    expect(tableMounted).toEqual(EXPECTED)
    // 行级类：同样只允许该页。
    const rowMounted = vueFiles
      .filter((file) => readFileSync(file, 'utf8').includes(ROW_HIGHLIGHT_OPT_IN_ROW_CLASS))
      .map(relative)
      .sort()
    expect(rowMounted).toEqual(EXPECTED)
  })

  it('15. §13.3 预设分层契约：覆盖整行 td、固定压过 hover 与 current-row、左缘仅首格', () => {
    const rs = rules(css())
    const pick = (needle: string, exclude: string[] = []) => {
      const hit = rs.find(
        (r) => r.selector.includes(needle) && exclude.every((x) => !r.selector.includes(x)),
      )
      expect(hit, `缺规则：${needle}`).toBeDefined()
      return hit!
    }
    const reset = pick('tr.current-row > td.el-table__cell')
    const hoverPreset = pick(':not(.lt-row-highlight__row):hover')
    const fixed = pick('tr.lt-row-highlight__row > td.el-table__cell', [':hover', 'first-child'])
    const fixedHover = pick('tr.lt-row-highlight__row:hover')
    const accent = pick('tr.lt-row-highlight__row > td.el-table__cell:first-child')

    // 固定底色覆盖整行**每个** `td.el-table__cell`（选择器不回退到更窄的单元格），与最右固定列一致。
    expect(fixed.body).toContain('background-color: #e1e4e8')
    expect(fixed.selector).not.toContain('first-child')
    expect(fixed.selector).not.toContain('nth-child')
    // 「当前行」归零与固定行规则**同前导段**（同特异性），且归零在**前** → 同时命中时固定行按源码顺序胜出。
    const lead = (s: string) => s.split(/\s+/)[0]
    expect(lead(reset.selector)).toBe(lead(fixed.selector))
    expect(rs.indexOf(reset)).toBeLessThan(rs.indexOf(fixed))
    // 普通 hover 预设只作用于**非固定行**，与固定行规则无层叠竞争。
    expect(hoverPreset.body).toContain('background-color: #f4f4f5')
    expect(lead(hoverPreset.selector)).toBe(lead(fixed.selector))
    // 固定行再次 hover 保持固定底色。
    expect(fixedHover.body).toContain('background-color: #e1e4e8')
    // 左缘强调只画在首格，每行至多一条。
    expect(accent.selector).toContain('td.el-table__cell:first-child')
    expect(accent.body).toContain('box-shadow: inset 3px 0 0 0 #18181b')
  })
})
