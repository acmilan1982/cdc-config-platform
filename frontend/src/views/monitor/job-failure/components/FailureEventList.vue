<template>
  <div>
    <el-table :data="events" size="small" border style="width: 100%">
      <el-table-column label="故障事件 ID" width="190">
        <template #default="{ row }">
          <el-tooltip :content="row.eventIdText" placement="top" :hide-after="0">
            <code class="cell-code">{{ truncateId(row.eventIdText) }}</code>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="发生故障的 Job ID" min-width="200">
        <template #default="{ row }">
          <el-tooltip :content="row.failedJobId" placement="top" :hide-after="0">
            <code class="cell-code">{{ truncateId(row.failedJobId) }}</code>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="故障时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.failureTime) }}
        </template>
      </el-table-column>
      <el-table-column label="事件处理结果" width="170">
        <template #default="{ row }">
          <el-tooltip :content="eventResultDisplay(row).tooltip" placement="top" :hide-after="0">
            <el-tag :type="eventResultDisplay(row).tagType" size="small">
              {{ eventResultDisplay(row).label }}
            </el-tag>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="viewDetail(row)">
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
const emit = defineEmits<{ 'view-detail': [eventId: string] }>()

function viewDetail(row: EventCardVO): void {
  if (row.eventIdText) emit('view-detail', row.eventIdText)
}

interface ResultDisplay {
  label: string
  tagType: 'success' | 'warning' | 'info'
  tooltip: string
}

function truncateId(val?: string | null): string {
  if (!val) return '--'
  if (val.length <= 16) return val
  return val.slice(0, 6) + '…' + val.slice(-8)
}

function eventResultDisplay(row: EventCardVO): ResultDisplay {
  if (row.hasDuplicateIgnoredLog) {
    return {
      label: '已忽略（重复事件）',
      tagType: 'info',
      tooltip: 'EVENT_RESULT：ACCEPTED\n后续处理：DUPLICATED_EVENT_IGNORED'
    }
  }
  const raw = row.eventResult
  const rawText = raw ? raw : '未提供'
  switch (raw) {
    case 'ACCEPTED':
      return { label: '已受理', tagType: 'success', tooltip: `EVENT_RESULT：${rawText}` }
    case 'IGNORED_INVALID':
      return { label: '已忽略（信息无效）', tagType: 'info', tooltip: `EVENT_RESULT：${rawText}` }
    case 'IGNORED_STALE':
      return { label: '已忽略（回调过期）', tagType: 'warning', tooltip: `EVENT_RESULT：${rawText}` }
    default:
      return { label: '未识别的处理结果', tagType: 'info', tooltip: `EVENT_RESULT：${rawText}` }
  }
}

function formatTime(val?: string | null): string {
  if (!val) return '--'
  const idx = val.indexOf('T')
  return idx >= 0 ? val.replace('T', ' ') : val
}
</script>

<style scoped>
.cell-code {
  font-size: 12px;
  font-family: monospace;
  white-space: nowrap;
}
</style>
