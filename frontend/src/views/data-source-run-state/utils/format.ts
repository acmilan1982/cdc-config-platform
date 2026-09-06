/** 三个时间列的空值占位（DSS-REQ-031/032/033，AC-029/030/052）：null/空一律显示 --。 */
export const TIME_DASH = '--'

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
