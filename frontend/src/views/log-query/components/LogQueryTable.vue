<template>
  <div class="table-region">
    <div v-if="error" class="table-error" role="alert">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ error }}</span>
    </div>
    <div class="table-wrap">
      <div v-if="queryStatus === 'NOT_QUERIED'" class="table-guide" role="status">
        <p class="guide-main">正确日志数据量较大，请设置查询条件后点击"查询"</p>
        <p class="guide-hint">默认查询时间为当天。缩小时间范围或指定数据源、表名可提高查询速度。</p>
      </div>
      <el-table
        v-else
        :data="items"
        size="small"
        border
        height="100%"
        :empty-text="emptyText"
        row-key="cdcLogId"
      >
        <el-table-column label="源库" width="160" fixed="left">
          <template #default="{ row }">
            <el-tooltip
              v-if="dsCell(row, 'sourceDataSourceName', 'sourceDataSourceId') !== '--'"
              :content="dsTooltip(row, 'sourceDataSourceName', 'sourceDataSourceId')"
              placement="top"
              :show-after="200"
            >
              <span class="cell-ellipsis">{{ dsCell(row, 'sourceDataSourceName', 'sourceDataSourceId') }}</span>
            </el-tooltip>
            <span v-else class="cell-muted">--</span>
          </template>
        </el-table-column>

        <el-table-column label="源表名" width="220" fixed="left">
          <template #default="{ row }">
            <el-tooltip v-if="row.sourceTableName" :content="row.sourceTableName" placement="top" :show-after="200">
              <span class="cell-ellipsis">{{ row.sourceTableName }}</span>
            </el-tooltip>
            <span v-else class="cell-muted">--</span>
          </template>
        </el-table-column>

        <el-table-column label="目标库" min-width="160">
          <template #default="{ row }">
            <el-tooltip
              v-if="dsCell(row, 'targetDataSourceName', 'targetDataSourceId') !== '--'"
              :content="dsTooltip(row, 'targetDataSourceName', 'targetDataSourceId')"
              placement="top"
              :show-after="200"
            >
              <span class="cell-ellipsis">{{ dsCell(row, 'targetDataSourceName', 'targetDataSourceId') }}</span>
            </el-tooltip>
            <span v-else class="cell-muted">--</span>
          </template>
        </el-table-column>

        <el-table-column label="目标表名" min-width="220">
          <template #default="{ row }">
            <el-tooltip v-if="row.targetTableName" :content="row.targetTableName" placement="top" :show-after="200">
              <span class="cell-ellipsis">{{ row.targetTableName }}</span>
            </el-tooltip>
            <span v-else class="cell-muted">--</span>
          </template>
        </el-table-column>

        <el-table-column label="指令类型" min-width="90" align="center">
          <template #default="{ row }">{{ row.instructionType || '--' }}</template>
        </el-table-column>

        <el-table-column label="日志摘要" min-width="260">
          <template #default="{ row }">
            <span class="cell-ellipsis">{{ row.logSummary || '--' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="偏移量" min-width="120" align="right">
          <template #default="{ row }">{{ row.offset || '--' }}</template>
        </el-table-column>

        <el-table-column label="采集时间" min-width="170">
          <template #default="{ row }">{{ row.sourceTime || '--' }}</template>
        </el-table-column>

        <el-table-column label="进入链路时间" min-width="170">
          <template #default="{ row }">{{ row.kafkaEnqueueTime || '--' }}</template>
        </el-table-column>

        <el-table-column label="同步到目标表时间" min-width="180">
          <template #default="{ row }">{{ row.targetTime || '--' }}</template>
        </el-table-column>

        <el-table-column label="日志落盘时间" min-width="170">
          <template #default="{ row }">{{ row.insertTime || '--' }}</template>
        </el-table-column>

        <el-table-column label="操作" width="190" fixed="right">
          <template #default="{ row }">
            <div class="op-cell">
              <el-tooltip v-if="!row.hasLogDetail" content="暂无日志详情" placement="top">
                <span class="op-btn-wrap">
                  <el-button size="small" disabled>日志详情</el-button>
                </span>
              </el-tooltip>
              <el-button v-else size="small" type="primary" plain @click="$emit('detail', row)">日志详情</el-button>
              <el-tooltip v-if="!row.hasRawMessage" content="暂无原始消息" placement="top">
                <span class="op-btn-wrap">
                  <el-button size="small" disabled>原始消息</el-button>
                </span>
              </el-tooltip>
              <el-button v-else size="small" type="primary" plain @click="$emit('raw', row)">原始消息</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="loading" class="table-mask">
        <div class="mask-content">
          <el-icon class="is-loading" :size="26"><Loading /></el-icon>
          <p class="mask-text">{{ loadingText }}</p>
          <p class="mask-elapsed">
            已等待 {{ elapsed }} 秒<template v-if="elapsed > 3">，查询耗时较长，请耐心等待</template>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loading, WarningFilled } from '@element-plus/icons-vue'
import type { LogListVO, LogType } from '@/types/logQuery'
import type { LogQueryTabStatus } from '../composables/useLogQueryTab'
import { dsCellText, dsTooltipText } from './dsDisplay'

defineOptions({ name: 'LogQueryTable' })

const props = defineProps<{
  logType: LogType
  items: LogListVO[]
  loading: boolean
  error: string | null
  elapsed: number
  /** 每 Tab 推导查询状态（LQ-UI-140 修订）：NOT_QUERIED 显示引导，SUCCESS_EMPTY 显示"暂无数据" */
  queryStatus: LogQueryTabStatus
}>()

defineEmits<{
  detail: [row: LogListVO]
  raw: [row: LogListVO]
}>()

const loadingText = computed(() =>
  `正在查询${props.logType === 'error' ? '错误' : '正确'}日志，请稍候`,
)

const emptyText = computed(() => {
  if (props.error) return ''
  return props.queryStatus === 'SUCCESS_EMPTY' ? '当前查询条件下暂无日志' : ''
})

type NameField = 'sourceDataSourceName' | 'targetDataSourceName'
type IdField = 'sourceDataSourceId' | 'targetDataSourceId'

/**
 * 数据源名称降级展示（LQ-UI-183 / LQ-API-64 / LQ-DESIGN-180）：
 * 复用 dsDisplay 统一四态规则，名称等于 ID 视为名称缺失，不出现 `ID（ID）`。
 */
function dsCell(row: LogListVO, nameField: NameField, idField: IdField): string {
  return dsCellText(row[nameField], row[idField])
}

function dsTooltip(row: LogListVO, nameField: NameField, idField: IdField): string {
  return dsTooltipText(row[nameField], row[idField])
}
</script>

<style scoped>
.table-region {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.table-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-bottom: 8px;
  font-size: 13px;
  color: #f56c6c;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 6px;
  flex-shrink: 0;
}

.table-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
}

.table-guide {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
}

.guide-main {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #606266;
}

.guide-hint {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.table-mask {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
}

.mask-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #409eff;
}

.mask-text {
  margin: 0;
  font-size: 13px;
  color: #606266;
}

.mask-elapsed {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.cell-ellipsis {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-muted {
  color: #c0c4cc;
}

.op-cell {
  display: flex;
  gap: 8px;
  align-items: center;
}

.op-btn-wrap {
  display: inline-block;
}
</style>
