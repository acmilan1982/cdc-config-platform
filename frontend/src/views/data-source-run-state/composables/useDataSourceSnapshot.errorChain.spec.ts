import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import http from '@/services/http'
import { fetchSnapshotStatusList } from '@/api/dataSourceSnapshot'
import type { ApiResponse } from '@/types/monitor'
import type {
  AppliedCriteria,
  CandidateGroup,
  SnapshotStatusItem,
  SnapshotStatusListResult,
  StatusToken,
} from '@/types/dataSourceSnapshot'
import { useDataSourceSnapshot, AUTO_REFRESH_INTERVAL_MS, REFRESH_FAIL_MESSAGE } from './useDataSourceSnapshot'

/**
 * R1-01 真实请求链（不 Mock 整个 fetchSnapshotStatusList）：用可控 axios adapter 替代网络边界，
 * 覆盖 HTTP 500 / 超时断网 / 业务 code!=200，证明本页请求（带 skipGlobalErrorPopup）不触发全局
 * ElMessage、失败提示收敛、旧现场保持、60s 后可重试、恢复成功更新时间；同时证明未带静默选项的
 * 其它请求默认全局弹窗行为不变。
 */

const originalAdapter = http.defaults.adapter
type AdapterFn = (config: InternalAxiosRequestConfig) => Promise<unknown>

function installAdapter(fn: AdapterFn): void {
  http.defaults.adapter = fn as AxiosAdapter
}

function row(clientId = 'hosp-012', statusCategory: StatusToken = 'RUNNING', raw = 'SNAPSHOT_RUNNING'): SnapshotStatusItem {
  return {
    clientId,
    clientRef: { state: 'ACTIVE', desc: 'HIS 探针示例' },
    sourceId: '112-source-19c',
    sourceRef: { state: 'ACTIVE', org: '示例医院源库', category: 'SOURCE', sourceRole: true },
    snapshotStatus: raw,
    statusCategory,
    snapshotLastSeenAt: '2026-08-17 17:28:46',
    snapshotCompletedAt: null,
    updatedAt: '2026-08-17 17:28:46',
  }
}

function candidates(): CandidateGroup {
  return {
    clients: [{ id: 'hosp-012', desc: 'HIS 探针示例', active: true }],
    sources: [{ id: '112-source-19c', org: '示例医院源库', active: true }],
    statuses: ['RUNNING', 'COMPLETED'],
  }
}

function okRes(records: SnapshotStatusItem[], cand: CandidateGroup = candidates()): ApiResponse<SnapshotStatusListResult> {
  const data: SnapshotStatusListResult = { records, candidates: cand }
  return { code: 200, message: 'success', timestamp: '', data }
}

function bizFail(): ApiResponse<SnapshotStatusListResult> {
  return { code: 500, message: '业务处理失败', timestamp: '', data: null as unknown as SnapshotStatusListResult }
}

function okAdapter(body: unknown): AdapterFn {
  return (config) =>
    Promise.resolve({
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: body,
    } as AxiosResponse)
}

/** 模拟浏览器 xhr adapter 对 HTTP 500 的 settle 拒绝：error.config 携带真实请求配置。 */
function http500Adapter(serverMessage: string): AdapterFn {
  return (config) =>
    Promise.reject(
      new AxiosError(
        'Request failed with status code 500',
        AxiosError.ERR_BAD_RESPONSE,
        config,
        {},
        { status: 500, statusText: 'Internal Server Error', headers: {}, config, data: { message: serverMessage } },
      ),
    )
}

/** 模拟断网/超时（无 response，error.message 为底层原因）。 */
function networkTimeoutAdapter(message: string): AdapterFn {
  return (config) => Promise.reject(new AxiosError(message, AxiosError.ECONNABORTED, config, {}))
}

function allApplied(): AppliedCriteria {
  return { clientIds: [], sourceIds: [], statuses: [] }
}

/** 冲刷当前 microtask 链（onPageMounted/launch 返回 void，无法直接 await）。 */
async function settle(): Promise<void> {
  for (let i = 0; i < 16; i++) await Promise.resolve()
}

function elErrorSpy() {
  vi.spyOn(ElMessage, 'error').mockImplementation(() => undefined as never)
}

beforeEach(() => {
  elErrorSpy()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  http.defaults.adapter = originalAdapter
})

describe('R1-01 本页请求带 skipGlobalErrorPopup，HTTP/网络失败不产生全局错误弹窗（真实拦截链）', () => {
  it('fetchSnapshotStatusList 请求确实携带 skipGlobalErrorPopup=true 到达 adapter', async () => {
    const captured: { config?: InternalAxiosRequestConfig } = {}
    installAdapter((config) => {
      captured.config = config
      return Promise.resolve({
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: okRes([row()]),
      } as AxiosResponse)
    })

    const res = await fetchSnapshotStatusList({ clientId: [], sourceId: [], status: [] })
    expect(res.code).toBe(200)
    expect(captured.config?.skipGlobalErrorPopup).toBe(true)
    expect(captured.config?.url).toContain('/api/monitor/data-source-run-state/list')
    expect(vi.mocked(ElMessage.error)).not.toHaveBeenCalled()
  })

  it('HTTP 500：本页首次加载失败进入整区错误态，且不调用全局 ElMessage（不展示原始服务器消息）', async () => {
    installAdapter(http500Adapter('ORA-00001: 内部原始异常堆栈详情，不应直接上浮'))
    const ctl = useDataSourceSnapshot()
    ctl.onPageMounted()
    await settle()

    expect(ctl.firstLoadError.value).toBe(true)
    expect(ctl.hasSuccess.value).toBe(false)
    expect(ctl.appliedCriteria.value).toEqual(allApplied())
    expect(vi.mocked(ElMessage.error)).not.toHaveBeenCalled()
  })

  it('超时/断网（无 response）：有成功现场后自动刷新失败只给收敛内联提示，旧现场保持，不调用全局 ElMessage', async () => {
    installAdapter(okAdapter(okRes([row('A')])))
    const ctl = useDataSourceSnapshot()
    ctl.onPageMounted()
    await settle()
    expect(ctl.hasSuccess.value).toBe(true)

    installAdapter(networkTimeoutAdapter('timeout of 30000ms exceeded'))
    ctl.manualRefresh()
    await settle()

    expect(ctl.refreshError.value).toBe(REFRESH_FAIL_MESSAGE)
    expect(ctl.records.value.map((r) => r.clientId)).toEqual(['A'])
    expect(ctl.appliedCriteria.value).toEqual(allApplied())
    expect(vi.mocked(ElMessage.error)).not.toHaveBeenCalled()
  })

  it('业务 code!=200（HTTP 200 但 code=500）：走页面内联失败处理，旧数据保持、无全局弹窗', async () => {
    installAdapter(okAdapter(bizFail()))
    const ctl = useDataSourceSnapshot()
    ctl.onPageMounted()
    await settle()

    expect(ctl.firstLoadError.value).toBe(true)
    expect(ctl.hasSuccess.value).toBe(false)
    expect(vi.mocked(ElMessage.error)).not.toHaveBeenCalled()

    // 有成功现场后再次业务失败：保留旧记录，只给收敛提示
    installAdapter(okAdapter(okRes([row('A')])))
    const ctl2 = useDataSourceSnapshot()
    ctl2.onPageMounted()
    await settle()
    installAdapter(okAdapter(bizFail()))
    ctl2.manualRefresh()
    await settle()

    expect(ctl2.refreshError.value).toBe(REFRESH_FAIL_MESSAGE)
    expect(ctl2.records.value.map((r) => r.clientId)).toEqual(['A'])
    expect(vi.mocked(ElMessage.error)).not.toHaveBeenCalled()
  })

  it('未带 skipGlobalErrorPopup 的其它请求默认行为不变：HTTP 500 仍弹全局错误（取 response.data.message）', async () => {
    const captured: { config?: InternalAxiosRequestConfig } = {}
    installAdapter((config) => {
      captured.config = config
      return Promise.reject(
        new AxiosError(
          'Request failed with status code 500',
          AxiosError.ERR_BAD_RESPONSE,
          config,
          {},
          { status: 500, statusText: 'Internal Server Error', headers: {}, config, data: { message: 'mock 服务端错误消息' } },
        ),
      )
    })

    const promise = http.get('/api/other-page/list', { timeout: 10000 })
    const err = await promise.catch((e: unknown) => e)
    expect((err as AxiosError).response?.status).toBe(500)
    expect(captured.config?.skipGlobalErrorPopup).toBeUndefined()
    expect(vi.mocked(ElMessage.error)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(ElMessage.error)).toHaveBeenCalledWith('mock 服务端错误消息')
  })
})

describe('R1-01 失败恢复语义（真实请求链）：60s 后自动重试，恢复成功更新最近刷新时间', () => {
  it('自动刷新 HTTP500 失败后约 60s 自动重试成功：记录更新、提示清除、最近成功刷新时间推进', async () => {
    vi.useFakeTimers()
    installAdapter(okAdapter(okRes([row('A')])))
    const ctl = useDataSourceSnapshot()
    ctl.onPageMounted()
    await settle()
    const firstText = ctl.lastRefreshText.value
    expect(ctl.records.value.map((r) => r.clientId)).toEqual(['A'])
    expect(ctl.refreshError.value).toBe('')

    // 进入下一自动周期时模拟 HTTP 500
    installAdapter(http500Adapter('mock 500'))
    await vi.advanceTimersByTimeAsync(AUTO_REFRESH_INTERVAL_MS)
    await settle()
    expect(ctl.refreshError.value).toBe(REFRESH_FAIL_MESSAGE)
    expect(ctl.records.value.map((r) => r.clientId)).toEqual(['A'])
    expect(ctl.lastRefreshText.value).toBe(firstText) // 失败不更新时间
    expect(vi.mocked(ElMessage.error)).not.toHaveBeenCalled()

    // 再下一周期恢复成功：记录更新、提示清除、时间推进
    installAdapter(okAdapter(okRes([row('B')])))
    await vi.advanceTimersByTimeAsync(AUTO_REFRESH_INTERVAL_MS)
    await settle()
    expect(ctl.records.value.map((r) => r.clientId)).toEqual(['B'])
    expect(ctl.refreshError.value).toBe('')
    expect(ctl.hasSuccess.value).toBe(true)
    expect(ctl.lastRefreshText.value).not.toBe(firstText)
    expect(vi.mocked(ElMessage.error)).not.toHaveBeenCalled()
  })
})
