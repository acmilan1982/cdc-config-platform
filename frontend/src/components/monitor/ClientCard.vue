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
          <div class="detail-content" :class="{ empty: !client.detailInfo }">
            {{ client.detailInfo || '(无详细信息)' }}
          </div>
        </template>
        <div class="detail-popover-content">
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
/* Card */
.client-card {
  margin-bottom: 0;
  border: 1px solid #F1F5F9;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
  background-color: #FFFFFF;
  transition: box-shadow 0.2s;
}
.client-card:hover {
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

/* Card header */
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 15px;
}

/* Status dot: 8px */
.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.online-dot.online { background-color: #10B981; }
.online-dot.offline { background-color: #EF4444; }

.online-text {
  font-size: 13px;
}
.online-dot.online ~ .online-text { color: #10B981; }
.online-dot.offline ~ .online-text { color: #EF4444; }

.client-name {
  font-weight: 700;
  color: #0F172A;
}

.path-icon {
  color: #2563EB;
  cursor: pointer;
  font-size: 15px;
}
.path-icon:hover { color: #1D4ED8; }

.card-alert {
  margin-bottom: 12px;
}

/* el-descriptions overrides */
.client-card :deep(.el-descriptions__label) {
  background-color: #F8FAFC;
  color: #64748B;
}
.client-card :deep(.el-descriptions__content) {
  background-color: #FFFFFF;
  color: #334155;
}
.client-card :deep(.el-descriptions) {
  --el-descriptions-border-color: #E2E8F0;
}
.client-descriptions {
  margin-bottom: 16px;
}

/* offline dot breathing animation */
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

/* detailInfo: dark code block */
.detail-section {
  margin-bottom: 16px;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background-color: #F8FAFC;
  border-bottom: 1px solid #E2E8F0;
}

.detail-title {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.detail-content {
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
  padding: 10px 12px;
  white-space: pre-wrap;
  word-break: break-all;
  color: #94A3B8;
  background-color: #1E293B;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: default;
}
.detail-content.empty {
  color: #64748B;
  -webkit-line-clamp: unset;
  display: block;
  background-color: #F8FAFC;
}

/* detailInfo popover: match dark code block */
.detail-popover-content {
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 450px;
  overflow-y: auto;
  color: #94A3B8;
  background-color: #1E293B;
  padding: 10px 12px;
  border-radius: 6px;
}

/* Jobs table */
.jobs-section {
  margin-top: 4px;
}

.jobs-title {
  font-size: 13px;
  font-weight: 600;
  color: #0F172A;
  margin-bottom: 8px;
}

/* Table header */
.client-card :deep(.el-table__header-wrapper th) {
  background-color: #F8FAFC;
  color: #64748B;
  font-weight: 500;
  border-bottom-color: #E2E8F0;
}
.client-card :deep(.el-table__body-wrapper td) {
  color: #334155;
  border-bottom-color: #F1F5F9;
}
.client-card :deep(.el-table__body tr:hover > td) {
  background-color: #F8FAFC;
}
.client-card :deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background-color: #FAFBFC;
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

.path-icon-small {
  font-size: 13px;
  color: #2563EB;
  cursor: pointer;
}
.path-icon-small:hover { color: #1D4ED8; }

/* Copy button in detail header */
.client-card :deep(.detail-header .el-button--primary) {
  color: #2563EB;
}
.client-card :deep(.detail-header .el-button--primary:hover) {
  color: #1D4ED8;
}
</style>
