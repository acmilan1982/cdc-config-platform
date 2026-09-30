import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

import {
  CED_DIALOG_CLASS,
  CED_DIALOG_FEATURE_TOKENS,
  CED_DIALOG_TEMPLATE_TOKENS,
  CED_DIALOG_TOKENS,
} from './index'

/**
 * 新增／编辑业务弹窗公共视觉模板公共层静态契约（SHARED_COMPONENT_DESIGN §7 断言 1–5 的实现化）。
 *
 * 本文件只断言「源码文本」，不涉及 CSS 求值、层叠、选择器实际匹配数或几何：
 * jsdom 不实现层叠与布局，这些运行时事实由隔离夹具在真实浏览器（真实 Element Plus
 * 样式与真实 Vue／EP 组件 DOM）审核（见 R1 报告与 reports/evidence/）。
 */

const DIALOG_DIR = resolve(process.cwd(), 'src/styles/dialog')
const SRC_DIR = resolve(process.cwd(), 'src')

const CSS_FILE = 'create-edit-dialog-visual.css'
const CONSTANTS_FILE = 'index.ts'
const CSS_PATH = join(DIALOG_DIR, CSS_FILE)

const ROOT_CLASS = ['ced-', 'dialog'].join('')
const ROOT_CLASS_SELECTOR = `.${ROOT_CLASS}`

/** 根类之外**唯一**允许出现在公共源里的 `ced-*` 辅助/opt-in 类。拼接构造避免自扫描。 */
const HELPER_CLASSES = [
  ['ced-', 'form-label'].join(''),
  ['ced-', 'label-row'].join(''),
  ['ced-', 'submit'].join(''),
  ['ced-', 'field-feedback'].join(''),
  ['ced-', 'field-error'].join(''),
  ['ced-', 'field--error'].join(''),
  ['ced-', 'required-mark'].join(''),
]

/** 作用域首段中允许出现的类：仅根类本身（本层无并列 opt-in 类）。 */
const REGISTERED_LEAD_CLASSES = [ROOT_CLASS]

const EXPECTED_TEMPLATE_TOKENS = [
  '--ced-label-font-size',
  '--ced-label-font-weight',
  '--ced-label-color',
  '--ced-required-mark-color',
  '--ced-submit-bg',
  '--ced-submit-bg-hover',
  '--ced-submit-bg-active',
  '--ced-submit-text',
  '--ced-submit-radius',
  '--ced-submit-font-weight',
  '--ced-error-color',
  '--ced-error-font-size',
  '--ced-feedback-min-height',
]

/** 已批准设计登记的 Feature 决定值令牌（4）：公共层一律不设缺省。 */
const EXPECTED_FEATURE_TOKENS = [
  '--ced-label-column-width',
  '--ced-label-gap',
  '--ced-dialog-safety-inset',
  '--ced-submit-bg-loading',
]

/** 以**无回退** `var()` 消费的 Feature 令牌（值由接入页面提供；未提供时回退为初始值）。 */
const FEATURE_TOKENS_WITHOUT_FALLBACK = [
  '--ced-label-column-width',
  '--ced-label-gap',
  '--ced-dialog-safety-inset',
]

/** 逐模板令牌公共默认值：全部取自两页可比对一致的既有值，不得发明新视觉值。 */
const EXPECTED_TEMPLATE_DEFAULTS: Record<string, string> = {
  '--ced-label-font-size': '14px',
  '--ced-label-font-weight': '500',
  '--ced-label-color': '#3f3f46',
  '--ced-required-mark-color': 'var(--el-color-danger)',
  '--ced-submit-bg': '#09090b',
  '--ced-submit-bg-hover': '#27272a',
  '--ced-submit-bg-active': '#18181b',
  '--ced-submit-text': '#ffffff',
  '--ced-submit-radius': '6px',
  '--ced-submit-font-weight': '500',
  '--ced-error-color': 'var(--el-color-danger)',
  '--ced-error-font-size': '13px',
  '--ced-feedback-min-height': '20px',
}

/** 探针端专用加载灰度：**不得**成为公共缺省（loading 配色属 Feature 可选、两页不一致）。 */
const PROBE_END_LOADING_GRAY = ['#3f', '3f46'].join('')

/** 公共层不得选择的业务类名前缀。 */
const FORBIDDEN_PREFIXES = [
  '.cc-',
  '.ds-',
  '.editor-',
  '.data-table',
  '.naming-table',
  '.dss-',
  '.toff-',
  '.query-',
]

/** 两页不一致的差异字面量：公共层不得写死为通用默认。 */
const FORBIDDEN_DIVERGENT_LITERALS = ['84px', '120px', '900px', '620px', 'calc(100vw - 48px)']

const IMPORT_PATH = ['styles/dialog/', 'create-edit-dialog-visual.css'].join('')

/** 扫描标记一律以拼接构造，避免本测试文件自身源码被「唯一来源」扫描误计入。 */
const CONSUME_ROOT = ['var(', '--ced-label-font-size'].join('')
const ROOT_RULE_RE = new RegExp(`\\.${ROOT_CLASS}\\s*\\{`)

function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '')
}

function css(): string {
  return stripComments(readFileSync(CSS_PATH, 'utf8'))
}

/** 扁平 CSS 规则拆分（本预设无嵌套块，仅顶层规则）。 */
function rules(text: string): Array<{ selector: string; body: string; index: number }> {
  return [...text.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    selector: (m[1] ?? '').trim(),
    body: m[2] ?? '',
    index: m.index ?? 0,
  }))
}

/** 选择器列表按逗号拆分（本预设不使用 `:is()`／`:where()`，故逗号不嵌套）。 */
function selectorList(selectorText: string): string[] {
  return selectorText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** 读一条规则体内某个声明的原样值（`null` 表示该声明不存在）。 */
function declaration(body: string, property: string): string | null {
  const m = body.match(new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`))
  return m ? (m[1] ?? '').trim() : null
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

describe('新增／编辑弹窗公共视觉模板公共层契约', () => {
  it('1. 公共根类源与常量导出存在', () => {
    expect(existsSync(CSS_PATH)).toBe(true)
    expect(existsSync(join(DIALOG_DIR, CONSTANTS_FILE))).toBe(true)
    expect(CED_DIALOG_CLASS).toBe(ROOT_CLASS)
    expect(css()).toContain(ROOT_CLASS_SELECTOR)
  })

  it('2. 令牌登记与已批准设计一致：模板自有 13 + Feature 4 = 17', () => {
    expect([...CED_DIALOG_TEMPLATE_TOKENS]).toEqual(EXPECTED_TEMPLATE_TOKENS)
    expect([...CED_DIALOG_FEATURE_TOKENS]).toEqual(EXPECTED_FEATURE_TOKENS)
    expect([...CED_DIALOG_TOKENS]).toEqual([
      ...EXPECTED_TEMPLATE_TOKENS,
      ...EXPECTED_FEATURE_TOKENS,
    ])
    expect(CED_DIALOG_TOKENS).toHaveLength(17)
  })

  it('3. 令牌登记与 CSS 实际一致（不多不少）', () => {
    const found = [...new Set(css().match(/--ced-[\w-]+/g) ?? [])].sort()
    expect(found).toEqual([...CED_DIALOG_TOKENS].sort())
  })

  it('4. 每个模板自有令牌的消费点都带内联默认值，且默认值与已批准设计一致', () => {
    const text = css()
    for (const token of EXPECTED_TEMPLATE_TOKENS) {
      const fallback = EXPECTED_TEMPLATE_DEFAULTS[token]!
      expect(text, `${token} 缺内联回退`).toContain(`${['var(', token].join('')}, ${fallback})`)
    }
  })

  it('5. 三个 Feature 令牌以无回退 var() 消费，且公共层不臆造缺省', () => {
    const text = css()
    for (const token of FEATURE_TOKENS_WITHOUT_FALLBACK) {
      expect(text, `${token} 应以无回退 var() 消费`).toContain(`var(${token})`)
      expect(text, `${token} 不得带缺省值`).not.toMatch(new RegExp(`var\\(${token}\\s*,`))
    }
  })

  it('6. --ced-label-gap 确有可用消费点：标签行辅助类以无缺省 gap 消费', () => {
    const rs = rules(css())
    const gapRules = rs.filter((r) => r.selector.includes(HELPER_CLASSES[1]!)) // ced-label-row
    expect(gapRules).toHaveLength(1)
    const [row] = gapRules
    expect(row!.selector).toContain(ROOT_CLASS_SELECTOR)
    expect(declaration(row!.body, 'gap')).toBe('var(--ced-label-gap)')
    // 间距值只能来自 Feature，不得写死任何长度字面量。
    expect(row!.body).not.toMatch(/\d+(px|rem|em)\b/)
    // 未提供变量时间距回退为初始值，不得出现探针端 12px 之类的公共缺省。
    expect(row!.body).not.toContain('12px')
  })

  it('7. --ced-submit-bg-loading 确有可用消费点，且级联回退到主提交按钮既有背景', () => {
    const rs = rules(css())
    const loadingRules = rs.filter((r) => r.selector.includes('is-loading'))
    expect(loadingRules).toHaveLength(1)
    const [loading] = loadingRules
    // 加载态由专属规则显式接管：仅限主提交按钮、根类内、且保留禁用保护。
    expect(loading.selector).toContain(ROOT_CLASS_SELECTOR)
    expect(loading.selector).toContain(HELPER_CLASSES[2]!) // ced-submit
    expect(loading.selector).toContain('is-loading')
    expect(loading.selector).toContain(':not(.is-disabled)')
    // 提供变量则按值呈现；未提供则回退到按钮既有背景（正常态令牌），既不透明也不写死灰度。
    const expected = 'var(--ced-submit-bg-loading, var(--ced-submit-bg, #09090b))'
    expect(declaration(loading.body, 'background')).toBe(expected)
    expect(declaration(loading.body, 'border-color')).toBe(expected)
    expect(loading.body).not.toContain('transparent')
    expect(loading.body).not.toContain(PROBE_END_LOADING_GRAY)
    // 加载态必须排在正常／hover／focus／active 之后，才能在同等特异度下取得优先。
    const normal = rs.find(
      (r) => r.selector === `${ROOT_CLASS_SELECTOR} .ced-submit:not(.is-disabled)`,
    )
    expect(normal, '正常态规则缺失').toBeTruthy()
    expect(loading.index).toBeGreaterThan(normal!.index)
    for (const state of [':hover', ':focus', ':active']) {
      const rule = rs.find((r) => r.selector.includes(`.ced-submit:not(.is-disabled)${state}`))
      expect(rule, `${state} 规则缺失`).toBeTruthy()
      expect(loading.index).toBeGreaterThan(rule!.index)
    }
  })

  it('8. 公共层不声明任何 --ced-* 的值（只允许出现在 var() 内联回退中）', () => {
    expect(css()).not.toMatch(/--ced-[\w-]+\s*:/)
  })

  it('9. 每条规则的选择器均由根类前置限定；无裸 EP 选择器、无 :root/html/body/* 规则', () => {
    for (const { selector } of rules(css())) {
      for (const one of selectorList(selector)) {
        // 作用域首段必须以根类开头，且首段只允许出现根类本身。
        const lead = one.split(/\s+/)[0] ?? ''
        const leadClasses = lead.match(/\.[\w-]+/g) ?? []
        expect(lead.startsWith(ROOT_CLASS_SELECTOR), one).toBe(true)
        expect(leadClasses[0], one).toBe(ROOT_CLASS_SELECTOR)
        for (const cls of leadClasses) {
          expect(REGISTERED_LEAD_CLASSES, one).toContain(cls.replace(/^\./, ''))
        }
        // 任何 Element Plus 内部选择器都必须由根类前置限定。
        if (/\.el-/.test(one)) {
          expect(one.startsWith(ROOT_CLASS_SELECTOR), one).toBe(true)
        }
        expect(one, one).not.toMatch(/(^|[\s,>+~])(:root|html|body|\*)([\s,>+~:.]|$)/)
      }
    }
  })

  it('10. 不出现任何禁止的业务类名前缀', () => {
    const text = css()
    for (const prefix of FORBIDDEN_PREFIXES) {
      expect(text, prefix).not.toContain(prefix)
    }
  })

  it('11. 不出现业务文案、业务列名或状态语义命名', () => {
    const text = css()
    expect(text).not.toMatch(/数据源|快照|同步对象|停用|异常|序号|角色|主机|端口|用户名|探针/)
    expect(text).not.toMatch(/\bSOURCE\b|\bTARGET\b/)
    expect(text).not.toMatch(/\bsuccess\b|\bwarning\b/)
    // `danger` 仅允许以 Element Plus 危险色令牌 `--el-color-danger` 出现，不得作业务状态类名。
    expect(text.replace(/--el-color-danger/g, '')).not.toMatch(/\bdanger\b/)
  })

  it('12. 公共源为纯 CSS，不含 @import／.vue／路由元数据或隐式启用入口', () => {
    const text = css()
    expect(text).not.toMatch(/@import/)
    expect(text).not.toMatch(/\.vue\b/)
    expect(text).not.toMatch(/router|route\b/)
    expect(text).not.toMatch(/meta\./)
    // 常量模块同样不得引入任何模块或产生副作用。
    expect(readFileSync(join(DIALOG_DIR, CONSTANTS_FILE), 'utf8')).not.toMatch(/^\s*import\b/m)
  })

  it('13. 不含 !important，也不消除焦点轮廓', () => {
    const text = css()
    expect(text).not.toMatch(/!important/)
    expect(text).not.toMatch(/outline\s*:\s*none/)
    expect(text).not.toMatch(/outline\s*:\s*0\b/)
  })

  it('14. 内部辅助类恰好为已登记的辅助类（除根类外无其他 ced- 类选择器）', () => {
    const allClasses = [...new Set(css().match(/\.ced-[\w-]+/g) ?? [])]
    const helperClasses = allClasses.filter((name) => name !== ROOT_CLASS_SELECTOR).sort()
    expect(helperClasses).toEqual(HELPER_CLASSES.map((c) => `.${c}`).sort())
    expect(allClasses.sort()).toEqual(
      [ROOT_CLASS_SELECTOR, ...HELPER_CLASSES.map((c) => `.${c}`)].sort(),
    )
  })

  it('15. 主提交按钮作用边界：各可见态均受 :not(.is-disabled) 限定，禁用保护保留', () => {
    const rs = rules(css())
    const submitRules = rs.filter((r) => r.selector.includes('.ced-submit'))
    expect(submitRules.length).toBeGreaterThan(0)
    // 每条主提交按钮规则都必须带 :not(.is-disabled)，保护 EP 禁用视觉不被正常态覆盖。
    for (const r of submitRules) {
      expect(r.selector, r.selector).toContain(':not(.is-disabled)')
    }
    // 正常／hover+focus／active 三态齐备。
    const hasState = (re: RegExp) => submitRules.some((r) => re.test(r.selector))
    expect(hasState(/\.ced-submit:not\(\.is-disabled\)\s*$/m)).toBe(true)
    expect(hasState(/\.ced-submit:not\(\.is-disabled\):hover/)).toBe(true)
    expect(hasState(/\.ced-submit:not\(\.is-disabled\):focus/)).toBe(true)
    expect(hasState(/\.ced-submit:not\(\.is-disabled\):active/)).toBe(true)
    // 黑色实心只应用于显式 .ced-submit：出现 #09090b 的规则必限定 .ced-submit。
    for (const r of rs.filter((r) => r.body.includes('#09090b'))) {
      expect(r.selector, r.selector).toContain('.ced-submit')
    }
    // 按钮状态值取自已批准令牌序列。
    const active = submitRules.find((r) => r.selector.includes(':active'))!
    expect(active.body).toContain('var(--ced-submit-bg-active, #18181b)')
    const hover = submitRules.find((r) => r.selector.includes(':hover'))!
    expect(hover.body).toContain('var(--ced-submit-bg-hover, #27272a)')
  })

  it('16. 加载态不触碰 Element Plus 内建 loading 视觉（遮罩/pointer-events/定位）', () => {
    const text = css()
    // EP 以 `.is-loading { pointer-events: none; position: relative }` + `::before` 白遮罩承载加载态；
    // 公共层只允许接管配色，不得改写这些内建处理。
    expect(text).not.toMatch(/pointer-events\s*:/)
    const rs = rules(css())
    for (const r of rs) {
      if (r.selector.includes('is-loading')) {
        expect(r.body, r.selector).not.toContain('position')
        expect(r.body, r.selector).not.toContain('::before')
        expect(r.body, r.selector).not.toContain(':before')
        expect(r.body, r.selector).not.toContain('background-color')
      }
      // 任何 `::before` 规则都只能是星号规则（由断言 17 完整校验）。
      if (/::?before/.test(r.selector)) {
        expect(r.selector, r.selector).toContain(HELPER_CLASSES[6]!) // ced-required-mark
      }
    }
  })

  it('17. 必填星号只受显式 opt-in 控制，且不产生校验规则或隐式 required', () => {
    const rs = rules(css())
    const contentRules = rs.filter((r) => /\bcontent\s*:/.test(r.body))
    expect(contentRules.length).toBe(1)
    for (const r of contentRules) {
      expect(r.selector, r.selector).toContain(HELPER_CLASSES[6]!) // ced-required-mark
      expect(r.body).toContain("content: '*'")
      expect(r.body).toContain('var(--ced-required-mark-color, var(--el-color-danger))')
    }
    // 不得写入 required 属性语义或生成隐式校验选择器。
    const text = css()
    expect(text).not.toMatch(/\[required\]/)
    expect(text).not.toMatch(/:required\b/)
    expect(text).not.toMatch(/is-required/)
  })

  it('18. 公共层不硬编码两页差异值（标签列宽／弹窗宽度／安全边距／加载灰度字面量）', () => {
    const text = css()
    for (const literal of FORBIDDEN_DIVERGENT_LITERALS) {
      expect(text, literal).not.toContain(literal)
    }
    // `#3f3f46` 仅可作标签颜色默认值；不得作为加载态灰度缺省。
    const loadingRule = rules(text).find((r) => r.selector.includes('is-loading'))!
    expect(loadingRule.body).not.toContain(PROBE_END_LOADING_GRAY)
  })

  it('19. 未接入页面零泄漏：views 下无任何弹窗挂载 ced-dialog 根类', () => {
    const VIEWS_DIR = resolve(SRC_DIR, 'views')
    const mounted = walk(VIEWS_DIR)
      .filter((file) => file.endsWith('.vue'))
      .filter((file) => readFileSync(file, 'utf8').includes(ROOT_CLASS))
      .map(relative)
    expect(mounted).toEqual([])
  })

  it('20. 公共预设规则在全 frontend/src 中只有唯一来源文件', () => {
    const hits: string[] = []
    for (const file of walk(SRC_DIR)) {
      const text = stripComments(readFileSync(file, 'utf8'))
      if (ROOT_RULE_RE.test(text) || text.includes(CONSUME_ROOT)) hits.push(relative(file))
    }
    expect(hits).toEqual([`styles/dialog/${CSS_FILE}`])
  })

  it('21. 公共 CSS 经前端全局入口只做一次最小引入', () => {
    const importing = walk(SRC_DIR)
      .filter((file) => readFileSync(file, 'utf8').includes(IMPORT_PATH))
      .map(relative)
    expect(importing).toEqual(['main.ts'])
    const mainText = readFileSync(join(SRC_DIR, 'main.ts'), 'utf8')
    expect(mainText.split(IMPORT_PATH).length - 1).toBe(1)
  })
})
