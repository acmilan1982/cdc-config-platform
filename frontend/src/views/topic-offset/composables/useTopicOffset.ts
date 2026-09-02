import { ref } from 'vue'
import { fetchTopicCandidates, fetchTopicOffsets } from '@/api/topicOffset'
import { useTopicOffsetStore } from '@/stores/topicOffset'
import type { AppliedCriteria, TopicOffsetPageResult, TopicOffsetQueryParams } from '@/types/topicOffset'
import { buildCriteriaFromDraft } from '@/views/topic-offset/utils/selection'

export const AUTO_REFRESH_INTERVAL_MS = 60_000

type RequestKind = 'initial' | 'retry' | 'query' | 'page' | 'manual' | 'restore' | 'auto'

interface QueuedRequest {
  criteria: AppliedCriteria
  page: number
  kind: RequestKind
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
 * topic-offset 页面编排（DESIGN §6.4/§6.5/§7）。
 *
 * 并发模型为“单飞行 + 用户操作排队”：
 * - 任一请求进行中（busy）时，自动刷新 tick 跳过；用户主动的查询/翻页/手工刷新不会静默丢弃，
 *   记入队列在当前请求完成后执行（请求不重叠，TOFF-REQ-109）。
 * - 生效条件与页码只在请求成功时原子提交到 store（两阶段提交）；失败保留上一次成功现场。
 * - 自动刷新固定 60 秒；每次成功提交后重计；页面不可见暂停、重新可见立即刷新并重计。
 * - 自动刷新失败不弹提示，仅工具栏内联弱提示；手工失败通过 notify 提示一次。
 */
export function useTopicOffset(notify?: (message: string) => void) {
  const store = useTopicOffsetStore()

  const loading = ref(false)
  const refreshing = ref(false)
  /** 自动/恢复刷新失败的工具栏内联弱提示（不清空旧数据）。 */
  const refreshError = ref('')
  /** 从未成功时首次加载失败 → 整区错误态。 */
  const firstLoadError = ref(false)

  let busy = false
  const pendingQueue: QueuedRequest[] = []
  let timer: ReturnType<typeof setInterval> | null = null
  let hidden = false
  let lastFailedCriteria: AppliedCriteria | null = null

  function startTimer(): void {
    stopTimer()
    timer = setInterval(() => {
      if (hidden || busy || !store.hasSuccess) return
      void execute(store.appliedCriteria as AppliedCriteria, store.pageNum, 'auto')
    }, AUTO_REFRESH_INTERVAL_MS)
  }

  function stopTimer(): void {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  function setVisual(kind: RequestKind, on: boolean): void {
    if (kind === 'manual' || kind === 'restore' || kind === 'auto') {
      refreshing.value = on
    } else {
      loading.value = on
    }
  }

  async function execute(criteria: AppliedCriteria, page: number, kind: RequestKind): Promise<void> {
    if (busy) {
      if (kind !== 'auto') {
        pendingQueue.push({ criteria, page, kind })
      }
      return
    }
    busy = true
    setVisual(kind, true)
    try {
      const ok = await doFetch(criteria, page, kind)
      if (!ok && !store.hasSuccess) {
        firstLoadError.value = true
        lastFailedCriteria = criteria
      }
    } finally {
      setVisual(kind, false)
      busy = false
      const next = pendingQueue.shift()
      if (next) {
        void execute(next.criteria, next.page, next.kind)
      }
    }
  }

  async function doFetch(criteria: AppliedCriteria, page: number, kind: RequestKind): Promise<boolean> {
    try {
      const res = await fetchTopicOffsets(queryParams(criteria, page))
      if (res.code !== 200) {
        return handleFailure(criteria, kind, res.message || '请求失败')
      }
      const data = res.data
      store.commitSuccess(criteria, page, data, Date.now())
      refreshError.value = ''
      firstLoadError.value = false
      startTimer()
      void refreshCandidatesQuietly()
      convergeAfterSuccess(data)
      return true
    } catch {
      return handleFailure(criteria, kind, '数据加载失败')
    }
  }

  function handleFailure(criteria: AppliedCriteria, kind: RequestKind, message: string): boolean {
    if (!store.hasSuccess) {
      // 从未成功：整区错误态，保留待重试条件；不清空（本就无成功现场）。
      lastFailedCriteria = criteria
      refreshError.value = ''
      return false
    }
    // 已有成功现场：保留上一次成功数据（TOFF-REQ-111/039）。
    if (kind === 'manual') {
      if (notify) notify(message)
    } else if (kind === 'auto') {
      refreshError.value = '自动刷新失败，已保留上次数据'
    } else {
      refreshError.value = '刷新失败，已保留上次数据'
    }
    return false
  }

  /** 刷新/翻页成功后当前页越界收敛（TOFF-REQ-093）：total>0 且 page>pages → page=pages；total=0 → page=1。 */
  function convergeAfterSuccess(data: TopicOffsetPageResult): void {
    if (store.pageNum <= data.pages) return
    const criteria = store.appliedCriteria as AppliedCriteria
    if (data.pages > 0) {
      void execute(criteria, data.pages, 'page')
    } else if (store.pageNum !== 1) {
      void execute(criteria, 1, 'page')
    }
  }

  async function loadCandidates(): Promise<void> {
    try {
      const res = await fetchTopicCandidates()
      if (res.code === 200) {
        store.setCandidates(res.data)
      }
    } catch {
      // 候选加载失败不影响断点列表；下拉按空候选渲染。
    }
  }

  async function refreshCandidatesQuietly(): Promise<void> {
    try {
      const res = await fetchTopicCandidates()
      if (res.code === 200) {
        store.setCandidates(res.data)
      }
    } catch {
      // 静默失败，保留旧候选。
    }
  }

  /** 页面挂载：恢复已成功现场并立即刷新，否则缺省条件自动查询（DESIGN §6.3/§7.1）。 */
  function onPageMounted(): void {
    void loadCandidates().finally(() => {
      if (store.hasSuccess) {
        void execute(store.appliedCriteria as AppliedCriteria, store.pageNum, 'restore')
      } else {
        void execute(defaultCriteria(), 1, 'initial')
      }
    })
  }

  /** 用户点击查询：草稿 → 不可变 pending（buildCriteria）→ 目标第 1 页。 */
  function submitQuery(
    clients: string[],
    sources: string[],
    targets: string[],
    tableName: string,
  ): void {
    const pending = buildCriteriaFromDraft(clients, sources, targets, tableName)
    void execute(pending, 1, 'query')
  }

  function changePage(page: number): void {
    if (!store.appliedCriteria) return
    if (page < 1 || page === store.pageNum) return
    void execute(store.appliedCriteria, page, 'page')
  }

  function manualRefresh(): void {
    if (!store.appliedCriteria) return
    void execute(store.appliedCriteria, store.pageNum, 'manual')
  }

  function retry(): void {
    void execute(lastFailedCriteria ?? defaultCriteria(), 1, 'retry')
  }

  function visibilityChanged(isHidden: boolean): void {
    hidden = isHidden
    if (isHidden) {
      stopTimer()
      return
    }
    startTimer()
    if (store.hasSuccess) {
      void execute(store.appliedCriteria as AppliedCriteria, store.pageNum, 'restore')
    }
  }

  function destroy(): void {
    stopTimer()
  }

  return {
    loading,
    refreshing,
    refreshError,
    firstLoadError,
    submitQuery,
    changePage,
    manualRefresh,
    retry,
    loadCandidates,
    onPageMounted,
    visibilityChanged,
    destroy,
  }
}
