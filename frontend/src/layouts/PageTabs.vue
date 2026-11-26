<template>
  <div v-if="tabs.length > 0" class="page-tabs">
    <div ref="listRef" class="page-tabs__list" role="tablist" aria-label="页面标签">
      <div
        v-for="(tab, index) in tabs"
        :key="tab.path"
        class="page-tab"
        :class="{ 'is-active': tab.path === activePath }"
      >
        <button
          type="button"
          role="tab"
          class="page-tab__label"
          :aria-selected="tab.path === activePath"
          :tabindex="tab.path === activePath ? 0 : -1"
          @click="select(tab.path)"
          @keydown="onLabelKeydown($event, index)"
        >
          {{ tab.title }}
        </button>
        <button
          type="button"
          class="page-tab__close"
          :aria-label="`关闭 ${tab.title}`"
          :title="`关闭 ${tab.title}`"
          @click.stop="closeTab(tab.path)"
        >
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { Close } from '@element-plus/icons-vue'
import { useTabsStore } from '@/stores/tabs'

const tabsStore = useTabsStore()
const { tabs, activePath } = storeToRefs(tabsStore)
const route = useRoute()
const router = useRouter()

const listRef = ref<HTMLElement | null>(null)

function select(path: string): void {
  if (path === route.path) return
  void router.push(path)
}

function closeTab(path: string): void {
  const wasActive = tabsStore.activePath === path
  const next = tabsStore.close(path)
  if (!wasActive) return
  if (next) {
    void router.push(next)
  } else {
    // 关闭最后一个标签：进入公共布局的空工作区
    void router.push('/workspace')
  }
}

function focusLabel(index: number): void {
  const labels = listRef.value?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
  labels?.[index]?.focus()
}

function onLabelKeydown(event: KeyboardEvent, index: number): void {
  const count = tabs.value.length
  if (count === 0) return
  let target = index
  if (event.key === 'ArrowRight') {
    target = (index + 1) % count
  } else if (event.key === 'ArrowLeft') {
    target = (index - 1 + count) % count
  } else if (event.key === 'Home') {
    target = 0
  } else if (event.key === 'End') {
    target = count - 1
  } else {
    return
  }
  event.preventDefault()
  const path = tabs.value[target].path
  if (path !== route.path) {
    void router.push(path)
  }
  void nextTick(() => focusLabel(target))
}

/** 标签过多时保证激活项在标签条可视范围内。 */
watch(
  [activePath, () => tabs.value.length],
  () => {
    void nextTick(() => {
      const labels = listRef.value?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      if (!labels) return
      const activeIndex = tabs.value.findIndex((tab) => tab.path === activePath.value)
      labels[activeIndex]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    })
  },
  { immediate: true }
)
</script>

<style scoped>
.page-tabs {
  flex-shrink: 0;
  padding: 0 8px;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.page-tabs__list {
  display: flex;
  align-items: stretch;
  gap: 4px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

.page-tab {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  border-bottom: 2px solid transparent;
}

.page-tab.is-active {
  border-bottom-color: #409eff;
}

.page-tab__label {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 8px 10px;
  font-size: 14px;
  line-height: 20px;
  color: #606266;
  white-space: nowrap;
}

.page-tab__label:hover {
  color: #409eff;
}

.page-tab__label:focus-visible {
  outline: 2px solid #409eff;
  outline-offset: -2px;
  border-radius: 2px;
}

.page-tab.is-active .page-tab__label {
  color: #409eff;
  font-weight: 500;
}

.page-tab__close {
  display: inline-flex;
  align-items: center;
  margin-right: 4px;
  padding: 4px;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: #909399;
  cursor: pointer;
}

.page-tab__close:hover {
  background-color: #f0f2f5;
  color: #606266;
}

.page-tab__close:focus-visible {
  outline: 2px solid #409eff;
  outline-offset: -2px;
}
</style>
