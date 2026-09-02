<template>
  <div class="toff-toolbar">
    <div class="toff-toolbar-stats">
      <span class="toff-stat">共 {{ total }} 条</span>
      <span v-if="unparseableTotal > 0" class="toff-stat toff-stat--warn">无法解析 {{ unparseableTotal }} 条</span>
      <span class="toff-stat toff-auto">
        <span class="toff-dot" :class="{ 'is-refreshing': refreshing }" />
        60 秒自动刷新
      </span>
      <span v-if="lastRefreshText" class="toff-stat toff-last">最近成功刷新 {{ lastRefreshText }}</span>
      <span v-if="refreshError" class="toff-stat toff-error">{{ refreshError }}</span>
    </div>
    <el-button size="small" type="primary" plain :loading="refreshing" :disabled="busy || refreshing" @click="$emit('refresh')">
      立即刷新
    </el-button>
  </div>
</template>

<script setup lang="ts">
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
  gap: 8px;
  margin: 8px 0;
}
.toff-toolbar-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #475467;
}
.toff-stat {
  white-space: nowrap;
}
.toff-stat--warn {
  color: #b45309;
}
.toff-auto {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #344054;
}
.toff-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #98a2b3;
}
.toff-dot.is-refreshing {
  background: #2e90fa;
  animation: toff-blink 1s ease-in-out infinite;
}
.toff-last {
  color: #98a2b3;
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
