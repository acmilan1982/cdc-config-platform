import { describe, it, expect } from 'vitest'
import type { TopicOffsetItem } from '@/types/topicOffset'
import { rowKey } from './rowKey'

function item(serverId: string, rawTopic: string): TopicOffsetItem {
  return {
    serverId,
    rawTopic,
    nextOffset: '1',
    updatedAt: null,
    kafkaEndOffset: null,
    pendingCount: null,
    consumeLag: null,
    parseable: true,
    parsed: null,
    mapping: null,
  }
}

describe('rowKey 稳定表格行唯一键（TOPIC-OFFSET-R1 §4.1）', () => {
  it('不同 serverId、相同 Topic 得到不同 key', () => {
    expect(rowKey(item('SVR-A', 'cli.src.sch.t.tgt'))).not.toBe(rowKey(item('SVR-B', 'cli.src.sch.t.tgt')))
  })

  it('相同 serverId、不同 Topic 得到不同 key', () => {
    expect(rowKey(item('SVR-A', 'cli.s1.s.t1.tgt'))).not.toBe(rowKey(item('SVR-A', 'cli.s1.s.t2.tgt')))
  })

  it('自动刷新后相同行 key 稳定（确定性、与调用次数无关）', () => {
    const a = item('SVR-A', 'cli.src.sch.tbl.tgt')
    const b = item('SVR-A', 'cli.src.sch.tbl.tgt')
    const k1 = rowKey(a)
    const k2 = rowKey(b)
    const k3 = rowKey(item('SVR-A', 'cli.src.sch.tbl.tgt'))
    expect(k1).toBe(k2)
    expect(k1).toBe(k3)
  })

  it('NUL 分隔避免普通字符串拼接歧义', () => {
    // ":" 拼接下 (a:b, c) 与 (a, b:c) 会撞键；NUL 分隔必须区分
    expect(rowKey(item('a:b', 'c'))).not.toBe(rowKey(item('a', 'b:c')))
  })

  it('key 永不为 undefined/空，且包含完整 serverId 与 rawTopic', () => {
    const k = rowKey(item('SVR-001', 'cli.src.sch.tbl.tgt'))
    expect(k).toBeTruthy()
    expect(k.includes('SVR-001')).toBe(true)
    expect(k.includes('cli.src.sch.tbl.tgt')).toBe(true)
  })
})
