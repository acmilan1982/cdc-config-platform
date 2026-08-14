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
      <span class="ov-label">本次故障处理结果</span>
      <el-tag :type="statusTagType(detail.recordStatus)" size="small" class="ov-result-tag">
        {{ currentStatusLabel }}
      </el-tag>
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
      <span class="ov-label">处理概况</span>
      <el-tooltip :content="duration.tooltip" placement="top" :show-after="300" :disabled="!duration.tooltip">
        <span class="ov-value">重启 {{ detail.restartCount }} 次 · 历时 {{ duration.main }}</span>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FaultProcessDetailVO } from '@/types/jobFailure'
import DataSourceDisplay from './DataSourceDisplay.vue'

const props = defineProps<{ detail: FaultProcessDetailVO }>()

const currentStatusLabel = computed(() => {
  const status = props.detail.recordStatus
  if (status === 'RECOVERY_RECORDED') return '已恢复'
  return props.detail.recordStatusLabel || status || '--'
})

const duration = computed(() => {
  return durationDisplay(props.detail.firstFailureTime, props.detail.lastHandleTime)
})

function toEpochSeconds(val: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/.exec(val)
  if (!m) return null
  const [, y, mo, d, h, mi, s] = m
  return Math.floor(
    Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)) / 1000
  )
}

function durationDisplay(start?: string | null, end?: string | null): { main: string; tooltip: string } {
  if (!start || !end) return { main: '—', tooltip: '' }
  const s = toEpochSeconds(start)
  const e = toEpochSeconds(end)
  if (s == null || e == null || e < s) return { main: '—', tooltip: '' }
  const totalSec = e - s
  return { main: mainDurationText(totalSec), tooltip: `精确历时：${preciseDurationText(totalSec)}` }
}

function mainDurationText(totalSec: number): string {
  const sec = totalSec % 60
  const min = Math.floor(totalSec / 60) % 60
  const hr = Math.floor(totalSec / 3600) % 24
  const days = Math.floor(totalSec / 86400)
  if (totalSec < 60) return `${totalSec} 秒`
  if (totalSec < 3600) return `${min} 分 ${sec} 秒`
  if (totalSec < 86400) return `${hr} 小时 ${min} 分`
  return `${days} 天 ${hr} 小时 ${min} 分`
}

function preciseDurationText(totalSec: number): string {
  const sec = totalSec % 60
  const min = Math.floor(totalSec / 60) % 60
  const hr = Math.floor(totalSec / 3600) % 24
  const days = Math.floor(totalSec / 86400)
  const parts: string[] = []
  if (days > 0) parts.push(`${days} 天`)
  if (hr > 0) parts.push(`${hr} 小时`)
  if (min > 0) parts.push(`${min} 分`)
  parts.push(`${String(sec).padStart(2, '0')} 秒`)
  return parts.join(' ')
}

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
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: #ebeef5;
}
.overview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  background: #fff;
  min-width: 0;
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
}
</style>
