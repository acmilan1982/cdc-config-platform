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
    <!-- 倒计时文字：秒数为固定 2ch 槽位（width/min/max 同锁，60→9 / -- 不移动“最近成功刷新”与按钮 x 坐标） -->
    <span class="dss-countdown-text">
      <span class="dss-countdown-seconds">{{ secondsText }}</span> <span class="dss-countdown-unit">秒后自动刷新</span>
    </span>
    <span class="dss-refresh-sep" aria-hidden="true"></span>
    <!-- 固定前缀 + 常驻定宽时间值槽位（DSS-AC-113 / R1 §5.2）：正文严格为“最近成功刷新：{{ lastRefreshText }}”。
         reserve 常驻但不可见（visibility:hidden + aria-hidden），仅用于占定值宽度；actual 绝对定位于同一槽位左上，
         因此槽位宽度只由常量 reserve 决定，与真实时间字符串的字形宽度无关（比例数字字体下尤为必要）。 -->
    <span class="dss-refresh-time">
      <span class="dss-refresh-time-prefix">最近成功刷新：</span>
      <span class="dss-refresh-time-value">
        <span class="dss-refresh-time-reserve" aria-hidden="true">88:88:88</span>
        <span class="dss-refresh-time-actual">{{ lastRefreshText }}</span>
      </span>
    </span>
    <!-- “立即刷新”：白底细边框次级按钮（R5 §5）；固定宽度；被功能阻断时视觉稳定。
         Loading 视觉（DSS-REQ-089 / DESIGN §31 / UI §25）：相对定位容器 + 常驻绝对定位 Feature 私有指示器
         + 独立固定居中文字标签节点；仅 kind=manual 点亮指示器，否则在按钮内容流内显隐而不改变几何。 -->
    <el-button
      class="dss-refresh-btn"
      :aria-busy="manualLoading ? 'true' : undefined"
      :aria-disabled="ariaBlocked || undefined"
      @click="onRefresh"
    >
      <span class="dss-btn-spinner" :class="{ 'is-visible': manualLoading }" aria-hidden="true"></span>
      <span class="dss-action-label">立即刷新</span>
    </el-button>
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
 * 三态几何稳定：按钮固定宽度、秒数固定 2ch 槽位，均不推动前方文案/后方按钮坐标。
 * 时间值槽位（R1 §5.2）：前缀与时间值拆为独立子节点，时间值由常驻 reserve 常量占位定宽、actual 绝对定位
 * 显示真实值，使整组几何不随“最近成功刷新”时间字符串变化（DSS-AC-113 全矩形 0px 判据）。
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
/* 秒数固定 2ch 槽位（R1 §5.3）：width / min-width / max-width / flex-basis 四值同锁 2ch，
   box-sizing:border-box 使 1px 级内容差异不外溢；60/59/10/9/0/-- 盒宽恒定，后缀与后方元素 x 坐标不变。 */
.dss-countdown-seconds {
  display: inline-block;
  width: 2ch;
  min-width: 2ch;
  max-width: 2ch;
  flex-basis: 2ch;
  box-sizing: border-box;
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
}
/* 定宽时间值槽位（R1 §5.2）：包含块为相对定位的 inline-block，宽度完全由常驻 reserve 常量文本决定。
   actual 绝对定位（left/top:0），脱离内容流：无论时间字符串为 --、HH:mm:ss 还是不同数字组合，
   槽位盒宽恒定，故整个刷新信息组 x/y/width/height 不随“最近成功刷新”时间变化而位移。 */
.dss-refresh-time-value {
  position: relative;
  display: inline-block;
  white-space: nowrap;
}
/* 常量占位：不可见但必须占位（visibility:hidden 而非 display:none）。不参与读屏（aria-hidden）。 */
.dss-refresh-time-reserve {
  visibility: hidden;
  font-variant-numeric: tabular-nums;
}
/* 可见时间值：与 reserve 同一布局单元，绝对定位于槽位左上，不推动任何相邻元素。 */
.dss-refresh-time-actual {
  position: absolute;
  left: 0;
  top: 0;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
/* AC-068/072 + R5 §5 稳定宽度 + DSS-REQ-089 几何锁：width / min-width / max-width / flex-basis 四值同锁
   110px；box-sizing:border-box 保证 1px 边框计入 110px 外框。min/max 夹住宽度、flex 0 0 110px 阻止被
   .dss-refresh-group 拉伸或压缩，因此 idle / Loading / 成功 / 失败四态外框 x/y/width/height 零位移。
   position: relative 使常驻私有指示器以本按钮为包含块（绝对定位，不进入按钮内容流）。 */
.dss-refresh-btn {
  width: 110px;
  box-sizing: border-box;
  position: relative;
  min-width: 110px;
  max-width: 110px;
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: 110px;
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
/* Feature 私有 Loading 指示器（DSS-REQ-089，AC-110~113）：常驻 DOM 节点，绝对定位于文字左侧空白区
   （按钮左内边距之内，不与文字重叠），不进入按钮内容流，因此显隐/旋转不重排、不推移文字、不改变外框。
   颜色取 currentColor（本按钮为深灰 #3f3f46），复用既有色调，不引入新视觉系统。
   本规则全部落在 Feature 私有命名空间内：不做强制提升，不新增全局按钮/图标/加载类覆盖，
   也不做任何脚本尺寸监听（尺寸观察器 / resize / 轮询 / 运行时宽度测量）。 */
.dss-btn-spinner {
  position: absolute;
  left: 3px;
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
  animation: dss-action-spin 0.6s linear infinite;
}
.dss-btn-spinner.is-visible {
  opacity: 1;
  visibility: visible;
}
/* 独立文字标签节点：文本内容在四种状态下恒定，节点由按钮 inline-flex + justify-content: center 固定居中。 */
.dss-action-label {
  white-space: nowrap;
}
@keyframes dss-action-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .dss-countdown-ring .dss-ring-progress {
    transition: none;
  }
  /* 停止旋转，但指示器仍静态可见、几何完全稳定（DSS-REQ-089⑦）。 */
  .dss-btn-spinner {
    animation: none;
  }
}
</style>
