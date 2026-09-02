import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import TopicOffsetPage from './TopicOffsetPage.vue'
import { useTopicOffsetStore } from '@/stores/topicOffset'
import type { ApiResponse } from '@/types/monitor'
import type {
  CandidateGroup,
  TopicOffsetItem,
  TopicOffsetPageResult,
  TopicOffsetQueryParams,
} from '@/types/topicOffset'

vi.mock('@/api/topicOffset', () => ({
  fetchTopicCandidates: vi.fn(),
  fetchTopicOffsets: vi.fn(),
}))

import { fetchTopicCandidates, fetchTopicOffsets } from '@/api/topicOffset'

const mockedOffsets = vi.mocked(fetchTopicOffsets)
const mockedCandidates = vi.mocked(fetchTopicCandidates)

function row(): TopicOffsetItem {
  return {
    serverId: 'SVR-A',
    rawTopic: 'cliA.srcA.scm.tblX.tgtA',
    nextOffset: '100',
    updatedAt: '2026-09-02 10:00:00',
    kafkaEndOffset: null,
    pendingCount: null,
    consumeLag: null,
    parseable: true,
    parsed: { clientId: 'cliA', sourceId: 'srcA', schema: 'scm', table: 'tblX', targetId: 'tgtA' },
    mapping: {
      client: { state: 'ACTIVE', id: 'cliA', org: null, desc: '客户端A' },
      source: { state: 'ACTIVE', id: 'srcA', org: '源库A', desc: null },
      target: { state: 'ACTIVE', id: 'tgtA', org: '目标库A', desc: null },
    },
  }
}

function candidatesRes(): ApiResponse<CandidateGroup> {
  return {
    code: 200,
    message: 'success',
    timestamp: '',
    data: { clients: [{ id: 'cliA', desc: '客户端A', active: true }], sources: [], targets: [] },
  }
}

function echoOffsets(params: TopicOffsetQueryParams): Promise<ApiResponse<TopicOffsetPageResult>> {
  const data: TopicOffsetPageResult = {
    pageNum: params.pageNum,
    pageSize: 150,
    total: 1,
    pages: 1,
    unparseableTotal: 0,
    records: [row()],
  }
  return Promise.resolve({ code: 200, message: 'success', timestamp: '', data })
}

beforeEach(() => {
  mockedCandidates.mockReset()
  mockedOffsets.mockReset()
  mockedCandidates.mockResolvedValue(candidatesRes())
  mockedOffsets.mockImplementation(echoOffsets)
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('TopicOffsetPage 页面编排 smoke', () => {
  it('挂载后展示页面标题、Kafka 提示，缺省查询成功填充表格与分页', async () => {
    const pinia = createPinia()
    const wrapper = mount(TopicOffsetPage, { global: { plugins: [pinia, ElementPlus] } })
    await flushPromises()
    await flushPromises()

    const text = wrapper.text()
    // 页面标题与 Kafka 提示（TOFF-REQ-067）
    expect(text).toContain('数据同步进度')
    expect(text).toContain('Kafka 实时数据尚未接入。Kafka 末端位置、待消费数量和消费延迟暂不计算。')

    const store = useTopicOffsetStore(pinia)
    expect(store.hasSuccess).toBe(true)
    // 缺省条件查询：三维空 + 空表名 + 第 1 页
    expect(mockedOffsets).toHaveBeenCalledTimes(1)
    const params = mockedOffsets.mock.calls[0][0]
    expect(params).toEqual(
      expect.objectContaining({ clientId: [], sourceId: [], targetId: [], tableName: '', pageNum: 1 }),
    )

    // 工具栏与分页
    expect(text).toContain('共 1 条')
    expect(text).toContain('第 1 / 共 1 页')
    // 同步对象内容已渲染
    expect(text).toContain('scm.tblX')

    wrapper.unmount()
  })
})
