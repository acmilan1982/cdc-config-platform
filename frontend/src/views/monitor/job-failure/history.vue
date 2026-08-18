<template>
  <div class="history-page">
    <!-- Toolbar -->
    <div class="page-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">故障历史</h2>
        <el-tag v-if="summaryList" size="small" type="info">同步平台共 {{ platformClientCount }} 个客户端，{{ platformDataSourceCount }} 个数据源</el-tag>
      </div>
      <div class="toolbar-right">
        <el-button size="small" type="primary" :loading="loading" @click="load('preserve')">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- Query area: only client filter + query/reset -->
    <div class="query-area">
      <el-form :inline="true" size="small" class="query-form">
        <el-form-item label="客户端">
          <el-select v-model="filterClient" placeholder="全部" clearable style="width: 220px">
            <el-option label="全部" value="" />
            <el-option v-for="c in clientOptions" :key="c" :label="c" :value="c" />
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

    <!-- Error -->
    <div v-else-if="error" class="state-box">
      <el-empty description="数据加载失败">
        <el-button type="primary" @click="load('reset')">重试</el-button>
      </el-empty>
    </div>

    <!-- Empty -->
    <div v-else-if="visibleCards.length === 0" class="state-box">
      <el-empty description="暂无匹配的故障记录" />
    </div>

    <!-- Client cards -->
    <div v-else class="cards-container">
      <el-card
        v-for="c in visibleCards"
        :key="c.clientId"
        shadow="never"
        class="client-card"
      >
        <template #header>
          <div class="card-header" @click="toggleClient(c.clientId)">
            <span class="card-client-id">{{ c.clientId }}</span>
            <el-icon class="card-toggle-icon" :class="{ 'is-collapsed': !isExpanded(c.clientId) }">
              <ArrowDown />
            </el-icon>
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
            <el-table-column label="今日故障次数" width="120">
              <template #default="{ row }">{{ row.todayFailureCount }}</template>
            </el-table-column>
            <el-table-column label="近7天故障次数" width="120">
              <template #default="{ row }">{{ row.last7DaysFailureCount }}</template>
            </el-table-column>
            <el-table-column label="近30天故障次数" width="120">
              <template #default="{ row }">{{ row.last30DaysFailureCount }}</template>
            </el-table-column>
            <el-table-column label="最近故障时间" width="170">
              <template #default="{ row }">{{ formatTime(row.latestFailureTime) }}</template>
            </el-table-column>
            <el-table-column label="最近处理结果" width="130">
              <template #default="{ row }">
                <span v-if="row.latestProcessStatusLabel">{{ row.latestProcessStatusLabel }}</span>
                <span v-else class="no-value">--</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <RouterLink
                  :to="{ name: 'JobFailureHistoryList', query: { clientId: row.clientId, dataSourceId: row.dataSourceId } }"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="history-link"
                >查看历史</RouterLink>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Loading, ArrowDown } from '@element-plus/icons-vue'
import { fetchHistorySummary } from '@/api/jobFailure'
import type { FaultHistorySummaryVO } from '@/types/jobFailure'
import DataSourceDisplay from './components/DataSourceDisplay.vue'

const summaryList = ref<FaultHistorySummaryVO[] | null>(null)
const loading = ref(true)
const error = ref(false)

const filterClient = ref('')
const expandedState = ref<Record<string, boolean>>({})

// 平台整体规模：始终从未筛选的完整 Summary 计算，不随客户端筛选变化
const platformClientCount = computed(() => {
  if (!summaryList.value) return 0
  const seen = new Set<string>()
  for (const r of summaryList.value) seen.add(r.clientId)
  return seen.size
})

const platformDataSourceCount = computed(() => (summaryList.value ? summaryList.value.length : 0))

const clientOptions = computed(() => {
  if (!summaryList.value) return []
  const seen: string[] = []
  for (const r of summaryList.value) {
    if (!seen.includes(r.clientId)) seen.push(r.clientId)
  }
  return seen.sort((a, b) => a.localeCompare(b))
})

const visibleCards = computed(() => {
  if (!summaryList.value) return []
  const rows = filterClient.value
    ? summaryList.value.filter(r => r.clientId === filterClient.value)
    : summaryList.value
  const cards: { clientId: string; rows: FaultHistorySummaryVO[] }[] = []
  for (const r of rows) {
    let card = cards.find(c => c.clientId === r.clientId)
    if (!card) {
      card = { clientId: r.clientId, rows: [] }
      cards.push(card)
    }
    card.rows.push(r)
  }
  return cards
})

function isExpanded(clientId: string): boolean {
  return expandedState.value[clientId] ?? false
}

function toggleClient(clientId: string) {
  expandedState.value[clientId] = !isExpanded(clientId)
}

// reset: 当前结果全部展开；preserve: 保留仍存在 clientId 的人工状态，新 clientId 展开
type ExpansionMode = 'reset' | 'preserve'

function applyExpansion(mode: ExpansionMode, rows: FaultHistorySummaryVO[] | null) {
  const current = new Set<string>()
  for (const r of rows ?? []) {
    current.add(r.clientId)
    if (mode === 'reset') {
      expandedState.value[r.clientId] = true
    } else if (!(r.clientId in expandedState.value)) {
      expandedState.value[r.clientId] = true
    }
  }
  for (const key of Object.keys(expandedState.value)) {
    if (!current.has(key)) delete expandedState.value[key]
  }
}

function doQuery() {
  // filter is reactive; visibleCards recomputes automatically
  applyExpansion('reset', summaryList.value)
}

function resetFilter() {
  filterClient.value = ''
  applyExpansion('reset', summaryList.value)
}

function formatTime(val?: string | null): string {
  if (!val) return '--'
  const idx = val.indexOf('T')
  return idx >= 0 ? val.replace('T', ' ') : val
}

async function load(mode: ExpansionMode = 'preserve') {
  loading.value = true
  error.value = false
  try {
    const res = await fetchHistorySummary()
    if (res.code === 200) {
      summaryList.value = res.data
      applyExpansion(mode, res.data)
    } else {
      error.value = true
      ElMessage.warning(res.message || '请求失败')
    }
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => load('reset'))
</script>

<style scoped>
.history-page {
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
  background: #ffffff;
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
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  width: 100%;
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
.history-link {
  font-size: 13px;
  color: #409eff;
  text-decoration: none;
}
.history-link:hover {
  color: #79bbff;
}
.no-value {
  color: #c0c4cc;
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
