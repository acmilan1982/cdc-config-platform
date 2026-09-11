/** 三个时间列的空值占位（DSS-REQ-031/032/033，AC-029/030/052）：null/空一律显示 --。 */
export const TIME_DASH = '--'

/** 统一字段级截断上限：四个展示字段一律 20 个 Unicode code point（DSS-REQ-085）。 */
export const FIELD_TRUNCATE_CODE_POINTS = 20

/**
 * 按 Unicode code point 计数（非 UTF-16 码元）：CJK/emoji 各计 1，代理对不被拆开（DSS-REQ-085）。
 */
export function codePointLength(text: string): number {
  return Array.from(text).length
}

/**
 * 统一字段级展示截断（DSS-REQ-085，AC-098/099）：code point 数 ≤ max 返回原文、不追加省略号；
 * > max 返回前 max 个 code point + 英文三点 `...`（不是单字符 `…`）。
 * 只用于展示，调用方不得把结果回流到选项 value、查询参数或请求语义。
 */
export function truncateCodePoints(text: string, max: number = FIELD_TRUNCATE_CODE_POINTS): string {
  const points = Array.from(text)
  if (points.length <= max) return text
  return `${points.slice(0, max).join('')}...`
}

/**
 * 四字段展示管线第一步（DSS-REQ-085）：null/undefined 安全归一为空字符串，其余执行 trim()。
 * 只用于展示；调用方不得把结果回流到选项 value、选中值和查询参数。
 */
export function normalizeFieldText(value: string | null | undefined): string {
  return value == null ? '' : value.trim()
}

/**
 * 四字段统一展示规则（DSS-REQ-085，AC-098/099）：先 normalizeFieldText（null 安全 + trim），
 * 再对 trim 后结果按 Unicode 码点计数——不超过 max 完整显示，超过则显示前 max 个码点并追加 ASCII 三点 `...`。
 * CLIENT_ID / CLIENT_DESC / DATA_SOURCE_ORG / DATA_SOURCE_ID 四个展示字段必须共用本函数，
 * 不得出现不同字段各自实现；组合标签对每个组成字段分别调用（不能先拼接再整体截断）。
 * 只用于展示：返回值不得作为选项稳定身份、选中值或查询参数。
 */
export function displayField(value: string | null | undefined, max: number = FIELD_TRUNCATE_CODE_POINTS): string {
  return truncateCodePoints(normalizeFieldText(value), max)
}

/** 后端 TO_CHAR 字符串（YYYY-MM-DD HH:mm:ss）或 null → 展示文本；null/空返回 --，原值不改变。 */
export function formatTimeOrDash(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return TIME_DASH
  return value
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** 最近成功刷新时间（前端成功时刻 epoch ms）→ HH:mm:ss；null（从未成功）返回 --（UI §6.1）。 */
export function formatEpochToHms(epochMs: number | null | undefined): string {
  if (epochMs === null || epochMs === undefined || !Number.isFinite(epochMs)) return TIME_DASH
  const d = new Date(epochMs)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}
