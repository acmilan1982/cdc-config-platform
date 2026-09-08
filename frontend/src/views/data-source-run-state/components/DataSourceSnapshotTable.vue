<template>
  <div class="dss-table-wrap">
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

      <!-- 探针端列（弹性列，min-width:170）：始终显示原始 CLIENT_ID；非启用(FG_ACTIVE≠'1')追加红字“停用”；完整非空 CLIENT_DESC 走页面级单实例 Tooltip -->
      <el-table-column label="探针端" min-width="170" align="left">
        <template #default="{ row }">
          <div class="dss-cell">
            <span
              class="dss-cell-main dss-tt"
              :data-tt-kind="`client-desc-${rowKey(row)}`"
              @mouseenter="onProbeMainEnter(row, $event)"
              @mouseleave="tooltip.hide()"
            >{{ row.clientId }}</span>
            <span v-if="isProbeInactive(row)" class="dss-inactive-mark">停用</span>
          </div>
        </template>
      </el-table-column>

      <!-- 源库列（弹性列，min-width:280）：正常 ORG 非空只显示 ORG；ORG 空/配置缺失回退原始 DATA_SOURCE_ID；Tooltip 恒为完整原始 DATA_SOURCE_ID -->
      <el-table-column label="源库" min-width="280" align="left">
        <template #default="{ row }">
          <div class="dss-cell">
            <span
              class="dss-cell-main dss-tt"
              :data-tt-kind="`source-main-${rowKey(row)}`"
              @mouseenter="onSourceMainEnter(row, $event)"
              @mouseleave="tooltip.hide()"
            >{{ sourceMainText(row) }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="快照状态" width="130" align="center">
        <template #default="{ row }">
          <span
            class="dss-tt dss-status-trigger"
            :data-tt-kind="`status-${rowKey(row)}`"
            @mouseenter="onStatusEnter(row, $event)"
            @mouseleave="tooltip.hide()"
          >
            <DataSourceSnapshotStatusTag :status-category="row.statusCategory" />
          </span>
        </template>
      </el-table-column>

      <el-table-column label="快照启动时间" width="165" align="left">
        <template #default="{ row }">
          <span class="dss-time" :class="{ 'dss-time-dash': isDash(row.snapshotLastSeenAt) }">
            {{ formatTime(row.snapshotLastSeenAt) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="快照完成时间" width="165" align="left">
        <template #default="{ row }">
          <span class="dss-time" :class="{ 'dss-time-dash': isDash(row.snapshotCompletedAt) }">
            {{ formatTime(row.snapshotCompletedAt) }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="记录更新时间" width="165" align="left">
        <template #default="{ row }">
          <span class="dss-time" :class="{ 'dss-time-dash': isDash(row.updatedAt) }">
            {{ formatTime(row.updatedAt) }}
          </span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 页面级单实例 Tooltip Host：页面唯一表格 → 任意时刻最多 1 个 Tooltip -->
    <SnapshotTooltipHost :target="ttCurrent" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import type { SnapshotStatusItem } from '@/types/dataSourceSnapshot'
import { rowKey } from '@/views/data-source-run-state/utils/rowKey'
import { formatTimeOrDash } from '@/views/data-source-run-state/utils/format'
import DataSourceSnapshotStatusTag from './DataSourceSnapshotStatusTag.vue'
import SnapshotTooltipHost from '../tooltip/SnapshotTooltipHost.vue'
import { useSnapshotTooltip } from '../tooltip/useSnapshotTooltip'
import type { ShowTooltipOptions } from '../tooltip/useSnapshotTooltip'

const props = withDefaults(
  defineProps<{
    records: SnapshotStatusItem[]
    /** 整表 loading：仅 initial 首载在途（DSS-REQ-071①，query 不遮罩表格）。 */
    loading: boolean
    emptyText?: string
  }>(),
  { emptyText: '暂无数据' },
)

const tooltip = useSnapshotTooltip()
// 顶层 ref 绑定在模板自动解包：将 tooltip.current 解出为顶层 ref，Host :target 才收到真实状态（而非 Ref 本体）
const ttCurrent = tooltip.current

function formatTime(value: string | null): string {
  return formatTimeOrDash(value)
}

function isDash(value: string | null): boolean {
  return value === null || value === undefined || value === ''
}

/** 探针端非启用（FG_ACTIVE≠'1'）时在 CLIENT_ID 后追加红字"停用"（DSS-REQ-073，AC-082）。 */
function isProbeInactive(row: SnapshotStatusItem): boolean {
  return row.clientRef.state === 'INACTIVE'
}

function clientDescText(row: SnapshotStatusItem): string {
  const desc = row.clientRef.desc
  return desc === null || desc === undefined ? '' : desc.trim()
}

function sourceOrgText(row: SnapshotStatusItem): string {
  const org = row.sourceRef.org
  return org === null || org === undefined ? '' : org.trim()
}

function sourceShowsOrg(row: SnapshotStatusItem): boolean {
  return sourceOrgText(row).length > 0
}

function sourceMainText(row: SnapshotStatusItem): string {
  return sourceShowsOrg(row) ? sourceOrgText(row) : row.sourceId
}

function openTooltip(opts: ShowTooltipOptions): void {
  tooltip.show(opts)
}

function onProbeMainEnter(row: SnapshotStatusItem, e: MouseEvent): void {
  openTooltip({ key: `client-${rowKey(row)}`, content: clientDescText(row), el: e.currentTarget as HTMLElement })
}

/** 源库列 Tooltip 恒为完整原始 DATA_SOURCE_ID（正常行与回退行同源，DSS-REQ-074，AC-075）。 */
function onSourceMainEnter(row: SnapshotStatusItem, e: MouseEvent): void {
  openTooltip({ key: `source-${rowKey(row)}`, content: row.sourceId, el: e.currentTarget as HTMLElement })
}

function onStatusEnter(row: SnapshotStatusItem, e: MouseEvent): void {
  openTooltip({
    key: `status-${rowKey(row)}`,
    content: `原始状态：${row.snapshotStatus}`,
    el: e.currentTarget as HTMLElement,
  })
}

let unbindGlobalClose: (() => void) | null = null

onMounted(() => {
  unbindGlobalClose = tooltip.bindGlobalClose()
})

onUnmounted(() => {
  if (unbindGlobalClose) unbindGlobalClose()
  tooltip.destroy()
})

/** 表格数据替换（records 变化）关闭 Tooltip（DSS-REQ-070②，AC-076）。 */
watch(
  () => props.records,
  () => tooltip.hide(),
)
</script>

<style scoped>
.dss-table-wrap {
  width: 100%;
  overflow-x: auto;
}
/* 弹性表格（DSS-REQ-069/AC-073）：五固定列（70/130/165/165/165）＋探针端 min-width 170/源库 min-width 280 两弹性列吸收剩余宽度铺满结果卡片；取消固定总宽，最小总宽 1145、窄屏容器横向滚动 */
.dss-table {
  width: 100%;
  min-width: 1145px;
}
.dss-seq {
  font-size: 14px;
  color: #606266;
  font-variant-numeric: tabular-nums;
}
.dss-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  line-height: 1.5;
}
.dss-cell-main {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #303133;
  font-size: 14px;
}
.dss-tt {
  outline: none;
}
.dss-inactive-mark {
  flex: 0 0 auto;
  font-size: 14px;
  color: var(--el-color-danger, #f56c6c);
  white-space: nowrap;
}
.dss-status-trigger {
  display: inline-block;
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
