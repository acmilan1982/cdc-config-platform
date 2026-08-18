<template>
  <div class="job-failure-page">
    <!-- Toolbar -->
    <div class="page-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">故障监控</h2>
        <el-tag v-if="summaryList" size="small" type="info">共 {{ summaryList.length }} 个数据源</el-tag>
      </div>
      <div class="toolbar-right">
        <span class="refresh-label">自动刷新:</span>
        <el-select v-model="refreshInterval" size="small" style="width: 100px" @change="onIntervalChange">
          <el-option :value="60" label="1 分钟" />
          <el-option :value="3600" label="60 分钟" />
          <el-option :value="21600" label="360 分钟" />
        </el-select>
        <span v-if="lastRefreshedAt" class="last-refresh">最后刷新: {{ lastRefreshedAt }}</span>
        <el-button size="small" type="primary" :loading="refreshing" :disabled="refreshing" @click="manualRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- Query area -->
    <div class="query-area">
      <el-form :inline="true" :model="filter" size="small" class="query-form">
        <el-form-item label="客户端">
          <el-select
            v-model="filter.selectedClients"
            placeholder="全部"
            multiple
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="2"
            style="width: 260px"
            @change="onClientFilterChange"
          >
            <el-option label="全部" value="__ALL__" />
            <el-option
              v-for="c in clientOptions"
              :key="c.clientId"
              :label="c.clientId"
              :value="c.clientId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="Job 当前状态">
          <el-select v-model="filter.status" placeholder="全部" clearable style="width: 130px">
            <el-option label="全部" value="" />
            <el-option label="正常" value="正常运行" />
            <el-option label="恢复中" value="恢复中" />
            <el-option label="离线" value="离线" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="doQuery">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- Loading (initial) -->
    <div v-if="loading && !summaryList" class="state-box">
      <el-icon class="is-loading" :size="28"><Loading /></el-icon>
      <p>正在加载...</p>
    </div>

    <!-- Error (no data yet) -->
    <div v-else-if="error && !summaryList" class="state-box">
      <el-empty description="数据加载失败">
        <el-button type="primary" @click="manualRefresh">重试</el-button>
      </el-empty>
    </div>

    <!-- ZooKeeper failure -->
    <div v-else-if="zkError" class="state-box zk-error-box">
      <el-icon class="zk-error-icon" :size="28"><WarningFilled /></el-icon>
      <p class="zk-error-text">{{ zkErrorText }}</p>
      <div class="zk-connection-info" role="status" aria-live="polite">
        <div v-if="zkConnectionInfoLoading" class="zk-info-placeholder">正在获取连接配置…</div>
        <div v-else-if="zkConnectionInfoFailed" class="zk-info-placeholder">连接配置信息获取失败</div>
        <template v-else>
          <div class="zk-info-row">
            <span class="zk-info-label">集群地址</span>
            <span class="zk-info-value">{{ zkConnectStringDisplay }}</span>
            <el-button
              v-if="zkConnectStringCopiable"
              link
              type="primary"
              size="small"
              class="zk-copy-btn"
              aria-label="复制集群地址"
              title="复制集群地址"
              @click="copyConnectString"
            >复制</el-button>
          </div>
          <div class="zk-info-row">
            <span class="zk-info-label">根路径</span>
            <span class="zk-info-value">{{ zkRootPathDisplay }}</span>
            <el-button
              v-if="zkRootPathCopiable"
              link
              type="primary"
              size="small"
              class="zk-copy-btn"
              aria-label="复制根路径"
              title="复制根路径"
              @click="copyRootPath"
            >复制</el-button>
          </div>
        </template>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="visibleClients.length === 0" class="state-box">
      <el-empty description="暂无匹配的故障记录" />
    </div>

    <!-- Client cards -->
    <div v-else class="cards-container">
      <el-card
        v-for="c in visibleClients"
        :key="c.clientId"
        shadow="never"
        class="client-card"
        :class="{
          'client-card--offline': !c.clientOnline,
          'client-card--abnormal': c.clientOnline && c.overallStatus === '异常'
        }"
      >
        <template #header>
          <div class="card-header" @click="toggleClient(c.clientId)">
            <div class="card-header-left">
              <span
                class="status-dot"
                :class="c.clientOnline ? 'status-dot--online' : 'status-dot--offline'"
              ></span>
              <span
                class="client-status-text"
                :class="c.clientOnline ? 'client-status-text--online' : 'client-status-text--offline'"
              >{{ c.clientOnline ? '在线' : '离线' }}</span>
              <span class="card-client-id">{{ c.clientId }}</span>
            </div>
            <div class="card-header-right">
              <el-icon class="card-toggle-icon" :class="{ 'is-collapsed': !isExpanded(c.clientId) }">
                <ArrowDown />
              </el-icon>
            </div>
          </div>
        </template>
        <div v-show="isExpanded(c.clientId)">
          <el-table :data="c.rows" size="small" border style="width: 100%">
            <el-table-column label="数据源" min-width="180">
              <template #default="{ row }">
                <DataSourceDisplay
                  :data-source-id="row.dataSourceId"
                  :data-source-org="row.dataSourceOrg"
                  :data-source-exists="row.dataSourceExists"
                  :data-source-active="row.dataSourceActive"
                />
              </template>
            </el-table-column>
            <el-table-column label="Job 当前状态" width="110">
              <template #default="{ row }">
                <el-tag :type="jobStatusTagType(finalJobStatus(row))" size="small">
                  {{ jobStatusLabel(finalJobStatus(row)) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="最近故障时间" width="160">
              <template #default="{ row }">{{ formatTime(row.latestFailureTime) }}</template>
            </el-table-column>
            <el-table-column label="最近恢复时间" width="160">
              <template #default="{ row }">{{ formatTime(row.latestRecoveryTime) }}</template>
            </el-table-column>
            <el-table-column label="故障期间恢复尝试" width="140">
              <template #default="{ row }">
                {{ row.eventCountInWindow > 0 ? row.latestRestartCount + ' 次' : '—' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.latestFaultRootId"
                  link
                  type="primary"
                  size="small"
                  @click="openDetail(row.clientId, row.dataSourceId)"
                >
                  查看
                </el-button>
                <span v-else class="no-action">—</span>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="c.rows.length !== c.allRows.length" class="filter-hint">
            当前显示 {{ c.rows.length }} / 共 {{ c.allRows.length }} 个数据源
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, Loading, ArrowDown, WarningFilled } from '@element-plus/icons-vue'
import { fetchSummary } from '@/api/jobFailure'
import { fetchZkHealth } from '@/api/monitor'
import type { JobFailureSummaryVO } from '@/types/jobFailure'
import DataSourceDisplay from './components/DataSourceDisplay.vue'

const router = useRouter()

const summaryList = ref<JobFailureSummaryVO[] | null>(null)
const loading = ref(true)
const refreshing = ref(false)
const error = ref(false)
const zkError = ref(false)
const lastRefreshedAt = ref('')
const refreshInterval = ref(3600)

const ZK_FAILURE_MESSAGE = 'ZooKeeper 连接失败，将在 60 秒重试'
const ZK_RETRY_SECONDS = 60
const ZK_RETRY_MS = 60_000

const zkRetryRemainingSeconds = ref(ZK_RETRY_SECONDS)
const zkRetrying = ref(false)

// ZK connection-target diagnostics (§6.12): separate from Summary status and the
// retry countdown. Health config is fetched once per error lifecycle.
const zkConnectionInfoLoading = ref(false)
const zkConnectionInfoFailed = ref(false)
const zkConnectString = ref<string | null>(null)
const zkRootPath = ref<string | null>(null)

let zkHealthLoadPromise: Promise<void> | null = null
let zkConnectionInfoRequested = false
let zkHealthEpoch = 0

let timer: ReturnType<typeof setInterval> | null = null
let zkRetryTimer: ReturnType<typeof setTimeout> | null = null
let zkCountdownTimer: ReturnType<typeof setInterval> | null = null
let zkNextRetryAt: number | null = null
let requestId = 0
let loadPromise: Promise<LoadResult> | null = null

const filter = reactive({
  selectedClients: ['__ALL__'] as string[],
  status: '' as string
})

// Dynamic ZK failure copy: countdown while waiting, connecting text while retrying.
const zkErrorText = computed(() =>
  zkRetrying.value
    ? '正在重新连接 ZooKeeper…'
    : `ZooKeeper 连接失败，将在 ${zkRetryRemainingSeconds.value} 秒后重试`
)

function resetZkConnectionInfo() {
  zkHealthEpoch += 1
  zkConnectionInfoLoading.value = false
  zkConnectionInfoFailed.value = false
  zkConnectString.value = null
  zkRootPath.value = null
  zkConnectionInfoRequested = false
  zkHealthLoadPromise = null
}

function toNullableString(raw: unknown): string | null {
  return typeof raw === 'string' && raw.trim() !== '' ? raw : null
}

function loadZkConnectionInfo() {
  if (zkConnectionInfoRequested || zkHealthLoadPromise) return
  zkConnectionInfoRequested = true
  zkConnectionInfoLoading.value = true
  zkConnectionInfoFailed.value = false
  const epoch = zkHealthEpoch
  const p = (async () => {
    try {
      const res = await fetchZkHealth()
      if (epoch !== zkHealthEpoch) return
      if (res.code === 200 && res.data) {
        zkConnectString.value = toNullableString(res.data.connectString)
        zkRootPath.value = toNullableString(res.data.rootPath)
        zkConnectionInfoFailed.value = false
      } else {
        zkConnectionInfoFailed.value = true
      }
    } catch {
      if (epoch !== zkHealthEpoch) return
      zkConnectionInfoFailed.value = true
    } finally {
      if (epoch === zkHealthEpoch) zkConnectionInfoLoading.value = false
      zkHealthLoadPromise = null
    }
  })()
  zkHealthLoadPromise = p
}

const zkConnectStringDisplay = computed(() => zkConnectString.value ?? '未配置')
const zkRootPathDisplay = computed(() => zkRootPath.value ?? '未配置')
const zkConnectStringCopiable = computed(() => zkConnectString.value !== null)
const zkRootPathCopiable = computed(() => zkRootPath.value !== null)

// Fallback for LAN HTTP deployments where the Clipboard API is unavailable
// (non-secure context). Uses a transient textarea + execCommand('copy') in the
// synchronous user-gesture call chain, then always removes the node and
// best-effort restores focus/selection.
function legacyCopyText(text: string): boolean {
  const activeEl = document.activeElement as HTMLElement | null
  const selection = window.getSelection()
  let prevRange: Range | null = null
  if (selection && selection.rangeCount > 0) prevRange = selection.getRangeAt(0)

  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'fixed'
  ta.style.left = '-9999px'
  ta.style.top = '0'
  ta.style.opacity = '0'
  ta.style.pointerEvents = 'none'
  document.body.appendChild(ta)

  let ok = false
  try {
    ta.focus()
    ta.select()
    ta.setSelectionRange(0, text.length)
    ok = document.execCommand('copy') === true
  } catch {
    ok = false
  } finally {
    if (ta.parentNode) ta.parentNode.removeChild(ta)
    if (activeEl && typeof activeEl.focus === 'function') {
      try {
        activeEl.focus()
      } catch {
        /* focus restore is best-effort */
      }
    }
    if (prevRange && selection && document.contains(prevRange.startContainer)) {
      try {
        selection.removeAllRanges()
        selection.addRange(prevRange)
      } catch {
        /* selection restore is best-effort */
      }
    }
  }
  return ok
}

async function writeClipboardText(text: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return legacyCopyText(text)
    }
  }
  return legacyCopyText(text)
}

async function copyZkConnectionValue(text: string, label: string): Promise<void> {
  const ok = await writeClipboardText(text)
  if (ok) {
    ElMessage.success({ message: `${label}已复制`, grouping: true })
  } else {
    ElMessage.error({ message: '复制失败，请手动选择复制', grouping: true })
  }
}

async function copyConnectString() {
  if (zkConnectString.value === null) return
  await copyZkConnectionValue(zkConnectString.value, '集群地址')
}

async function copyRootPath() {
  if (zkRootPath.value === null) return
  await copyZkConnectionValue(zkRootPath.value, '根路径')
}

// Track which client cards the user has manually toggled
const manualExpand = ref<Record<string, boolean>>({})

interface ClientCard {
  clientId: string
  clientName: string | null | undefined
  overallStatus: string
  clientOnline: boolean
  allRows: JobFailureSummaryVO[]
  rows: JobFailureSummaryVO[]
}

// Final display status for a single Job row: client offline or job offline -> 离线,
// otherwise the database fault status (正常运行 / 恢复中).
function finalJobStatus(row: JobFailureSummaryVO): string {
  if (row.clientOnline === false) return '离线'
  if (row.jobOnline === false) return '离线'
  return row.jobStatus
}

function jobStatusLabel(status: string): string {
  return status === '正常运行' ? '正常' : status
}

function jobStatusTagType(status: string): 'success' | 'warning' | 'danger' {
  if (status === '离线') return 'danger'
  if (status === '正常运行') return 'success'
  return 'warning'
}

// Build deduplicated client options from data
const clientOptions = computed(() => {
  if (!summaryList.value) return []
  const seen = new Map<string, { clientId: string; clientName?: string | null }>()
  for (const r of summaryList.value) {
    if (!seen.has(r.clientId)) {
      seen.set(r.clientId, { clientId: r.clientId, clientName: r.clientName })
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.clientId.localeCompare(b.clientId))
})

// Expanded state: manual override takes priority
const expandedState = ref<Record<string, boolean>>({})

function isExpanded(clientId: string): boolean {
  return expandedState.value[clientId] ?? false
}

function toggleClient(clientId: string) {
  const current = isExpanded(clientId)
  expandedState.value[clientId] = !current
  manualExpand.value[clientId] = !current
}

// Client cards built from summary data, applying filters
const visibleClients = computed<ClientCard[]>(() => {
  if (!summaryList.value) return []

  // Build client cards
  const grouped = new Map<string, JobFailureSummaryVO[]>()
  for (const r of summaryList.value) {
    const arr = grouped.get(r.clientId)
    if (arr) arr.push(r)
    else grouped.set(r.clientId, [r])
  }

  // Determine selected clients
  const selAll = filter.selectedClients.includes('__ALL__') || filter.selectedClients.length === 0
  const selSet = new Set(filter.selectedClients)

  const cards: ClientCard[] = []
  for (const [clientId, allRows] of grouped) {
    if (!selAll && !selSet.has(clientId)) continue

    const abnormalCount = allRows.filter(r => r.jobStatus === '恢复中').length
    const overallStatus = abnormalCount > 0 ? '异常' : '正常'
    const clientOnline = allRows[0]?.clientOnline === true

    // Apply filters (final display status decides the bucket)
    let visibleRows = allRows
    if (filter.status) {
      visibleRows = visibleRows.filter(r => finalJobStatus(r) === filter.status)
    }

    // Skip cards with no visible rows after filter
    if (visibleRows.length === 0) continue

    // Set default expand state for new clients: all expanded on first load
    if (!(clientId in expandedState.value)) {
      expandedState.value[clientId] = true
    }

    cards.push({
      clientId,
      clientName: allRows[0]?.clientName,
      overallStatus,
      clientOnline,
      allRows,
      rows: visibleRows
    })
  }

  // Sort: offline client → online+abnormal/recovering → online+offline-job → all normal → clientId
  cards.sort((a, b) => {
    const rankA = sortRank(a)
    const rankB = sortRank(b)
    if (rankA !== rankB) return rankA - rankB
    return a.clientId.localeCompare(b.clientId)
  })

  return cards
})

function sortRank(c: ClientCard): number {
  if (!c.clientOnline) return 0
  const statuses = c.allRows.map(finalJobStatus)
  if (statuses.some(s => s === '恢复中')) return 1
  if (statuses.some(s => s === '离线')) return 2
  return 3
}

// Client filter: handle "全部" mutual exclusion
function onClientFilterChange(values: string[]) {
  const last = values[values.length - 1]
  if (last === '__ALL__') {
    filter.selectedClients = ['__ALL__']
  } else if (values.includes('__ALL__') && values.length > 1) {
    filter.selectedClients = values.filter(v => v !== '__ALL__')
  } else if (values.length === 0) {
    filter.selectedClients = ['__ALL__']
  }
}

function doQuery() {
  // Filters are reactive, computed auto-updates
}

function resetFilter() {
  filter.selectedClients = ['__ALL__']
  filter.status = ''
  // Reset expand states on query reset so new results default to all expanded
  expandedState.value = {}
  manualExpand.value = {}
}

type LoadResult = 'success' | 'zk-failure' | 'error'

async function loadData(): Promise<LoadResult> {
  // Shared in-flight protection: at most one Summary request at a time across
  // initial load, page auto-refresh, ZK auto-retry and manual refresh.
  if (loadPromise) return loadPromise
  const p = doLoad()
  loadPromise = p
  try {
    return await p
  } finally {
    if (loadPromise === p) loadPromise = null
  }
}

async function doLoad(): Promise<LoadResult> {
  const id = ++requestId
  let result: LoadResult
  try {
    const res = await fetchSummary()
    if (id !== requestId) return 'error'
    if (res.code === 200) {
      // Prune stale entries from manualExpand and expandedState
      const activeClientIds = new Set((res.data || []).map(r => r.clientId))
      for (const key of Object.keys(manualExpand.value)) {
        if (!activeClientIds.has(key)) delete manualExpand.value[key]
      }
      for (const key of Object.keys(expandedState.value)) {
        if (!activeClientIds.has(key)) delete expandedState.value[key]
      }
      // Prune selected clients that no longer exist
      if (!filter.selectedClients.includes('__ALL__')) {
        filter.selectedClients = filter.selectedClients.filter(c => activeClientIds.has(c))
        if (filter.selectedClients.length === 0) filter.selectedClients = ['__ALL__']
      }
      summaryList.value = res.data
      error.value = false
      zkError.value = false
      lastRefreshedAt.value = formatNow()
      resetZkConnectionInfo()
      result = 'success'
    } else if (res.message === ZK_FAILURE_MESSAGE) {
      const firstEntry = !zkError.value
      summaryList.value = null
      error.value = false
      zkError.value = true
      lastRefreshedAt.value = ''
      result = 'zk-failure'
      if (firstEntry) loadZkConnectionInfo()
    } else {
      if (!summaryList.value) error.value = true
      ElMessage.warning(res.message || '请求失败')
      result = 'error'
    }
  } catch {
    if (id !== requestId) return 'error'
    if (!summaryList.value) error.value = true
    result = 'error'
  }

  if (result === 'success') {
    clearZkRetry()
    startTimer()
  } else if (result === 'zk-failure') {
    stopTimer()
    scheduleZkRetry()
  }
  return result
}

async function manualRefresh() {
  refreshing.value = true
  clearZkRetry()
  if (zkError.value) zkRetrying.value = true
  await loadData()
  refreshing.value = false
}

function openDetail(clientId: string, dataSourceId: string) {
  const route = router.resolve({
    name: 'JobFailureDetail',
    query: { clientId, dataSourceId }
  })
  window.open(route.href, '_blank')
}

function onIntervalChange() {
  // During a ZK failure the fixed 60s retry takes precedence; the new interval only
  // applies after recovery.
  if (!zkError.value) {
    startTimer()
  }
}

function startTimer() {
  stopTimer()
  timer = setInterval(() => {
    if (!refreshing.value) loadData()
  }, refreshInterval.value * 1000)
}

function stopTimer() {
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

function scheduleZkRetry() {
  clearZkRetry()
  zkRetryRemainingSeconds.value = ZK_RETRY_SECONDS
  zkNextRetryAt = Date.now() + ZK_RETRY_MS
  zkRetryTimer = setTimeout(() => {
    zkRetryTimer = null
    triggerZkRetry()
  }, ZK_RETRY_MS)
  zkCountdownTimer = setInterval(updateZkCountdown, 500)
}

function stopZkTimers() {
  if (zkRetryTimer !== null) {
    clearTimeout(zkRetryTimer)
    zkRetryTimer = null
  }
  if (zkCountdownTimer !== null) {
    clearInterval(zkCountdownTimer)
    zkCountdownTimer = null
  }
}

function clearZkRetry() {
  stopZkTimers()
  zkNextRetryAt = null
  zkRetrying.value = false
  zkRetryRemainingSeconds.value = ZK_RETRY_SECONDS
}

function updateZkCountdown() {
  if (zkNextRetryAt === null) return
  const remainingMs = zkNextRetryAt - Date.now()
  zkRetryRemainingSeconds.value = Math.max(
    0,
    Math.min(ZK_RETRY_SECONDS, Math.ceil(remainingMs / 1000))
  )
  // Expiry may be discovered by the timeout, the countdown tick or a visibility
  // restore; the shared guard below ensures only a single retry request fires.
  if (remainingMs <= 0 && !zkRetrying.value && !loadPromise) {
    triggerZkRetry()
  }
}

async function triggerZkRetry() {
  if (zkRetrying.value || loadPromise) return
  zkRetrying.value = true
  stopZkTimers()
  await loadData()
}

function handleVisibilityChange() {
  if (document.hidden) return
  if (zkNextRetryAt !== null) {
    updateZkCountdown()
  }
}

function formatTime(val?: string | null): string {
  if (!val) return '—'
  const idx = val.indexOf('T')
  return idx >= 0 ? val.replace('T', ' ') : val
}

function formatNow(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

onMounted(async () => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  await loadData()
  loading.value = false
  if (!zkError.value) startTimer()
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  stopTimer()
  clearZkRetry()
  resetZkConnectionInfo()
})
</script>

<style scoped>
.job-failure-page {
  min-height: 100%;
  padding: 16px;
}
.page-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.toolbar-left { display: flex; align-items: baseline; gap: 12px; }
.page-title { margin: 0; font-size: 18px; font-weight: 600; color: #303133; }
.toolbar-right { display: flex; align-items: center; gap: 10px; }
.refresh-label { font-size: 13px; color: #909399; }
.last-refresh { font-size: 12px; color: #c0c4cc; }
.query-area {
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px 16px 4px;
  margin-bottom: 16px;
}
.query-form {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
}
.cards-container {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #EEF2F7;
  background:
    radial-gradient(circle at 12% 18%, rgba(99, 102, 241, 0.06), transparent 28%),
    radial-gradient(circle at 88% 12%, rgba(56, 189, 248, 0.08), transparent 30%),
    linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 55%, #EEF2FF 100%);
}
.client-card {
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  background: linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%);
  transition: box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
}
.client-card--abnormal {
  background: linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%);
}
.client-card--offline {
  background: linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%);
  border-color: #FECACA;
}
.client-card:hover {
  border-color: #CBD5E1;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}
@media (prefers-reduced-motion: reduce) {
  .client-card:hover {
    transform: none;
  }
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  width: 100%;
}
.client-card :deep(.el-card__header) {
  padding: 12px 16px;
  background: #F8FAFC;
  border-bottom: 1px solid #E2E8F0;
  border-radius: 16px 16px 0 0;
}
.client-card :deep(.el-card__body) {
  padding: 16px;
}
.card-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.status-dot--online {
  background-color: rgba(16, 185, 129, 0.82);
}
.status-dot--offline {
  background-color: rgba(245, 34, 45, 0.85);
}
.client-status-text {
  font-size: 13px;
  font-weight: 600;
}
.client-status-text--online {
  color: #16a34a;
}
.client-status-text--offline {
  color: #ef4444;
}
.card-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.card-client-id {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  font-family: monospace;
}
.card-toggle-icon {
  transition: transform 0.2s;
  color: #909399;
  font-size: 14px;
}
.card-toggle-icon.is-collapsed {
  transform: rotate(-90deg);
}
.no-action {
  color: #c0c4cc;
  font-size: 13px;
}
.filter-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #c0c4cc;
  text-align: right;
}
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #909399;
}
.zk-error-box {
  gap: 12px;
}
.zk-error-icon {
  color: #f56c6c;
  animation: zk-icon-breathe 1.4s ease-in-out infinite;
}
@keyframes zk-icon-breathe {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.92); }
}
@media (prefers-reduced-motion: reduce) {
  .zk-error-icon {
    animation: none;
  }
}
.zk-error-text {
  margin: 0;
  font-size: 15px;
  color: #f56c6c;
  font-weight: 500;
}
.zk-connection-info {
  max-width: 560px;
  width: 100%;
  margin-top: 4px;
  padding: 10px 14px;
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}
.zk-info-placeholder {
  font-size: 12px;
  color: #909399;
}
.zk-info-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}
.zk-info-label {
  flex-shrink: 0;
  font-size: 12px;
  color: #a8abb2;
  width: 48px;
}
.zk-info-value {
  flex: 1;
  min-width: 0;
  font-family: monospace;
  font-size: 12px;
  color: #606266;
  overflow-wrap: anywhere;
}
.zk-copy-btn {
  flex-shrink: 0;
  font-size: 12px;
}
</style>
