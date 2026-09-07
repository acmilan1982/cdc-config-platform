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

      <!-- 探针端列：只显示原始 CLIENT_ID，单行省略；完整 CLIENT_DESC 走页面级单实例 Tooltip -->
      <el-table-column label="探针端" width="170" align="left">
        <template #default="{ row }">
          <div class="dss-cell">
            <span
              class="dss-cell-main dss-tt"
              :data-tt-kind="`client-desc-${rowKey(row)}`"
              @mouseenter="onProbeMainEnter(row, $event)"
              @mouseleave="tooltip.hide()"
            >{{ row.clientId }}</span>
            <span
              v-for="h in clientHintTriggers(row)"
              :key="h.key"
              class="dss-tt dss-hint"
              :data-tt-kind="h.key"
              @mouseenter="onHintEnter(h, $event)"
              @mouseleave="tooltip.hide()"
            >
              <el-icon class="dss-hint-icon" role="img" :aria-label="h.text"><WarningFilled /></el-icon>
            </span>
          </div>
        </template>
      </el-table-column>

      <!-- 源库列：正常 ORG 非空只显示 ORG；ORG 空/配置缺失回退原始 DATA_SOURCE_ID -->
      <el-table-column label="源库" width="280" align="left">
        <template #default="{ row }">
          <div class="dss-cell">
            <span
              class="dss-cell-main dss-tt"
              :data-tt-kind="`source-main-${rowKey(row)}`"
              @mouseenter="onSourceMainEnter(row, $event)"
              @mouseleave="tooltip.hide()"
            >{{ sourceMainText(row) }}</span>
            <span
              v-for="h in sourceHintTriggers(row)"
              :key="h.key"
              class="dss-tt dss-hint"
              :data-tt-kind="h.key"
              @mouseenter="onHintEnter(h, $event)"
              @mouseleave="tooltip.hide()"
            >
              <el-icon class="dss-hint-icon" role="img" :aria-label="h.text"><WarningFilled /></el-icon>
            </span>
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
import { WarningFilled } from '@element-plus/icons-vue'
import type { SnapshotStatusItem } from '@/types/dataSourceSnapshot'
import { rowKey } from '@/views/data-source-run-state/utils/rowKey'
import { formatTimeOrDash } from '@/views/data-source-run-state/utils/format'
import DataSourceSnapshotStatusTag from './DataSourceSnapshotStatusTag.vue'
import SnapshotTooltipHost from '../tooltip/SnapshotTooltipHost.vue'
import { useSnapshotTooltip } from '../tooltip/useSnapshotTooltip'
import type { ShowTooltipOptions } from '../tooltip/useSnapshotTooltip'

interface Hint {
  text: string
}

interface HintTrigger {
  text: string
  key: string
}

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

function clientDescText(row: SnapshotStatusItem): string {
  const desc = row.clientRef.desc
  return desc === null || desc === undefined ? '' : desc.trim()
}

function clientHints(row: SnapshotStatusItem): Hint[] {
  const state = row.clientRef.state
  if (state === 'NOT_FOUND') return [{ text: '探针端配置缺失' }]
  if (state === 'INACTIVE') return [{ text: '配置已停用' }]
  return []
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

/** 源库列 Tooltip：正常行只展示完整 ORG；回退行展示完整原始 ID 与对应异常说明（DSS-REQ-069⑤⑥，AC-075）。 */
function sourceMainContent(row: SnapshotStatusItem): string {
  if (sourceShowsOrg(row)) return sourceOrgText(row)
  const lines = [row.sourceId]
  for (const h of sourceHints(row)) lines.push(h.text)
  return lines.join('\n')
}

function openTooltip(opts: ShowTooltipOptions): void {
  tooltip.show(opts)
}

function onProbeMainEnter(row: SnapshotStatusItem, e: MouseEvent): void {
  openTooltip({ key: `client-${rowKey(row)}`, content: clientDescText(row), el: e.currentTarget as HTMLElement })
}

function onSourceMainEnter(row: SnapshotStatusItem, e: MouseEvent): void {
  openTooltip({ key: `source-${rowKey(row)}`, content: sourceMainContent(row), el: e.currentTarget as HTMLElement })
}

function onStatusEnter(row: SnapshotStatusItem, e: MouseEvent): void {
  openTooltip({
    key: `status-${rowKey(row)}`,
    content: `原始状态：${row.snapshotStatus}`,
    el: e.currentTarget as HTMLElement,
  })
}

function onHintEnter(h: HintTrigger, e: MouseEvent): void {
  openTooltip({ key: h.key, content: h.text, el: e.currentTarget as HTMLElement })
}

function clientHintTriggers(row: SnapshotStatusItem): HintTrigger[] {
  return clientHints(row).map((h, i) => ({ text: h.text, key: `client-hint-${rowKey(row)}-${i}` }))
}

function sourceHintTriggers(row: SnapshotStatusItem): HintTrigger[] {
  return sourceHints(row).map((h, i) => ({ text: h.text, key: `source-hint-${rowKey(row)}-${i}` }))
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
/* 七列固定列宽（DSS-REQ-069/AC-073）：70+170+280+130+165+165+165=1145 */
.dss-table {
  width: 1145px !important;
  min-width: 1145px !important;
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
.dss-hint {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
}
.dss-hint-icon {
  font-size: 14px;
  color: #e6a23c;
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
