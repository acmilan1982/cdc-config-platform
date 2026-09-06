<template>
  <el-table
    :data="records"
    v-loading="loading"
    border
    class="dss-table"
    :empty-text="emptyText"
    :row-key="rowKey"
  >
    <el-table-column label="序号" width="70" align="center">
      <template #default="{ $index }">
        <span class="dss-seq">{{ $index + 1 }}</span>
      </template>
    </el-table-column>

    <el-table-column label="探针端" min-width="220">
      <template #default="{ row }">
        <div class="dss-cell">
          <span class="dss-cell-main" :title="row.clientId">{{ row.clientId }}</span>
          <span v-if="hasClientDesc(row)" class="dss-cell-sub">{{ row.clientRef.desc }}</span>
          <el-tooltip v-for="h in clientHints(row)" :key="h.text" :content="h.text" placement="top">
            <el-icon class="dss-hint-icon" role="img" :aria-label="h.text"><WarningFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="源库" min-width="240">
      <template #default="{ row }">
        <div class="dss-cell">
          <el-tooltip v-if="sourceOrgShown(row)" :content="row.sourceId" placement="top">
            <span class="dss-cell-main dss-cell-link">{{ sourceMainText(row) }}</span>
          </el-tooltip>
          <span v-else class="dss-cell-main" :title="row.sourceId">{{ sourceMainText(row) }}</span>
          <el-tooltip v-for="h in sourceHints(row)" :key="h.text" :content="h.text" placement="top">
            <el-icon class="dss-hint-icon" role="img" :aria-label="h.text"><WarningFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>
    </el-table-column>

    <el-table-column label="快照状态" width="150" align="center">
      <template #default="{ row }">
        <DataSourceSnapshotStatusTag :status-category="row.statusCategory" :snapshot-status="row.snapshotStatus" />
      </template>
    </el-table-column>

    <el-table-column label="快照启动时间" min-width="180">
      <template #default="{ row }">
        <span class="dss-time" :class="{ 'dss-time-dash': isDash(row.snapshotLastSeenAt) }">
          {{ formatTime(row.snapshotLastSeenAt) }}
        </span>
      </template>
    </el-table-column>

    <el-table-column label="快照完成时间" min-width="180">
      <template #default="{ row }">
        <span class="dss-time" :class="{ 'dss-time-dash': isDash(row.snapshotCompletedAt) }">
          {{ formatTime(row.snapshotCompletedAt) }}
        </span>
      </template>
    </el-table-column>

    <el-table-column label="记录更新时间" min-width="180">
      <template #default="{ row }">
        <span class="dss-time" :class="{ 'dss-time-dash': isDash(row.updatedAt) }">
          {{ formatTime(row.updatedAt) }}
        </span>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { WarningFilled } from '@element-plus/icons-vue'
import type { SnapshotStatusItem } from '@/types/dataSourceSnapshot'
import { rowKey } from '@/views/data-source-run-state/utils/rowKey'
import { formatTimeOrDash } from '@/views/data-source-run-state/utils/format'
import DataSourceSnapshotStatusTag from './DataSourceSnapshotStatusTag.vue'

interface Hint {
  text: string
}

const props = withDefaults(
  defineProps<{
    records: SnapshotStatusItem[]
    /** 整表大态 loading（kind=initial/retry/query 在途，UI §7.1）。 */
    loading: boolean
    emptyText?: string
  }>(),
  { emptyText: '暂无数据' },
)

function formatTime(value: string | null): string {
  return formatTimeOrDash(value)
}

function isDash(value: string | null): boolean {
  return value === null || value === undefined || value === ''
}

function hasClientDesc(row: SnapshotStatusItem): boolean {
  const desc = row.clientRef.desc
  return desc !== null && desc !== undefined && desc.trim().length > 0
}

function clientHints(row: SnapshotStatusItem): Hint[] {
  const state = row.clientRef.state
  if (state === 'NOT_FOUND') return [{ text: '探针端配置缺失' }]
  if (state === 'INACTIVE') return [{ text: '配置已停用' }]
  return []
}

function sourceOrgShown(row: SnapshotStatusItem): boolean {
  const org = row.sourceRef.org
  return org !== null && org !== undefined && org.trim().length > 0
}

function sourceMainText(row: SnapshotStatusItem): string {
  const org = row.sourceRef.org
  return org !== null && org !== undefined && org.trim().length > 0 ? org : row.sourceId
}

function sourceHints(row: SnapshotStatusItem): Hint[] {
  const ref = row.sourceRef
  const hints: Hint[] = []
  if (ref.state === 'NOT_FOUND') {
    hints.push({ text: '源库配置缺失' })
  } else if (ref.state === 'INACTIVE') {
    hints.push({ text: '配置已停用' })
  }
  if (ref.state !== 'NOT_FOUND' && !ref.sourceRole) {
    hints.push({ text: '类别非 SOURCE' })
  }
  return hints
}
</script>

<style scoped>
.dss-table {
  width: 100%;
}
.dss-seq {
  font-size: 14px;
  color: #606266;
  font-variant-numeric: tabular-nums;
}
.dss-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  line-height: 1.5;
}
.dss-cell-main {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #303133;
  font-size: 14px;
  min-width: 0;
}
.dss-cell-link {
  border-bottom: 1px dashed #c0c4cc;
  cursor: default;
}
.dss-cell-sub {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #909399;
  font-size: 13px;
  min-width: 0;
}
.dss-hint-icon {
  flex: 0 0 auto;
  font-size: 14px;
  color: #e6a23c;
}
.dss-time {
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.dss-time-dash {
  color: #c0c4cc;
}
:deep(.el-table__header th .cell) {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
</style>
