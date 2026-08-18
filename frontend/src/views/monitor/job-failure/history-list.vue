<template>
  <div class="history-list-page">
    <!-- Toolbar -->
    <div class="page-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">数据源故障历史</h2>
      </div>
      <div class="toolbar-right">
        <el-button size="small" type="primary" :loading="loading" @click="load">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- Identity: client + data source with ID tooltip -->
    <div v-if="clientId && dataSourceId" class="identity-bar">
      <span class="identity-label">客户端</span>
      <span class="identity-client">{{ clientId }}</span>
      <el-divider direction="vertical" />
      <el-tooltip :content="`数据源 ID：${dataSourceId}`" placement="top" :show-after="300">
        <span class="identity-ds">{{ dataSourceId }}</span>
      </el-tooltip>
    </div>

    <!-- Query area: fixed natural-day ranges -->
    <div class="query-area">
      <el-form :inline="true" size="small" class="query-form">
        <el-form-item label="时间范围">
          <el-radio-group v-model="range" @change="onRangeChange">
            <el-radio-button label="TODAY">今日</el-radio-button>
            <el-radio-button label="LAST_7_DAYS">近7天</el-radio-button>
            <el-radio-button label="LAST_30_DAYS">近30天</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </div>

    <!-- Loading (initial) -->
    <div v-if="loading && !records" class="state-box">
      <el-icon class="is-loading" :size="28"><Loading /></el-icon>
      <p>正在加载...</p>
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg" class="state-box">
      <el-empty :description="errorMsg">
        <el-button v-if="retryable" type="primary" @click="load">重试</el-button>
      </el-empty>
    </div>

    <template v-else>
      <el-table :data="records" size="small" border style="width: 100%">
        <el-table-column label="首次失败时间" width="170">
          <template #default="{ row }">{{ formatTime(row.startTime) }}</template>
        </el-table-column>
        <el-table-column label="最终恢复时间" width="170">
          <template #default="{ row }">
            {{ row.recordStatus === 'RECOVERY_RECORDED' ? formatTime(row.lastRecordTime) : '--' }}
          </template>
        </el-table-column>
        <el-table-column label="处理历时" width="120">
          <template #default="{ row }">{{ durationText(row) }}</template>
        </el-table-column>
        <el-table-column label="故障事件数" width="110">
          <template #default="{ row }">{{ row.mainChainEventCount }}</template>
        </el-table-column>
        <el-table-column label="重启次数" width="100">
          <template #default="{ row }">{{ row.restartCount }}</template>
        </el-table-column>
        <el-table-column label="本次故障处理结果" width="150">
          <template #default="{ row }">
            <el-tag :type="resultTagType(row)" size="small">{{ resultLabel(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90">
          <template #default="{ row }">
            <RouterLink
              v-if="isValidFaultRootIdText(row.faultRootIdText)"
              :to="{ name: 'JobFailureProcessDetail', params: { faultRootId: row.faultRootIdText } }"
              class="view-link"
            >查看详情</RouterLink>
            <span v-else class="view-link view-link--disabled">查看详情</span>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        class="list-pagination"
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="onPageChange"
        @size-change="onSizeChange"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Refresh, Loading } from '@element-plus/icons-vue'
import { fetchFaultHistoryList } from '@/api/jobFailure'
import type { FaultHistoryListQuery, FaultProcessSummaryVO } from '@/types/jobFailure'

const route = useRoute()

const clientId = ref('')
const dataSourceId = ref('')
const range = ref<'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS'>('TODAY')
const page = ref(1)
const pageSize = ref(20)

const records = ref<FaultProcessSummaryVO[] | null>(null)
const total = ref(0)
const loading = ref(false)
const errorMsg = ref('')
const retryable = ref(false)

let requestSeq = 0

function isValidFaultRootIdText(val?: string | null): val is string {
  return typeof val === 'string' && /^\d+$/.test(val)
}

function formatTime(val?: string | null): string {
  if (!val) return '--'
  const idx = val.indexOf('T')
  return idx >= 0 ? val.replace('T', ' ') : val
}

function durationText(row: FaultProcessSummaryVO): string {
  if (!row.startTime || !row.lastRecordTime) return '--'
  const start = new Date(row.startTime.replace('T', ' ')).getTime()
  const end = new Date(row.lastRecordTime.replace('T', ' ')).getTime()
  if (isNaN(start) || isNaN(end) || end < start) return '--'
  const minutes = Math.floor((end - start) / 60000)
  if (minutes < 60) return minutes + ' 分钟'
  const hours = Math.floor(minutes / 60)
  const remainMin = minutes % 60
  if (hours < 24) return hours + ' 小时 ' + remainMin + ' 分钟'
  const days = Math.floor(hours / 24)
  return days + ' 天 ' + (hours % 24) + ' 小时'
}

function resultLabel(row: FaultProcessSummaryVO): string {
  if (row.recordStatus === 'RECOVERY_RECORDED') return '已恢复'
  return row.faultProcessResultLabel || row.recordStatusLabel || row.recordStatus || '--'
}

function resultTagType(row: FaultProcessSummaryVO): string {
  const status = row.recordStatus
  if (!status) return 'info'
  switch (status) {
    case 'RECOVERY_RECORDED': return 'success'
    case 'NOT_CLOSED': return 'warning'
    case 'DATA_ANOMALY': return 'danger'
    default: return 'info'
  }
}

function buildQuery(): FaultHistoryListQuery {
  return {
    clientId: clientId.value,
    dataSourceId: dataSourceId.value,
    range: range.value,
    page: page.value,
    pageSize: pageSize.value
  }
}

async function load() {
  if (!clientId.value || !dataSourceId.value) {
    errorMsg.value = '缺少 clientId 或 dataSourceId 参数'
    records.value = []
    total.value = 0
    retryable.value = false
    loading.value = false
    return
  }
  const seq = ++requestSeq
  loading.value = true
  errorMsg.value = ''
  retryable.value = false
  try {
    const res = await fetchFaultHistoryList(buildQuery())
    if (seq !== requestSeq) return
    if (res.code === 200) {
      records.value = res.data.records
      total.value = res.data.total
      // Clamp: if the current page is now beyond the valid range, jump to the last page
      if (page.value > 1 && records.value.length === 0 && total.value > 0) {
        page.value = Math.max(1, Math.ceil(total.value / pageSize.value))
        load()
        return
      }
    } else {
      records.value = []
      total.value = 0
      errorMsg.value = res.code === 40403
        ? '当前配置中不存在该数据源'
        : (res.message || '请求失败')
      retryable.value = res.code !== 40403
    }
  } catch {
    if (seq !== requestSeq) return
    records.value = []
    total.value = 0
    errorMsg.value = '网络请求失败'
    retryable.value = true
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

function onRangeChange() {
  page.value = 1
  load()
}

function onPageChange(p: number) {
  page.value = p
  load()
}

function onSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
  load()
}

watch(
  () => route.fullPath,
  () => {
    const cid = route.query.clientId
    const did = route.query.dataSourceId
    clientId.value = typeof cid === 'string' ? cid : ''
    dataSourceId.value = typeof did === 'string' ? did : ''
    page.value = 1
    load()
  },
  { immediate: true }
)
</script>

<style scoped>
.history-list-page {
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
.identity-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
.identity-label {
  font-size: 12px;
  color: #909399;
}
.identity-client {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  font-family: monospace;
}
.identity-ds {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  font-family: monospace;
  cursor: default;
}
.query-area {
  background: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 12px 16px 4px;
  margin-bottom: 16px;
}
.query-form {
  display: flex;
  flex-wrap: wrap;
}
.list-pagination {
  margin-top: 16px;
  justify-content: flex-end;
}
.view-link {
  font-size: 13px;
  color: #409eff;
  text-decoration: none;
  cursor: pointer;
}
.view-link:hover {
  color: #79bbff;
}
.view-link--disabled {
  color: #c0c4cc;
  cursor: not-allowed;
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
