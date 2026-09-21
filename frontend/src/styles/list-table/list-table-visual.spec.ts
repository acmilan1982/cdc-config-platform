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

  it('6. 每条 :deep(...) 均由 .lt-main-table 限定', () => {
    const deep = rules(css()).filter((r) => r.selector.includes(':deep('))
    expect(deep.length).toBeGreaterThan(0)
    for (const { selector } of deep) {
      expect(selector.startsWith(`${ROOT_CLASS_SELECTOR} `), selector).toBe(true)
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

  it('11. 内部辅助类数量为 0（除根类外无其他 lt- 类选择器）', () => {
    const classes = [...new Set(css().match(/\.lt-[\w-]+/g) ?? [])]
    expect(classes).toEqual([ROOT_CLASS_SELECTOR])
  })

  it('12. 公共预设规则在全 frontend/src 中只有唯一来源文件', () => {
    const hits: string[] = []
    for (const file of walk(SRC_DIR)) {
      const text = stripComments(readFileSync(file, 'utf8'))
      if (ROOT_RULE_RE.test(text) || text.includes(CONSUME_ROOT)) hits.push(relative(file))
    }
    expect(hits).toEqual([`styles/list-table/${CSS_FILE}`])
  })
})
