import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTopicOffsetStore } from './topicOffset'
import type { AppliedCriteria, TopicOffsetPageResult } from '@/types/topicOffset'

function page(overrides: Partial<TopicOffsetPageResult> = {}): TopicOffsetPageResult {
  return {
    pageNum: 1,
    pageSize: 150,
    total: 2,
    pages: 1,
    unparseableTotal: 1,
    records: [],
    ...overrides,
  }
}

const CRITERIA: AppliedCriteria = { clientIds: ['C1'], sourceIds: [], targetIds: [], tableName: 'tbl' }

describe('topicOffset store 会话级状态（DESIGN §6.2/§6.5）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始：无成功记录（hasSuccess=false）、缺省页码与候选', () => {
    const store = useTopicOffsetStore()
    expect(store.hasSuccess).toBe(false)
    expect(store.appliedCriteria).toBeNull()
    expect(store.pageNum).toBe(1)
    expect(store.pages).toBe(0)
    expect(store.total).toBe(0)
    expect(store.records).toEqual([])
    expect(store.lastRefreshText).toBeNull()
    expect(store.candidates).toBeNull()
  })

  it('commitSuccess 原子写入生效条件/页码/结果/刷新时刻（DESIGN §6.5）', () => {
    const store = useTopicOffsetStore()
    store.commitSuccess(CRITERIA, 1, page({ pageNum: 1, total: 2, pages: 1 }), 1000)
    expect(store.hasSuccess).toBe(true)
    expect(store.appliedCriteria).toEqual(CRITERIA)
    expect(store.pageNum).toBe(1)
    expect(store.total).toBe(2)
    expect(store.pages).toBe(1)
    expect(store.unparseableTotal).toBe(1)
    expect(store.lastRefreshText).toMatch(/^\d{2}:\d{2}:\d{2}$/)
  })

  it('翻页成功提交新页码；同一会话内刷新成功提交覆盖结果但页码语义以提交入参为准', () => {
    const store = useTopicOffsetStore()
    store.commitSuccess(CRITERIA, 1, page({ pageNum: 1, total: 5, pages: 2 }), 1000)
    expect(store.pageNum).toBe(1)
    store.commitSuccess(CRITERIA, 2, page({ pageNum: 2, total: 5, pages: 2 }), 2000)
    expect(store.pageNum).toBe(2)
    expect(store.lastRefreshText).toBeTruthy()
  })

  it('setCandidates 保存候选分组', () => {
    const store = useTopicOffsetStore()
    store.setCandidates({
      clients: [{ id: 'C1', desc: 'x', active: true }],
      sources: [],
      targets: [],
    })
    expect(store.candidates?.clients[0].id).toBe('C1')
    store.setCandidates(null)
    expect(store.candidates).toBeNull()
  })
})
