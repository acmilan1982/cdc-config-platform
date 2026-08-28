import { describe, it, expect, vi, afterEach } from 'vitest'
import http from '@/services/http'
import { fetchServerConfigPage, saveServerConfig } from '@/api/serverConfig'
import type { ApiResponse } from '@/types/monitor'
import type { ServerConfigPageVO } from '@/types/serverConfig'

function okPage(): ApiResponse<ServerConfigPageVO> {
  return {
    code: 200,
    message: 'success',
    timestamp: '',
    data: { serverId: 'S1', configCount: 0, items: [] },
  }
}

function okSave(): ApiResponse<null> {
  return { code: 200, message: 'success', timestamp: '', data: null }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('server-config API 请求契约（SC-API-090）', () => {
  it('GET /api/server-config 精确 timeout=15000，POST /api/server-config/save 精确 timeout=30000 且请求体仅 items', async () => {
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: okPage() } as never)
    const postSpy = vi.spyOn(http, 'post').mockResolvedValue({ data: okSave() } as never)

    const page = await fetchServerConfigPage()
    expect(getSpy).toHaveBeenCalledTimes(1)
    expect(getSpy.mock.calls[0]).toEqual(['/api/server-config', { timeout: 15000 }])
    expect(page).toEqual(okPage())

    const request = { items: [{ idServerConfig: '0001', configValue: 'true' }] }
    const res = await saveServerConfig(request)
    expect(postSpy).toHaveBeenCalledTimes(1)
    expect(postSpy.mock.calls[0]).toEqual(['/api/server-config/save', request, { timeout: 30000 }])
    expect(res).toEqual(okSave())
  })

  it('全局 http.ts 默认超时保持 10000，请求级覆盖不修改全局', () => {
    expect(http.defaults.timeout).toBe(10000)
  })
})
