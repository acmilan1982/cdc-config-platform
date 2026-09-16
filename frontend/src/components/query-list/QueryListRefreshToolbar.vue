<template>
  <div class="ql-refresh-group">
    <!-- 「本页不使用自动刷新」（countdown === null）：环、秒数文本与分隔符整体不渲染。 -->
    <template v-if="countdown !== null">
      <svg class="ql-countdown-ring" viewBox="0 0 16 16" aria-hidden="true">
        <circle class="ql-ring-track" cx="8" cy="8" r="6.5" fill="none"></circle>
        <circle
          class="ql-ring-progress"
          cx="8"
          cy="8"
          r="6.5"
          fill="none"
          stroke-dasharray="40.84"
          transform="rotate(-90 8 8)"
          :style="{ strokeDashoffset: ringDashOffset }"
        ></circle>
      </svg>
      <span class="ql-countdown-text">
        <span class="ql-countdown-seconds">{{ secondsText }}</span> <span class="ql-countdown-unit">秒后自动刷新</span>
      </span>
      <span class="ql-refresh-sep" aria-hidden="true"></span>
    </template>
    <span class="ql-refresh-time">
      <span class="ql-refresh-time-prefix">{{ lastRefreshLabel }}</span>
      <span class="ql-refresh-time-value">
        <span class="ql-refresh-time-reserve" aria-hidden="true">88:88:88</span>
        <span class="ql-refresh-time-actual">{{ lastRefreshText }}</span>
      </span>
    </span>
    <el-button
      class="ql-refresh-btn"
      :style="btnStyle"
      :aria-busy="manualLoading ? 'true' : undefined"
      :aria-disabled="busy ? 'true' : undefined"
      @click="onRefresh"
    >
      <span class="ql-btn-spinner" :class="{ 'is-visible': manualLoading }" aria-hidden="true"></span>
      <span class="ql-action-label">{{ refreshText }}</span>
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { QueryListCountdown } from './types'

/**
 * 结果区右侧不可拆散的刷新逻辑组（SHARED_COMPONENT_DESIGN §7.4.5）：
 * 倒计时环 → `N 秒后自动刷新` → 分隔符 → `最近成功刷新：HH:mm:ss` → 立即刷新按钮。
 * 不拥有自动刷新周期数值与是否启用（由 `countdown: null` 表达），不拥有请求，不拥有左侧摘要。
 */
const props = withDefaults(
  defineProps<{
    /** 倒计时投影。`null` = 本页不使用自动刷新（环/秒数/分隔符整体不渲染）。 */
    countdown: QueryListCountdown | null
    /** 最近成功刷新时间文案；从未成功传 '--'。 */
    lastRefreshText?: string
    /** 时间前缀标签。 */
    lastRefreshLabel?: string
    /** 仅“立即刷新”按钮显示 Loading 指示器。 */
    manualLoading?: boolean
    /** 任一实际请求在途：立即刷新被功能阻断。 */
    busy?: boolean
    /** 按钮文案。 */
    refreshText?: string
    /** 按钮固定宽度（px）。非标准文案必须显式传入。 */
    refreshWidthPx?: number
  }>(),
  {
    lastRefreshText: '--',
    lastRefreshLabel: '最近成功刷新：',
    manualLoading: false,
    busy: false,
    refreshText: '立即刷新',
    refreshWidthPx: 110,
  },
)

const emit = defineEmits<{
  /** 立即刷新按钮被激活且未被阻断。 */
  refresh: []
}>()

const RING_RADIUS = 6.5
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/** 秒数占位 -- 与数字均占固定 2ch，保证计数变化不引发布局位移。 */
const secondsText = computed(() => {
  const c = props.countdown
  if (c === null || c.seconds === null) return '--'
  return String(c.seconds)
})

/** 无已安排周期（progress: null）时环为空。 */
const ringProgress = computed(() => clamp01((props.countdown?.progress) ?? 0))
const ringDashOffset = computed(() => RING_LENGTH * (1 - ringProgress.value))

/** 固定宽度四值同锁的来源：`--ql-refresh-btn-width` 由 prop 驱动（默认 110px）。 */
const btnStyle = computed(() => ({ '--ql-refresh-btn-width': `${props.refreshWidthPx}px` }))

function onRefresh(): void {
  if (props.busy) return
  emit('refresh')
}
</script>

<style scoped>
/* 整组为不可拆散单一逻辑组：自身不换行；宽度不足时由外层结果面板头部整体换行。 */
.ql-refresh-group {
  display: inline-flex;
  align-items: center;
  gap: var(--ql-refresh-group-gap, 8px);
  flex: 0 0 auto;
  white-space: nowrap;
  font-size: 13px;
  color: var(--ql-refresh-text-color, #3f3f46);
}

.ql-countdown-ring {
  flex: 0 0 auto;
  width: var(--ql-countdown-size, 16px);
  height: var(--ql-countdown-size, 16px);
  display: block;
}

.ql-ring-track {
  stroke: var(--ql-countdown-track, #e4e4e7);
  stroke-width: var(--ql-countdown-stroke, 2);
  fill: none;
}

.ql-ring-progress {
  stroke: var(--ql-countdown-progress, #2563eb);
  stroke-width: var(--ql-countdown-stroke, 2);
  fill: none;
}

.ql-countdown-text {
  white-space: nowrap;
}

/* 秒数固定 2ch 槽位（四值同锁）：60 / 59 / 10 / 9 / 0 / -- 盒宽恒定，后缀与后方元素 x 坐标不变。 */
.ql-countdown-seconds {
  display: inline-block;
  width: 2ch;
  min-width: 2ch;
  max-width: 2ch;
  flex-basis: 2ch;
  box-sizing: border-box;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.ql-countdown-unit {
  white-space: nowrap;
}

.ql-refresh-sep {
  flex: 0 0 auto;
  width: 1px;
  height: var(--ql-refresh-sep-height, 14px);
  background: var(--ql-refresh-sep-color, var(--ql-divider, #f0f0f1));
}

.ql-refresh-time {
  white-space: nowrap;
}

/* 定宽时间值槽位：槽宽完全由常驻 reserve 常量文本决定，与真实时间字符串无关。 */
.ql-refresh-time-value {
  position: relative;
  display: inline-block;
  white-space: nowrap;
}

.ql-refresh-time-reserve {
  visibility: hidden;
  font-variant-numeric: tabular-nums;
}

.ql-refresh-time-actual {
  position: absolute;
  left: 0;
  top: 0;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* 按钮固定宽度四值同锁 + 禁止拉伸/压缩；position:relative 使常驻指示器以本按钮为包含块。
   高度保持 Element Plus 默认（§7.5.4：公共层不设按钮高度令牌）。 */
.ql-refresh-btn {
  width: var(--ql-refresh-btn-width, 110px);
  min-width: var(--ql-refresh-btn-width, 110px);
  max-width: var(--ql-refresh-btn-width, 110px);
  flex-basis: var(--ql-refresh-btn-width, 110px);
  flex-grow: 0;
  flex-shrink: 0;
  box-sizing: border-box;
  position: relative;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  color: var(--ql-refresh-text-color, #3f3f46);
  font-weight: 500;
  border-radius: 6px;
}

.ql-refresh-btn:hover,
.ql-refresh-btn:focus {
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  color: var(--ql-refresh-text-color, #3f3f46);
}

.ql-refresh-btn:focus-visible {
  outline: 2px solid rgba(37, 99, 235, 0.5);
  outline-offset: 1px;
}

/* 常驻指示器（§7.5.3，类名与令牌与查询/重置按钮一致）：绝对定位脱离内容流，
   只切换 opacity / visibility；颜色一律 currentColor。 */
.ql-btn-spinner {
  position: absolute;
  left: var(--ql-btn-spinner-inset, 2px);
  top: 50%;
  width: 12px;
  height: 12px;
  margin-top: -6px;
  box-sizing: border-box;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  opacity: 0;
  visibility: hidden;
  animation: ql-action-spin 0.6s linear infinite;
}

.ql-btn-spinner.is-visible {
  opacity: 1;
  visibility: visible;
}

.ql-action-label {
  white-space: nowrap;
}

@keyframes ql-action-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ql-ring-progress {
    transition: none;
  }
  /* 停止旋转，但指示器仍静态可见、几何完全稳定。 */
  .ql-btn-spinner {
    animation: none;
  }
}
</style>
