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

    <!-- Summary info rows -->
    <div class="summary-info">
      <div class="info-row">
        <span class="info-item"><label>IP:</label> {{ client.ip || '—' }}</span>
        <span class="info-item"><label>状态码:</label> {{ client.statusCode || '—' }}</span>
        <span class="info-item"><label>状态:</label> {{ client.statusMessage || '—' }}</span>
        <span class="info-item"><label>更新时间:</label> {{ client.updateTime || '—' }}</span>
      </div>
      <div class="info-row">
        <span class="info-item"><label>PID:</label> {{ client.pid }}</span>
        <span class="info-item"><label>实例ID:</label> {{ client.instanceId }}</span>
        <span class="info-item"><label>启动时间:</label> {{ client.startTime }}</span>
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
      <div class="detail-content" :class="{ empty: !client.detailInfo }">
        {{ client.detailInfo || '(无详细信息)' }}
      </div>
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
          <el-table-column label="任务名称" min-width="160">
            <template #default="{ row }">
              <span class="job-name-cell">
                {{ row.jobName }}
                <el-tooltip :content="row.jobPath" placement="top" :show-after="500">
                  <el-icon class="path-icon-small"><InfoFilled /></el-icon>
                </el-tooltip>
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="statusCode" label="状态码" width="100" />
          <el-table-column prop="statusMessage" label="状态描述" min-width="140" />
          <el-table-column prop="scn" label="SCN" min-width="160">
            <template #default="{ row }">
              {{ row.scn || '' }}
            </template>
          </el-table-column>
          <el-table-column prop="scnUpdateTime" label="SCN 更新时间" min-width="170">
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
.client-card {
  margin-bottom: 16px;
  border-left: 4px solid #52c41a;
  transition: border-color 0.3s;
}
.client-card.offline {
  border-left: 4px solid #bfbfbf;
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
.online-dot.offline { background-color: #bfbfbf; }

.online-text {
  color: #52c41a;
  font-size: 13px;
}
.offline .online-text {
  color: #bfbfbf;
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

.summary-info {
  margin-bottom: 16px;
  font-size: 13px;
  color: #606266;
}

.info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 24px;
  margin-bottom: 4px;
}

.info-item label {
  color: #909399;
  margin-right: 4px;
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
  height: calc(6 * 1.5em);
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  color: #303133;
  background-color: #fff;
}
.detail-content.empty {
  color: #c0c4cc;
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
}

.path-icon-small {
  font-size: 13px;
  color: #909399;
  cursor: pointer;
}
.path-icon-small:hover { color: #409eff; }
</style>
