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
              :label="`${s.dataSourceId}（${s.dataSourceOrg}）`"
            />
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
              :label="`${t.dataSourceId}（${t.dataSourceOrg}）`"
            />
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
            <span v-else>{{ row.dataSubDesc }}</span>
          </template>
        </el-table-column>
        <el-table-column label="源库" min-width="140">
          <template #default="{ row }">
            <template v-if="row.source">
              <span>{{ describeRef(row.source) }}</span>
              <span class="ref-id" :title="row.source.dataSourceId">{{ row.source.dataSourceId }}</span>
              <el-tag v-if="refStatusLabel(row.source.status)" size="small" type="warning">
                {{ refStatusLabel(row.source.status) }}
              </el-tag>
            </template>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="源表" min-width="160">
          <template #default="{ row }">
            <template v-if="!row.anomalyMultiSource">
              <el-tooltip placement="top">
                <template #content>
                  <div class="tooltip-content">
                    <div v-for="group in row.tablesBySchema" :key="group.schema" class="tooltip-group">
                      <div class="tooltip-schema">{{ group.schema }}</div>
                      <div class="tooltip-tables">{{ group.tables.join('、') }}</div>
                    </div>
                  </div>
                </template>
                <span class="table-count">共 {{ row.sourceTableCount }} 张</span>
              </el-tooltip>
              <div v-if="row.rawUnparseableTables.length > 0" class="unparseable-zone">
                <div class="unparseable-title">以下片段无法解析：</div>
                <div class="unparseable-list">{{ row.rawUnparseableTables.join('、') }}</div>
              </div>
            </template>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="目标库" min-width="160">
          <template #default="{ row }">
            <template v-if="row.targets.length > 0">
              <div class="target-tags">
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
                <el-tag
                  v-if="row.targets.length > TARGET_FOLD_THRESHOLD"
                  size="small"
                  class="fold-tag"
                  @click="toggleTargets(row.dataSubId)"
                >
                  {{ isTargetsExpanded(row.dataSubId) ? '收起' : `+${row.targets.length - TARGET_FOLD_THRESHOLD}` }}
                </el-tag>
              </div>
            </template>
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
              <el-button link type="primary" @click="openDetail(row)">详情</el-button>
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  fetchSubscriptionList,
  fetchSubscriptionOptions,
} from '@/api/subscription'
import type {
  QueryWarningVO,
  SubscriptionListQuery,
  SubscriptionOptionsVO,
  SubscriptionRowVO,
  TargetRefVO,
} from '@/types/subscription'
import { describeRef, refStatusLabel, resolveUpdateTime } from './utils/subscriptionFormat'
import SubscribeDetailDialog from './components/SubscribeDetailDialog.vue'
import SubscribeDeleteDialog from './components/SubscribeDeleteDialog.vue'
import SubscribeFormDialog from './components/SubscribeFormDialog.vue'

/** 目标库标签折叠阈值（紧凑展示，命名常量而非散落数字）。 */
const TARGET_FOLD_THRESHOLD = 2

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

// 普通 Set 的 add/delete 不会触发 Vue 重渲染，必须用 reactive 集合才能让折叠开关生效。
const expandedTargetRows = reactive(new Set<string>())

function messageOf(e: unknown): string {
  return e && typeof e === 'object' && 'message' in e
    ? ((e as { message?: string }).message ?? '查询失败')
    : '查询失败'
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

function visibleTargets(row: SubscriptionRowVO): TargetRefVO[] {
  if (row.targets.length <= TARGET_FOLD_THRESHOLD || isTargetsExpanded(row.dataSubId)) {
    return row.targets
  }
  return row.targets.slice(0, TARGET_FOLD_THRESHOLD)
}

function isTargetsExpanded(dataSubId: string): boolean {
  return expandedTargetRows.has(dataSubId)
}

function toggleTargets(dataSubId: string) {
  if (expandedTargetRows.has(dataSubId)) {
    expandedTargetRows.delete(dataSubId)
  } else {
    expandedTargetRows.add(dataSubId)
  }
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
  width: 260px;
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
.ref-id {
  margin-left: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.table-count {
  color: var(--el-color-primary);
  font-weight: 600;
  cursor: pointer;
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
.tooltip-tables {
  word-break: break-all;
}
.unparseable-zone {
  margin-top: 4px;
  padding: 4px 6px;
  background: var(--el-color-warning-light-9);
  border-radius: 4px;
  font-size: 12px;
  color: var(--el-color-warning-dark-2);
  max-height: 72px;
  overflow: auto;
}
.unparseable-title {
  font-weight: 600;
}
.unparseable-list {
  word-break: break-all;
}
.target-tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.fold-tag {
  cursor: pointer;
}
.create-tag {
  margin-left: 6px;
}
</style>
