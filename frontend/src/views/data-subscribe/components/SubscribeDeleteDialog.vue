<template>
  <el-dialog
    v-model="visible"
    title="删除确认"
    width="620px"
    destroy-on-close
    :close-on-click-modal="false"
    append-to-body
    class="subscribe-delete-dialog"
  >
    <div v-if="loading" v-loading="true" class="sd-loading"></div>
    <div v-else-if="error" class="sd-error">
      <el-alert type="error" :closable="false" :title="error" show-icon />
      <el-button class="sd-retry" @click="load">重试</el-button>
    </div>
    <div v-else-if="preview" class="sd-body">
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="数据库记录物理删除且无法恢复"
        class="sd-irrecoverable"
      />
      <el-descriptions :column="1" border>
        <el-descriptions-item label="订阅描述">{{ preview.dataSubDesc }}</el-descriptions-item>
        <el-descriptions-item label="源库">
          <span>{{ describeRef(preview.source) }}</span>
          <span class="ref-id">{{ preview.source.dataSourceId }}</span>
          <el-tag v-if="refStatusLabel(preview.source.status)" size="small" type="warning">
            {{ refStatusLabel(preview.source.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="Schema 数">{{ preview.schemaCount }}</el-descriptions-item>
        <el-descriptions-item label="表数">{{ preview.tableCount }}</el-descriptions-item>
        <el-descriptions-item label="目标库">
          <div class="sd-targets">
            <div v-for="target in preview.targets" :key="target.dataSourceId" class="sd-target">
              <span>{{ describeRef(target) }}</span>
              <span class="ref-id">{{ target.dataSourceId }}</span>
            </div>
          </div>
        </el-descriptions-item>
      </el-descriptions>
      <div v-if="preview.warnings.length > 0" class="sd-warnings">
        <div v-for="(w, i) in preview.warnings" :key="i" class="sd-warning-item">警告：{{ w }}</div>
      </div>
      <div class="sd-restart-note">当前运行中的同步任务不会立即停止，需要重启相关 sync-client 后生效。</div>
    </div>

    <template #footer>
      <el-button :disabled="deleting" @click="close">取消</el-button>
      <el-button
        type="danger"
        :loading="deleting"
        :disabled="loading || !!error || !preview"
        @click="confirmDelete"
      >
        确认删除
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { deleteSubscription, fetchSubscriptionDeletePreview } from '@/api/subscription'
import type { SubscriptionDeletePreviewVO } from '@/types/subscription'
import { describeRef, refStatusLabel } from '../utils/subscriptionFormat'

const props = defineProps<{
  modelValue: boolean
  dataSubId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'deleted', success: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const preview = ref<SubscriptionDeletePreviewVO | null>(null)
const loading = ref(false)
const deleting = ref(false)
const error = ref<string | null>(null)

async function load() {
  if (!props.dataSubId) return
  loading.value = true
  error.value = null
  try {
    const res = await fetchSubscriptionDeletePreview(props.dataSubId)
    if (res.code === 200) {
      preview.value = res.data
    } else {
      error.value = res.message
    }
  } catch (e) {
    error.value = e && typeof e === 'object' && 'message' in e
      ? (e as { message?: string }).message ?? '加载失败'
      : '加载失败'
  } finally {
    loading.value = false
  }
}

function close() {
  visible.value = false
}

async function confirmDelete() {
  if (!props.dataSubId || deleting.value) return
  deleting.value = true
  try {
    const res = await deleteSubscription(props.dataSubId)
    if (res.code === 200) {
      emit('deleted', true)
      close()
    } else if (res.code === 40430) {
      ElMessage.warning(res.message)
      emit('deleted', false)
      close()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    const message = e && typeof e === 'object' && 'message' in e
      ? (e as { message?: string }).message ?? '删除失败'
      : '删除失败'
    ElMessage.error(message)
  } finally {
    deleting.value = false
  }
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      preview.value = null
      error.value = null
      load()
    }
  },
)
</script>

<style scoped>
.sd-loading {
  min-height: 120px;
}
.sd-error {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}
.sd-body {
  max-height: 60vh;
  overflow: auto;
  padding-right: 4px;
}
.sd-irrecoverable {
  margin-bottom: 12px;
}
.ref-id {
  margin-left: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.sd-targets {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.sd-warnings {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sd-warning-item {
  font-size: 12px;
  color: var(--el-color-warning-dark-2);
  background: var(--el-color-warning-light-9);
  border-radius: 4px;
  padding: 6px 8px;
}
.sd-restart-note {
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
