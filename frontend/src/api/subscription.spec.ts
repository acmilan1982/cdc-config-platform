import { describe, it, expect, vi, afterEach } from 'vitest'
import http from '@/services/http'
import {
  createSubscription,
  deleteSubscription,
  fetchSourceSchemas,
  fetchSourceTables,
  fetchSubscriptionDeletePreview,
  fetchSubscriptionDetail,
  fetchSubscriptionEdit,
  fetchSubscriptionList,
  fetchSubscriptionOptions,
  serializeSubscriptionParams,
  updateSubscription,
} from '@/api/subscription'
import type { ApiResponse } from '@/types/monitor'
import type {
  SubscriptionCreateDTO,
  SubscriptionListQuery,
  SubscriptionListVO,
  SubscriptionOptionsVO,
  SubscriptionRowVO,
  SubscriptionUpdateDTO,
} from '@/types/subscription'

const QUERY_TIMEOUT = 30000
const WRITE_TIMEOUT = 30000

function okOptions(): ApiResponse<SubscriptionOptionsVO> {
  return {
    code: 200,
    message: 'success',
    timestamp: '',
    data: {
      sources: [{ dataSourceId: '112-source-19c', dataSourceOrg: '机构A' }],
      targets: [{ dataSourceId: 'T01', dataSourceOrg: '机构B' }],
    },
  }
}

function okList(): ApiResponse<SubscriptionListVO> {
  return {
    code: 200,
    message: 'success',
    timestamp: '',
    data: {
      items: [
        {
          dataSubId: '9f3f' + '0'.repeat(28),
          dataSubDesc: '机构A到机构B全量订阅',
          anomalyMultiSource: false,
          source: { dataSourceId: 'S01', dataSourceOrg: '机构A', status: 'NORMAL' },
          sourceTableCount: 2,
          tablesBySchema: [{ schema: 'SCHEMA_A', tables: ['TABLE_1', 'TABLE_2'] }],
          rawUnparseableTables: [],
          targets: [{ dataSourceId: 'T01', dataSourceOrg: '机构B', status: 'NORMAL' }],
          updateTime: '2026-08-30T10:00:00',
          insertTime: '2026-08-29T09:00:00',
        },
      ] as SubscriptionRowVO[],
      queryWarnings: [
        {
          type: 'AMBIGUOUS_COMMA_ID',
          field: 'sourceIds',
          value: 'A,B',
          message: '含逗号的数据源 ID 只能进行历史兼容可能匹配，结果可能包含歧义记录',
        },
      ],
    },
  }
}

function okNull(): ApiResponse<null> {
  return { code: 200, message: 'success', timestamp: '', data: null }
}

function createRequest(): SubscriptionCreateDTO {
  return {
    dataSubDesc: '机构A到机构B全量订阅',
    dataFromSourceId: 'S01',
    dataToSourceIds: ['T01'],
    sourceTables: [{ schemaName: 'SCHEMA_A', tableName: 'TABLE_1' }],
  }
}

function updateRequest(): SubscriptionUpdateDTO {
  return {
    dataSubDesc: '机构A到机构B全量订阅',
    dataFromSourceId: 'S01',
    dataToSourceIds: ['T01'],
    sourceSelectionMode: 'REPLACE',
    sourceTables: [{ schemaName: 'SCHEMA_A', tableName: 'TABLE_1' }],
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('serializeSubscriptionParams 多选参数序列化（API.md §4.2）', () => {
  it('多个 sourceIds 生成重复参数而非 sourceIds[]= 括号形式、非 JSON 数组、非 CSV', () => {
    const query: SubscriptionListQuery = { sourceIds: ['A', 'B'] }
    const result = serializeSubscriptionParams(query)
    expect(result).toBe('sourceIds=A&sourceIds=B')
    expect(result).not.toContain('sourceIds[]')
    expect(result).not.toContain('%5B')
    expect(result).not.toContain('["A","B"]')
    expect(result).not.toContain('A,B')
  })

  it('targetIds 同样生成重复参数形式', () => {
    expect(serializeSubscriptionParams({ targetIds: ['T1', 'T2', 'T3'] })).toBe(
      'targetIds=T1&targetIds=T2&targetIds=T3',
    )
  })

  it('源库组与目标库组并存时按先后输出且不混合为单一 OR 容器', () => {
    expect(
      serializeSubscriptionParams({ sourceIds: ['A', 'B'], targetIds: ['T1'] }),
    ).toBe('sourceIds=A&sourceIds=B&targetIds=T1')
  })

  it('空数组/未填不输出任何参数', () => {
    expect(serializeSubscriptionParams({})).toBe('')
    expect(serializeSubscriptionParams({ sourceIds: [], targetIds: undefined })).toBe('')
  })

  it('含特殊字符的 ID 值按 encodeURIComponent 编码（保留字符可正确传输）', () => {
    const result = serializeSubscriptionParams({ sourceIds: ['A,B', 'S.01', 'x y'] })
    expect(result).toBe('sourceIds=A%2CB&sourceIds=S.01&sourceIds=x%20y')
  })
})

describe('数据订阅 API 请求契约（API.md §4）', () => {
  it('GET /api/subscriptions/options 请求候选且 timeout=30000', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: okOptions() } as never)

    const res = await fetchSubscriptionOptions()

    expect(getSpy).toHaveBeenCalledTimes(1)
    expect(getSpy.mock.calls[0]).toEqual(['/api/subscriptions/options', { timeout: QUERY_TIMEOUT }])
    expect(res).toEqual(okOptions())
    expect(res.data.sources[0].dataSourceOrg).toBe('机构A')
  })

  it('GET /api/subscriptions 以重复参数序列化多选；响应 data 为对象含 items+queryWarnings 而非数组', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: okList() } as never)
    const query: SubscriptionListQuery = { sourceIds: ['A', 'B'], targetIds: ['T1'] }

    const res = await fetchSubscriptionList(query)

    expect(getSpy).toHaveBeenCalledTimes(1)
    const [url, config] = getSpy.mock.calls[0] as unknown as [
      string,
      {
        params: SubscriptionListQuery
        paramsSerializer: (params: SubscriptionListQuery) => string
        timeout: number
      },
    ]
    expect(url).toBe('/api/subscriptions')
    expect(config.timeout).toBe(QUERY_TIMEOUT)
    expect(config.params).toEqual(query)
    // 交给 axios 的序列化函数必须生成后端可识别的重复参数形式
    expect(config.paramsSerializer(config.params)).toBe('sourceIds=A&sourceIds=B&targetIds=T1')
    expect(config.paramsSerializer(config.params)).not.toContain('sourceIds[]')
    expect(config.paramsSerializer(config.params)).not.toContain('A,B')

    // data 是对象，读取 data.items 与 data.queryWarnings
    expect(Array.isArray(res.data)).toBe(false)
    expect(Array.isArray(res.data.items)).toBe(true)
    expect(res.data.items[0].dataSubDesc).toBe('机构A到机构B全量订阅')
    expect(res.data.queryWarnings[0].type).toBe('AMBIGUOUS_COMMA_ID')
  })

  it('GET /api/subscriptions 无条件时 params 为空对象且序列化为空串', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: okList() } as never)

    await fetchSubscriptionList({})

    const [, config] = getSpy.mock.calls[0] as unknown as [
      string,
      {
        params: SubscriptionListQuery
        paramsSerializer: (params: SubscriptionListQuery) => string
        timeout: number
      },
    ]
    expect(config.paramsSerializer(config.params)).toBe('')
  })

  it('GET /api/subscriptions/{dataSubId} 使用 encodeURIComponent 且 timeout=30000', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        timestamp: '',
        data: {
          dataSubId: '9f3f',
          dataSubDesc: '机构A到机构B全量订阅',
          source: { dataSourceId: 'S01', dataSourceOrg: '机构A', status: 'NORMAL' },
          tablesBySchema: [{ schema: 'SCHEMA_A', tables: ['TABLE_1'] }],
          rawUnparseableTables: [],
          targets: [{ dataSourceId: 'T01', dataSourceOrg: '机构B', status: 'NORMAL' }],
          insertTime: '2026-08-29T09:00:00',
          updateTime: null,
          warnings: [],
        },
      },
    } as never)

    const res = await fetchSubscriptionDetail('9f3f')

    expect(getSpy.mock.calls[0]).toEqual([
      '/api/subscriptions/9f3f',
      { timeout: QUERY_TIMEOUT },
    ])
    expect(res.data.tablesBySchema[0].schema).toBe('SCHEMA_A')
  })

  it('GET /api/subscriptions/metadata/schemas 用 params 对象承载 dataSourceId（保持原始字符串，不手工拼 query）', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        timestamp: '',
        data: { dataSourceId: '112-source-19c', filterMode: 'ORACLE_MAINTAINED', schemas: ['CDC_USER', 'SPT_HIS_2023'] },
      },
    } as never)

    const res = await fetchSourceSchemas('112-source-19c')

    expect(getSpy.mock.calls[0]).toEqual([
      '/api/subscriptions/metadata/schemas',
      { params: { dataSourceId: '112-source-19c' }, timeout: QUERY_TIMEOUT },
    ])
    expect(res.data.schemas).toContain('CDC_USER')
  })

  it('GET /api/subscriptions/metadata/tables 用 params 对象承载 dataSourceId+schema（区分大小写）', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        timestamp: '',
        data: { dataSourceId: '112-source-19c', schema: 'SPT_HIS_2023', tables: ['TBL_A', 'TBL_B'] },
      },
    } as never)

    const res = await fetchSourceTables('112-source-19c', 'SPT_HIS_2023')

    expect(getSpy.mock.calls[0]).toEqual([
      '/api/subscriptions/metadata/tables',
      { params: { dataSourceId: '112-source-19c', schema: 'SPT_HIS_2023' }, timeout: QUERY_TIMEOUT },
    ])
    expect(res.data.tables).toEqual(['TBL_A', 'TBL_B'])
  })

  it('POST /api/subscriptions 携带新增体；成功 data 为对象含 dataSubId 而非裸字符串', async () => {
    const postSpy = vi.spyOn(http, 'post').mockResolvedValue({
      data: { code: 200, message: 'success', timestamp: '', data: { dataSubId: '9f3f' + '0'.repeat(28) } },
    } as never)
    const request = createRequest()

    const res = await createSubscription(request)

    expect(postSpy.mock.calls[0]).toEqual(['/api/subscriptions', request, { timeout: WRITE_TIMEOUT }])
    // data 是对象，读取 data.dataSubId
    expect(typeof res.data).toBe('object')
    expect(res.data.dataSubId).toBe('9f3f' + '0'.repeat(28))
  })

  it('GET /api/subscriptions/{dataSubId}/edit 回显编辑打开数据', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        timestamp: '',
        data: {
          dataSubId: '9f3f',
          dataSubDesc: '机构A到机构B全量订阅',
          source: { dataSourceId: 'S01', dataSourceOrg: '机构A', status: 'NORMAL' },
          targets: [{ dataSourceId: 'T01', dataSourceOrg: '机构B', status: 'NORMAL' }],
          tablesBySchema: [{ schema: 'SCHEMA_A', tables: ['TABLE_1'] }],
          rawUnparseableTables: [],
          sourceReachable: true,
          sourceTableCheck: 'CHECKED',
          invalidTables: [],
        },
      },
    } as never)

    const res = await fetchSubscriptionEdit('9f3f')

    expect(getSpy.mock.calls[0]).toEqual(['/api/subscriptions/9f3f/edit', { timeout: QUERY_TIMEOUT }])
    expect(res.data.sourceTableCheck).toBe('CHECKED')
    expect(res.data.sourceReachable).toBe(true)
  })

  it('PUT /api/subscriptions/{dataSubId} 携带编辑体且 timeout=30000', async () => {
    const putSpy = vi.spyOn(http, 'put').mockResolvedValue({ data: okNull() } as never)
    const request = updateRequest()

    const res = await updateSubscription('9f3f', request)

    expect(putSpy.mock.calls[0]).toEqual([
      '/api/subscriptions/9f3f',
      request,
      { timeout: WRITE_TIMEOUT },
    ])
    expect(res.data).toBeNull()
  })

  it('GET /api/subscriptions/{dataSubId}/delete-preview 删除预览（schemaCount/tableCount）', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        timestamp: '',
        data: {
          dataSubId: '9f3f',
          dataSubDesc: '机构A到机构B全量订阅',
          source: { dataSourceId: 'S01', dataSourceOrg: '机构A', status: 'NORMAL' },
          schemaCount: 2,
          tableCount: 128,
          targets: [{ dataSourceId: 'T01', dataSourceOrg: '机构B', status: 'NORMAL' }],
          warnings: [],
        },
      },
    } as never)

    const res = await fetchSubscriptionDeletePreview('9f3f')

    expect(getSpy.mock.calls[0]).toEqual([
      '/api/subscriptions/9f3f/delete-preview',
      { timeout: QUERY_TIMEOUT },
    ])
    expect(res.data.schemaCount).toBe(2)
    expect(res.data.tableCount).toBe(128)
  })

  it('DELETE /api/subscriptions/{dataSubId} 无请求体（不携带并发字段），timeout=30000', async () => {
    const deleteSpy = vi.spyOn(http, 'delete').mockResolvedValue({ data: okNull() } as never)

    const res = await deleteSubscription('9f3f')

    expect(deleteSpy.mock.calls[0]).toEqual(['/api/subscriptions/9f3f', { timeout: WRITE_TIMEOUT }])
    expect(res.data).toBeNull()
  })

  it('全局 http.ts 默认超时保持 10000，请求级覆盖不修改全局', () => {
    expect(http.defaults.timeout).toBe(10000)
  })
})
