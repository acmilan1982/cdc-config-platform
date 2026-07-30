<template>
  <div class="summary-table-wrap">
    <el-table :data="data?.records ?? []" size="small" border style="width: 100%" v-loading="loading">
      <el-table-column label="客户端" min-width="120">
        <template #default="{ row }">
          <div>
            <div class="name-cell">{{ row.clientName || row.clientId }}</div>
            <div v-if="row.clientName" class="id-cell">{{ row.clientId }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="业务库" min-width="140">
        <template #default="{ row }">
          <div>
            <div class="name-cell">{{ row.dataSourceName || row.dataSourceId }}</div>
            <div v-if="row.dataSourceName" class="id-cell">{{ row.dataSourceId }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="最近故障时间" width="160">
        <template #default="{ row }">{{ formatTime(row.latestFailureTime) }}</template>
      </el-table-column>
      <el-table-column label="当前处理状态" width="120">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.latestRecordStatus)" size="small">
            {{ row.latestRecordStatusLabel || row.latestRecordStatus || '--' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="故障过程结果" width="130">
        <template #default="{ row }">
          <el-tag :type="resultTagType(row.latestFaultProcessResult)" size="small">
            {{ row.latestFaultProcessResultLabel || row.latestFaultProcessResult || '--' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="latestRestartCount" label="重启" width="60" />
      <el-table-column prop="eventCountInWindow" label="事件数" width="70" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="$emit('detail-click', row.clientId, row.dataSourceId)">
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import type { JobFailureSummaryVO, PageResult } from '@/types/jobFailure'

defineProps<{
  data: PageResult<JobFailureSummaryVO> | null
  loading: boolean
}>()

defineEmits<{ 'detail-click': [clientId: string, dataSourceId: string] }>()

function formatTime(val?: string | null): string {
  if (!val) return '--'
  const idx = val.indexOf('T')
  return idx >= 0 ? val.replace('T', ' ') : val
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

function resultTagType(result?: string | null): string {
  return statusTagType(result)
}
</script>

<style scoped>
.summary-table-wrap { }
.name-cell { font-weight: 500; color: #303133; }
.id-cell { font-size: 12px; color: #909399; }
</style>
