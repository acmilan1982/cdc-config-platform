import { describe, it, expect, vi, afterEach } from 'vitest'
import http from '@/services/http'
import {
  createDataSource,
  createNamingStrategy,
  deleteDataSource,
  deleteNamingStrategy,
  fetchBizAttr,
  fetchDataSourceList,
  fetchDataSourceDetail,
  fetchNamingStrategies,
  fetchTargetOptions,
  saveBizAttr,
  testDataSourceConnection,
  updateDataSource,
  updateNamingStrategy,
} from '@/api/dataSource'
import type { ApiResponse } from '@/types/monitor'
import type {
  BizAttrSaveRequest,
  DataSourceCreateRequest,
  DataSourceListQuery,
  DataSourceRow,
  DataSourceUpdateRequest,
  NamingStrategySaveRequest,
  NamingStrategyVO,
  TestConnectionRequest,
} from '@/types/dataSource'

const TIMEOUT = 30000

function okRows(): ApiResponse<DataSourceRow[]> {
  return {
    code: 200,
    message: 'success',
    timestamp: '',
    data: [
      {
        dataSourceId: 'DS001',
        dataSourceName: '测试源库',
        dataSourceCategory: 'SOURCE',
        dataSourceType: 'ORACLE',
        host: '10.1.1.1',
        port: 1521,
        serviceName: 'orcl',
        userName: 'user',
      },
    ],
  }
}

function okRow(): ApiResponse<DataSourceRow> {
  return { code: 200, message: 'success', timestamp: '', data: okRows().data![0] }
}

function okString(value: string): ApiResponse<string> {
  return { code: 200, message: 'success', timestamp: '', data: value }
}

function okNull(): ApiResponse<null> {
  return { code: 200, message: 'success', timestamp: '', data: null }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('data-source API 请求契约（API.md 数据源管理 §4）', () => {
  it('GET /api/data-sources 以 params 传递三条件并 timeout=30000', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: okRows() } as never)
    const query: DataSourceListQuery = { id: 'DS', name: '源', host: '10.1' }

    const res = await fetchDataSourceList(query)

    expect(getSpy).toHaveBeenCalledTimes(1)
    expect(getSpy.mock.calls[0]).toEqual([
      '/api/data-sources',
      { params: query, timeout: TIMEOUT },
    ])
    expect(res).toEqual(okRows())
  })

  it('GET /api/data-sources/{dataSourceId} 使用 encodeURIComponent 且 timeout=30000', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: okRow() } as never)

    const res = await fetchDataSourceDetail('DS 001/')

    expect(getSpy.mock.calls[0]).toEqual([
      '/api/data-sources/DS%20001%2F',
      { timeout: TIMEOUT },
    ])
    expect(res).toEqual(okRow())
  })

  it('POST /api/data-sources 携带完整新增体', async () => {
    const postSpy = vi.spyOn(http, 'post').mockResolvedValue({ data: okString('DS002') } as never)
    const request: DataSourceCreateRequest = {
      dataSourceId: 'DS002',
      dataSourceName: '新库',
      dataSourceCategory: 'TARGET',
      dataSourceType: 'MYSQL',
      host: '10.1.1.2',
      port: 3306,
      userName: 'app',
      password: 'pwd',
      serviceName: 'mydb',
    }

    const res = await createDataSource(request)

    expect(postSpy.mock.calls[0]).toEqual(['/api/data-sources', request, { timeout: TIMEOUT }])
    expect(res).toEqual(okString('DS002'))
  })

  it('PUT /api/data-sources/{originalDataSourceId} 使用 encodeURIComponent 且请求体不含 password（未修改）', async () => {
    const putSpy = vi.spyOn(http, 'put').mockResolvedValue({ data: okString('DS001') } as never)
    const request: DataSourceUpdateRequest = {
      dataSourceId: 'DS001',
      dataSourceName: '测试源库',
      dataSourceCategory: 'SOURCE',
      dataSourceType: 'ORACLE',
      host: '10.1.1.1',
      port: 1521,
      userName: 'user',
      serviceName: 'orcl',
    }

    const res = await updateDataSource('DS 001', request)

    expect(putSpy.mock.calls[0]).toEqual([
      '/api/data-sources/DS%20001',
      request,
      { timeout: TIMEOUT },
    ])
    expect(res).toEqual(okString('DS001'))
  })

  it('DELETE /api/data-sources/{dataSourceId} 使用 encodeURIComponent', async () => {
    const deleteSpy = vi.spyOn(http, 'delete').mockResolvedValue({ data: okNull() } as never)

    const res = await deleteDataSource('DS 001')

    expect(deleteSpy.mock.calls[0]).toEqual([
      '/api/data-sources/DS%20001',
      { timeout: TIMEOUT },
    ])
    expect(res).toEqual(okNull())
  })

  it('POST /api/data-sources/test-connection 携带 originalDataSourceId 与 password', async () => {
    const postSpy = vi.spyOn(http, 'post').mockResolvedValue({
      data: { code: 200, message: 'success', timestamp: '', data: { success: true, message: '连接成功' } },
    } as never)
    const request: TestConnectionRequest = {
      originalDataSourceId: 'DS001',
      dataSourceType: 'ORACLE',
      host: '10.1.1.1',
      port: 1521,
      userName: 'user',
      password: 'newpwd',
      serviceName: 'orcl',
    }

    const res = await testDataSourceConnection(request)

    expect(postSpy.mock.calls[0]).toEqual([
      '/api/data-sources/test-connection',
      request,
      { timeout: TIMEOUT },
    ])
    expect(res.data.success).toBe(true)
  })

  it('GET /api/data-sources/target-options 请求目标库候选', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: okNull() } as never)

    await fetchTargetOptions()

    expect(getSpy.mock.calls[0]).toEqual(['/api/data-sources/target-options', { timeout: TIMEOUT }])
  })

  it('GET /api/data-sources/{id}/biz-attr 与 PUT 原样保存业务属性', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({
      data: { code: 200, message: 'success', timestamp: '', data: { dataSourceId: 'TG001', bizAttr: '{"a":1}' } },
    } as never)
    const putSpy = vi.spyOn(http, 'put').mockResolvedValue({ data: okNull() } as never)
    const request: BizAttrSaveRequest = { bizAttr: '  {"a":1}  ' }

    await fetchBizAttr('TG 001')
    expect(getSpy.mock.calls[0]).toEqual([
      '/api/data-sources/TG%20001/biz-attr',
      { timeout: TIMEOUT },
    ])

    await saveBizAttr('TG 001', request)
    expect(putSpy.mock.calls[0]).toEqual([
      '/api/data-sources/TG%20001/biz-attr',
      request,
      { timeout: TIMEOUT },
    ])
  })

  it('GET/POST/PUT/DELETE 命名策略路径正确（sourceId + originalTargetId 均 encodeURIComponent）', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: okNull() } as never)
    const postSpy = vi.spyOn(http, 'post').mockResolvedValue({ data: okNull() } as never)
    const putSpy = vi.spyOn(http, 'put').mockResolvedValue({ data: okNull() } as never)
    const deleteSpy = vi.spyOn(http, 'delete').mockResolvedValue({ data: okNull() } as never)

    const request: NamingStrategySaveRequest = {
      targetDataSourceId: 'TG001',
      tableNamingStrategy: 'TABLE_MERGE',
      tableNamePrefix: '',
      tableNameSuffix: '',
    }

    const strategies: ApiResponse<NamingStrategyVO[]> = {
      code: 200,
      message: 'success',
      timestamp: '',
      data: [],
    }
    getSpy.mockResolvedValue({ data: strategies } as never)

    await fetchNamingStrategies('SRC 001')
    expect(getSpy.mock.calls[0]).toEqual([
      '/api/data-sources/SRC%20001/naming-strategies',
      { timeout: TIMEOUT },
    ])

    await createNamingStrategy('SRC 001', request)
    expect(postSpy.mock.calls[0]).toEqual([
      '/api/data-sources/SRC%20001/naming-strategies',
      request,
      { timeout: TIMEOUT },
    ])

    await updateNamingStrategy('SRC 001', 'TG 001', request)
    expect(putSpy.mock.calls[0]).toEqual([
      '/api/data-sources/SRC%20001/naming-strategies/TG%20001',
      request,
      { timeout: TIMEOUT },
    ])

    await deleteNamingStrategy('SRC 001', 'TG 001')
    expect(deleteSpy.mock.calls[0]).toEqual([
      '/api/data-sources/SRC%20001/naming-strategies/TG%20001',
      { timeout: TIMEOUT },
    ])
  })

  it('全局 http.ts 默认超时保持 10000，请求级覆盖不修改全局', () => {
    expect(http.defaults.timeout).toBe(10000)
  })
})
