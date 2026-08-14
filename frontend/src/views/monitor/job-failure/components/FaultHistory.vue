<template>
  <div>
    <div class="history-toolbar">
      <span class="history-label">时间范围:</span>
      <el-select v-model="timeRange" size="small" style="width: 130px" @change="onTimeRangeChange">
        <el-option label="最近一天" value="1d" />
        <el-option label="最近一周" value="7d" />
        <el-option label="最近一个月" value="30d" />
      </el-select>
    </div>

    <div v-if="loading" class="history-loading">
      <el-icon class="is-loading" :size="20"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <el-empty v-else-if="records.length === 0" description="暂无历史故障记录" :image-size="60" />

    <el-table
      v-else
      :data="records"
      size="small"
      border
      style="width: 100%"
      :row-class-name="rowClassName"
    >
      <el-table-column label="首次失败时间" width="160">
        <template #default="{ row }">{{ formatTime(row.startTime) }}</template>
      </el-table-column>
      <el-table-column label="最终恢复时间" width="160">
        <template #default="{ row }">
          {{ row.recordStatus === 'RECOVERY_RECORDED' ? formatTime(row.lastRecordTime) : '--' }}
        </template>
      </el-table-column>
      <el-table-column label="持续时间" width="100">
        <template #default="{ row }">{{ durationText(row) }}</template>
      </el-table-column>
      <el-table-column label="失败事件数" width="90">
        <template #default="{ row }">{{ row.mainChainEventCount }}</template>
      </el-table-column>
      <el-table-column label="重启次数" width="80">
        <template #default="{ row }">{{ row.restartCount }}</template>
      </el-table-column>
      <el-table-column label="当前处理状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.recordStatus)" size="small">
            {{ statusLabel(row) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="selectRow(row)">
            查看
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { fetchHistory } from '@/api/jobFailure'
import type { FaultProcessSummaryVO } from '@/types/jobFailure'

const props = defineProps<{
  clientId: string
  dataSourceId: string
  currentFaultRootId: string | null
}>()

const emit = defineEmits<{ select: [faultRootId: string] }>()

function selectRow(row: FaultProcessSummaryVO): void {
  if (row.faultRootIdText) emit('select', row.faultRootIdText)
}

const timeRange = ref('1d')
const records = ref<FaultProcessSummaryVO[]>([])
const loading = ref(false)

function rowClassName({ row }: { row: FaultProcessSummaryVO }): string {
  return row.faultRootIdText === props.currentFaultRootId ? 'history-row--current' : ''
}

function statusLabel(row: FaultProcessSummaryVO): string {
  if (row.recordStatus === 'RECOVERY_RECORDED') return '已恢复'
  return row.recordStatusLabel || row.recordStatus || '--'
}

function statusTagType(status?: string | null): string {
  if (!status) return 'info'
  switch (status) {
    case 'RECOVERY_RECORDED': return 'success'
    case 'NOT_CLOSED': return 'warning'
    case 'DATA_ANOMALY': return 'danger'
    default: return 'info'
  }
}

function durationText(row: FaultProcessSummaryVO): string {
  if (!row.startTime || !row.lastRecordTime) return '--'
  const start = new Date(row.startTime.replace('T', ' ') + 'Z').getTime()
  const end = new Date(row.lastRecordTime.replace('T', ' ') + 'Z').getTime()
  if (isNaN(start) || isNaN(end) || end < start) return '--'
  const ms = end - start
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return minutes + ' 分钟'
  const hours = Math.floor(minutes / 60)
  const remainMin = minutes % 60
  if (hours < 24) return hours + ' 小时 ' + remainMin + ' 分钟'
  const days = Math.floor(hours / 24)
  const remainHr = hours % 24
  return days + ' 天 ' + remainHr + ' 小时'
}

function formatTime(val?: string | null): string {
  if (!val) return '--'
  const idx = val.indexOf('T')
  return idx >= 0 ? val.replace('T', ' ') : val
}

function formatApiTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function onTimeRangeChange() {
  load()
}

async function load() {
  loading.value = true
  try {
    const now = new Date()
    const endTime = formatApiTime(now)

    const start = new Date(now)
    if (timeRange.value === '1d') {
      start.setDate(start.getDate() - 1)
    } else if (timeRange.value === '7d') {
      start.setDate(start.getDate() - 7)
    } else {
      start.setDate(start.getDate() - 30)
    }
    const startTime = formatApiTime(start)

    const res = await fetchHistory(props.clientId, props.dataSourceId, {
      pageNum: 1,
      pageSize: 1000,
      startTime,
      endTime
    })
    if (res.code === 200) {
      records.value = res.data.records
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => load())
</script>

<style scoped>
.history-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.history-label {
  font-size: 13px;
  color: #606266;
}
.history-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  justify-content: center;
  color: #909399;
  font-size: 13px;
}
</style>
<style>
.history-row--current {
  background-color: #ecf5ff !important;
}
.history-row--current td {
  background-color: transparent !important;
}
</style>
