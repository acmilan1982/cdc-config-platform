<template>
  <div class="dss-toolbar">
    <div class="dss-toolbar-left">
      <div class="dss-note-row">
        <span class="dss-note">60 秒自动刷新｜最近成功刷新：{{ lastRefreshText }}</span>
        <span v-if="refreshError" class="dss-error" role="status">{{ refreshError }}</span>
      </div>
    </div>
    <div class="dss-toolbar-right">
      <el-button
        class="dss-refresh-btn"
        type="primary"
        plain
        :loading="refreshing"
        :disabled="busy || refreshing"
        @click="$emit('refresh')"
      >
        立即刷新
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  /** “最近成功刷新：HH:mm:ss”；从未成功显示 --（UI §6.1/§6.3）。 */
  lastRefreshText: string
  /** 刷新在途（manual/restore/auto）→ 按钮 loading，但宽度恒定（AC-068）。 */
  refreshing: boolean
  /** 任一实际请求在途 → “立即刷新”禁用（DSS-REQ-053，AC-050/068）。 */
  busy: boolean
  /** 有数据时刷新/查询失败的内联收敛提示（不清表，UI §6.4）。 */
  refreshError: string
}>()

defineEmits<{
  (e: 'refresh'): void
}>()
</script>

<style scoped>
.dss-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px 12px;
  margin: 8px 0;
}
/* 左区为完整逻辑块：说明文案与失败弱提示各自保持宽度稳定，任何状态变化不横向移动“立即刷新”。 */
.dss-toolbar-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
}
.dss-note-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.dss-note {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.dss-error {
  font-size: 13px;
  color: #d92d20;
  white-space: nowrap;
}
.dss-toolbar-right {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
}
/* AC-068 稳定宽度：按钮固定宽度，EP loading 图标显隐与禁用态变化都不改变按钮水平宽度，也不推动左侧说明文案 */
.dss-refresh-btn {
  width: 110px;
}
</style>
