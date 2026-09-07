<template>
  <Teleport to="body">
    <div
      v-if="target"
      ref="boxEl"
      class="dss-single-tooltip"
      role="tooltip"
      data-tt-host="1"
      :style="posStyle"
      @mouseenter.prevent.stop
      @mouseleave.prevent.stop
    >
      <div class="dss-single-tooltip__content">{{ target.content }}</div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { computeTooltipPlacement } from './tooltipPosition'
import type { SnapshotTooltipState } from './useSnapshotTooltip'

/**
 * 页面级单实例受控 Tooltip Host（DSS-REQ-070，AC-076/077）：
 * 页面唯一；Teleport 到 body 避免被表格 overflow 裁切；pointer-events:none 不可交互；
 * 对视口四边避让；内容优先单行（width:max-content），仅当自然内容宽度超过安全视口
 * （calc(100vw - 16px)，border-box 计入 padding/border）时才换行并全文可读、不横向越界。
 */
const props = defineProps<{
  target: SnapshotTooltipState | null
}>()

const boxEl = ref<HTMLElement | null>(null)
/**
 * 定位态样式：`left…top…` 表示已完成本次测量并可显示；`visibility:hidden` 为不可见定位态。
 * 目标切换后、新内容完成尺寸/坐标测量前必须保持不可见定位态，杜绝新内容短暂沿用旧锚点坐标闪现。
 */
const posStyle = ref('visibility:hidden')

async function applyLayout(): Promise<void> {
  await nextTick()
  const target = props.target
  if (!target || !boxEl.value) return
  // 不可见定位态下 DOM 仍参与布局：offsetWidth/Height 反映当前内容真实尺寸（border-box 含 padding/border）。
  const width = boxEl.value.offsetWidth || 0
  const height = boxEl.value.offsetHeight || 0
  const vw = window.innerWidth || 0
  const vh = window.innerHeight || 0
  const p = computeTooltipPlacement(target.anchor, { width, height }, { width: vw, height: vh })
  posStyle.value = `left:${Math.round(p.left)}px;top:${Math.round(p.top)}px`
}

watch(
  () => props.target,
  (target) => {
    // 目标变化立即回到不可见定位态，再测量新尺寸并一次性显示（R1-01：无旧坐标残影）。
    posStyle.value = 'visibility:hidden'
    if (target) void applyLayout()
  },
  { flush: 'post', immediate: true },
)
</script>

<style scoped>
.dss-single-tooltip {
  position: fixed;
  z-index: 3000;
  box-sizing: border-box;
  /* 无固定 420px：自然单行宽度在安全视口内则单行；仅当超过安全视口才换行（R1-01）。 */
  max-width: calc(100vw - 16px);
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #ffffff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  color: #303133;
  font-size: 13px;
  line-height: 1.5;
  width: max-content;
  pointer-events: none;
  white-space: pre-line;
  overflow-wrap: anywhere;
}
</style>
