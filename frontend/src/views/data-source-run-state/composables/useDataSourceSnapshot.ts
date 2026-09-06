import { computed, ref } from 'vue'
import { fetchSnapshotStatusList } from '@/api/dataSourceSnapshot'
import type { ApiResponse } from '@/types/monitor'
import type {
  AppliedCriteria,
  CandidateGroup,
  DataSourceSnapshotQueryParams,
  SnapshotStatusItem,
  SnapshotStatusListResult,
} from '@/types/dataSourceSnapshot'
import { buildCriteriaFromDraft, defaultCriteria } from '@/views/data-source-run-state/utils/selection'
import { formatEpochToHms } from '@/views/data-source-run-state/utils/format'

/** 自动刷新周期（DSS-REQ-051/054，AC-048/051）。 */
export const AUTO_REFRESH_INTERVAL_MS = 60_000

/** 有数据时刷新/查询失败的内联收敛提示（UI §6.4/§7.3，DSS-REQ-061，AC-058）。 */
export const REFRESH_FAIL_MESSAGE = '刷新失败，将在约 60 秒后自动重试'

type RequestKind = 'initial' | 'retry' | 'query' | 'manual' | 'restore' | 'auto'

/** 建立性（整表 loading）：成功把本次请求快照升级为“已应用查询条件”。 */
const ESTABLISHING: ReadonlySet<RequestKind> = new Set(['initial', 'retry', 'query'])
/** 刷新性（工具栏轻量态）：成功只更新结果/最近成功时间，条件不变（DESIGN §7.3/§8）。 */
const REFRESHING: ReadonlySet<RequestKind> = new Set(['manual', 'restore', 'auto'])

function isEstablishing(kind: RequestKind): boolean {
  return ESTABLISHING.has(kind)
}

interface RequestOp {
  criteria: AppliedCriteria
  kind: RequestKind
}

function toQueryParams(criteria: AppliedCriteria): DataSourceSnapshotQueryParams {
  return { clientId: criteria.clientIds, sourceId: criteria.sourceIds, status: [...criteria.statuses] }
}

/**
 * 页面实例内编排（DESIGN §7/§8/§9，R1-01/R1-02/R1-03）：
 * 单飞行统一忙碌抑制（busy 时“查询/立即刷新”按钮禁用、自动触发被抑制，不排队不补发）；
 * 请求实例令牌 seq 仅防卸载迟写/防旧响应覆盖；每次真实请求结束后重启完整 60s；
 * 恢复可见延后单次补发（pendingVisibilityRefresh，唯一例外）按届时最新已应用条件执行。
 * 不新增 Pinia store，状态为页面/composable 实例内 ref；路由离开即销毁、现场不跨路由保留。
 */
export function useDataSourceSnapshot() {
  const records = ref<SnapshotStatusItem[]>([])
  const candidates = ref<CandidateGroup | null>(null)
  /** 已应用查询条件：最近一次成功“点击查询”确立；刷新/失败/重置不改（DESIGN §7.1/§7.3）。 */
  const appliedCriteria = ref<AppliedCriteria>(defaultCriteria())
  const hasSuccess = ref(false)
  /** 最近成功刷新时刻（前端成功收到并判成功，epoch ms）；失败/被抑制不更新（UI §6.3）。 */
  const lastSuccessAt = ref<number | null>(null)
  /** 整表大态 loading：kind=initial/retry/query 在途。 */
  const loading = ref(false)
  /** 工具栏轻量态：kind=manual/restore/auto 在途（表格不遮罩，DESIGN §7.6）。 */
  const refreshing = ref(false)
  /** 任一实际请求在途；busy 时“查询/立即刷新”禁用、自动触发被抑制（R1-02）。 */
  const busy = ref(false)
  /** 从未成功时的首次加载失败 → 整区错误态 + 重新加载（UI §7.2）。 */
  const firstLoadError = ref(false)
  /** 有成功现场后的刷新失败内联收敛提示（不清表，UI §6.4/§7.3）。 */
  const refreshError = ref('')

  let disposed = false
  let hidden = false
  let latestSeq = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let pendingVisibilityRefresh = false

  const candidateClients = computed(() => candidates.value?.clients ?? [])
  const candidateSources = computed(() => candidates.value?.sources ?? [])
  const candidateStatuses = computed(() => candidates.value?.statuses ?? [])
  /** 工具栏“最近成功刷新：HH:mm:ss”；从未成功显示 --（UI §6.1）。 */
  const lastRefreshText = computed(() => formatEpochToHms(lastSuccessAt.value))

  function stopTimer(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  /** 完整 60 秒周期：先清再设，仅页面实例可见才运行（DESIGN §7.5）。 */
  function scheduleNext(): void {
    stopTimer()
    if (disposed || hidden) return
    timer = setTimeout(() => {
      timer = null
      launch(appliedCriteria.value, 'auto')
    }, AUTO_REFRESH_INTERVAL_MS)
  }

  function setVisual(kind: RequestKind, on: boolean): void {
    if (REFRESHING.has(kind)) {
      refreshing.value = on
    } else {
      loading.value = on
    }
  }

  /** 唯一入链口：busy/卸载/隐藏时一律拒绝（被禁用/被抑制触发不视为实际请求，R1-02）。 */
  function launch(criteria: AppliedCriteria, kind: RequestKind): void {
    if (disposed || busy.value || hidden) return
    void run(criteria, kind)
  }

  async function run(criteria: AppliedCriteria, kind: RequestKind): Promise<void> {
    const seq = ++latestSeq
    busy.value = true
    setVisual(kind, true)
    try {
      const res: ApiResponse<SnapshotStatusListResult> = await fetchSnapshotStatusList(toQueryParams(criteria))
      if (disposed || seq !== latestSeq) return
      if (res.code !== 200) {
        handleFailure()
        return
      }
      commitSuccess(criteria, kind, res.data)
    } catch {
      if (disposed || seq !== latestSeq) return
      handleFailure()
    } finally {
      setVisual(kind, false)
      busy.value = false
      onRequestFinally()
    }
  }

  /** 成功提交（DESIGN §7.3 两阶段提交）：仅 !disposed 且该 op 为当前最新实际请求才允许写入。 */
  function commitSuccess(criteria: AppliedCriteria, kind: RequestKind, data: SnapshotStatusListResult): void {
    if (isEstablishing(kind)) {
      appliedCriteria.value = {
        clientIds: [...criteria.clientIds],
        sourceIds: [...criteria.sourceIds],
        statuses: [...criteria.statuses],
      }
    }
    records.value = data.records
    candidates.value = data.candidates
    hasSuccess.value = true
    lastSuccessAt.value = Date.now()
    firstLoadError.value = false
    refreshError.value = ''
  }

  function handleFailure(): void {
    if (!hasSuccess.value) {
      // 首次失败（无成功现场）：整区错误态；已应用条件仍为初始三项“全部”，重试仍按“全部”（UI §7.2）。
      firstLoadError.value = true
      refreshError.value = ''
      return
    }
    // 有成功现场：保留上一次成功数据与已应用条件，只给收敛脱敏提示（UI §7.3）。
    refreshError.value = REFRESH_FAIL_MESSAGE
  }

  /**
   * 计时统一收口（DESIGN §7.7 伪代码）：
   * busy 已复位；disposed/hidden 直接返回；待补发恢复刷新则清标志并立即按届时最新已应用条件补发
   * （该次补发结束才重启 60s）；否则重启完整 60 秒。
   */
  function onRequestFinally(): void {
    if (disposed || hidden) return
    if (pendingVisibilityRefresh) {
      pendingVisibilityRefresh = false
      launch(appliedCriteria.value, 'restore')
      return
    }
    scheduleNext()
  }

  /** 每次路由进入/页面实例创建：重置为三项“全部”并自动按“全部”首次查询（DESIGN §7.1，AC-021）。 */
  function onPageMounted(initialHidden = false): void {
    hidden = initialHidden
    if (hidden) return
    launch(defaultCriteria(), 'initial')
  }

  /** 点击“查询”：草稿 → 去哨兵快照 → kind=query；仅成功才升级已应用条件（DESIGN §8 E3）。 */
  function submitQuery(clients: string[], sources: string[], statuses: string[]): void {
    launch(buildCriteriaFromDraft(clients, sources, statuses), 'query')
  }

  /** “立即刷新”：恒按已应用条件取数，成功/失败都不改条件（DESIGN §8 E8）。 */
  function manualRefresh(): void {
    launch(appliedCriteria.value, 'manual')
  }

  /** “重新加载”（首次失败态）：按“全部”重试（DESIGN §8 E14）。 */
  function retry(): void {
    launch(appliedCriteria.value, 'retry')
  }

  /**
   * 页面隐藏/恢复可见（DESIGN §7.7/§8 E11~E13）：
   * 隐藏停表并清待补发标志；空闲恢复立即按当前已应用条件刷新（从未成功 → “全部”首次重试）；
   * 在途恢复仅置一次性 pendingVisibilityRefresh（多次可见合并为一次，不并发）。
   */
  function visibilityChanged(isHidden: boolean): void {
    hidden = isHidden
    if (isHidden) {
      stopTimer()
      pendingVisibilityRefresh = false
      return
    }
    if (busy.value) {
      pendingVisibilityRefresh = true
      return
    }
    launch(appliedCriteria.value, hasSuccess.value ? 'restore' : 'retry')
  }

  /** 页面实例销毁（路由离开）：清计时器/待补发标志、置 disposed，杜绝迟到响应写入（DESIGN §8 E16）。 */
  function destroy(): void {
    disposed = true
    stopTimer()
    pendingVisibilityRefresh = false
  }

  return {
    records,
    candidates,
    appliedCriteria,
    hasSuccess,
    lastSuccessAt,
    loading,
    refreshing,
    busy,
    firstLoadError,
    refreshError,
    lastRefreshText,
    candidateClients,
    candidateSources,
    candidateStatuses,
    onPageMounted,
    submitQuery,
    manualRefresh,
    retry,
    visibilityChanged,
    destroy,
  }
}
