/**
 * 列表表格视觉模板 · 公共常量模块。
 * 只承载根类名常量与只读令牌名称清单，不含样式、路由逻辑、页面识别或运行时副作用。
 */

export const LT_MAIN_TABLE_CLASS = 'lt-main-table'

export const LT_TABLE_VISUAL_TOKENS = [
  '--lt-table-width',
  '--lt-border-color',
  '--lt-header-bg-color',
  '--lt-header-text-color',
  '--lt-header-font-size',
  '--lt-header-font-weight',
  '--lt-header-letter-spacing',
  '--lt-header-cell-padding',
  '--lt-body-cell-padding',
] as const
