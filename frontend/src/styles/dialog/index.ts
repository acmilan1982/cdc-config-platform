/**
 * 新增／编辑业务弹窗公共视觉模板 · 常量导出。
 *
 * 仅导出显式 opt-in 根类常量与已登记的 `--ced-*` 令牌清单；
 * 不引入任何模块、不产生任何副作用、不注册路由或运行时。
 */

/** 显式 opt-in 根类：唯一挂载契约（未挂该根类的弹窗零命中）。 */
export const CED_DIALOG_CLASS = 'ced-dialog'

/**
 * 模板自有令牌（13）：两页可比对一致的视觉，消费点均带内联默认值。
 * 公共层不声明其值，最终值只可能来自启用页面的局部覆盖。
 */
export const CED_DIALOG_TEMPLATE_TOKENS = [
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
] as const

/**
 * Feature 决定值令牌（2）：两页取值不同，公共层不设缺省，值由接入页面提供。
 * 未提供时对应声明不构成约束（回退为初始值），不改动现有页面。
 */
export const CED_DIALOG_FEATURE_TOKENS = [
  '--ced-label-column-width',
  '--ced-dialog-safety-inset',
] as const

/**
 * 全部已登记令牌（15）= 模板自有 + Feature。
 * 静态契约测试据此校验「令牌登记与 CSS 实际一致」。
 *
 * 说明：已批准设计登记表中的 `--ced-label-gap` 与 `--ced-submit-bg-loading` 本轮**未**实现——
 * 前者无纯 CSS 可复用的公共消费点（间距由页面 flex 布局／EP `label-width` 承载），
 * 后者属 Feature 可选且两页不一致、公共层不设缺省（详见实现报告「取舍」节）。
 */
export const CED_DIALOG_TOKENS = [
  ...CED_DIALOG_TEMPLATE_TOKENS,
  ...CED_DIALOG_FEATURE_TOKENS,
] as const
