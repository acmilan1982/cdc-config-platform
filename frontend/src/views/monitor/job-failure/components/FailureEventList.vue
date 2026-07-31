<template>
  <div>
    <el-table :data="events" size="small" border style="width: 100%">
      <el-table-column label="事件 ID" width="180">
        <template #default="{ row }">
          <el-tooltip :content="String(row.eventId)" placement="top" :hide-after="0">
            <code class="cell-code">{{ truncateId(row.eventId) }}</code>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="失败 Job ID" min-width="200">
        <template #default="{ row }">
          <el-tooltip :content="row.failedJobId" placement="top" :hide-after="0">
            <code class="cell-code">{{ truncateId(row.failedJobId) }}</code>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="失败时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.failureTime) }}
        </template>
      </el-table-column>
      <el-table-column label="有效性" width="100">
        <template #default="{ row }">
          <el-tag :type="validityTag(row.validity)" size="small">
            {{ row.validityLabel || row.validity || '--' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="事件结果" width="120">
        <template #default="{ row }">
          {{ eventResultLabel(row.eventResult) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="$emit('view-detail', row.eventId)">
            查看故障详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import type { EventCardVO } from '@/types/jobFailure'

defineProps<{ events: EventCardVO[] }>()
defineEmits<{ 'view-detail': [eventId: number] }>()

function truncateId(val: string | number): string {
  const s = String(val)
  if (s.length <= 16) return s
  return s.slice(0, 6) + '…' + s.slice(-8)
}

function eventResultLabel(result?: string | null): string {
  if (!result) return '--'
  if (result === 'ACCEPTED') return '已纳入主链'
  return result
}

function formatTime(val?: string | null): string {
  if (!val) return '--'
  const idx = val.indexOf('T')
  return idx >= 0 ? val.replace('T', ' ') : val
}

function validityTag(val?: string | null): string {
  if (!val) return 'info'
  switch (val) {
    case 'VALID': return 'success'
    case 'INVALID': return 'info'
    case 'STALE': return 'warning'
    default: return 'info'
  }
}
</script>

<style scoped>
.cell-code {
  font-size: 12px;
  font-family: monospace;
  white-space: nowrap;
}
</style>
