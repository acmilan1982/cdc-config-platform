import { describe, it, expect, vi, afterEach } from 'vitest'
import http from '@/services/http'
import {
  fetchTopicCandidates,
  fetchTopicOffsets,
  serializeTopicOffsetParams,
} from '@/api/topicOffset'
import type { ApiResponse } from '@/types/monitor'
import type { CandidateGroup, TopicOffsetPageResult } from '@/types/topicOffset'

const QUERY_TIMEOUT = 30000

function okOffsets(): ApiResponse<TopicOffsetPageResult> {
  return {
    code: 200,
    message: 'success',
    timestamp: '',
    data: {
      pageNum: 1,
      pageSize: 150,
      total: 1,
      pages: 1,
      unparseableTotal: 0,
      records: [
        {
          serverId: 'SVR1',
          rawTopic: 'cli.src.schema.tbl.tgt',
          nextOffset: '100',
          updatedAt: '2026-09-02 10:00:00',
          kafkaEndOffset: null,
          pendingCount: null,
          consumeLag: null,
          parseable: true,
          parsed: { clientId: 'cli', sourceId: 'src', schema: 'schema', table: 'tbl', targetId: 'tgt' },
          mapping: {
            client: { state: 'ACTIVE', id: 'cli', org: null, desc: '客户端' },
            source: { state: 'ACTIVE', id: 'src', org: '源库', desc: null },
            target: { state: 'ACTIVE', id: 'tgt', org: '目标库', desc: null },
          },
        },
      ],
    },
  }
}

function okCandidates(): ApiResponse<CandidateGroup> {
  return {
    code: 200,
    message: 'success',
    timestamp: '',
    data: {
      clients: [{ id: 'CLI1', desc: '客户端一', active: true }],
      sources: [{ id: 'DS1', org: '源库A', active: true }],
      targets: [{ id: 'DS2', org: '目标库A', active: true }],
    },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('serializeTopicOffsetParams 多值参数序列化（API.md §4.1）', () => {
  it('三维多选各自生成重复参数而非 [] 括号/CSV/JSON 形式', () => {
    const result = serializeTopicOffsetParams({
      clientId: ['C1', 'C2'],
      sourceId: ['S1'],
      targetId: ['T1'],
      tableName: '',
      pageNum: 1,
    })
    expect(result).toBe('clientId=C1&clientId=C2&sourceId=S1&targetId=T1&pageNum=1')
    expect(result).not.toContain('clientId[]')
    expect(result).not.toContain('["C1","C2"]')
    expect(result).not.toContain('C1,C2')
  })

  it('空表名不输出 tableName；空维度不输出任何该维度参数', () => {
    const result = serializeTopicOffsetParams({
      clientId: [],
      sourceId: [],
      targetId: [],
      tableName: '',
      pageNum: 2,
    })
    expect(result).toBe('pageNum=2')
  })

  it('特殊字符按 encodeURIComponent 编码', () => {
    const result = serializeTopicOffsetParams({
      clientId: ['A,B'],
      sourceId: ['S.01'],
      targetId: [],
      tableName: 'x y',
      pageNum: 1,
    })
    expect(result).toContain('clientId=A%2CB')
    expect(result).toContain('tableName=x%20y')
  })
})

describe('topic-offset API 请求契约', () => {
  it('GET /api/monitor/topic-offset/offsets 携带重复参数序列化 + timeout=30000', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: okOffsets() } as never)

    const res = await fetchTopicOffsets({
      clientId: ['C1', 'C2'],
      sourceId: [],
      targetId: ['T1'],
      tableName: 'ord',
      pageNum: 3,
    })

    expect(getSpy).toHaveBeenCalledTimes(1)
    const [url, config] = getSpy.mock.calls[0] as unknown as [
      string,
      {
        params: { clientId: string[]; sourceId: string[]; targetId: string[]; tableName: string; pageNum: number }
        paramsSerializer: (params: unknown) => string
        timeout: number
      },
    ]
    expect(url).toBe('/api/monitor/topic-offset/offsets')
    expect(config.timeout).toBe(QUERY_TIMEOUT)
    expect(config.paramsSerializer(config.params)).toBe(
      'clientId=C1&clientId=C2&targetId=T1&tableName=ord&pageNum=3',
    )
    expect(Array.isArray(res.data.records)).toBe(true)
    expect(res.data.records[0].rawTopic).toBe('cli.src.schema.tbl.tgt')
    // Kafka 三列与字符串 Offset 原样透传，不被前端改写
    expect(res.data.records[0].kafkaEndOffset).toBeNull()
    expect(res.data.records[0].nextOffset).toBe('100')
  })

  it('GET /api/monitor/topic-offset/candidates 请求候选且 timeout=30000', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: okCandidates() } as never)

    const res = await fetchTopicCandidates()

    expect(getSpy.mock.calls[0]).toEqual([
      '/api/monitor/topic-offset/candidates',
      { timeout: QUERY_TIMEOUT },
    ])
    expect(res.data.clients[0].desc).toBe('客户端一')
  })

  it('全局 http.ts 默认超时保持 10000，请求级覆盖不修改全局', () => {
    expect(http.defaults.timeout).toBe(10000)
  })
})
