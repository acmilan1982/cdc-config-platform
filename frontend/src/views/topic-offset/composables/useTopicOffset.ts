import { ref } from 'vue'
import { fetchTopicCandidates, fetchTopicOffsets } from '@/api/topicOffset'
import { useTopicOffsetStore } from '@/stores/topicOffset'
import type { ApiResponse } from '@/types/monitor'
import type { AppliedCriteria, TopicOffsetPageResult, TopicOffsetQueryParams } from '@/types/topicOffset'
import { buildCriteriaFromDraft, criteriaEqual } from '@/views/topic-offset/utils/selection'

export const AUTO_REFRESH_INTERVAL_MS = 60_000

type RequestKind = 'initial' | 'retry' | 'query' | 'page' | 'manual' | 'restore' | 'auto'

/** 建立性操作：会变更生效条件并回到第 1 页（大态整表 loading）。 */
const ESTABLISHING: ReadonlySet<RequestKind> = new Set(['initial', 'retry', 'query'])
/** 轻量操作：保持当前条件/页码刷新，只显示工具栏轻量状态，不遮罩表格。 */
const LIGHT: ReadonlySet<RequestKind> = new Set(['page', 'manual', 'restore', 'auto'])

interface PendingOp {
  criteria: AppliedCriteria
  page: number
  kind: RequestKind
  /** 意图序号：仅当仍等于 acceptedSeq 时该 op 的响应才被允许提交；序号只增，最新用户意图获胜。 */
  seq: number
}

function isEstablishing(kind: RequestKind): boolean {
  return ESTABLISHING.has(kind)
}

function defaultCriteria(): AppliedCriteria {
  return { clientIds: [], sourceIds: [], targetIds: [], tableName: '' }
}

function queryParams(criteria: AppliedCriteria, pageNum: number): TopicOffsetQueryParams {
  return {
    clientId: criteria.clientIds,
    sourceId: criteria.sourceIds,
    targetId: criteria.targetIds,
    tableName: criteria.tableName,
    pageNum,
  }
}

/**
 * topic-offset 页面编排（DESIGN §6.4/§6.5/§7；TOPIC-OFFSET-IMPLEMENTATION-001-R1 §4.3/§4.4）。
 *
 * 并发模型为“单飞行 + 最新用户意图槽位”，替换 R1 复审指出的旧 FIFO 队列问题：
 * - 整个生命周期内至多一个受控请求链在跑（busy），offsets 与候选刷新在同一个 busy 内
 *   串行 await（绝无 fire-and-forget / Promise.all 并行），candidates 结束前 busy 不释放；
 * - 自动刷新与页面恢复（auto/restore）忙时直接跳过，不排队；
 * - 用户主动的查询/翻页/手工刷新忙时只保留“最后一个仍有效”的意图；新意图覆盖旧等待意图；
 *   查询条件变化后，基于旧 appliedCriteria 的翻页/刷新在进入队列前即判定为陈旧并丢弃；
 * - 每次接受/覆盖用户意图递增 acceptedSeq；响应提交前校验 op.seq === acceptedSeq，
 *   旧响应、旧等待意图与页面销毁后的迟到响应一律不得覆盖最新成功状态；
 * - 生效条件与页码只在请求成功时原子提交到 store（两阶段提交）；失败保留上一次成功现场；
 *   offsets 成功即可提交列表；candidates 失败静默保留上一次成功候选，不阻断已提交列表。
 */
export function useTopicOffset(notify?: (message: string) => void) {
  const store = useTopicOffsetStore()

  const loading = ref(false)
  const refreshing = ref(false)
  /** 任一受控请求链（含候选刷新）进行中；可用于禁用会并发的控件，但不喂给表格 loading。 */
  const busy = ref(false)
  /** 自动/恢复刷新失败的工具栏内联弱提示（不清空旧数据）。 */
  const refreshError = ref('')
  /** 从未成功时首次加载失败 → 整区错误态。 */
  const firstLoadError = ref(false)

  let disposed = false
  let acceptedSeq = 0
  let running: PendingOp | null = null
  let slot: PendingOp | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let hidden = false
  let lastFailedCriteria: AppliedCriteria | null = null

  function stopTimer(): void {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function startTimer(): void {
    stopTimer()
    timer = setInterval(() => {
      if (hidden || !store.hasSuccess) return
      enqueue(store.appliedCriteria as AppliedCriteria, store.pageNum, 'auto')
    }, AUTO_REFRESH_INTERVAL_MS)
  }

  function setVisual(kind: RequestKind, on: boolean): void {
    if (LIGHT.has(kind)) {
      refreshing.value = on
    } else {
      loading.value = on
    }
  }

  function isLatest(op: PendingOp): boolean {
    return !disposed && op.seq === acceptedSeq
  }

  function accepted(criteria: AppliedCriteria, page: number, kind: RequestKind): PendingOp {
    return { criteria, page, kind, seq: ++acceptedSeq }
  }

  /** 保留性操作（翻页/刷新/恢复/自动）是否仍有效：不得与更新（建立中）的条件意图冲突。 */
  function preserveValidFor(criteria: AppliedCriteria): boolean {
    const runningEstablishing = running && isEstablishing(running.kind) ? running.criteria : null
    const parkedEstablishing = slot && isEstablishing(slot.kind) ? slot.criteria : null
    return !(runningEstablishing && !criteriaEqual(runningEstablishing, criteria)) &&
      !(parkedEstablishing && !criteriaEqual(parkedEstablishing, criteria))
  }

  /** 唯一的入链口：忙时按最新意图语义覆盖或丢弃；闲时立即执行。 */
  function enqueue(criteria: AppliedCriteria, page: number, kind: RequestKind): void {
    if (disposed) return
    if (busy.value) {
      if (kind === 'auto' || kind === 'restore') {
        return
      }
      if (isEstablishing(kind) || preserveValidFor(criteria)) {
        slot = accepted(criteria, page, kind)
      }
      return
    }
    const op = isEstablishing(kind) || preserveValidFor(criteria)
      ? accepted(criteria, page, kind)
      : null
    if (op) {
      void run(op)
    }
  }

  function drain(): void {
    if (busy.value) return
    if (disposed) {
      slot = null
      return
    }
    if (slot) {
      const next = slot
      slot = null
      void run(next)
    }
  }

  async function run(op: PendingOp): Promise<void> {
    running = op
    busy.value = true
    setVisual(op.kind, true)
    try {
      await doFetch(op)
    } finally {
      setVisual(op.kind, false)
      running = null
      busy.value = false
      drain()
    }
  }

  async function doFetch(op: PendingOp): Promise<void> {
    let res: ApiResponse<TopicOffsetPageResult>
    try {
      res = await fetchTopicOffsets(queryParams(op.criteria, op.page))
    } catch {
      if (isLatest(op)) handleFailure(op, '数据加载失败')
      return
    }
    if (!isLatest(op)) return
    if (res.code !== 200) {
      handleFailure(op, res.message || '请求失败')
      return
    }
    // offsets 成功即原子提交列表（两阶段提交），不依赖候选结果。
    store.commitSuccess(op.criteria, op.page, res.data, Date.now())
    refreshError.value = ''
    firstLoadError.value = false
    startTimer()
    // 候选刷新纳入同一 busy 生命周期串行执行；失败保留旧候选。
    await refreshCandidates(op)
    converge(op, res.data)
  }

  /** 页面越界收敛（TOFF-REQ-093）：成功返回后当前页超末页 → 按最新意图排队补查。 */
  function converge(op: PendingOp, data: TopicOffsetPageResult): void {
    if (!isLatest(op)) return
    if (store.pageNum <= data.pages) return
    const criteria = store.appliedCriteria as AppliedCriteria
    if (data.pages > 0) {
      enqueue(criteria, data.pages, 'page')
    } else if (store.pageNum !== 1) {
      enqueue(criteria, 1, 'page')
    }
  }

  async function refreshCandidates(op: PendingOp): Promise<void> {
    try {
      const res = await fetchTopicCandidates()
      if (res.code === 200 && isLatest(op)) {
        store.setCandidates(res.data)
      }
    } catch {
      // 候选刷新失败静默保留上一次成功候选；不阻断已提交列表、不产生新 UI 文案。
    }
  }

  function handleFailure(op: PendingOp, message: string): void {
    if (!store.hasSuccess) {
      // 从未成功：整区错误态，保留待重试条件；不清空（本就无成功现场）。
      lastFailedCriteria = op.criteria
      refreshError.value = ''
      firstLoadError.value = true
      return
    }
    // 已有成功现场：保留上一次成功数据（TOFF-REQ-111/039）。
    if (op.kind === 'manual') {
      if (notify) notify(message)
    } else if (op.kind === 'auto') {
      refreshError.value = '自动刷新失败，已保留上次数据'
    } else {
      refreshError.value = '刷新失败，已保留上次数据'
    }
  }

  /** 页面挂载：恢复已成功现场并立即刷新，否则缺省条件自动查询（DESIGN §6.3/§7.1）。 */
  function onPageMounted(): void {
    if (store.hasSuccess) {
      enqueue(store.appliedCriteria as AppliedCriteria, store.pageNum, 'restore')
    } else {
      enqueue(defaultCriteria(), 1, 'initial')
    }
  }

  /** 用户点击查询：草稿 → 不可变 pending（buildCriteria）→ 目标第 1 页。 */
  function submitQuery(
    clients: string[],
    sources: string[],
    targets: string[],
    tableName: string,
  ): void {
    const pending = buildCriteriaFromDraft(clients, sources, targets, tableName)
    enqueue(pending, 1, 'query')
  }

  function changePage(page: number): void {
    const applied = store.appliedCriteria
    if (!applied) return
    if (page < 1 || page === store.pageNum) return
    enqueue(applied, page, 'page')
  }

  function manualRefresh(): void {
    const applied = store.appliedCriteria
    if (!applied) return
    enqueue(applied, store.pageNum, 'manual')
  }

  function retry(): void {
    enqueue(lastFailedCriteria ?? defaultCriteria(), 1, 'retry')
  }

  function visibilityChanged(isHidden: boolean): void {
    hidden = isHidden
    if (isHidden) {
      stopTimer()
      return
    }
    startTimer()
    if (store.hasSuccess) {
      enqueue(store.appliedCriteria as AppliedCriteria, store.pageNum, 'restore')
    }
  }

  function destroy(): void {
    disposed = true
    stopTimer()
    slot = null
  }

  return {
    loading,
    refreshing,
    busy,
    refreshError,
    firstLoadError,
    submitQuery,
    changePage,
    manualRefresh,
    retry,
    onPageMounted,
    visibilityChanged,
    destroy,
  }
}
