<template>
  <div class="job-failure-page">
    <!-- Toolbar -->
    <div class="page-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">故障监控</h2>
        <el-tag v-if="summaryList" size="small" type="info">共 {{ summaryList.length }} 个业务库</el-tag>
      </div>
      <div class="toolbar-right">
        <span class="refresh-label">自动刷新:</span>
        <el-select v-model="refreshInterval" size="small" style="width: 100px" @change="resetTimer">
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
            <el-option label="正常运行" value="正常运行" />
            <el-option label="恢复中" value="恢复中" />
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
        :class="{ 'client-card--abnormal': c.overallStatus === '异常' }"
      >
        <template #header>
          <div class="card-header" @click="toggleClient(c.clientId)">
            <div class="card-header-left">
              <span class="card-client-id">{{ c.clientId }}</span>
              <el-tag size="small" :type="c.overallStatus === '正常' ? 'success' : 'warning'">
                {{ c.overallStatus === '正常' ? '正常' : '异常' }}
              </el-tag>
            </div>
            <div class="card-header-right">
              <span class="card-count">
                正常 <strong>{{ c.normalCount }}</strong> / 异常 <strong>{{ c.abnormalCount }}</strong>
              </span>
              <el-icon class="card-toggle-icon" :class="{ 'is-collapsed': !isExpanded(c.clientId) }">
                <ArrowDown />
              </el-icon>
            </div>
          </div>
        </template>
        <div v-show="isExpanded(c.clientId)">
          <el-table :data="c.rows" size="small" border style="width: 100%">
            <el-table-column label="业务库" min-width="140">
              <template #default="{ row }">
                <div>
                  <div class="name-cell">{{ row.dataSourceName || '--' }}</div>
                  <div class="id-cell">{{ row.dataSourceId }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="Job 当前状态" width="110">
              <template #default="{ row }">
                <el-tag :type="row.jobStatus === '正常运行' ? 'success' : 'warning'" size="small">
                  {{ row.jobStatus }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="最近故障时间" width="160">
              <template #default="{ row }">{{ formatTime(row.latestFailureTime) }}</template>
            </el-table-column>
            <el-table-column label="重启次数" width="80">
              <template #default="{ row }">{{ row.latestRestartCount }}</template>
            </el-table-column>
            <el-table-column label="失败事件数" width="90">
              <template #default="{ row }">{{ row.eventCountInWindow }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openDetail(row.clientId, row.dataSourceId)">
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="c.rows.length !== c.allRows.length" class="filter-hint">
            当前显示 {{ c.rows.length }} / 共 {{ c.allRows.length }} 个业务库
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
import { Refresh, Loading, ArrowDown } from '@element-plus/icons-vue'
import { fetchSummary } from '@/api/jobFailure'
import type { JobFailureSummaryVO } from '@/types/jobFailure'

const router = useRouter()

const summaryList = ref<JobFailureSummaryVO[] | null>(null)
const loading = ref(true)
const refreshing = ref(false)
const error = ref(false)
const lastRefreshedAt = ref('')
const refreshInterval = ref(3600)

let timer: ReturnType<typeof setInterval> | null = null
let requestId = 0

const filter = reactive({
  selectedClients: ['__ALL__'] as string[],
  status: '' as string
})

// Track which client cards the user has manually toggled
const manualExpand = ref<Record<string, boolean>>({})

interface ClientCard {
  clientId: string
  clientName: string | null | undefined
  overallStatus: string
  normalCount: number
  abnormalCount: number
  allRows: JobFailureSummaryVO[]
  rows: JobFailureSummaryVO[]
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

// Expanded state: manual override takes priority, otherwise default by status
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
    const normalCount = allRows.length - abnormalCount
    const overallStatus = abnormalCount > 0 ? '异常' : '正常'

    // Apply status filter
    let visibleRows = allRows
    if (filter.status) {
      visibleRows = allRows.filter(r => r.jobStatus === filter.status)
    }

    // Skip cards with no visible rows after status filter
    if (visibleRows.length === 0) continue

    // Set default expand state for new clients: all expanded on first load
    if (!(clientId in expandedState.value)) {
      expandedState.value[clientId] = true
    }

    cards.push({
      clientId,
      clientName: allRows[0]?.clientName,
      overallStatus,
      normalCount,
      abnormalCount,
      allRows,
      rows: visibleRows
    })
  }

  // Sort: abnormal first, then by clientId
  cards.sort((a, b) => {
    if (a.overallStatus !== b.overallStatus) return a.overallStatus === '异常' ? -1 : 1
    return a.clientId.localeCompare(b.clientId)
  })

  return cards
})

// Client filter: handle "全部" mutual exclusion
function onClientFilterChange(values: string[]) {
  const last = values[values.length - 1]
  if (last === '__ALL__') {
    filter.selectedClients = ['__ALL__']
  } else if (values.includes('__ALL__') && values.length > 1) {
    // "全部" was already selected, user picked a specific client → remove "全部"
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
}

async function loadData() {
  const id = ++requestId
  try {
    const res = await fetchSummary()
    if (id !== requestId) return
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
      lastRefreshedAt.value = formatNow()
    } else {
      if (!summaryList.value) error.value = true
      ElMessage.warning(res.message || '请求失败')
    }
  } catch {
    if (id !== requestId) return
    if (!summaryList.value) error.value = true
  }
}

async function manualRefresh() {
  refreshing.value = true
  await loadData()
  refreshing.value = false
  resetTimer()
}

function openDetail(clientId: string, dataSourceId: string) {
  const route = router.resolve({
    name: 'JobFailureDetail',
    query: { clientId, dataSourceId }
  })
  window.open(route.href, '_blank')
}

function resetTimer() {
  stopTimer()
  startTimer()
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

function formatTime(val?: string | null): string {
  if (!val) return '--'
  const idx = val.indexOf('T')
  return idx >= 0 ? val.replace('T', ' ') : val
}

function formatNow(): string {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

onMounted(async () => {
  await loadData()
  loading.value = false
  startTimer()
})

onUnmounted(() => stopTimer())
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
  gap: 16px;
}
.client-card {
  border-left: 4px solid #e0e0e0;
  transition: border-color 0.2s;
}
.client-card--abnormal {
  border-left-color: #e6a23c;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  width: 100%;
}
.card-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
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
.card-count {
  font-size: 12px;
  color: #909399;
}
.card-count strong {
  color: #303133;
}
.card-toggle-icon {
  transition: transform 0.2s;
  color: #909399;
  font-size: 14px;
}
.card-toggle-icon.is-collapsed {
  transform: rotate(-90deg);
}
.name-cell { font-weight: 500; color: #303133; }
.id-cell { font-size: 12px; color: #909399; }
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
</style>
