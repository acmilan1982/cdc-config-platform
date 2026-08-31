<template>
  <el-dialog
    v-model="visible"
    title="订阅详情"
    width="680px"
    destroy-on-close
    :close-on-click-modal="false"
    append-to-body
    class="subscribe-detail-dialog"
  >
    <div v-if="loading" v-loading="true" class="sd-loading"></div>
    <div v-else-if="error" class="sd-error">
      <el-alert type="error" :closable="false" :title="error" show-icon />
      <el-button class="sd-retry" @click="load">重试</el-button>
    </div>
    <div v-else-if="detail" class="sd-body">
      <div class="sd-section-title">基本信息</div>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="订阅描述">{{ detail.dataSubDesc }}</el-descriptions-item>
        <el-descriptions-item label="订阅ID">{{ detail.dataSubId }}</el-descriptions-item>
        <el-descriptions-item label="源库">
          <span>{{ describeRef(detail.source) }}</span>
          <span class="ref-id" :title="detail.source.dataSourceId">{{ detail.source.dataSourceId }}</span>
          <el-tag v-if="refStatusLabel(detail.source.status)" size="small" type="warning">
            {{ refStatusLabel(detail.source.status) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <div class="sd-section-title">源表</div>
      <div class="sd-table-zone">
        <div class="sd-table-group" v-for="group in detail.tablesBySchema" :key="group.schema">
          <div class="sd-table-schema">{{ group.schema }}</div>
          <div class="sd-table-tables">{{ group.tables.join('、') }}</div>
        </div>
        <div v-if="detail.rawUnparseableTables.length > 0" class="sd-unparseable">
          <div class="sd-unparseable-title">以下源表片段无法解析，可能存在历史格式异常：</div>
          <div class="sd-unparseable-list">{{ detail.rawUnparseableTables.join('、') }}</div>
        </div>
      </div>

      <div class="sd-section-title">目标库</div>
      <div class="sd-targets">
        <div v-for="target in detail.targets" :key="target.dataSourceId" class="sd-target">
          <span>{{ describeRef(target) }}</span>
          <span class="ref-id" :title="target.dataSourceId">{{ target.dataSourceId }}</span>
          <el-tag v-if="refStatusLabel(target.status)" size="small" type="warning">
            {{ refStatusLabel(target.status) }}
          </el-tag>
        </div>
      </div>

      <div class="sd-section-title">时间</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="创建时间">{{ detail.insertTime ?? '—' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detail.updateTime ?? '—' }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="detail.warnings.length > 0" class="sd-warnings">
        <div v-for="(w, i) in detail.warnings" :key="i" class="sd-warning-item">警告：{{ w }}</div>
      </div>
    </div>

    <template #footer>
      <el-button @click="close">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { fetchSubscriptionDetail } from '@/api/subscription'
import type { SubscriptionDetailVO } from '@/types/subscription'
import { describeRef, refStatusLabel } from '../utils/subscriptionFormat'

const props = defineProps<{
  modelValue: boolean
  dataSubId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const detail = ref<SubscriptionDetailVO | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function load() {
  if (!props.dataSubId) return
  loading.value = true
  error.value = null
  try {
    const res = await fetchSubscriptionDetail(props.dataSubId)
    if (res.code === 200) {
      detail.value = res.data
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

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      detail.value = null
      error.value = null
      load()
    }
  },
)
</script>

<style scoped>
.sd-loading {
  min-height: 200px;
}
.sd-error {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  min-height: 120px;
}
.sd-body {
  max-height: 60vh;
  overflow: auto;
  padding-right: 4px;
}
.sd-section-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--el-text-color-primary);
  margin: 14px 0 8px;
}
.sd-section-title:first-child {
  margin-top: 0;
}
.ref-id {
  margin-left: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.sd-table-zone {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px;
  max-height: 220px;
  overflow: auto;
}
.sd-table-group {
  margin-bottom: 8px;
}
.sd-table-schema {
  font-weight: 600;
  font-size: 13px;
}
.sd-table-tables {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  word-break: break-all;
}
.sd-unparseable {
  margin-top: 8px;
  padding: 8px;
  background: var(--el-color-warning-light-9);
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-color-warning-dark-2);
}
.sd-unparseable-title {
  font-weight: 600;
}
.sd-unparseable-list {
  margin-top: 4px;
  word-break: break-all;
}
.sd-targets {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}
.sd-target {
  display: flex;
  align-items: center;
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
</style>
