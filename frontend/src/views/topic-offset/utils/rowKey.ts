import type { TopicOffsetItem } from '@/types/topicOffset'

/** NUL 分隔符：避免普通字符串拼接歧义（如 serverId="a:b"+topic="c" 与 serverId="a"+topic="b:c" 冲突）。 */
const SEP = String.fromCharCode(0)

/**
 * 表格行唯一键（TOPIC-OFFSET-IMPLEMENTATION-001-R1 §4.1）。
 * 采用批准唯一键 SERVER_ID + KAFKA_TOPIC，NUL 分隔；同一 serverId/topic
 * 在同源刷新与分页下恒稳定，不以序号作 key。
 */
export function rowKey(row: TopicOffsetItem): string {
  return `${row.serverId}${SEP}${row.rawTopic}`
}
