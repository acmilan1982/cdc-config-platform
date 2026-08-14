<template>
  <div class="restart-cards">
    <el-empty v-if="groups.length === 0" description="暂无处理记录" :image-size="60" />

    <div v-for="(group, gIdx) in groups" :key="gIdx" class="restart-card" :class="cardClass(group)">
      <div class="card-header">
        <div class="card-title-row">
          <span class="card-name">{{ group.label }}</span>
          <el-tag :type="group.success ? 'success' : 'danger'" size="small" class="card-result-tag">
            {{ group.success ? '恢复成功' : '恢复失败' }}
          </el-tag>
        </div>
        <div class="card-meta">
          <span v-if="group.startTime" class="meta-item">
            <span class="meta-label">开始:</span> {{ formatTime(group.startTime) }}
          </span>
          <span v-if="group.endTime && group.endTime !== group.startTime" class="meta-item">
            <span class="meta-label">结束:</span> {{ formatTime(group.endTime) }}
          </span>
          <span v-if="group.oldJobId" class="meta-item">
            <span class="meta-label">原 Job:</span>
            <el-tooltip :content="group.oldJobId" placement="top" :hide-after="0">
              <code class="job-id-code">{{ truncateId(group.oldJobId) }}</code>
            </el-tooltip>
            <el-button link size="small" class="inline-copy" @click="copyId(group.oldJobId!)">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </span>
          <span v-if="group.newJobId" class="meta-item">
            <span class="meta-label">新 Job:</span>
            <el-tooltip :content="group.newJobId" placement="top" :hide-after="0">
              <code class="job-id-code">{{ truncateId(group.newJobId) }}</code>
            </el-tooltip>
            <el-button link size="small" class="inline-copy" @click="copyId(group.newJobId!)">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </span>
        </div>
      </div>

      <div class="card-steps">
        <div v-for="step in group.steps" :key="step.logIdText ?? step.logId" class="step-row">
          <span class="step-time">{{ formatTime(step.handleTime) }}</span>
          <el-tag :type="stageTag(step.handleStage)" size="small" class="step-stage">
            {{ stageLabel(step) }}
          </el-tag>
          <span v-if="step.newJobId" class="step-newjob">
            → <el-tooltip :content="step.newJobId" placement="top" :hide-after="0">
              <code>{{ truncateId(step.newJobId) }}</code>
            </el-tooltip>
          </span>
          <el-button
            v-if="hasErrorDetail(step.handleStage)"
            link
            type="primary"
            size="small"
            class="step-action"
            @click="viewError(step)"
          >
            查看错误详情
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'
import type { HandleTimelineVO, JobChainVO } from '@/types/jobFailure'

const props = defineProps<{
  timeline: HandleTimelineVO[]
  jobChain: JobChainVO[]
}>()

const emit = defineEmits<{ 'view-error': [logId: string] }>()

interface CardGroup {
  label: string
  steps: HandleTimelineVO[]
  startTime: string | null | undefined
  endTime: string | null | undefined
  oldJobId: string | null
  newJobId: string | null
  success: boolean
}

const groups = computed<CardGroup[]>(() => {
  const tl = props.timeline
  if (tl.length === 0) return []

  // Find all RESTART_STARTED indices as group boundaries
  const boundaries: number[] = []
  for (let i = 0; i < tl.length; i++) {
    if (tl[i].handleStage === 'RESTART_STARTED') {
      boundaries.push(i)
    }
  }

  const result: CardGroup[] = []

  if (boundaries.length === 0) {
    // No restarts at all - everything is initial fault
    result.push(buildGroup('初始故障', tl, 0, tl.length, 0))
    return result
  }

  // Group 0: initial fault (everything before first RESTART_STARTED)
  const firstRestart = boundaries[0]
  if (firstRestart > 0) {
    result.push(buildGroup('初始故障', tl, 0, firstRestart, 0))
  }

  // Groups 1..N: each RESTART_STARTED through next RESTART_STARTED (or end)
  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i]
    const end = i + 1 < boundaries.length ? boundaries[i + 1] : tl.length
    const label = `第 ${i + 1} 次重启`
    result.push(buildGroup(label, tl, start, end, i + 1))
  }

  return result
})

function buildGroup(
  label: string,
  tl: HandleTimelineVO[],
  startIdx: number,
  endIdx: number,
  chainIdx: number
): CardGroup {
  const steps = tl.slice(startIdx, endIdx)

  const success = steps.some(s => s.handleStage === 'STABLE_CHECK_PASSED')

  // Extract new job from NEW_JOB_SUBMIT_SUCCEEDED in this group
  const submitEntry = steps.find(s => s.handleStage === 'NEW_JOB_SUBMIT_SUCCEEDED')
  const newJobId = submitEntry?.newJobId ?? null

  // Old job from job chain
  const oldJobId = props.jobChain[chainIdx]?.jobId ?? null

  return {
    label,
    steps,
    startTime: steps[0]?.handleTime,
    endTime: steps[steps.length - 1]?.handleTime,
    oldJobId,
    newJobId,
    success
  }
}

function cardClass(group: CardGroup): string {
  return group.success ? 'restart-card--success' : 'restart-card--failed'
}

function truncateId(val: string): string {
  if (val.length <= 16) return val
  return val.slice(0, 6) + '…' + val.slice(-8)
}

async function copyId(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.warning('复制失败')
  }
}

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

function hasErrorDetail(stage?: string | null): boolean {
  return stage === 'NEW_JOB_SUBMIT_FAILED' || stage === 'JOB_FAILURE_RECEIVED'
}

function viewError(log: HandleTimelineVO): void {
  if (log.logIdText) emit('view-error', log.logIdText)
}
</script>

<style scoped>
.restart-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.restart-card {
  border-radius: 8px;
  border: 2px solid #e4e7ed;
  background: #fff;
  overflow: hidden;
}
.restart-card--failed {
  border-color: #f56c6c;
}
.restart-card--success {
  border-color: #67c23a;
}
.card-header {
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #ebeef5;
}
.restart-card--failed .card-header {
  background: #fef0f0;
}
.restart-card--success .card-header {
  background: #f0f9eb;
}
.card-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.card-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}
.card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}
.meta-label {
  color: #909399;
}
.job-id-code {
  font-size: 12px;
  font-family: monospace;
  color: #303133;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;
}
.inline-copy {
  padding: 0;
  font-size: 13px;
  flex-shrink: 0;
}
.card-steps {
  padding: 8px 16px 12px;
}
.step-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  border-bottom: 1px solid #f5f7fa;
  font-size: 13px;
}
.step-row:last-child {
  border-bottom: none;
}
.step-time {
  color: #909399;
  font-size: 12px;
  white-space: nowrap;
  min-width: 140px;
}
.step-stage {
  flex-shrink: 0;
}
.step-newjob {
  font-size: 12px;
  color: #909399;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.step-newjob code {
  font-size: 12px;
  font-family: monospace;
  color: #606266;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;
}
.step-action {
  margin-left: auto;
  flex-shrink: 0;
}
</style>
