<template>
  <div class="overview-grid">
    <div class="overview-item">
      <span class="ov-label">客户端</span>
      <span class="ov-value">{{ detail.clientId }}</span>
    </div>
    <div class="overview-item">
      <span class="ov-label">业务库</span>
      <span class="ov-value">{{ detail.dataSourceId }}</span>
    </div>
    <div class="overview-item">
      <span class="ov-label">故障根事件</span>
      <span class="ov-value">{{ detail.faultRootId }}</span>
    </div>
    <div class="overview-item">
      <span class="ov-label">首次失败时间</span>
      <span class="ov-value">{{ formatTime(detail.firstFailureTime) }}</span>
    </div>
    <div class="overview-item">
      <span class="ov-label">最近处理时间</span>
      <span class="ov-value">{{ formatTime(detail.lastHandleTime) }}</span>
    </div>
    <div class="overview-item">
      <span class="ov-label">重启次数</span>
      <span class="ov-value">{{ detail.restartCount }}</span>
    </div>
    <div class="overview-item">
      <span class="ov-label">当前处理状态</span>
      <el-tag :type="statusTagType(detail.recordStatus)" size="small">
        {{ currentStatusLabel }}
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FaultProcessDetailVO } from '@/types/jobFailure'

const props = defineProps<{ detail: FaultProcessDetailVO }>()

const currentStatusLabel = computed(() => {
  const status = props.detail.recordStatus
  if (status === 'RECOVERY_RECORDED') return '已恢复'
  return props.detail.recordStatusLabel || status || '--'
})

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
</script>

<style scoped>
.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px 24px;
}
.overview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ov-label {
  font-size: 12px;
  color: #909399;
}
.ov-value {
  font-size: 14px;
  color: #303133;
  word-break: break-all;
}
@media (max-width: 1024px) {
  .overview-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
