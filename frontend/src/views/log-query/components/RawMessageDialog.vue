<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="原始消息"
    width="800px"
    top="5vh"
    destroy-on-close
  >
    <div v-if="loading" class="dialog-state">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <p>正在加载原始消息…</p>
    </div>
    <div v-else-if="error" class="dialog-state">
      <el-icon class="state-icon"><WarningFilled /></el-icon>
      <p class="state-text">{{ error }}</p>
      <el-button size="small" type="primary" @click="load">重试</el-button>
    </div>
    <div v-else-if="!raw" class="dialog-state">
      <p>暂无原始消息</p>
    </div>
    <template v-else>
      <div class="raw-toolbar">
        <el-radio-group v-if="isJson" v-model="view" size="small">
          <el-radio-button value="raw">原文</el-radio-button>
          <el-radio-button value="formatted">格式化</el-radio-button>
        </el-radio-group>
      </div>
      <pre class="raw-pre">{{ displayText }}</pre>
    </template>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
      <el-button v-if="raw" type="primary" @click="copyRaw">复制原文</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, WarningFilled } from '@element-plus/icons-vue'
import { fetchRawMessage } from '@/api/logQuery'
import type { LogListVO, LogType } from '@/types/logQuery'
import { resolveBusinessError, resolveHttpError } from '../composables/useLogQueryTab'

defineOptions({ name: 'RawMessageDialog' })

const props = defineProps<{
  visible: boolean
  logType: LogType | null
  row: LogListVO | null
}>()

defineEmits<{
  'update:visible': [val: boolean]
}>()

const raw = ref('')
const loading = ref(false)
const error = ref('')
const view = ref<'raw' | 'formatted'>('raw')
let requestSeq = 0

const isJson = computed(() => {
  if (!raw.value) return false
  try {
    JSON.parse(raw.value)
    return true
  } catch {
    return false
  }
})

const formattedText = computed(() => {
  if (!isJson.value) return ''
  try {
    return JSON.stringify(JSON.parse(raw.value), null, 2)
  } catch {
    return ''
  }
})

const displayText = computed(() =>
  view.value === 'formatted' && isJson.value ? formattedText.value : raw.value,
)

async function load() {
  if (!props.logType || !props.row) return
  const seq = ++requestSeq
  loading.value = true
  error.value = ''
  try {
    const res = await fetchRawMessage(props.logType, props.row.cdcLogId)
    if (seq !== requestSeq) return
    if (res.code === 200) {
      raw.value = res.data.rawMessage ?? ''
      view.value = 'raw'
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

async function copyRaw() {
  if (!raw.value) return
  try {
    await navigator.clipboard.writeText(raw.value)
    ElMessage.success('已复制原文')
  } catch {
    ElMessage.warning('复制失败')
  }
}

watch(
  () => props.visible,
  (v) => {
    if (v) {
      raw.value = ''
      error.value = ''
      load()
    } else {
      requestSeq += 1
      raw.value = ''
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

.raw-toolbar {
  margin-bottom: 10px;
}

.raw-pre {
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
</style>
