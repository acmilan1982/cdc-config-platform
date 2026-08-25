import { reactive } from 'vue'
import { searchLogs } from '@/api/logQuery'
import type { LogListQuery, LogListVO, LogType } from '@/types/logQuery'

/**
 * 每 Tab 独立状态机（LQ-UI-035 / 140、LQ-TAB-01~08）。
 * 表单条件、已生效条件、列表、请求游标栈、hasNext/nextCursor、loading、error、
 * initialQueryAttempted 全部独立；成功才原子替换；失败保留旧状态；请求令牌防旧响应覆盖。
 * 正确日志 Tab 首次切换只初始化缺省条件、不自动查询，保持 NOT_QUERIED 状态（本任务修订，
 * 见 deriveTabQueryStatus）；错误日志仍按既有规则在初始化完成后自动首查。
 */

/** "全部"互斥哨兵，仅存在于表单内，提交时映射为"不携带该数组条件"（LQ-UI-056） */
export const ALL_DATA_SOURCE = '__ALL__'

export interface LogQueryForm {
  sourceDataSourceIds: string[]
  sourceTableName: string
  targetDataSourceIds: string[]
  targetTableName: string
  timeRange: [string, string] | null
}

export interface AppliedCriteria {
  logType: LogType
  sourceDataSourceIds: string[] | null
  sourceTableName: string | null
  targetDataSourceIds: string[] | null
  targetTableName: string | null
  startTime: string
  endTime: string
}

export interface LogQueryTabState {
  logType: LogType
  form: LogQueryForm
  applied: AppliedCriteria | null
  items: LogListVO[]
  requestCursorStack: (string | null)[]
  hasNext: boolean
  nextCursor: string | null
  loading: boolean
  error: string | null
  validationError: string
  initialQueryAttempted: boolean
  elapsed: number
  reinitialize: () => void
  initialQuery: () => Promise<void>
  query: () => Promise<void>
  reset: () => void
  nextPage: () => Promise<void>
  prevPage: () => Promise<void>
}

/**
 * Tab 查询状态（LQ-UI-140 修订）：
 * NOT_QUERIED 尚未执行查询，显示引导文案；
 * LOADING 查询中，显示遮罩、旋转图标与等待秒数；
 * SUCCESS_WITH_DATA 查询成功且有数据，显示表格；
 * SUCCESS_EMPTY 查询成功但无数据，显示"暂无数据"；
 * FAILED 查询失败，显示既有失败提示并保留既有列表语义。
 */
export type LogQueryTabStatus =
  | 'NOT_QUERIED'
  | 'LOADING'
  | 'SUCCESS_WITH_DATA'
  | 'SUCCESS_EMPTY'
  | 'FAILED'

/**
 * 从每 Tab 独立状态推导查询状态。
 * 以 applied 是否已生效（成功执行过查询）区分 NOT_QUERIED 与 SUCCESS_EMPTY，
 * 不用 items.length === 0 推断"是否查询过"。
 */
export function deriveTabQueryStatus(tab: LogQueryTabState): LogQueryTabStatus {
  if (tab.loading) return 'LOADING'
  if (tab.error !== null) return 'FAILED'
  if (tab.applied === null) return 'NOT_QUERIED'
  return tab.items.length > 0 ? 'SUCCESS_WITH_DATA' : 'SUCCESS_EMPTY'
}

const DAY_SPAN_MS = 7 * 24 * 60 * 60 * 1000

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

/** 时间格式：yyyy-MM-dd HH:mm:ss，无毫秒无时区（LQ-API-06 / LQ-UI-060） */
export function formatDateTime(d: Date): string {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  )
}

export function parseDateTime(text: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(text)
  if (!m) return null
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])
  return Number.isNaN(d.getTime()) ? null : d
}

/** 当前自然日 00:00:00 ~ 23:59:59（LQ-UI-061） */
export function currentNaturalDay(): [string, string] {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  return [formatDateTime(start), formatDateTime(end)]
}

/** 业务错误码 → 用户可读文案（LQ-UI-184 / 185） */
export function resolveBusinessError(code: number, message: string): string {
  if (code === 40015 || code === 40016) {
    return '查询条件已变化或游标已失效，请重新查询第一页'
  }
  return message || '查询失败，请稍后重试'
}

/** HTTP/网络/超时错误 → 用户可读文案 */
export function resolveHttpError(e: unknown): string {
  const err = e as { code?: string; message?: string } | null
  const msg = err?.message || ''
  if (err?.code === 'ECONNABORTED' || /timeout/i.test(msg)) {
    return '查询超时，请缩小查询范围或增加筛选条件后重试'
  }
  return '网络请求失败，请稍后重试'
}

export function useLogQueryTab(
  logType: LogType,
  getGeneration: () => number,
): LogQueryTabState {
  let requestToken = 0
  let elapsedTimer: number | null = null

  const form = reactive<LogQueryForm>({
    sourceDataSourceIds: [],
    sourceTableName: '',
    targetDataSourceIds: [],
    targetTableName: '',
    timeRange: null,
  })

  function setDefaultForm(): void {
    const [start, end] = currentNaturalDay()
    form.sourceDataSourceIds = [ALL_DATA_SOURCE]
    form.sourceTableName = ''
    form.targetDataSourceIds = [ALL_DATA_SOURCE]
    form.targetTableName = ''
    form.timeRange = [start, end]
  }

  function validate(): string | null {
    const range = form.timeRange
    if (!range || !range[0] || !range[1]) {
      return '同步到目标库时间范围必须填写开始与结束时间'
    }
    const start = parseDateTime(range[0])
    const end = parseDateTime(range[1])
    if (!start || !end) {
      return '同步到目标库时间范围必须填写开始与结束时间'
    }
    if (start.getTime() > end.getTime()) {
      return '开始时间不能晚于结束时间'
    }
    const endExclusive = end.getTime() + 1000
    if (endExclusive - start.getTime() > DAY_SPAN_MS) {
      return '时间跨度超过 7 天，请缩小查询范围'
    }
    if (form.sourceTableName.trim().length > 64) {
      return '源表名不能超过 64 个字符'
    }
    if (form.targetTableName.trim().length > 64) {
      return '目标表名不能超过 64 个字符'
    }
    return null
  }

  function buildApplied(): AppliedCriteria {
    const range = form.timeRange as [string, string]
    return {
      logType,
      sourceDataSourceIds:
        form.sourceDataSourceIds.includes(ALL_DATA_SOURCE) || form.sourceDataSourceIds.length === 0
          ? null
          : [...form.sourceDataSourceIds],
      sourceTableName: form.sourceTableName.trim() || null,
      targetDataSourceIds:
        form.targetDataSourceIds.includes(ALL_DATA_SOURCE) || form.targetDataSourceIds.length === 0
          ? null
          : [...form.targetDataSourceIds],
      targetTableName: form.targetTableName.trim() || null,
      startTime: range[0],
      endTime: range[1],
    }
  }

  function startElapsed(): void {
    if (elapsedTimer !== null) {
      window.clearInterval(elapsedTimer)
      elapsedTimer = null
    }
    state.elapsed = 0
    elapsedTimer = window.setInterval(() => {
      state.elapsed += 1
    }, 1000)
  }

  function stopElapsed(): void {
    if (elapsedTimer !== null) {
      window.clearInterval(elapsedTimer)
      elapsedTimer = null
    }
  }

  async function runSearch(
    criteria: AppliedCriteria,
    cursor: string | null,
    mode: 'initial' | 'query' | 'next' | 'prev',
    targetStack: (string | null)[] | null,
  ): Promise<void> {
    const token = ++requestToken
    const generation = getGeneration()
    state.loading = true
    state.error = null
    startElapsed()
    try {
      const query: LogListQuery = {
        logType: criteria.logType,
        sourceDataSourceIds: criteria.sourceDataSourceIds ?? undefined,
        sourceTableName: criteria.sourceTableName,
        targetDataSourceIds: criteria.targetDataSourceIds ?? undefined,
        targetTableName: criteria.targetTableName,
        startTime: criteria.startTime,
        endTime: criteria.endTime,
        cursor,
      }
      const res = await searchLogs(query)
      if (token !== requestToken || generation !== getGeneration()) return
      if (res.code === 200) {
        state.items = res.data.items ?? []
        state.hasNext = res.data.hasNext
        state.nextCursor = res.data.nextCursor ?? null
        state.error = null
        if (mode === 'initial' || mode === 'query') {
          state.requestCursorStack = [null]
          state.applied = criteria
        } else if (mode === 'next') {
          state.requestCursorStack = [...state.requestCursorStack, cursor]
        } else if (mode === 'prev' && targetStack) {
          state.requestCursorStack = targetStack
        }
      } else {
        state.error = resolveBusinessError(res.code, res.message)
      }
    } catch (e) {
      if (token !== requestToken || generation !== getGeneration()) return
      state.error = resolveHttpError(e)
    } finally {
      if (token === requestToken) {
        state.loading = false
        stopElapsed()
      }
    }
  }

  /**
   * 完整重新初始化（LQ-UI-210 / LQ-AC-181）：重新进入/再次点击当前菜单时，
   * 作废在途请求并清空全部状态，恢复默认表单，等待页面按 enabled 分支重新初始化。
   */
  function reinitialize(): void {
    requestToken += 1
    stopElapsed()
    setDefaultForm()
    state.applied = null
    state.items = []
    state.requestCursorStack = [null]
    state.hasNext = false
    state.nextCursor = null
    state.loading = false
    state.error = null
    state.validationError = ''
    state.initialQueryAttempted = false
    state.elapsed = 0
  }

  async function initialQuery(): Promise<void> {
    if (state.initialQueryAttempted) return
    state.initialQueryAttempted = true
    setDefaultForm()
    const criteria = buildApplied()
    await runSearch(criteria, null, 'initial', null)
  }

  /**
   * 手动查询（R1-02）：校验通过且准备真正发起请求时置 initialQueryAttempted = true，
   * 无论随后成功、业务失败、网络失败或超时都保持 true（与 LQ-AC-004 一致）。
   * 在途请求被 loading 拒绝、表单校验失败不改变标志；reinitialize 仍重置为 false。
   */
  async function query(): Promise<void> {
    if (state.loading) return
    const err = validate()
    if (err) {
      state.validationError = err
      return
    }
    state.validationError = ''
    state.initialQueryAttempted = true
    const criteria = buildApplied()
    await runSearch(criteria, null, 'query', null)
  }

  /** 重置表单并清除校验错误，但保留列表、已生效条件和游标，不发起查询（LQ-DESIGN-172 / LQ-UI-073） */
  function reset(): void {
    setDefaultForm()
    state.validationError = ''
  }

  async function nextPage(): Promise<void> {
    if (state.loading || !state.applied || !state.hasNext) return
    await runSearch(state.applied, state.nextCursor, 'next', null)
  }

  async function prevPage(): Promise<void> {
    if (state.loading || !state.applied || state.requestCursorStack.length <= 1) return
    const targetStack = [...state.requestCursorStack]
    targetStack.pop()
    const cursor = targetStack[targetStack.length - 1] ?? null
    await runSearch(state.applied, cursor, 'prev', targetStack)
  }

  const state = reactive<LogQueryTabState>({
    logType,
    form,
    applied: null,
    items: [],
    requestCursorStack: [null],
    hasNext: false,
    nextCursor: null,
    loading: false,
    error: null,
    validationError: '',
    initialQueryAttempted: false,
    elapsed: 0,
    reinitialize,
    initialQuery,
    query,
    reset,
    nextPage,
    prevPage,
  })

  return state
}
