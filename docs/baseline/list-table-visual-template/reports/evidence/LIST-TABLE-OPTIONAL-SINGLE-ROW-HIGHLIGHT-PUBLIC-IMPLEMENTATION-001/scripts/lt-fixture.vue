<!-- 临时隔离夹具（不提交、不含业务数据）：仅用于真实浏览器核对
     `@/styles/list-table/list-table-visual.css` 的 §13.3 可选单行固定高亮预设的运行时层叠。
     通过 URL 参数切换 `optin`（表级 opt-in 类）与 `fixed`（被固定行的下标）。 -->
<template>
  <div style="width: 720px">
    <el-table
      class="fx-table"
      :class="[LT_MAIN_TABLE_CLASS, optIn ? 'lt-row-highlight' : '']"
      :data="rows"
      :row-class-name="rowClassName"
    >
      <el-table-column prop="a" label="A" width="180" />
      <el-table-column prop="b" label="B" width="180" />
      <el-table-column prop="c" label="C" width="180" />
      <el-table-column label="操作" width="120" fixed="right" class-name="lt-row-action__cell">
        <template #default>
          <span class="lt-row-action__ellipsis">···</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { LT_MAIN_TABLE_CLASS } from '@/styles/list-table'

const params = new URLSearchParams(location.search)
const optIn = ref(params.get('optin') === '1')
const fixedIndex = ref(params.has('fixed') ? Number(params.get('fixed')) : -1)

const rows = [
  { a: 'row-0-a', b: 'row-0-b', c: 'row-0-c' },
  { a: 'row-1-a', b: 'row-1-b', c: 'row-1-c' },
  { a: 'row-2-a', b: 'row-2-b', c: 'row-2-c' },
]

function rowClassName({ rowIndex }: { rowIndex: number }): string {
  return rowIndex === fixedIndex.value ? 'lt-row-highlight__row' : ''
}
</script>

<style scoped src="@/styles/list-table/list-table-visual.css"></style>
