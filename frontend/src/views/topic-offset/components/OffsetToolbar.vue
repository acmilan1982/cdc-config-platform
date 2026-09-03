<template>
  <div class="toff-toolbar">
    <div class="toff-toolbar-left">
      <span class="toff-stat toff-total">共 {{ total }} 条</span>
      <span v-if="unparseableTotal > 0" class="toff-stat toff-warn">
        <el-icon class="toff-warn-icon"><WarningFilled /></el-icon>
        <span>其中 {{ unparseableTotal }} 条 Topic 格式无法解析</span>
      </span>
    </div>
    <div class="toff-toolbar-right">
      <span class="toff-stat toff-auto">
        <span class="toff-dot" :class="{ 'is-refreshing': refreshing }" />
        60 秒自动刷新
      </span>
      <span v-if="lastRefreshText" class="toff-sep">|</span>
      <span v-if="lastRefreshText" class="toff-stat toff-last">最近成功刷新：{{ lastRefreshText }}</span>
      <span v-if="refreshError" class="toff-stat toff-error">{{ refreshError }}</span>
      <el-button type="primary" plain :loading="refreshing" :disabled="busy || refreshing" @click="$emit('refresh')">
        立即刷新
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { WarningFilled } from '@element-plus/icons-vue'

defineProps<{
  total: number
  unparseableTotal: number
  refreshing: boolean
  /** 任一请求进行中（含首次/查询/翻页整表 loading）时禁用“立即刷新”，避免请求重叠。 */
  busy?: boolean
  lastRefreshText: string | null
  refreshError: string
}>()

defineEmits<{
  (e: 'refresh'): void
}>()
</script>

<style scoped>
.toff-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin: 8px 0;
}
.toff-toolbar-left {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}
/* 右组作为一个完整逻辑组：内部禁止换行，必要时整组随外层工具栏换到下一行，不得把“立即刷新”单独挤到下一行。 */
.toff-toolbar-right {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 14px;
  flex-shrink: 0;
  min-width: 0;
}
.toff-stat {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 400;
  color: #606266;
}
.toff-warn {
  color: #b45309;
  font-weight: 500;
}
.toff-warn-icon {
  font-size: 15px;
  color: #f79009;
  margin-right: 4px;
}
.toff-sep {
  color: #c0c4cc;
  font-size: 14px;
  line-height: 1;
  flex: 0 0 auto;
}
.toff-auto {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.toff-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #98a2b3;
  flex: 0 0 auto;
}
.toff-dot.is-refreshing {
  background: #2e90fa;
  animation: toff-blink 1s ease-in-out infinite;
}
.toff-error {
  color: #d92d20;
}
@keyframes toff-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}
</style>
