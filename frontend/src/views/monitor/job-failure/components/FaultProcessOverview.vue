<template>
  <div class="overview-grid">
    <div class="overview-item">
      <span class="ov-label">客户端</span>
      <span class="ov-value">{{ detail.clientId }}</span>
    </div>
    <div class="overview-item">
      <span class="ov-label">数据源</span>
      <DataSourceDisplay
        :data-source-id="detail.dataSourceId"
        :data-source-org="detail.dataSourceOrg"
        :data-source-exists="detail.dataSourceExists"
        :data-source-active="detail.dataSourceActive"
      />
    </div>
    <div class="overview-item">
      <span class="ov-label">根事件</span>
      <el-tooltip :content="rootEventIdText" placement="top" :show-after="300">
        <span class="ov-value">{{ rootEventIdShort }}</span>
      </el-tooltip>
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
    <div class="overview-item overview-item--span2">
      <span class="ov-label">本次故障处理结果</span>
      <el-tag :type="statusTagType(detail.recordStatus)" size="small" class="ov-result-tag">
        {{ currentStatusLabel }}
      </el-tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FaultProcessDetailVO } from '@/types/jobFailure'
import DataSourceDisplay from './DataSourceDisplay.vue'

const props = defineProps<{ detail: FaultProcessDetailVO }>()

const rootEventIdText = computed(() => {
  const d = props.detail
  if (d.faultRootIdText) return d.faultRootIdText
  return d.faultRootId != null ? String(d.faultRootId) : ''
})

const rootEventIdShort = computed(() => {
  const t = rootEventIdText.value
  if (t.length <= 10) return t
  return t.slice(0, 6) + '…' + t.slice(-4)
})

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
  gap: 1px;
  background: #ebeef5;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}
.overview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  background: #fff;
  min-width: 0;
}
.overview-item--span2 {
  grid-column: span 2;
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
.ov-result-tag {
  align-self: flex-start;
}
@media (max-width: 1024px) {
  .overview-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .overview-grid { grid-template-columns: 1fr; }
  .overview-item--span2 { grid-column: span 1; }
}
</style>
