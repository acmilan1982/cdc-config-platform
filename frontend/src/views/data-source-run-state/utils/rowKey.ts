import type { SnapshotStatusItem } from '@/types/dataSourceSnapshot'

/** NUL 分隔符：避免普通字符串拼接歧义（DESIGN §15.1-11，API §6.1）。 */
const SEP = String.fromCharCode(0)

/** 表格行唯一键 = clientId + '\x00' + sourceId（复合组合唯一、无拼接歧义）。 */
export function rowKey(row: SnapshotStatusItem): string {
  return `${row.clientId}${SEP}${row.sourceId}`
}
