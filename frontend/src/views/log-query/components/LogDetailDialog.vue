<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="日志详情"
    width="800px"
    top="5vh"
    destroy-on-close
  >
    <div v-if="loading" class="dialog-state">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <p>正在加载日志详情…</p>
    </div>
    <div v-else-if="error" class="dialog-state">
      <el-icon class="state-icon"><WarningFilled /></el-icon>
      <p class="state-text">{{ error }}</p>
      <el-button size="small" type="primary" @click="load">重试</el-button>
    </div>
    <template v-else-if="detail">
      <el-descriptions :column="2" size="small" border class="detail-desc">
        <el-descriptions-item label="CDC 日志 ID">{{ detail.cdcLogId || '--' }}</el-descriptions-item>
        <el-descriptions-item label="指令类型">{{ field(detail.instructionType, row?.instructionType) }}</el-descriptions-item>
        <el-descriptions-item label="源库">{{ sourceNameText }}</el-descriptions-item>
        <el-descriptions-item label="源表名">{{ field(detail.sourceTableName, row?.sourceTableName) }}</el-descriptions-item>
        <el-descriptions-item label="目标库">{{ targetNameText }}</el-descriptions-item>
        <el-descriptions-item label="目标表名">{{ field(detail.targetTableName, row?.targetTableName) }}</el-descriptions-item>
        <el-descriptions-item label="结果码">{{ field(detail.resultCode) }}</el-descriptions-item>
        <el-descriptions-item label="Kafka 偏移量">{{ field(detail.offset, row?.offset) }}</el-descriptions-item>
        <el-descriptions-item label="采集时间">{{ field(detail.sourceTime, row?.sourceTime) }}</el-descriptions-item>
        <el-descriptions-item label="进入链路时间">{{ field(detail.kafkaEnqueueTime, row?.kafkaEnqueueTime) }}</el-descriptions-item>
        <el-descriptions-item label="同步到目标表时间">{{ field(detail.targetTime, row?.targetTime) }}</el-descriptions-item>
        <el-descriptions-item label="日志落盘时间">{{ field(detail.insertTime, row?.insertTime) }}</el-descriptions-item>
      </el-descriptions>
      <div class="detail-block">
        <div class="detail-block-title">完整日志</div>
        <pre v-if="detail.logDetail" class="detail-pre">{{ detail.logDetail }}</pre>
        <span v-else class="cell-muted">--</span>
      </div>
    </template>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
      <el-button v-if="detail?.logDetail" type="primary" @click="copyDetail">复制</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, WarningFilled } from '@element-plus/icons-vue'
import { fetchLogDetail } from '@/api/logQuery'
import type { LogDetailVO, LogListVO, LogType } from '@/types/logQuery'
import { resolveBusinessError, resolveHttpError } from '../composables/useLogQueryTab'
import { dsDetailText } from './dsDisplay'

defineOptions({ name: 'LogDetailDialog' })

const props = defineProps<{
  visible: boolean
  logType: LogType | null
  row: LogListVO | null
}>()

defineEmits<{
  'update:visible': [val: boolean]
}>()

const detail = ref<LogDetailVO | null>(null)
const loading = ref(false)
const error = ref('')
let requestSeq = 0

function field(...vals: (string | undefined | null)[]): string {
  for (const v of vals) {
    if (v) return v
  }
  return '--'
}

const sourceNameText = computed(() => dsNameText(props.row, 'sourceDataSourceName', 'sourceDataSourceId'))
const targetNameText = computed(() => dsNameText(props.row, 'targetDataSourceName', 'targetDataSourceId'))

function dsNameText(
  row: LogListVO | null,
  nameField: 'sourceDataSourceName' | 'targetDataSourceName',
  idField: 'sourceDataSourceId' | 'targetDataSourceId',
): string {
  if (!row) return '--'
  return dsDetailText(row[nameField], row[idField])
}

async function load() {
  if (!props.logType || !props.row) return
  const seq = ++requestSeq
  loading.value = true
  error.value = ''
  try {
    const res = await fetchLogDetail(props.logType, props.row.cdcLogId)
    if (seq !== requestSeq) return
    if (res.code === 200) {
      detail.value = res.data
    } else {
      error.value = resolveBusinessError(res.code, res.message)
    }
  } catch (e) {
    if (seq !== requestSeq) return
    error.value = resolveHttpError(e)
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

async function copyDetail() {
  if (!detail.value?.logDetail) return
  try {
    await navigator.clipboard.writeText(detail.value.logDetail)
    ElMessage.success('已复制')
  } catch {
    ElMessage.warning('复制失败')
  }
}

watch(
  () => props.visible,
  (v) => {
    if (v) {
      detail.value = null
      error.value = ''
      load()
    } else {
      requestSeq += 1
      detail.value = null
      error.value = ''
    }
  },
)
</script>

<style scoped>
.dialog-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 0;
  color: #909399;
  gap: 8px;
}

.state-icon {
  font-size: 22px;
  color: #f56c6c;
}

.state-text {
  margin: 0;
  font-size: 13px;
  color: #606266;
}

.detail-desc {
  margin-bottom: 16px;
}

.detail-block-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 600;
}

.detail-pre {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 16px;
  max-height: 420px;
  overflow: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.cell-muted {
  color: #c0c4cc;
}
</style>
