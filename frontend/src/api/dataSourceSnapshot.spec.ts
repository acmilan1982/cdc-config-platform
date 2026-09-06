import { describe, it, expect, vi, afterEach } from 'vitest'
import http from '@/services/http'
import { fetchSnapshotStatusList, serializeDataSourceSnapshotParams } from '@/api/dataSourceSnapshot'
import type { ApiResponse } from '@/types/monitor'
import type { SnapshotStatusItem, SnapshotStatusListResult, CandidateGroup } from '@/types/dataSourceSnapshot'

const QUERY_TIMEOUT = 30000

function item(): SnapshotStatusItem {
  return {
    clientId: 'hosp-012',
    clientRef: { state: 'ACTIVE', desc: 'HIS 探针示例' },
    sourceId: '112-source-19c',
    sourceRef: { state: 'ACTIVE', org: '示例医院源库', category: 'SOURCE', sourceRole: true },
    snapshotStatus: 'SNAPSHOT_RUNNING',
    statusCategory: 'RUNNING',
    snapshotLastSeenAt: '2026-08-17 17:28:46',
    snapshotCompletedAt: null,
    updatedAt: '2026-08-17 17:28:46',
  }
}

function okList(): ApiResponse<SnapshotStatusListResult> {
  const data: SnapshotStatusListResult = {
    records: [item()],
    candidates: {
      clients: [{ id: 'hosp-012', desc: 'HIS 探针示例', active: true }],
      sources: [{ id: '112-source-19c', org: '示例医院源库', active: true }],
      statuses: ['RUNNING', 'COMPLETED'],
    } as CandidateGroup,
  }
  return { code: 200, message: 'success', timestamp: '', data }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('serializeDataSourceSnapshotParams 多值参数序列化（API §4.1）', () => {
  it('三维多选各自生成重复参数而非 [] 括号/CSV/JSON 形式', () => {
    const result = serializeDataSourceSnapshotParams({
      clientId: ['hosp-012', 'hosp-013'],
      sourceId: ['src-01'],
      status: ['RUNNING', 'UNKNOWN'],
    })
    expect(result).toBe(
      'clientId=hosp-012&clientId=hosp-013&sourceId=src-01&status=RUNNING&status=UNKNOWN',
    )
    expect(result).not.toContain('clientId[]')
    expect(result).not.toContain('status[]')
    expect(result).not.toContain('["hosp-012","hosp-013"]')
  })

  it('空维度不输出任何该维度参数（该维即“全部”，永不发送 __ALL__ 哨兵）', () => {
    const result = serializeDataSourceSnapshotParams({ clientId: [], sourceId: [], status: [] })
    expect(result).toBe('')
  })

  it('特殊字符按 encodeURIComponent 编码', () => {
    const result = serializeDataSourceSnapshotParams({
      clientId: ['A,B'],
      sourceId: ['s.01'],
      status: ['RUNNING'],
    })
    expect(result).toContain('clientId=A%2CB')
    expect(result).toContain('sourceId=s.01')
  })
})

describe('dataSourceSnapshot API 请求契约', () => {
  it('GET /api/monitor/data-source-run-state/list 携带重复参数序列化 + timeout=30000', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: okList() } as never)

    const res = await fetchSnapshotStatusList({
      clientId: ['hosp-012'],
      sourceId: [],
      status: ['RUNNING'],
    })

    expect(getSpy).toHaveBeenCalledTimes(1)
    const [url, config] = getSpy.mock.calls[0] as unknown as [
      string,
      {
        params: { clientId: string[]; sourceId: string[]; status: string[] }
        paramsSerializer: (params: unknown) => string
        timeout: number
      },
    ]
    expect(url).toBe('/api/monitor/data-source-run-state/list')
    expect(config.timeout).toBe(QUERY_TIMEOUT)
    expect(config.paramsSerializer(config.params)).toBe('clientId=hosp-012&status=RUNNING')
    expect(Array.isArray(res.data.records)).toBe(true)
    expect(res.data.records[0].snapshotStatus).toBe('SNAPSHOT_RUNNING')
    // 时间 null 透传不改写
    expect(res.data.records[0].snapshotCompletedAt).toBeNull()
  })

  it('全局 http.ts 默认超时保持 10000，请求级覆盖不修改全局', () => {
    expect(http.defaults.timeout).toBe(10000)
  })
})
