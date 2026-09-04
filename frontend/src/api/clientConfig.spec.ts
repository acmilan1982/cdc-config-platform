import { describe, it, expect, vi, afterEach } from 'vitest'
import http from '@/services/http'
import {
  createClient,
  deleteClient,
  disableClient,
  enableClient,
  fetchClientList,
  fetchDataSourceOptions,
  updateClient,
} from '@/api/clientConfig'
import type { ApiResponse } from '@/types/monitor'
import type {
  ClientListQuery,
  ClientListVO,
  ClientSaveRequest,
  DataSourceOptionVO,
} from '@/types/clientConfig'

const TIMEOUT = 30000

function okList(): ApiResponse<ClientListVO> {
  return { code: 200, message: 'success', timestamp: '', data: { items: [] } }
}

function okOptions(data: DataSourceOptionVO[]): ApiResponse<DataSourceOptionVO[]> {
  return { code: 200, message: 'success', timestamp: '', data }
}

function okNull(): ApiResponse<null> {
  return { code: 200, message: 'success', timestamp: '', data: null }
}

function fail(code: number, message: string): ApiResponse<null> {
  return { code, message, timestamp: '', data: null }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('client-config API 请求契约（API.md E1~E7 / CCFG-API-001~020）', () => {
  it('E1 GET /api/clients 以 params 传递 keyword/status 并 timeout=30000', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: okList() } as never)
    const query: ClientListQuery = { keyword: 'probe', status: 'ENABLED' }

    const res = await fetchClientList(query)

    expect(getSpy).toHaveBeenCalledTimes(1)
    expect(getSpy.mock.calls[0]).toEqual([
      '/api/clients',
      { params: query, timeout: TIMEOUT },
    ])
    expect(res).toEqual(okList())
  })

  it('E1 无关键词也显式传空 params，不注入多余键', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: okList() } as never)

    await fetchClientList({})

    expect(getSpy.mock.calls[0]).toEqual(['/api/clients', { params: {}, timeout: TIMEOUT }])
  })

  it('E2 GET /api/clients/data-source-options 缺省不传 excludeClientId', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: okOptions([]) } as never)

    const res = await fetchDataSourceOptions()

    expect(getSpy.mock.calls[0]).toEqual([
      '/api/clients/data-source-options',
      { params: {}, timeout: TIMEOUT },
    ])
    expect(res).toEqual(okOptions([]))
  })

  it('E2 编辑传原探针 ID 作为 excludeClientId（Query 编码交由 axios，传原值）', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: okOptions([]) } as never)

    await fetchDataSourceOptions('probe 001/')

    expect(getSpy.mock.calls[0]).toEqual([
      '/api/clients/data-source-options',
      { params: { excludeClientId: 'probe 001/' }, timeout: TIMEOUT },
    ])
  })

  it('E3 POST /api/clients 携带完整新增体且不含状态字段', async () => {
    const postSpy = vi.spyOn(http, 'post').mockResolvedValue({ data: okNull() } as never)
    const request: ClientSaveRequest = {
      clientId: 'probe-002',
      clientDesc: '分院探针',
      dataSourceIds: ['ds_oracle_021', 'ds_oracle_022'],
    }

    const res = await createClient(request)

    expect(postSpy.mock.calls[0]).toEqual(['/api/clients', request, { timeout: TIMEOUT }])
    expect(res).toEqual(okNull())
    expect(JSON.stringify(request)).not.toContain('fgActive')
    expect(JSON.stringify(request)).not.toContain('password')
  })

  it('E4 PUT /api/clients/{originalClientId} 使用 encodeURIComponent 且 body 含最终值', async () => {
    const putSpy = vi.spyOn(http, 'put').mockResolvedValue({ data: okNull() } as never)
    const request: ClientSaveRequest = {
      clientId: 'PROBE-001',
      clientDesc: '中心医院探针（更名后）',
      dataSourceIds: ['ds_oracle_011'],
    }

    const res = await updateClient('probe 001', request)

    expect(putSpy.mock.calls[0]).toEqual([
      '/api/clients/probe%20001',
      request,
      { timeout: TIMEOUT },
    ])
    expect(res).toEqual(okNull())
  })

  it('E5 DELETE /api/clients/{clientId} 使用 encodeURIComponent', async () => {
    const deleteSpy = vi.spyOn(http, 'delete').mockResolvedValue({ data: okNull() } as never)

    const res = await deleteClient('probe 001/')

    expect(deleteSpy.mock.calls[0]).toEqual([
      '/api/clients/probe%20001%2F',
      { timeout: TIMEOUT },
    ])
    expect(res).toEqual(okNull())
  })

  it('E6/E7 PUT /api/clients/{clientId}/enable|disable 路径与空 body', async () => {
    const putSpy = vi.spyOn(http, 'put').mockResolvedValue({ data: okNull() } as never)

    await enableClient('probe 001')
    expect(putSpy.mock.calls[0]).toEqual([
      '/api/clients/probe%20001/enable',
      null,
      { timeout: TIMEOUT },
    ])

    await disableClient('probe 001')
    expect(putSpy.mock.calls[1]).toEqual([
      '/api/clients/probe%20001/disable',
      null,
      { timeout: TIMEOUT },
    ])
  })

  it('业务失败原样返回后端 code/message（如 40941 数据源占用）', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({
      data: fail(40941, '数据源“中心医院（ds_oracle_011）”已分配给探针：probe-hosp-007，不能重复分配。'),
    } as never)

    const res = await fetchClientList({ keyword: '' })

    expect(res.code).toBe(40941)
    expect(res.message).toContain('probe-hosp-007')
    expect(getSpy).toHaveBeenCalledTimes(1)
  })

  it('全局 http.ts 默认超时保持 10000，请求级覆盖不修改全局', () => {
    expect(http.defaults.timeout).toBe(10000)
  })
})
