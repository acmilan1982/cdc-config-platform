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

    <!-- Info grid: two-row layout -->
    <div class="info-grid">
      <!-- Row 1: process identity -->
      <div class="info-row">
        <div class="info-field ip-field">
          <label>IP</label>
          <span>{{ client.ip || '—' }}</span>
        </div>
        <div class="info-field pid-field">
          <label>PID</label>
          <span>{{ client.pid }}</span>
        </div>
        <div class="info-field instance-field">
          <label>实例ID</label>
          <span class="instance-id-wrap">
            <el-tooltip
              :content="client.instanceId"
              placement="top"
              :disabled="client.instanceId === '--' || client.instanceId.length <= 17"
              :show-after="300"
            >
              <span class="instance-id-text">{{ truncateInstanceId(client.instanceId) }}</span>
            </el-tooltip>
            <el-button
              v-if="client.instanceId !== '--'"
              size="small"
              text
              type="primary"
              class="copy-instance-btn"
              @click="copyInstanceId"
            >
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </span>
        </div>
      </div>
      <!-- Row 2: run status -->
      <div class="info-row">
        <div class="info-field code-field">
          <label>状态码</label>
          <span>{{ client.statusCode || '—' }}</span>
        </div>
        <div class="info-field status-field">
          <label>状态</label>
          <span>{{ client.statusMessage || '—' }}</span>
        </div>
        <div class="info-field time-field">
          <label>启动时间</label>
          <span class="time-text">{{ client.startTime }}</span>
        </div>
        <div class="info-field time-field">
          <label>更新时间</label>
          <span class="time-text">{{ client.updateTime || '—' }}</span>
        </div>
      </div>
    </div>

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

function truncateInstanceId(id: string): string {
  if (!id || id === '--' || id.length <= 17) return id
  return id.substring(0, 8) + '…' + id.substring(id.length - 8)
}

function copyInstanceId() {
  if (props.client.instanceId && props.client.instanceId !== '--') {
    navigator.clipboard.writeText(props.client.instanceId).then(() => {
      ElMessage.success('已复制完整实例ID')
    }).catch(() => {
      ElMessage.error('复制失败')
    })
  }
}
</script>

<style scoped>
.client-card {
  margin-bottom: 16px;
  border-left: 4px solid #52c41a;
  transition: border-color 0.3s;
}
.client-card.offline {
  border-left: 4px solid #f56c6c;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 15px;
}

.online-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.online-dot.online { background-color: #52c41a; }
.online-dot.offline { background-color: #f56c6c; }

.online-text {
  color: #52c41a;
  font-size: 13px;
}
.offline .online-text {
  color: #f56c6c;
}

.client-name {
  font-weight: 700;
}

.path-icon {
  color: #909399;
  cursor: pointer;
  font-size: 15px;
}
.path-icon:hover { color: #409eff; }

.card-alert {
  margin-bottom: 12px;
}

/* Info grid: two-row layout */
.info-grid {
  margin-bottom: 14px;
}

.info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  padding: 4px 8px;
  font-size: 13px;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
}
.info-row:first-child {
  border-bottom: 1px solid #e4e7ed;
}

.info-field {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}
.info-field label {
  color: #909399;
  white-space: nowrap;
  flex-shrink: 0;
}
.info-field > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ip-field { flex: 0 0 32%; }
.pid-field { flex: 0 0 17%; }
.instance-field { flex: 1 1 auto; min-width: 120px; }
.code-field { flex: 0 0 13%; }
.status-field { flex: 0 0 27%; }
.time-field { flex: 0 0 28%; }

.time-text {
  white-space: nowrap;
}

.instance-id-wrap {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
}
.instance-id-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.copy-instance-btn {
  padding: 0 2px;
  height: 20px;
  flex-shrink: 0;
}

/* Responsive: row 2 wraps to 2+2 on narrow cards */
@media (max-width: 550px) {
  .time-field {
    flex: 0 0 40%;
  }
  .code-field {
    flex: 0 0 18%;
  }
  .status-field {
    flex: 0 0 35%;
  }
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

.detail-section {
  margin-bottom: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background-color: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.detail-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.detail-content {
  font-family: monospace, Consolas, "Courier New";
  font-size: 12px;
  line-height: 1.5;
  padding: 8px 12px;
  white-space: pre-wrap;
  word-break: break-all;
  color: #303133;
  background-color: #fff;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: default;
}
.detail-content.empty {
  color: #c0c4cc;
  -webkit-line-clamp: unset;
  display: block;
}

.detail-popover-content {
  font-family: monospace, Consolas, "Courier New";
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 450px;
  overflow-y: auto;
}

.jobs-section {
  margin-top: 4px;
}

.jobs-title {
  font-size: 13px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
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
  color: #909399;
  cursor: pointer;
}
.path-icon-small:hover { color: #409eff; }
</style>
