<template>
  <div class="data-subscribe-page">
    <el-card shadow="never" class="query-card">
      <div class="query-bar">
        <div class="query-field">
          <span class="query-label">源库</span>
          <el-select
            v-model="queryForm.sourceIds"
            multiple
            filterable
            collapse-tags
            placeholder="选择源库（可多选，组内 OR）"
            class="query-select"
          >
            <el-option
              v-for="s in options.sources"
              :key="s.dataSourceId"
              :value="s.dataSourceId"
              :label="queryOptionLabel(s)"
            >
              <div class="q-opt">
                <span class="q-opt-main">{{ s.dataSourceOrg ?? s.dataSourceId }}</span>
                <span class="q-opt-sub">{{ s.dataSourceId }}</span>
              </div>
              <div v-if="s.dataSourceId.includes(',')" class="q-opt-warn">
                含逗号，历史兼容查询可能存在歧义
              </div>
            </el-option>
          </el-select>
        </div>
        <div class="query-field">
          <span class="query-label">目标库</span>
          <el-select
            v-model="queryForm.targetIds"
            multiple
            filterable
            collapse-tags
            placeholder="选择目标库（可多选，组内 OR）"
            class="query-select"
          >
            <el-option
              v-for="t in options.targets"
              :key="t.dataSourceId"
              :value="t.dataSourceId"
              :label="queryOptionLabel(t)"
            >
              <div class="q-opt">
                <span class="q-opt-main">{{ t.dataSourceOrg ?? t.dataSourceId }}</span>
                <span class="q-opt-sub">{{ t.dataSourceId }}</span>
              </div>
              <div v-if="t.dataSourceId.includes(',')" class="q-opt-warn">
                含逗号，历史兼容查询可能存在歧义
              </div>
            </el-option>
          </el-select>
        </div>
        <div class="query-actions">
          <el-button type="primary" :loading="listLoading" @click="runQuery">查询</el-button>
          <el-button :disabled="listLoading" @click="onReset">重置</el-button>
        </div>
      </div>
    </el-card>

    <el-alert
      v-for="(w, i) in queryWarnings"
      :key="i"
      type="warning"
      :closable="false"
      show-icon
      class="warning-banner"
      :title="w.message"
    />

    <el-card shadow="never" class="list-card">
      <div class="list-toolbar">
        <span class="list-title">订阅列表</span>
        <el-button type="primary" @click="openCreate">新增订阅</el-button>
      </div>

      <el-alert v-if="listError" type="error" :closable="false" show-icon class="list-error">
        <template #title>{{ listError }}</template>
        <template #default>
          <el-button size="small" @click="refresh">重试</el-button>
        </template>
      </el-alert>

      <el-table
        :data="list"
        v-loading="listLoading"
        empty-text="暂无符合条件的订阅记录"
        row-key="dataSubId"
        :row-class-name="tableRowClassName"
      >
        <el-table-column label="订阅描述" min-width="200">
          <template #default="{ row }">
            <span v-if="row.anomalyMultiSource" class="anomaly-msg">
              配置异常：该记录包含多个源库，请直接维护数据库
            </span>
            <span v-else class="desc-cell" :title="row.dataSubDesc">{{ row.dataSubDesc }}</span>
          </template>
        </el-table-column>
        <el-table-column label="源库" min-width="140">
          <template #default="{ row }">
            <template v-if="row.source">
              <span class="ref-main" :title="row.source.dataSourceId">{{ describeRef(row.source) }}</span>
              <el-tag v-if="refStatusLabel(row.source.status)" size="small" type="warning">
                {{ refStatusLabel(row.source.status) }}
              </el-tag>
            </template>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="源表" min-width="160">
          <template #default="{ row }">
            <div v-if="!row.anomalyMultiSource" class="cell-source-tables">
              <el-tooltip placement="top">
                <template #content>
                  <div class="tooltip-content">
                    <div v-for="group in row.tablesBySchema" :key="group.schema" class="tooltip-group">
                      <div class="tooltip-schema">{{ group.schema }}</div>
                      <div v-for="t in group.tables" :key="t" class="tooltip-table">{{ t }}</div>
                    </div>
                    <div v-if="row.rawUnparseableTables.length > 0" class="tooltip-unparseable">
                      <div class="tooltip-unparseable-title">以下片段无法解析，可能存在历史格式异常：</div>
                      <div class="tooltip-unparseable-list">{{ row.rawUnparseableTables.join('、') }}</div>
                    </div>
                  </div>
                </template>
                <span class="table-count">共 {{ row.sourceTableCount }} 张</span>
              </el-tooltip>
            </div>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="目标库" min-width="160">
          <template #default="{ row }">
            <div v-if="row.targets.length > 0" class="target-tags target-cell">
              <el-tooltip
                v-for="t in visibleTargets(row)"
                :key="t.dataSourceId"
                placement="top"
                :content="`${t.dataSourceId}${refStatusLabel(t.status) ? '（' + refStatusLabel(t.status) + '）' : ''}`"
              >
                <el-tag size="small" :type="t.status === 'NORMAL' ? 'info' : 'warning'">
                  {{ describeRef(t) }}
                </el-tag>
              </el-tooltip>
              <el-tooltip v-if="hiddenTargetCount(row) > 0" placement="top">
                <template #content>
                  <div class="target-tooltip-list">
                    <div v-for="t in row.targets" :key="t.dataSourceId" class="target-tooltip-item">
                      {{ describeRef(t) }}{{ refStatusLabel(t.status) ? '（' + refStatusLabel(t.status) + '）' : '' }}
                    </div>
                  </div>
                </template>
                <el-tag size="small" class="more-tag">+{{ hiddenTargetCount(row) }}</el-tag>
              </el-tooltip>
            </div>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="210">
          <template #default="{ row }">
            <template v-if="resolveUpdateTime(row.updateTime, row.insertTime)">
              <span>{{ resolveUpdateTime(row.updateTime, row.insertTime)!.time }}</span>
              <el-tag
                v-if="resolveUpdateTime(row.updateTime, row.insertTime)!.isCreateFallback"
                size="small"
                type="info"
                class="create-tag"
              >
                创建时间
              </el-tag>
            </template>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <template v-if="!row.anomalyMultiSource">
              <el-button link type="primary" @click="openDetail(row)">查看</el-button>
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="openDelete(row)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <SubscribeFormDialog
      v-model="formVisible"
      :mode="formMode"
      :data-sub-id="formDataSubId"
      :options="options"
      @saved="onSaved"
    />
    <SubscribeDetailDialog v-model="detailVisible" :data-sub-id="detailDataSubId" />
    <SubscribeDeleteDialog v-model="deleteVisible" :data-sub-id="deleteDataSubId" @deleted="onDeleted" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  fetchSubscriptionList,
  fetchSubscriptionOptions,
} from '@/api/subscription'
import type {
  QueryWarningVO,
  SourceOptionVO,
  SubscriptionListQuery,
  SubscriptionOptionsVO,
  SubscriptionRowVO,
  TargetOptionVO,
  TargetRefVO,
} from '@/types/subscription'
import { computeTargetCapacity, describeRef, refStatusLabel, resolveUpdateTime } from './utils/subscriptionFormat'
import SubscribeDetailDialog from './components/SubscribeDetailDialog.vue'
import SubscribeDeleteDialog from './components/SubscribeDeleteDialog.vue'
import SubscribeFormDialog from './components/SubscribeFormDialog.vue'

type CandidateLike = SourceOptionVO | TargetOptionVO

const options = reactive<SubscriptionOptionsVO>({ sources: [], targets: [] })
const queryForm = reactive<{ sourceIds: string[]; targetIds: string[] }>({
  sourceIds: [],
  targetIds: [],
})
let activeQuery: SubscriptionListQuery = {}

const list = ref<SubscriptionRowVO[]>([])
const queryWarnings = ref<QueryWarningVO[]>([])
const listLoading = ref(false)
const listError = ref<string | null>(null)

const formVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formDataSubId = ref<string | null>(null)
const detailVisible = ref(false)
const detailDataSubId = ref<string | null>(null)
const deleteVisible = ref(false)
const deleteDataSubId = ref<string | null>(null)

/**
 * 目标库标签展示容量：依据目标库列实际宽度计算（R1 §5.2.8），
 * 不得硬编码“永远只显示两个”。jsdom 无 ResizeObserver 时回退 2，保证测试稳定。
 */
const targetCellWidth = ref(0)
let targetResizeObserver: ResizeObserver | null = null
const targetCapacity = computed(() => computeTargetCapacity(targetCellWidth.value))

function initTargetWidthObserver() {
  targetResizeObserver?.disconnect()
  targetResizeObserver = null
  if (typeof ResizeObserver === 'undefined') return
  const el = document.querySelector('.target-cell')
  if (!el) return
  targetResizeObserver = new ResizeObserver(() => {
    targetCellWidth.value = (el as HTMLElement).clientWidth
  })
  targetResizeObserver.observe(el)
}

function messageOf(e: unknown): string {
  return e && typeof e === 'object' && 'message' in e
    ? ((e as { message?: string }).message ?? '查询失败')
    : '查询失败'
}

/** 查询候选标签：机构名为主文字，完整 ID 随标签展示，保证过滤仍可命中 ID 与机构（R1 §5.1.1）。 */
function queryOptionLabel(opt: CandidateLike): string {
  return opt.dataSourceOrg ? `${opt.dataSourceOrg}（${opt.dataSourceId}）` : opt.dataSourceId
}

function visibleTargets(row: SubscriptionRowVO): TargetRefVO[] {
  return row.targets.slice(0, targetCapacity.value)
}

function hiddenTargetCount(row: SubscriptionRowVO): number {
  return Math.max(0, row.targets.length - targetCapacity.value)
}

async function fetchList(query: SubscriptionListQuery) {
  listLoading.value = true
  listError.value = null
  try {
    const res = await fetchSubscriptionList(query)
    if (res.code === 200) {
      list.value = res.data.items
      queryWarnings.value = res.data.queryWarnings ?? []
    } else {
      listError.value = res.message
    }
  } catch (e) {
    listError.value = messageOf(e)
  } finally {
    listLoading.value = false
  }
}

function runQuery() {
  const query: SubscriptionListQuery = {
    sourceIds: queryForm.sourceIds.length ? [...queryForm.sourceIds] : undefined,
    targetIds: queryForm.targetIds.length ? [...queryForm.targetIds] : undefined,
  }
  activeQuery = query
  fetchList(query)
}

/** 重置只清空查询表单，不发起请求，保留当前列表与 queryWarnings（API.md §4.2）。 */
function onReset() {
  queryForm.sourceIds = []
  queryForm.targetIds = []
}

async function refresh() {
  await fetchList(activeQuery)
}

function tableRowClassName({ row }: { row: SubscriptionRowVO }) {
  return row.anomalyMultiSource ? 'anomaly-row' : ''
}

function openCreate() {
  formMode.value = 'create'
  formDataSubId.value = null
  formVisible.value = true
}

function openEdit(row: SubscriptionRowVO) {
  formMode.value = 'edit'
  formDataSubId.value = row.dataSubId
  formVisible.value = true
}

function openDetail(row: SubscriptionRowVO) {
  detailDataSubId.value = row.dataSubId
  detailVisible.value = true
}

function openDelete(row: SubscriptionRowVO) {
  deleteDataSubId.value = row.dataSubId
  deleteVisible.value = true
}

function onSaved(success: boolean) {
  if (success) {
    ElMessage.success('操作成功。配置将在相关 sync-client 重启后生效。')
  }
  refresh()
}

function onDeleted(success: boolean) {
  if (success) {
    ElMessage.success('操作成功。配置将在相关 sync-client 重启后生效。')
  }
  refresh()
}

watch(list, async () => {
  await nextTick()
  initTargetWidthObserver()
})

onMounted(async () => {
  try {
    const res = await fetchSubscriptionOptions()
    if (res.code === 200) {
      options.sources = res.data.sources ?? []
      options.targets = res.data.targets ?? []
    }
  } catch {
    // 候选加载失败不阻断列表查询
  }
  runQuery()
})

onBeforeUnmount(() => {
  targetResizeObserver?.disconnect()
})
</script>

<style scoped>
.data-subscribe-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.query-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.query-field {
  display: flex;
  align-items: center;
  gap: 8px;
}
.query-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}
.query-select {
  width: 280px;
}
.query-actions {
  display: flex;
  gap: 8px;
}
.warning-banner {
  margin: 0;
}
.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.list-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.list-error {
  margin-bottom: 12px;
}
.anomaly-msg {
  color: var(--el-color-danger);
  font-size: 13px;
}
/* 查询候选：机构名主文字 + ID 辅助文字；含逗号候选可选择但附加歧义警告（R1 §5.1）。 */
.q-opt {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.q-opt-main {
  color: var(--el-text-color-primary);
}
.q-opt-sub {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.q-opt-warn {
  font-size: 12px;
  color: var(--el-color-warning);
}
/* 订阅描述：单行省略，悬停 title 展示完整内容（R1 §5.2.1）。 */
.desc-cell {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 源库：正常只显示机构名，数据源 ID 通过悬停 title 查看（R1 §5.2.2）。 */
.ref-main {
  cursor: default;
}
.table-count {
  color: var(--el-color-primary);
  font-weight: 600;
}
.tooltip-content {
  max-height: 220px;
  overflow: auto;
  max-width: 360px;
}
.tooltip-group {
  margin-bottom: 8px;
}
.tooltip-schema {
  font-weight: 600;
}
.tooltip-table {
  padding-left: 10px;
  line-height: 1.6;
  word-break: break-all;
}
.tooltip-unparseable {
  margin-top: 8px;
  padding: 6px 8px;
  background: var(--el-color-warning-light-9);
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-color-warning-dark-2);
}
.tooltip-unparseable-title {
  font-weight: 600;
}
.tooltip-unparseable-list {
  margin-top: 4px;
  word-break: break-all;
}
.target-tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
}
.more-tag {
  cursor: default;
}
.target-tooltip-list {
  max-height: 220px;
  overflow: auto;
}
.target-tooltip-item {
  line-height: 1.6;
}
.create-tag {
  margin-left: 6px;
}
</style>
