<template>
  <div>
    <el-timeline v-if="timeline.length > 0">
      <el-timeline-item
        v-for="log in timeline"
        :key="log.logId"
        :timestamp="formatTime(log.handleTime)"
        placement="top"
      >
        <div class="timeline-item">
          <div class="tl-stage">
            <el-tag :type="stageTag(log.handleStage)" size="small">
              {{ stageLabel(log) }}
            </el-tag>
          </div>
          <div class="tl-meta">
            <span v-if="log.attemptNo != null">尝试 #{{ log.attemptNo }}</span>
            <span v-if="log.newJobId" class="tl-newjob">
              新 Job: <code>{{ log.newJobId }}</code>
            </span>
          </div>
          <div class="tl-logid">日志 ID: {{ log.logId }}</div>
          <div class="tl-action">
            <el-button link type="primary" size="small" @click="$emit('view-error', log.logId)">
              查看错误详情
            </el-button>
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
    <el-empty v-else description="暂无处理时间线" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
import type { HandleTimelineVO } from '@/types/jobFailure'

defineProps<{ timeline: HandleTimelineVO[] }>()
defineEmits<{ 'view-error': [logId: number] }>()

function formatTime(val?: string | null): string {
  if (!val) return '--'
  const idx = val.indexOf('T')
  return idx >= 0 ? val.replace('T', ' ') : val
}

const STAGE_LABELS: Record<string, string> = {
  JOB_FAILURE_RECEIVED: '接收到有效 Job 失败',
  JOB_FAILURE_IGNORED_INVALID: '失败信息无效',
  JOB_FAILURE_IGNORED_STALE: '失败回调已过期',
  DUPLICATED_EVENT_IGNORED: '重复事件已忽略',
  RESTART_SCHEDULED: '已安排延迟重启',
  SCHEDULED_RESTART_SKIPPED: '重启计划已跳过',
  RESTART_STARTED: '开始重启',
  NEW_JOB_SUBMIT_SUCCEEDED: '新 Job 已提交，稳定观察中',
  NEW_JOB_SUBMIT_FAILED: '新 Job 提交失败',
  STABLE_CHECK_PASSED: '稳定性检查通过，已记录恢复'
}

function stageLabel(log: HandleTimelineVO): string {
  const stage = log.handleStage
  if (!stage) return '--'
  return STAGE_LABELS[stage] || stage
}

function stageTag(stage?: string | null): string {
  if (!stage) return 'info'
  switch (stage) {
    case 'JOB_FAILURE_RECEIVED': return ''
    case 'RESTART_SCHEDULED': return 'info'
    case 'RESTART_STARTED': return 'warning'
    case 'NEW_JOB_SUBMIT_SUCCEEDED': return ''
    case 'STABLE_CHECK_PASSED': return 'success'
    case 'NEW_JOB_SUBMIT_FAILED': return 'danger'
    case 'SCHEDULED_RESTART_SKIPPED': return 'info'
    case 'JOB_FAILURE_IGNORED_INVALID':
    case 'JOB_FAILURE_IGNORED_STALE':
    case 'DUPLICATED_EVENT_IGNORED': return 'info'
    default: return 'info'
  }
}
</script>

<style scoped>
.timeline-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.tl-stage { }
.tl-meta {
  font-size: 12px;
  color: #909399;
  display: flex;
  gap: 12px;
}
.tl-newjob code {
  font-size: 11px;
  color: #606266;
}
.tl-logid {
  font-size: 11px;
  color: #c0c4cc;
}
.tl-action {
  margin-top: 2px;
}
</style>
