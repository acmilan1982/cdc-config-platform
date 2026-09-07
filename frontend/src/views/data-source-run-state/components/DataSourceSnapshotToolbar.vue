<template>
  <div class="dss-refresh-group">
    <!-- 灰色状态圆点：刷新类请求(manual/auto/restore)在途变蓝动态；文字仍是主要信息载体 -->
    <span
      class="dss-refresh-dot"
      :class="{ 'is-active': refreshActive }"
      aria-hidden="true"
    ></span>
    <span class="dss-refresh-text">60 秒自动刷新</span>
    <span class="dss-refresh-sep" aria-hidden="true"></span>
    <span class="dss-refresh-time">最近成功刷新：{{ lastRefreshText }}</span>
    <!-- “立即刷新”：固定宽度；仅 kind=manual 显示 loading（auto/restore 不显示）；被功能阻断时视觉稳定 -->
    <el-button
      class="dss-refresh-btn"
      type="primary"
      plain
      :loading="manualLoading"
      :aria-disabled="ariaBlocked || undefined"
      @click="onRefresh"
    >立即刷新</el-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * 结果卡片头部右侧不可拆散“刷新逻辑组”（DSS-REQ-068，AC-071/072，UI §13.3）：
 * 顺序固定为 圆点 → 60 秒自动刷新 → 分隔符 → 最近成功刷新：HH:mm:ss（从未成功 --）→ “立即刷新”。
 * 整组作为单一 flex/flow 项靠右；窄宽度下由结果卡片头部整组换行，不允许只把按钮拆到下一行。
 * 三态几何稳定：按钮固定宽度，loading 图标显隐不改变按钮/前方文案/时间几何；
 * 任一实际请求在途时按钮功能被阻断（busy 防御 + aria-disabled），视觉不闪动不变灰。
 */
const props = defineProps<{
  /** “最近成功刷新：HH:mm:ss”；从未成功显示 --（UI §13.3）。 */
  lastRefreshText: string
  /** 刷新类请求（manual/auto/restore）在途 → 圆点变蓝动态（DSS-REQ-071 e）。 */
  refreshActive: boolean
  /** 仅 kind=manual 在途 → “立即刷新”按钮 loading（auto/restore 不显示，DSS-REQ-071④⑤⑥）。 */
  manualLoading: boolean
  /** 任一实际请求在途：立即刷新被功能阻断（DSS-REQ-053，AC-050）。 */
  busy: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

/** busy 期间立即刷新功能被阻断：以 aria-disabled 语义标记，不改变外观。 */
const ariaBlocked = computed(() => props.busy)

function onRefresh(): void {
  if (props.busy) return
  emit('refresh')
}
</script>

<style scoped>
/* 整组为不可拆散单一逻辑组：自身不换行；宽度不足时由外层头部整体换行 */
.dss-refresh-group {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  white-space: nowrap;
  font-size: 14px;
  color: #606266;
}
.dss-refresh-dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #c0c4cc;
}
.dss-refresh-dot.is-active {
  background: #409eff;
  animation: dss-dot-pulse 1s ease-in-out infinite;
}
.dss-refresh-text {
  white-space: nowrap;
}
.dss-refresh-sep {
  flex: 0 0 auto;
  width: 1px;
  height: 14px;
  background: #dcdfe6;
}
.dss-refresh-time {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
/* AC-068/072 稳定宽度：loading 图标显隐/禁用态变化不改变按钮水平宽度 */
.dss-refresh-btn {
  width: 110px;
}
@keyframes dss-dot-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}
</style>
