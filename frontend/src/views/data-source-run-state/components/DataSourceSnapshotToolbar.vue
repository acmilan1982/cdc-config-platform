<template>
  <div class="dss-refresh-group">
    <!-- 真实自动刷新倒计时环（16px 只读投影，装饰性，aria-hidden）：track #E4E4E7 / progress #2563EB / stroke≈2px -->
    <svg class="dss-countdown-ring" viewBox="0 0 16 16" aria-hidden="true">
      <circle class="dss-ring-track" cx="8" cy="8" r="6.5" fill="none"></circle>
      <circle
        class="dss-ring-progress"
        cx="8"
        cy="8"
        r="6.5"
        fill="none"
        stroke-dasharray="40.84"
        transform="rotate(-90 8 8)"
        :style="{ strokeDashoffset: ringDashOffset }"
      ></circle>
    </svg>
    <!-- 倒计时文字：秒数占位宽度固定（tabular 2ch，60→9 不移动“最近成功刷新”与按钮 x 坐标） -->
    <span class="dss-countdown-text">
      <span class="dss-countdown-seconds">{{ secondsText }}</span> <span class="dss-countdown-unit">秒后自动刷新</span>
    </span>
    <span class="dss-refresh-sep" aria-hidden="true"></span>
    <span class="dss-refresh-time">最近成功刷新：{{ lastRefreshText }}</span>
    <!-- “立即刷新”：白底细边框次级按钮（R5 §5）；固定宽度；仅 kind=manual 显示 loading；被功能阻断时视觉稳定 -->
    <el-button
      class="dss-refresh-btn"
      :loading="manualLoading"
      :aria-disabled="ariaBlocked || undefined"
      @click="onRefresh"
    >立即刷新</el-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const RING_RADIUS = 6.5
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

/**
 * 结果卡片头部右侧不可拆散“刷新逻辑组”（DSS-REQ-068，AC-071/072，UI §13.3，R2 §9）：
 * 顺序固定为 16px 倒计时环 → N 秒后自动刷新 → 分隔符 → 最近成功刷新：HH:mm:ss（从未成功 --）→ “立即刷新”。
 * 倒计时环是真实自动刷新调度（useDataSourceSnapshot 单一 setTimeout）的只读可视化投影：
 * 秒数取整、环形进度同向递减；无已安排周期（首载/从未成功/隐藏暂停前）显示占位 --。
 * 整组作为单一 flex/flow 项靠右；窄宽度下由结果卡片头部整组换行，不允许只把按钮拆到下一行。
 * 按钮白底细边框次级（R5 §5，不抢黑色“查询”主按钮），loading/禁用仍可读；
 * 三态几何稳定：按钮固定宽度、秒数 2ch 占位，均不推动前方文案/后方按钮坐标。
 */
const props = defineProps<{
  /** “最近成功刷新：HH:mm:ss”；从未成功显示 --（UI §13.3）。 */
  lastRefreshText: string
  /** 下一轮真实自动刷新剩余秒数（60→0，无已安排周期 null）。 */
  countdownSeconds: number | null
  /** 下一轮真实自动刷新剩余比例 1→0（无已安排周期 null），驱动环形进度。 */
  countdownProgress: number | null
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

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/** 秒数占位 -- 与数字均占固定 2ch，保证计数变化不引发布局位移。 */
const secondsText = computed(() => (props.countdownSeconds === null ? '--' : String(props.countdownSeconds)))

const ringProgress = computed(() => clamp01(props.countdownProgress ?? 0))
/** 弧长随剩余时间从满环递减到空（dasharray=RING_LENGTH；offset=RING_LENGTH*(1-p)）。 */
const ringDashOffset = computed(() => RING_LENGTH * (1 - ringProgress.value))

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
  font-size: 13px;
  color: var(--dss-text-secondary, #3f3f46);
}
/* 倒计时环：16px、无旋转/脉冲，仅弧长随真实剩余时间缓慢递减 */
.dss-countdown-ring {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  display: block;
}
.dss-ring-track {
  stroke: #e4e4e7;
  stroke-width: 2;
  fill: none;
}
.dss-ring-progress {
  stroke: var(--dss-accent, #2563eb);
  stroke-width: 2;
  fill: none;
  /* 逐秒离散递减（每 tick 更新一次目标值，环与秒数同向；无填充式补间，避免周期重置瞬间的“倒转”观感）。
     prefers-reduced-motion 额外关停任何潜在过渡，仍保留准确数字与静态进度。 */
}
.dss-countdown-text {
  white-space: nowrap;
}
/* 秒数固定 2ch 占位：60/59/9/-- 宽度恒定，后缀与后方元素 x 坐标不变 */
.dss-countdown-seconds {
  display: inline-block;
  min-width: 2ch;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.dss-countdown-unit {
  white-space: nowrap;
}
.dss-refresh-sep {
  flex: 0 0 auto;
  width: 1px;
  height: 14px;
  background: var(--dss-divider, #f0f0f1);
}
.dss-refresh-time {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
/* AC-068/072 + R5 §5 稳定宽度：loading 图标显隐/禁用态变化不改变按钮水平宽度；
   box-sizing:border-box 保证 1px 边框计入 110px 内框，idle 与 loading 外框完全等宽 */
.dss-refresh-btn {
  width: 110px;
  box-sizing: border-box;
}
/* “立即刷新”白底细边框次级按钮（R5 §5）：background #FFFFFF / border 1px #E4E4E7 / color #3F3F46 / radius 6px；
   hover 浅灰 #F4F4F5；focus-visible 仅靠克制局部焦点环，不靠颜色；loading/disabled 仍可读；
   不抢黑色“查询”主按钮（保持次级视觉权重） */
.dss-refresh-group .dss-refresh-btn {
  background: #ffffff;
  border: 1px solid #e4e4e7;
  color: var(--dss-text-secondary, #3f3f46);
  font-weight: 500;
  border-radius: 6px;
}
.dss-refresh-group .dss-refresh-btn:hover,
.dss-refresh-group .dss-refresh-btn:focus {
  background: #f4f4f5;
  border-color: #e4e4e7;
  color: var(--dss-text-secondary, #3f3f46);
}
.dss-refresh-group .dss-refresh-btn:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.5);
  outline-offset: 1px;
}
.dss-refresh-group .dss-refresh-btn.is-disabled,
.dss-refresh-group .dss-refresh-btn.is-disabled:hover,
.dss-refresh-group .dss-refresh-btn.is-disabled:focus {
  background: #ffffff;
  border: 1px solid #e4e4e7;
  color: #8e8e96;
}
@media (prefers-reduced-motion: reduce) {
  .dss-countdown-ring .dss-ring-progress {
    transition: none;
  }
}
</style>
