<template>
  <Teleport to="body">
    <div
      v-if="target"
      ref="boxEl"
      :id="id"
      class="ql-tooltip"
      role="tooltip"
      data-ql-tooltip-host="1"
      :style="hostStyle"
    >
      {{ target.content }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { QueryListTooltipAnchor, QueryListTooltipTarget } from './types'

/**
 * 页面级单实例受控 Tooltip Host（SHARED_COMPONENT_DESIGN §7.4.6、§7.6.4）：
 * 页面唯一（`id` 直接取控制器 `hostId`，Host 不生成第二个 ID）；Teleport 到 body 避免被表格 overflow 裁切；
 * `pointer-events:none` 不可交互；内容优先单行（width:max-content），仅当自然内容宽度超过安全视口
 * （calc(100vw - 16px)，border-box 计入 padding/border）时才换行，换行后仍全文可读、不横向越界。
 * 最大宽度只有一个来源：`props.target.maxWidthPx`（省略 → 视口安全上限）。
 */
const props = defineProps<{
  /** Host 根节点 `id`；必须直接使用控制器返回的 `hostId`。 */
  id: string
  /** 当前目标；null 时不渲染任何 DOM。 */
  target: QueryListTooltipTarget | null
}>()

const boxEl = ref<HTMLElement | null>(null)

/**
 * 定位态样式：`left…top…` 表示已完成本次测量并可显示；`visibility:hidden` 为不可见定位态。
 * 目标切换后、新内容完成尺寸/坐标测量前必须保持不可见定位态，杜绝新内容短暂沿用旧锚点坐标闪现。
 */
const posStyle = ref('visibility:hidden')

/** 目标携带已校验的 `maxWidthPx` 时收窄内容上限；省略时仅使用视口安全上限。 */
const maxWidth = computed(() => {
  const px = props.target?.maxWidthPx
  const safe = 'var(--ql-tooltip-max-width, calc(100vw - 16px))'
  return px === undefined ? safe : `min(${px}px, ${safe})`
})

const hostStyle = computed(() => `${posStyle.value};max-width:${maxWidth.value}`)

const EDGE_GAP = 8
const VIEWPORT_MARGIN = 8

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * 锚点矩形定位（§7.6.2 统一的部分）：视口四边避让、优先上方、水平居中、夹取到视口。
 * 指针跟随类算法（对照页面的 pointer 坐标语义）不并入。
 */
function computePlacement(
  anchor: QueryListTooltipAnchor,
  size: { width: number; height: number },
  viewport: { width: number; height: number },
): { top: number; left: number } {
  const vw = Math.max(0, viewport.width)
  const vh = Math.max(0, viewport.height)
  const roomAbove = anchor.top
  const roomBelow = vh - anchor.bottom

  let top: number
  if (roomAbove >= size.height + EDGE_GAP && (roomBelow < size.height + EDGE_GAP || roomAbove >= roomBelow)) {
    top = anchor.top - size.height - EDGE_GAP
  } else {
    top = anchor.bottom + EDGE_GAP
  }

  const left = anchor.left + anchor.width / 2 - size.width / 2
  return {
    left: clamp(left, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, vw - size.width - VIEWPORT_MARGIN)),
    top: clamp(top, VIEWPORT_MARGIN, Math.max(VIEWPORT_MARGIN, vh - size.height - VIEWPORT_MARGIN)),
  }
}

async function applyLayout(): Promise<void> {
  await nextTick()
  const target = props.target
  if (!target || !boxEl.value) return
  // 不可见定位态下 DOM 仍参与布局：offsetWidth/Height 反映当前内容在**已施加宽度上限**后的真实尺寸
  // （border-box 含 padding/border）。
  const width = boxEl.value.offsetWidth || 0
  const height = boxEl.value.offsetHeight || 0
  const placement = computePlacement(
    target.anchor,
    { width, height },
    { width: window.innerWidth || 0, height: window.innerHeight || 0 },
  )
  posStyle.value = `left:${Math.round(placement.left)}px;top:${Math.round(placement.top)}px`
}

watch(
  () => props.target,
  (target) => {
    // 目标变化立即回到不可见定位态，再测量新尺寸并一次性显示（无旧坐标残影）。
    posStyle.value = 'visibility:hidden'
    if (target) void applyLayout()
  },
  { flush: 'post', immediate: true },
)
</script>

<style scoped>
.ql-tooltip {
  position: fixed;
  z-index: var(--ql-tooltip-z-index, 3000);
  box-sizing: border-box;
  /* 无固定内容宽度：自然单行宽度在安全视口内则单行；仅当超过安全视口才换行。 */
  width: max-content;
  max-width: var(--ql-tooltip-max-width, calc(100vw - 16px));
  padding: var(--ql-tooltip-padding, 6px 10px);
  border: var(--ql-tooltip-border, 1px solid #dcdfe6);
  border-radius: var(--ql-tooltip-radius, 4px);
  background: var(--ql-tooltip-bg, #ffffff);
  box-shadow: var(--ql-tooltip-shadow, 0 2px 12px rgba(0, 0, 0, 0.12));
  color: var(--ql-tooltip-color, #303133);
  font-size: var(--ql-tooltip-font-size, 13px);
  line-height: var(--ql-tooltip-line-height, 1.5);
  white-space: pre-line;
  overflow-wrap: anywhere;
  pointer-events: none;
}
</style>
