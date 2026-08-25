import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ElMessage } from 'element-plus'
import type { AxiosAdapter, AxiosResponse } from 'axios'
import http from '@/services/http'
import {
  getLogQueryStatus,
  fetchDataSourceOptions,
  searchLogs,
  fetchLogDetail,
  fetchRawMessage,
} from '@/api/logQuery'
import type { LogListQuery } from '@/types/logQuery'

const originalAdapter = http.defaults.adapter

function baseQuery(): LogListQuery {
  return {
    logType: 'error',
    startTime: '2026-08-25 00:00:00',
    endTime: '2026-08-25 23:59:59',
  }
}

/**
 * 模拟 Axios 浏览器 xhr 适配器的超时行为：在 config.timeout 毫秒后以
 * `timeout of Nms exceeded` + code=ECONNABORTED 中止请求。
 * 用于在 jsdom 无真实网络的前提下客观证明"请求按自身 timeout 配置在边界超时"。
 */
const timeoutAdapter: AxiosAdapter = (config) =>
  new Promise<AxiosResponse<unknown>>((_resolve, reject) => {
    const timeout = config.timeout ?? 0
    if (timeout > 0) {
      setTimeout(() => {
        const error = new Error(`timeout of ${timeout}ms exceeded`) as Error & { code?: string }
        error.code = 'ECONNABORTED'
        reject(error)
      }, timeout)
    }
  })

beforeEach(() => {
  // 屏蔽 http.ts 错误拦截器的 ElMessage 副作用
  vi.spyOn(ElMessage, 'error').mockImplementation(() => undefined as never)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  http.defaults.adapter = originalAdapter
})

describe('日志查询请求级 30 秒超时（LQ-AC-120）', () => {
  it('五个日志查询函数均显式携带请求级 timeout=30000，覆盖全局 10 秒默认且不改动全局', async () => {
    const postSpy = vi.spyOn(http, 'post').mockResolvedValue({ data: {} } as never)
    const getSpy = vi.spyOn(http, 'get').mockResolvedValue({ data: {} } as never)

    await searchLogs(baseQuery())
    expect(postSpy.mock.calls[0][2]).toEqual(expect.objectContaining({ timeout: 30000 }))

    await getLogQueryStatus()
    await fetchDataSourceOptions()
    await fetchLogDetail('error', '1')
    await fetchRawMessage('error', '1')
    expect(getSpy.mock.calls).toHaveLength(4)
    for (const call of getSpy.mock.calls) {
      expect(call[1]).toEqual(expect.objectContaining({ timeout: 30000 }))
    }
    // 全局默认保持 10000，请求级覆盖不修改全局，不影响其他 API
    expect(http.defaults.timeout).toBe(10000)
  })

  it('请求超过 30 秒未返回时在第 30 秒边界以 ECONNABORTED 结束，仅一次请求、不自动重试', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    http.defaults.adapter = timeoutAdapter

    const promise = searchLogs(baseQuery())
    let settled = false
    promise.then(
      () => {
        settled = true
      },
      () => {
        settled = true
      },
    )

    // 30 秒边界前请求仍在途、未结束
    await vi.advanceTimersByTimeAsync(29999)
    expect(settled).toBe(false)

    // 恰好第 30 秒边界超时结束
    await vi.advanceTimersByTimeAsync(1)
    expect(settled).toBe(true)

    const err = await promise.catch((e: unknown) => e)
    expect((err as { code?: string }).code).toBe('ECONNABORTED')
    expect((err as Error).message).toBe('timeout of 30000ms exceeded')
  })
})
