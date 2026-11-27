<template>
  <div class="in-doc-host">
    <div
      v-for="path in paths"
      :key="path"
      class="in-doc-page"
      :class="{ 'is-active': path === activePath }"
      :inert="path === activePath ? undefined : true"
      :aria-hidden="path === activePath ? undefined : 'true'"
    >
      <component :is="PAGE_COMPONENTS[path]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, type Component } from 'vue'
import { useRoute } from 'vue-router'

/**
 * 已打开页面的 in-document 承载：页面 DOM 与表格布局始终留在 document 内，
 * 仅通过可见性/交互性区分活动页；离开时不再把整棵子树移入 keep-alive 仓库。
 * 非活动页保持同一包含块宽度（绝对定位贴合宿主），因此 ResizeObserver 与
 * Element Plus 列布局无需在切回时按新宽度重算。
 */
const props = defineProps<{ paths: string[] }>()
const route = useRoute()

const activePath = computed(() =>
  props.paths.includes(route.path) ? route.path : null,
)

const PAGE_COMPONENTS: Record<string, Component> = {
  '/config/data-source': defineAsyncComponent(() => import('@/views/data-source/DataSourcePage.vue')),
  '/config/client': defineAsyncComponent(() => import('@/views/client-config/ClientConfigPage.vue')),
}
</script>

<style scoped>
.in-doc-host {
  position: relative;
  overflow: hidden;
}

.in-doc-page {
  min-width: 0;
}

/* 非活动页保持完整布局宽度与行布局：绝对定位贴合宿主内容宽度，高度随内容自然展开；
   宿主 overflow 裁剪其纵向溢出，滚动高度仅由活动页决定。 */
.in-doc-page:not(.is-active) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  visibility: hidden;
  pointer-events: none;
}
</style>
