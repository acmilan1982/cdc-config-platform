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
 * Feature 决定值令牌（4）：两页取值不同，公共层不设缺省，值由接入页面提供。
 * 未提供时对应声明不构成约束，不改动现有页面。
 *
 * - `--ced-label-column-width` / `--ced-dialog-safety-inset` / `--ced-label-gap`：
 *   以 `var(--ced-*)` **无回退**消费；未提供时声明回退为初始值（无害）。
 * - `--ced-submit-bg-loading`：以
 *   `var(--ced-submit-bg-loading, var(--ced-submit-bg, #09090b))` 消费；未提供时回退到
 *   主提交按钮**既有背景**（避免加载态跳色或透明），仍**不**声明任何缺省值。
 */
export const CED_DIALOG_FEATURE_TOKENS = [
  '--ced-label-column-width',
  '--ced-label-gap',
  '--ced-dialog-safety-inset',
  '--ced-submit-bg-loading',
] as const

/**
 * 全部已登记令牌（17）= 模板自有 13 + Feature 4。
 * 静态契约测试据此校验「令牌登记与 CSS 实际一致」。
 */
export const CED_DIALOG_TOKENS = [
  ...CED_DIALOG_TEMPLATE_TOKENS,
  ...CED_DIALOG_FEATURE_TOKENS,
] as const
