<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="dialogTitle"
    width="800px"
    top="5vh"
    destroy-on-close
  >
    <div v-if="loading" class="clob-state">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <p>正在加载...</p>
    </div>
    <div v-else-if="errorMsg" class="clob-state">
      <el-empty :description="errorMsg" :image-size="60" />
    </div>
    <div v-else-if="clobData && !clobData.content" class="clob-state">
      <el-empty description="无详细内容" :image-size="60" />
    </div>
    <div v-else-if="clobData" class="clob-content-wrap">
      <div class="clob-meta">
        <span>记录类型: {{ clobData.recordType }}</span>
        <span>记录 ID: {{ clobData.recordIdText ?? props.recordId }}</span>
        <span>长度: {{ clobData.contentLength }}</span>
        <el-tag v-if="clobData.truncated" type="warning" size="small">已截断</el-tag>
      </div>
      <pre class="clob-pre">{{ clobData.content }}</pre>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">关闭</el-button>
      <el-button
        v-if="clobData?.content"
        type="primary"
        @click="copyContent"
      >复制</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchClobDetail } from '@/api/jobFailure'
import type { ClobDetailVO } from '@/types/jobFailure'

const props = defineProps<{
  visible: boolean
  faultRootId: string | null
  clobField: string
  recordId: string | null
}>()

defineEmits<{ 'update:visible': [val: boolean] }>()

const clobData = ref<ClobDetailVO | null>(null)
const loading = ref(false)
const errorMsg = ref('')

const dialogTitle = computed(() => {
  if (props.clobField === 'FAILURE_EVENT_FAILURE_DETAIL') {
    return `故障详情 — 事件 ${props.recordId ?? '--'}`
  }
  return `错误详情 — 日志 ${props.recordId ?? '--'}`
})

async function load() {
  if (!props.faultRootId || !props.recordId) return
  loading.value = true
  errorMsg.value = ''
  clobData.value = null
  try {
    const res = await fetchClobDetail(props.faultRootId, props.clobField, props.recordId)
    if (res.code === 200) {
      clobData.value = res.data
    } else {
      errorMsg.value = res.message || '加载失败'
    }
  } catch {
    errorMsg.value = '网络请求失败'
  } finally {
    loading.value = false
  }
}

async function copyContent() {
  if (!clobData.value?.content) return
  try {
    await navigator.clipboard.writeText(clobData.value.content)
    ElMessage.success('已复制')
  } catch {
    ElMessage.warning('复制失败')
  }
}

watch(() => props.visible, (v) => {
  if (v) load()
})
</script>

<style scoped>
.clob-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
  color: #909399;
}
.clob-content-wrap { }
.clob-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}
.clob-pre {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 16px;
  max-height: 500px;
  overflow: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}
</style>
