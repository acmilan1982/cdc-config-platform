import { ALL_DATA_SOURCE } from '../composables/useLogQueryTab'

/**
 * 多选互斥："全部"与具体值互斥（LQ-UI-058 / LQ-DESIGN-170）。
 * 原值含"全部"时用户新增具体值 → 去掉"全部"；原值无"全部"时用户选了"全部" → 只保留"全部"。
 * 清空后恢复"全部"，避免出现无任何选择的空白态。
 */
export function normalizeSelection(prev: string[], next: string[]): string[] {
  if (next.length === 0) return [ALL_DATA_SOURCE]
  if (next.includes(ALL_DATA_SOURCE)) {
    if (prev.includes(ALL_DATA_SOURCE)) {
      return Array.from(new Set(next.filter((v) => v !== ALL_DATA_SOURCE)))
    }
    return [ALL_DATA_SOURCE]
  }
  return Array.from(new Set(next))
}
