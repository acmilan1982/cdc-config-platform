<template>
  <el-card class="client-card" :class="{ offline: !client.online }" shadow="never">
    <!-- Left color bar + card header -->
    <div class="card-header">
      <span class="online-dot" :class="{ online: client.online, offline: !client.online }"></span>
      <span class="online-text">{{ client.online ? '在线' : '离线' }}</span>
      <span class="client-name">{{ client.clientName }}</span>
      <el-tooltip :content="client.clientPath" placement="top" :show-after="500">
        <el-icon class="path-icon"><InfoFilled /></el-icon>
      </el-tooltip>
    </div>

    <!-- Warnings -->
    <el-alert
      v-if="client.readStatus === 'ERROR' || (client.warnings && client.warnings.length > 0)"
      :title="client.warnings?.join('; ') || '读取异常'"
      type="warning"
      :closable="false"
      show-icon
      class="card-alert"
    />

    <!-- Info: fixed three-row layout -->
    <el-descriptions :column="2" size="small" border class="client-descriptions">
      <el-descriptions-item label="IP">
        {{ client.ip || '—' }}
      </el-descriptions-item>
      <el-descriptions-item label="PID">
        {{ client.pid }}
      </el-descriptions-item>
      <el-descriptions-item label="状态码">
        {{ client.statusCode || '—' }}
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        {{ client.statusMessage || '—' }}
      </el-descriptions-item>
      <el-descriptions-item label="启动时间">
        {{ client.startTime }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ client.updateTime || '—' }}
      </el-descriptions-item>
    </el-descriptions>

    <!-- detailInfo section -->
    <div class="detail-section">
      <div class="detail-header">
        <span class="detail-title">详细信息</span>
        <el-button size="small" text type="primary" @click="copyDetailInfo">
          <el-icon><CopyDocument /></el-icon>
          复制
        </el-button>
      </div>
      <el-popover
        placement="bottom"
        :width="700"
        trigger="hover"
        :disabled="!client.detailInfo"
        :show-after="300"
      >
        <template #reference>
          <div
            class="detail-content"
            :class="{
              empty: !client.detailInfo,
              'terminal-text--error': !client.online && client.detailInfo,
              'terminal-text--normal': client.online && client.detailInfo
            }"
          >
            {{ client.detailInfo || '(无详细信息)' }}
          </div>
        </template>
        <div
          class="detail-popover-content"
          :class="{
            'terminal-text--error': !client.online,
            'terminal-text--normal': client.online
          }"
        >
          {{ client.detailInfo }}
        </div>
      </el-popover>
    </div>

    <!-- Jobs table -->
    <div class="jobs-section">
      <div class="jobs-title">采集任务 ({{ client.jobs.length }})</div>
      <div class="jobs-table-wrap" :class="{ scrollable: client.jobs.length > 8 }">
        <el-table
          :data="sortedJobs"
          size="small"
          stripe
          style="width: 100%"
          :empty-text="'(无采集任务)'"
        >
          <el-table-column label="任务名称" width="130" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="job-name-cell">
                <span class="job-name-text">{{ row.jobName }}</span>
                <el-tooltip :content="row.jobPath" placement="top" :show-after="500">
                  <el-icon class="path-icon-small"><InfoFilled /></el-icon>
                </el-tooltip>
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="statusCode" label="状态码" width="70" />
          <el-table-column prop="statusMessage" label="状态描述" />
          <el-table-column prop="scn" label="SCN" width="105" align="right">
            <template #default="{ row }">
              {{ row.scn || '' }}
            </template>
          </el-table-column>
          <el-table-column prop="scnUpdateTime" label="SCN 更新时间" width="160">
            <template #default="{ row }">
              {{ row.scnUpdateTime || '' }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { InfoFilled, CopyDocument } from '@element-plus/icons-vue'
import type { ZooKeeperClientVO, ZooKeeperJobVO } from '@/types/monitor'

const props = defineProps<{
  client: ZooKeeperClientVO
}>()

const sortedJobs = computed<ZooKeeperJobVO[]>(() => {
  if (!props.client.jobs || props.client.jobs.length === 0) return []
  return [...props.client.jobs].sort((a, b) => a.jobName.localeCompare(b.jobName))
})

function copyDetailInfo() {
  if (props.client.detailInfo) {
    navigator.clipboard.writeText(props.client.detailInfo).then(() => {
      ElMessage.success('已复制到剪贴板')
    }).catch(() => {
      ElMessage.error('复制失败')
    })
  }
}
</script>

<style scoped>
/* ========================================
   Card: glass morphism
   ======================================== */

/* Base card — online tint */
.client-card {
  margin-bottom: 0;
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
  background:
    linear-gradient(
      135deg,
      rgba(236, 253, 245, 0.30),
      rgba(255, 255, 255, 0.58)
    );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}
/* fallback */
@supports not (backdrop-filter: blur(12px)) {
  .client-card {
    background:
      linear-gradient(
        135deg,
        rgba(236, 253, 245, 0.55),
        rgba(255, 255, 255, 0.88)
      );
    border: 1px solid rgba(226, 232, 240, 0.55);
  }
}

/* Offline card — red tint */
.client-card.offline {
  background: rgba(254, 242, 242, 0.56);
}
@supports not (backdrop-filter: blur(12px)) {
  .client-card.offline {
    background: rgba(254, 242, 242, 0.82);
  }
}

.client-card:hover {
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}
@media (prefers-reduced-motion: reduce) {
  .client-card:hover {
    transform: none;
  }
}

/* ========================================
   Card header
   ======================================== */
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 15px;
}

/* Status dot: 8px, semi-transparent */
.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.online-dot.online {
  background-color: rgba(16, 185, 129, 0.82);
}
.online-dot.offline {
  background-color: rgba(248, 113, 113, 0.82);
}

.online-text {
  font-size: 13px;
  font-weight: 500;
}
.online-dot.online ~ .online-text { color: #10B981; }
.online-dot.offline ~ .online-text { color: #F87171; }

.client-name {
  font-weight: 700;
  color: #0F172A;
}

/* Info icon — muted semi-transparent */
.path-icon {
  color: rgba(100, 116, 139, 0.72);
  cursor: pointer;
  font-size: 15px;
  transition: color 0.15s;
}
.path-icon:hover { color: #2563EB; }

.card-alert {
  margin-bottom: 12px;
}

/* ========================================
   el-descriptions: light glass cells
   ======================================== */
.client-card :deep(.el-descriptions__label) {
  background-color: rgba(248, 250, 252, 0.72);
  color: #64748B;
}
.client-card :deep(.el-descriptions__content) {
  background-color: rgba(255, 255, 255, 0.52);
  color: #334155;
}
.client-card :deep(.el-descriptions) {
  --el-descriptions-border-color: rgba(226, 232, 240, 0.65);
}
.client-descriptions {
  margin-bottom: 16px;
  border-radius: 10px;
  overflow: hidden;
}

/* ========================================
   Breathing animation (offline dot only)
   ======================================== */
@keyframes breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.online-dot.offline {
  animation: breathe 2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .online-dot.offline {
    animation: none;
  }
}

/* ========================================
   detailInfo: light glass block
   ======================================== */
.detail-section {
  margin-bottom: 16px;
  border: 1px solid rgba(226, 232, 240, 0.72);
  border-radius: 10px;
  overflow: hidden;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: rgba(248, 250, 252, 0.72);
  border-bottom: 1px solid rgba(226, 232, 240, 0.55);
}

.detail-title {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

/* Log content — light monospace */
.detail-content {
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.55;
  padding: 10px 12px;
  white-space: pre-wrap;
  word-break: break-all;
  color: #475569;
  background: rgba(248, 250, 252, 0.72);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: default;
}
.detail-content.empty {
  color: #94A3B8;
  -webkit-line-clamp: unset;
  display: block;
  background: rgba(248, 250, 252, 0.48);
}

/* Terminal text colors: normal vs error (offline) — light bg variants */
.terminal-text--normal {
  color: #475569;
}
.terminal-text--error {
  color: #B91C1C;
}

/* Popover: light glass */
.detail-popover-content {
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 450px;
  overflow-y: auto;
  color: #475569;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.55);
  padding: 10px 12px;
  border-radius: 10px;
}

/* ========================================
   Jobs table
   ======================================== */
.jobs-section {
  margin-top: 4px;
}

.jobs-title {
  font-size: 13px;
  font-weight: 600;
  color: #0F172A;
  margin-bottom: 8px;
}

/* Table header: glass */
.client-card :deep(.el-table__header-wrapper th) {
  background-color: rgba(248, 250, 252, 0.72);
  color: #64748B;
  font-weight: 500;
  border-bottom-color: rgba(226, 232, 240, 0.55);
}
.client-card :deep(.el-table__body-wrapper td) {
  color: #334155;
  background-color: rgba(255, 255, 255, 0.36);
  border-bottom-color: rgba(226, 232, 240, 0.45);
}
.client-card :deep(.el-table__body tr:hover > td) {
  background-color: rgba(239, 246, 255, 0.55);
}
.client-card :deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: rgba(248, 250, 252, 0.50);
}

/* Table border-radius */
.client-card :deep(.el-table) {
  border-radius: 10px;
  overflow: hidden;
}

.jobs-table-wrap.scrollable {
  max-height: 360px;
  overflow-y: auto;
}

.job-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
}

.job-name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Small info icon — muted */
.path-icon-small {
  font-size: 13px;
  color: rgba(100, 116, 139, 0.72);
  cursor: pointer;
  transition: color 0.15s;
}
.path-icon-small:hover { color: #2563EB; }

/* Copy button — lightweight secondary action */
.client-card :deep(.detail-header .el-button--primary) {
  background: rgba(255, 255, 255, 0.38);
  color: #64748B;
  border: 1px solid rgba(226, 232, 240, 0.72);
  box-shadow: none;
  border-radius: 8px;
  font-size: 12px;
  padding: 2px 8px;
  transition: all 0.18s ease;
}
.client-card :deep(.detail-header .el-button--primary:hover) {
  color: #2563EB;
  border-color: rgba(37, 99, 235, 0.35);
  background: rgba(239, 246, 255, 0.72);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
}
.client-card :deep(.detail-header .el-button--primary:focus-visible) {
  outline: 2px solid rgba(37, 99, 235, 0.45);
  outline-offset: 2px;
}
</style>
