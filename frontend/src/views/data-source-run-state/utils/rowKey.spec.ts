import { describe, it, expect } from 'vitest'
import type { SnapshotStatusItem } from '@/types/dataSourceSnapshot'
import { rowKey } from './rowKey'

function item(clientId: string, sourceId: string): SnapshotStatusItem {
  return {
    clientId,
    clientRef: { state: 'ACTIVE', desc: null },
    sourceId,
    sourceRef: { state: 'ACTIVE', org: null, category: 'SOURCE', sourceRole: true },
    snapshotStatus: 'SNAPSHOT_RUNNING',
    statusCategory: 'RUNNING',
    snapshotLastSeenAt: null,
    snapshotCompletedAt: null,
    updatedAt: '2026-08-18 08:00:00',
  }
}

describe('rowKey 表格行唯一键（API §6.1，DESIGN §15.1-11）', () => {
  it('相同复合组合 key 稳定、不同组合互不相同', () => {
    expect(rowKey(item('a', 'b'))).toBe(rowKey(item('a', 'b')))
    expect(rowKey(item('a', 'b'))).not.toBe(rowKey(item('a', 'c')))
    expect(rowKey(item('a', 'b'))).not.toBe(rowKey(item('x', 'b')))
  })

  it('NUL 分隔避免普通字符串拼接歧义', () => {
    expect(rowKey(item('a:b', 'c'))).not.toBe(rowKey(item('a', 'b:c')))
  })

  it('key 恒包含完整 clientId 与 sourceId', () => {
    const k = rowKey(item('hosp-012', '112-source'))
    expect(k.includes('hosp-012')).toBe(true)
    expect(k.includes('112-source')).toBe(true)
  })
})
