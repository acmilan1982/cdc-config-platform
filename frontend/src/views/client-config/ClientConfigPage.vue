<template>
  <div class="cc-page">
    <!-- 页面标题（CCFG-UI-001：统一“探针端管理”） -->
    <header class="cc-header">
      <h2 class="cc-title">探针端管理</h2>
    </header>

    <!-- 首次查询失败且从未成功：整区错误态 + 重试（CCFG-UI-012） -->
    <div v-if="firstLoadFailed" class="cc-page-state cc-page-state--error" role="alert">
      <p class="cc-page-state-title">列表加载失败</p>
      <p class="cc-page-state-desc">暂时无法获取探针列表，请重新加载或稍后重试。</p>
      <el-button type="primary" plain :loading="listLoading" @click="loadList">重新加载</el-button>
    </div>

    <template v-else>
      <!-- 查询区（CCFG-UI-003） -->
      <div class="cc-query">
        <el-input
          v-model="queryKeyword"
          class="cc-query-keyword"
          placeholder="探针 ID / 探针描述"
          clearable
          @keyup.enter="onQuery"
        />
        <el-select v-model="queryStatus" class="cc-query-status">
          <el-option label="全部" value="ALL" />
          <el-option label="启用" value="ENABLED" />
          <el-option label="停用" value="DISABLED" />
        </el-select>
        <el-button type="primary" @click="onQuery">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </div>

      <!-- 工具栏（CCFG-UI-004：新增 + 唯一删除所选 + 弱提示） -->
      <div class="cc-toolbar">
        <div class="cc-toolbar-left">
          <el-button type="primary" @click="openCreate">新增探针</el-button>
          <el-button :disabled="selectedClientId === null" :loading="deleteBusy" @click="onDelete">
            删除所选
          </el-button>
          <span v-if="selectedClientId !== null" class="cc-selected">已选择：{{ selectedClientId }}</span>
        </div>
        <span class="cc-hint">双击记录可编辑</span>
      </div>

      <!-- 已有成功结果后的刷新失败：非遮挡提示 + 按已生效条件重试（R1-05） -->
      <div v-if="refreshFailed" class="cc-refresh-warn" role="status">
        <span class="cc-refresh-text">刷新失败：当前仍展示上一次成功结果，请点击“重试”重新加载。</span>
        <el-button size="small" :loading="listLoading" @click="loadList">重试</el-button>
      </div>

      <!-- 数据表格（CCFG-UI-005，无操作列/无分页/无自动刷新） -->
      <el-table
        v-loading="listLoading"
        class="cc-table"
        :data="listRows"
        :row-class-name="rowClassName"
        empty-text="暂无符合条件的探针"
        @row-click="onRowClick"
        @row-dblclick="onRowDblClick"
      >
        <el-table-column label="探针 ID" min-width="140">
          <template #default="{ row }">
            <span
              class="cc-id"
              tabindex="0"
              role="button"
              :aria-label="`编辑探针 ${row.clientId}`"
              @keydown="onRowKeyEdit($event, row)"
            >{{ row.clientId }}</span>
          </template>
        </el-table-column>

        <el-table-column label="探针描述" min-width="200">
          <template #default="{ row }">
            <el-tooltip v-if="isBlankDesc(row)" content="未填写探针描述" placement="top">
              <span class="cc-desc cc-desc--empty">—</span>
            </el-tooltip>
            <el-tooltip v-else :content="String(row.clientDesc)" placement="top">
              <span class="cc-desc">{{ row.clientDesc }}</span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="采集数据源" min-width="340">
          <template #default="{ row }">
            <div class="cc-src">
              <el-tooltip v-if="isRowAmbiguous(row)" class="box-item" effect="dark" placement="top">
                <template #content>
                  <div class="cc-amb-tip">
                    <p class="cc-amb-reason">英文逗号既可能是分隔符、也可能属于数据源 ID，无法精确还原实际分配关系。</p>
                    <p class="cc-amb-raw">原始串：{{ row.rawDataSourceIds ?? '—' }}</p>
                    <p v-if="row.possibleCommaDataSourceIds.length" class="cc-amb-possible">
                      可能含逗号数据源 ID：{{ row.possibleCommaDataSourceIds.join('、') }}
                    </p>
                    <p class="cc-amb-note">本行机构标签与数据源数量为普通 CSV 解析的展示结果。</p>
                  </div>
                </template>
                <el-tag type="danger" size="small" class="cc-rowbad">含逗号歧义</el-tag>
              </el-tooltip>

              <el-tooltip
                v-for="ds in projectedShown(row)"
                :key="`${row.clientId}-${ds.dataSourceId}`"
                class="box-item"
                effect="dark"
                placement="top"
              >
                <template #content>
                  <div class="cc-ds-tip">
                    <div>{{ ds.org || ds.dataSourceId }}</div>
                    <div v-if="ds.dataSourceName">{{ ds.dataSourceName }}</div>
                    <div>数据源 ID：{{ ds.dataSourceId }}</div>
                    <div v-if="ds.anomalies.length" class="cc-ds-tip-bad">
                      {{ anomalyText(ds.anomalies, ds.conflictClientIds) }}
                    </div>
                  </div>
                </template>
                <el-tag
                  size="small"
                  :type="ds.anomalies.length ? 'danger' : 'info'"
                  :class="['cc-dstag', { 'cc-dstag--bad': ds.anomalies.length }]"
                >
                  {{ dsTagText(ds) }}
                </el-tag>
              </el-tooltip>

              <el-popover
                v-if="row.dataSources.length > DIRECT_COUNT"
                placement="top"
                :width="340"
                trigger="click"
              >
                <template #reference>
                  <el-tag size="small" class="cc-more">+{{ row.dataSources.length - DIRECT_COUNT }}</el-tag>
                </template>
                <div class="cc-full-list">
                  <p v-if="isRowAmbiguous(row)" class="cc-full-note">
                    以下为普通 CSV 解析的展示结果（行级含逗号歧义），非已确定分配。
                  </p>
                  <ul>
                    <li
                      v-for="ds in row.dataSources"
                      :key="`${row.clientId}-full-${ds.dataSourceId}`"
                      class="cc-full-item"
                    >
                      <span class="cc-full-org">{{ ds.org || ds.dataSourceId }}</span>
                      <span v-if="ds.anomalies.length" class="cc-full-bad">
                        [{{ anomalyText(ds.anomalies, ds.conflictClientIds) }}]
                      </span>
                      <span class="cc-full-id">{{ ds.dataSourceId }}</span>
                    </li>
                  </ul>
                </div>
              </el-popover>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="数据源数量" min-width="100">
          <template #default="{ row }">
            <span class="cc-count">{{ row.dataSourceCount }}</span>
            <el-tooltip
              v-if="isRowAmbiguous(row)"
              content="普通 CSV 解析的展示结果（行级含逗号歧义，非已确定分配）"
              placement="top"
            >
              <span class="cc-count-note">（展示）</span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column label="状态" min-width="140">
          <template #default="{ row }">
            <span class="cc-status-cell">
              <el-tag size="small" :type="statusType(row)" class="cc-state-tag">
                {{ statusText(row) }}
              </el-tag>
              <el-button
                v-if="canToggle(row, 'disable')"
                link
                type="primary"
                class="cc-op"
                :disabled="opBusy === `disable:${row.clientId}`"
                @click="onDisable(row)"
              >
                {{ opBusy === `disable:${row.clientId}` ? '停用中…' : '停用' }}
              </el-button>
              <el-button
                v-else-if="canToggle(row, 'enable')"
                link
                type="primary"
                class="cc-op"
                :disabled="opBusy === `enable:${row.clientId}`"
                @click="onEnable(row)"
              >
                {{ opBusy === `enable:${row.clientId}` ? '启用中…' : '启用' }}
              </el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 新增/编辑弹窗（CCFG-UI-013/014/015/016/017） -->
    <el-dialog
      v-model="dialogOpen"
      class="cc-dialog"
      :title="mode === 'edit' ? '编辑探针' : '新增探针'"
      width="680px"
      :close-on-click-modal="false"
      @closed="onDialogClosed"
    >
      <div class="cc-form">
        <div class="cc-form-item">
          <span class="cc-form-label">探针 ID</span>
          <div class="cc-form-control">
            <div class="cc-id-control">
              <el-input
                v-if="!clientIdLocked"
                v-model="clientIdDraft"
                placeholder="1~32 位字母、数字、点、下划线或连字符"
                :disabled="submitting"
              />
              <el-input v-else :model-value="clientIdDraft" disabled data-locked="true" />
              <span v-if="mode === 'edit' && clientIdLocked" class="cc-lock-hint">（已锁定）</span>
            </div>
            <el-button
              v-if="mode === 'edit'"
              link
              type="primary"
              class="cc-id-toggle"
              :disabled="submitting"
              @click="toggleClientIdLock"
            >
              {{ clientIdLocked ? '修改探针 ID' : '取消修改' }}
            </el-button>
          </div>
        </div>

        <div class="cc-form-item">
          <span class="cc-form-label">探针描述</span>
          <div class="cc-form-control cc-desc-row">
            <el-input
              v-model="clientDescDraft"
              type="textarea"
              :rows="2"
              placeholder="探针用途描述（UTF-8 原文不超过 1024 字节）"
              :disabled="submitting"
            />
            <el-button class="cc-autogen" @click="onAutoGenerate">
              自动生成
            </el-button>
          </div>
        </div>

        <div class="cc-form-item">
          <span class="cc-form-label">采集数据源</span>
          <div class="cc-form-control cc-source-field">
            <div class="cc-split">
              <!-- 候选池（CCFG-UI-016） -->
              <div class="cc-pane cc-pane--options">
                <p class="cc-pane-title">可选数据源</p>
                <el-input
                  v-model="optionSearch"
                  class="cc-search"
                  placeholder="按机构 / 名称 / ID 搜索"
                  clearable
                />
                <div class="cc-opt-list">
                  <p v-if="optionsLoadFailed" class="cc-state-mini cc-state-mini--err">
                    数据源候选加载失败，请稍后重试
                  </p>
                  <p v-else-if="optionsLoading" class="cc-state-mini">候选加载中…</p>
                  <p v-else-if="options.length === 0" class="cc-state-mini">无可选数据源</p>
                  <p v-else-if="filteredOptions.length === 0" class="cc-state-mini">未找到匹配数据源</p>
                  <template v-else>
                    <button
                      v-for="opt in filteredOptions"
                      :key="opt.dataSourceId"
                      type="button"
                      class="cc-opt"
                      :class="{
                        'cc-opt--disabled': !opt.selectable,
                        'cc-opt--chosen': isChosen(opt.dataSourceId),
                      }"
                      :disabled="!opt.selectable || isChosen(opt.dataSourceId)"
                      :title="optTitle(opt)"
                      @click="addOption(opt)"
                    >
                      <span class="cc-opt-main">{{ opt.org || opt.dataSourceId }}</span>
                      <span class="cc-opt-sub">
                        {{ opt.dataSourceName }}{{ opt.dataSourceName ? ' · ' : '' }}{{ opt.dataSourceId }}
                      </span>
                      <span v-if="!opt.selectable && opt.notSelectableReason === 'COMMA_IN_ID'" class="cc-opt-reason">
                        ID 含英文逗号，不可选择
                      </span>
                      <span v-else-if="!opt.selectable && opt.notSelectableReason === 'OCCUPIED'" class="cc-opt-reason">
                        已分配给：{{ opt.occupiedByClientIds.join('、') }}
                      </span>
                    </button>
                  </template>
                </div>
              </div>

              <!-- 已选区域（CCFG-UI-014/016：异常项红色回显，可移除） -->
              <div class="cc-pane cc-pane--chosen">
                <p class="cc-pane-title">已选（{{ chosen.length }}）</p>
                <div class="cc-chosen-list">
                  <el-tag
                    v-for="(chip, idx) in chosen"
                    :key="`${chip.dataSourceId}-${idx}`"
                    closable
                    size="small"
                    :type="chip.anomalies.length ? 'danger' : 'info'"
                    :class="['cc-chip', { 'cc-chip--bad': chip.anomalies.length }]"
                    :disable-transitions="true"
                    @close="removeChip(idx)"
                  >
                    {{ chipText(chip) }}
                  </el-tag>
                  <p v-if="chosen.length === 0" class="cc-state-mini">尚未选择数据源</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p v-if="saveBlockReason" class="cc-save-hint" role="note">{{ saveBlockReason }}</p>

      <template #footer>
        <el-button :disabled="submitting" @click="dialogOpen = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="saveBlockReason !== null || submitting"
          :loading="submitting"
          @click="submitDialog"
        >
          {{ mode === 'edit' ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createClient,
  deleteClient,
  disableClient,
  enableClient,
  fetchClientList,
  fetchDataSourceOptions,
  updateClient,
} from '@/api/clientConfig'
import type { ClientListItemVO, ClientStatusFilter, DataSourceOptionVO } from '@/types/clientConfig'

const DIRECT_COUNT = 3

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/

const ANOMALY_TEXT: Record<string, string> = {
  INACTIVE: '已停用',
  NOT_FOUND: '不存在',
  CATEGORY_MISMATCH: '类别非 SOURCE',
  TYPE_MISMATCH: '类型非 ORACLE',
  COMMA_IN_ID: 'ID 含英文逗号',
  DUPLICATE_IN_ROW: '行内重复',
  ASSIGNED_TO_MULTIPLE_CLIENTS: '已分配给他人',
}

/** 与后端 String.trim() 一致的空白判定（移除两端 charCode <= 0x20 字符）。 */
function javaTrim(value: string): string {
  let start = 0
  let end = value.length
  while (start < end && value.charCodeAt(start) <= 0x20) start += 1
  while (end > start && value.charCodeAt(end - 1) <= 0x20) end -= 1
  return value.slice(start, end)
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).length
}

function anomalyText(anomalies: string[], conflictClientIds: string[]): string {
  return anomalies
    .map((a) => {
      if (a === 'ASSIGNED_TO_MULTIPLE_CLIENTS') {
        const owners = conflictClientIds.length ? `：${conflictClientIds.join('、')}` : ''
        return `${ANOMALY_TEXT[a]}${owners}`
      }
      return ANOMALY_TEXT[a] ?? a
    })
    .join('；')
}

function isBlankDesc(row: ClientListItemVO): boolean {
  return row.clientDesc === null || javaTrim(row.clientDesc).length === 0
}

function isRowAmbiguous(row: ClientListItemVO): boolean {
  return row.rowAnomalies.includes('COMMA_PROTOCOL_AMBIGUOUS')
}

/** 项级异常优先、组内保持接口原顺序的非持久化前三项投影（CCFG-UI-010，不改原数组）。 */
function projectedShown(row: ClientListItemVO): ClientListItemVO['dataSources'] {
  const abnormal = row.dataSources.filter((d) => d.anomalies.length > 0)
  const normal = row.dataSources.filter((d) => d.anomalies.length === 0)
  return [...abnormal, ...normal].slice(0, DIRECT_COUNT)
}

function dsTagText(ds: ClientListItemVO['dataSources'][number]): string {
  if (ds.anomalies.length) {
    return `${ds.dataSourceId}（${anomalyText(ds.anomalies, ds.conflictClientIds)}）`
  }
  const org = (ds.org ?? '').trim()
  return org.length ? org : ds.dataSourceId
}

function statusText(row: ClientListItemVO): string {
  if (row.fgActive === '1') return '启用'
  if (row.fgActive === '0') return '停用'
  return `异常（原始值=${row.fgActive}）`
}

function statusType(row: ClientListItemVO): 'success' | 'info' | 'danger' {
  if (row.fgActive === '1') return 'success'
  if (row.fgActive === '0') return 'info'
  return 'danger'
}

function canToggle(row: ClientListItemVO, action: 'enable' | 'disable'): boolean {
  if (action === 'disable') return row.fgActive === '1' || row.fgActive !== '0'
  return row.fgActive === '0'
}

// ------------------------------------------------------------------ 列表状态

const listRows = ref<ClientListItemVO[]>([])
const listLoading = ref(false)
const listLoadedOnce = ref(false)
const listFailed = ref(false)
let listSeq = 0
const selectedClientId = ref<string | null>(null)

const queryKeyword = ref('')
const queryStatus = ref<ClientStatusFilter>('ALL')
const appliedKeyword = ref<string | undefined>(undefined)
const appliedStatus = ref<ClientStatusFilter>('ALL')

const firstLoadFailed = computed(
  () => listFailed.value && !listLoadedOnce.value && listRows.value.length === 0,
)

/** 已有成功结果后再次查询/刷新失败：保留旧列表，在表格上方给出非遮挡提示（R1-05）。 */
const refreshFailed = computed(() => listFailed.value && listLoadedOnce.value)

const rowClassName = ({ row }: { row: ClientListItemVO }) =>
  selectedClientId.value === row.clientId ? 'cc-row--selected' : ''

function onRowClick(row: ClientListItemVO): void {
  selectedClientId.value = row.clientId
}

function onRowDblClick(row: ClientListItemVO): void {
  openEdit(row)
}

/** 探针 ID 单元格键盘编辑入口：Enter / Space 打开编辑，阻止 Space 页面滚动（R1-06）。 */
function onRowKeyEdit(event: KeyboardEvent, row: ClientListItemVO): void {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  if (dialogOpen.value) return
  openEdit(row)
}

function onQuery(): void {
  const keyword = javaTrim(queryKeyword.value)
  appliedKeyword.value = keyword.length ? keyword : undefined
  appliedStatus.value = queryStatus.value
  void loadList()
}

function onReset(): void {
  queryKeyword.value = ''
  queryStatus.value = 'ALL'
  // 恢复默认条件；不自动触发查询、不覆盖当前已生效列表（CCFG-UI-003）
}

async function loadList(): Promise<void> {
  const seq = ++listSeq
  listLoading.value = true
  listFailed.value = false
  try {
    const res = await fetchClientList({ keyword: appliedKeyword.value, status: appliedStatus.value })
    if (seq !== listSeq) return
    if (res.code === 200) {
      listRows.value = res.data?.items ?? []
      listLoadedOnce.value = true
      if (
        selectedClientId.value !== null &&
        !listRows.value.some((r) => r.clientId === selectedClientId.value)
      ) {
        selectedClientId.value = null
      }
    } else {
      listFailed.value = true
    }
  } catch (e) {
    if (seq !== listSeq) return
    listFailed.value = true
  } finally {
    if (seq === listSeq) listLoading.value = false
  }
}

function onDialogClosed(): void {
  // 弹窗关闭仅保留当前选中行，不做其他副作用
}

// ------------------------------------------------------------------ 删除

const deleteBusy = ref(false)

async function onDelete(): Promise<void> {
  const clientId = selectedClientId.value
  if (clientId === null || deleteBusy.value) return
  try {
    await ElMessageBox.confirm(`确定删除探针 ${clientId} 吗？该操作不可恢复。`, '删除探针', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch (e) {
    return
  }
  deleteBusy.value = true
  try {
    const res = await deleteClient(clientId)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      selectedClientId.value = null
      await loadList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    ElMessage.error('删除失败，请检查网络后重试。')
  } finally {
    deleteBusy.value = false
  }
}

// ------------------------------------------------------------------ 启停

const opBusy = ref<string | null>(null)

async function onEnable(row: ClientListItemVO): Promise<void> {
  const key = `enable:${row.clientId}`
  if (opBusy.value) return
  opBusy.value = key
  try {
    const res = await enableClient(row.clientId)
    if (res.code === 200) {
      ElMessage.success('启用成功')
      await loadList()
    } else {
      ElMessage.error(res.message || '启用失败')
    }
  } catch (e) {
    ElMessage.error('启用失败，请检查网络后重试。')
  } finally {
    opBusy.value = null
  }
}

async function onDisable(row: ClientListItemVO): Promise<void> {
  const key = `disable:${row.clientId}`
  if (opBusy.value) return
  try {
    await ElMessageBox.confirm(
      `确定停用探针 ${row.clientId} 吗？停用后该探针不再按启用状态命中。`,
      '停用探针',
      {
        confirmButtonText: '停用',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
  } catch (e) {
    return
  }
  opBusy.value = key
  try {
    const res = await disableClient(row.clientId)
    if (res.code === 200) {
      ElMessage.success('停用成功')
      await loadList()
    } else {
      ElMessage.error(res.message || '停用失败')
    }
  } catch (e) {
    ElMessage.error('停用失败，请检查网络后重试。')
  } finally {
    opBusy.value = null
  }
}

// ------------------------------------------------------------------ 弹窗表单

interface ChosenItem {
  dataSourceId: string
  org: string | null
  dataSourceName: string | null
  anomalies: string[]
  conflictClientIds: string[]
}

const dialogOpen = ref(false)
const mode = ref<'create' | 'edit' | null>(null)
const editRow = ref<ClientListItemVO | null>(null)
const clientIdLocked = ref(true)
const clientIdDraft = ref('')
const clientDescDraft = ref('')
const chosen = ref<ChosenItem[]>([])
const optionSearch = ref('')
const submitting = ref(false)

const options = ref<DataSourceOptionVO[]>([])
const optionsLoading = ref(false)
const optionsLoadFailed = ref(false)
let optionSeq = 0

function optTitle(opt: DataSourceOptionVO): string {
  return `${opt.org || opt.dataSourceId}（${opt.dataSourceName ?? ''}）${opt.dataSourceId}`
}

function isChosen(id: string): boolean {
  return chosen.value.some((c) => c.dataSourceId === id)
}

function addOption(opt: DataSourceOptionVO): void {
  if (!opt.selectable || isChosen(opt.dataSourceId)) return
  chosen.value.push({
    dataSourceId: opt.dataSourceId,
    org: opt.org,
    dataSourceName: opt.dataSourceName,
    anomalies: [],
    conflictClientIds: [],
  })
}

function removeChip(index: number): void {
  chosen.value.splice(index, 1)
}

function chipText(chip: ChosenItem): string {
  if (chip.anomalies.length) {
    return `${chip.dataSourceId}（${anomalyText(chip.anomalies, chip.conflictClientIds)}）`
  }
  const org = (chip.org ?? '').trim()
  return org.length ? org : chip.dataSourceId
}

const filteredOptions = computed(() => {
  const term = javaTrim(optionSearch.value).toLowerCase()
  if (!term) return options.value
  return options.value.filter((o) =>
    `${o.org ?? ''} ${o.dataSourceName ?? ''} ${o.dataSourceId}`.toLowerCase().includes(term),
  )
})

function openCreate(): void {
  resetDialog()
  mode.value = 'create'
  clientIdLocked.value = false
  dialogOpen.value = true
  void loadOptions()
}

function openEdit(row: ClientListItemVO): void {
  resetDialog()
  mode.value = 'edit'
  editRow.value = row
  clientIdLocked.value = true
  clientIdDraft.value = row.clientId
  clientDescDraft.value = row.clientDesc ?? ''
  chosen.value = row.dataSources.map((d) => ({
    dataSourceId: d.dataSourceId,
    org: d.org,
    dataSourceName: d.dataSourceName,
    anomalies: d.anomalies ?? [],
    conflictClientIds: d.conflictClientIds ?? [],
  }))
  dialogOpen.value = true
  void loadOptions(row.clientId)
}

function resetDialog(): void {
  mode.value = null
  editRow.value = null
  clientIdLocked.value = true
  clientIdDraft.value = ''
  clientDescDraft.value = ''
  chosen.value = []
  optionSearch.value = ''
  submitting.value = false
  options.value = []
  optionsLoading.value = false
  optionsLoadFailed.value = false
  optionSeq += 1
}

async function loadOptions(excludeClientId?: string): Promise<void> {
  const seq = ++optionSeq
  optionsLoading.value = true
  optionsLoadFailed.value = false
  try {
    const res = await fetchDataSourceOptions(excludeClientId)
    if (seq !== optionSeq) return
    if (res.code === 200) {
      options.value = res.data ?? []
    } else {
      optionsLoadFailed.value = true
    }
  } catch (e) {
    if (seq !== optionSeq) return
    optionsLoadFailed.value = true
  } finally {
    if (seq === optionSeq) optionsLoading.value = false
  }
}

function toggleClientIdLock(): void {
  if (clientIdLocked.value) {
    // 解锁编辑探针 ID：不弹修改前警告（CCFG-UI-014）
    clientIdLocked.value = false
  } else {
    // 取消修改：恢复原探针 ID 并回到只读
    if (editRow.value) clientIdDraft.value = editRow.value.clientId
    clientIdLocked.value = true
  }
}

/** 编辑歧义行：选择集与原始 CSV 解析结果完全一致时视为“尚未清除歧义”。 */
const ambiguityNotCleared = computed(() => {
  if (mode.value !== 'edit' || editRow.value === null) return false
  if (!isRowAmbiguous(editRow.value)) return false
  const originalIds = editRow.value.dataSources.map((d) => d.dataSourceId)
  const currentIds = chosen.value.map((c) => c.dataSourceId)
  return originalIds.length === currentIds.length && originalIds.every((id, i) => id === currentIds[i])
})

const hasAnomalousChosen = computed(() => chosen.value.some((c) => c.anomalies.length > 0))

const saveBlockReason = computed<string | null>(() => {
  if (chosen.value.length === 0) return '至少选择 1 个数据源'
  // 行级含逗号歧义优先于项级异常提示：歧义是根因，项级异常多为歧义解析的派生结果
  if (mode.value === 'edit' && ambiguityNotCleared.value) {
    return '原配置含英文逗号歧义：请移除歧义展示项并重新选择合法候选后再保存'
  }
  if (mode.value === 'edit' && hasAnomalousChosen.value) {
    return '存在异常数据源（见红色标记），请先移除异常项后再保存'
  }
  return null
})

function onAutoGenerate(): void {
  if (chosen.value.length === 0) {
    // 无已选数据源 → 严格无动作：不清空、不改写、不提示（CCFG-UI-015）
    return
  }
  const missing = chosen.value.find((c) => (c.org ?? '').trim().length === 0)
  if (missing) {
    ElMessage.warning(`数据源（${missing.dataSourceId}）无机构名称，自动生成失败。`)
    return
  }
  const generated = chosen.value.map((c) => (c.org ?? '').trim()).join(',')
  if (javaTrim(generated).length === 0) {
    ElMessage.warning('自动生成失败：结果为空白。')
    return
  }
  if (utf8Bytes(generated) > 1024) {
    ElMessage.warning('自动生成失败：生成描述超过 1024 字节（UTF-8）。')
    return
  }
  clientDescDraft.value = generated
}

async function submitDialog(): Promise<void> {
  if (mode.value === null || submitting.value || saveBlockReason.value !== null) return
  const finalClientId = javaTrim(clientIdDraft.value)
  if (finalClientId.length === 0) {
    ElMessage.warning('探针 ID 不能为空。')
    return
  }
  if (!ID_PATTERN.test(finalClientId)) {
    ElMessage.warning('探针 ID 格式不正确：须为 1~32 位字母、数字、点、下划线或连字符，且以字母或数字开头。')
    return
  }
  const desc = clientDescDraft.value
  if (javaTrim(desc).length === 0) {
    ElMessage.warning('探针描述不能为空。')
    return
  }
  if (utf8Bytes(desc) > 1024) {
    ElMessage.warning('探针描述去除首尾空白后非空，但原文超过 1024 字节（UTF-8），请缩短后再保存。')
    return
  }
  const request = {
    clientId: finalClientId,
    clientDesc: desc,
    dataSourceIds: chosen.value.map((c) => c.dataSourceId),
  }
  const originalClientId = editRow.value?.clientId
  const isEdit = mode.value === 'edit'
  submitting.value = true
  try {
    const res =
      isEdit && originalClientId
        ? await updateClient(originalClientId, request)
        : await createClient(request)
    if (res.code === 200) {
      ElMessage.success(isEdit ? '编辑成功' : '新增成功')
      dialogOpen.value = false
      if (isEdit && selectedClientId.value === originalClientId) {
        selectedClientId.value = request.clientId
      }
      await loadList()
    } else {
      ElMessage.error(res.message || (isEdit ? '编辑失败' : '新增失败'))
    }
  } catch (e) {
    ElMessage.error(isEdit ? '编辑失败，请检查网络后重试。' : '新增失败，请检查网络后重试。')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  void loadList()
})
</script>

<style scoped>
.cc-page {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cc-header {
  flex-shrink: 0;
}

.cc-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.cc-page-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 40px 0;
}

.cc-page-state--error {
  color: #909399;
}

.cc-page-state-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.cc-page-state-desc {
  margin: 0 0 6px;
  font-size: 13px;
  color: #909399;
}

.cc-query {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cc-query-keyword {
  width: 240px;
}

.cc-query-status {
  width: 120px;
}

.cc-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cc-toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cc-selected {
  margin-left: 4px;
  font-size: 13px;
  color: #606266;
}

.cc-hint {
  font-size: 13px;
  color: #909399;
}

.cc-refresh-warn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  border: 1px solid #e6a23c;
  border-radius: 6px;
  background: #fdf6ec;
  font-size: 13px;
  color: #b88230;
}

.cc-refresh-text {
  flex: 1;
  min-width: 0;
}

.cc-row--selected :deep(td) {
  background-color: #f0f7ff;
}

.cc-desc {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

.cc-desc--empty {
  color: #909399;
}

.cc-src {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
}

.cc-dstag {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cc-dstag--bad {
  border-color: var(--el-color-danger);
  color: var(--el-color-danger);
}

.cc-more {
  background: #ecf5ff;
  border-color: #b3d8ff;
  color: #409eff;
  cursor: pointer;
}

.cc-rowbad {
  flex-shrink: 0;
}

.cc-ds-tip {
  max-width: 300px;
  font-size: 12px;
  line-height: 1.5;
}

.cc-ds-tip-bad {
  color: #f56c6c;
}

.cc-amb-tip {
  max-width: 320px;
  font-size: 12px;
  line-height: 1.5;
}

.cc-amb-reason {
  margin: 0 0 4px;
}

.cc-amb-raw,
.cc-amb-possible,
.cc-amb-note {
  margin: 2px 0;
  word-break: break-all;
}

.cc-amb-note {
  color: #c0c4cc;
}

.cc-full-list {
  max-height: 320px;
  overflow-y: auto;
}

.cc-full-list ul {
  margin: 4px 0;
  padding-left: 16px;
}

.cc-full-item {
  line-height: 1.6;
}

.cc-full-note {
  margin: 0 0 4px;
  font-size: 12px;
  color: #e6a23c;
}

.cc-full-org {
  font-weight: 600;
}

.cc-full-bad {
  color: #f56c6c;
  margin: 0 6px;
}

.cc-full-id {
  color: #909399;
  font-size: 12px;
}

.cc-count-note {
  margin-left: 2px;
  font-size: 12px;
  color: #e6a23c;
}

.cc-status-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.cc-op {
  padding: 0;
}

.cc-dialog :deep(.el-dialog__body) {
  padding-top: 8px;
}

.cc-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  /* CCFG-UI-024：内容区相对视口安全高度，超出内部纵向滚动 */
  max-height: calc(100vh - 240px);
  overflow-y: auto;
}

.cc-form-item {
  display: flex;
  align-items: flex-start;
}

.cc-form-label {
  flex: 0 0 84px;
  padding-top: 6px;
  font-size: 14px;
  color: #606266;
}

.cc-form-label::before {
  content: '*';
  color: #f56c6c;
  margin-right: 2px;
}

.cc-form-control {
  flex: 1;
  min-width: 0;
}

.cc-id-control {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.cc-lock-hint {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.cc-id-toggle {
  margin-left: 4px;
  white-space: nowrap;
}

.cc-desc-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.cc-desc-row :deep(.el-textarea) {
  flex: 1;
}

.cc-autogen {
  flex-shrink: 0;
}

.cc-source-field {
  width: 100%;
}

.cc-split {
  display: flex;
  gap: 10px;
  width: 100%;
}

.cc-pane {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
  padding: 8px;
  flex: 1;
  min-width: 0;
}

.cc-pane-title {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  color: #303133;
}

.cc-search {
  margin-bottom: 6px;
}

.cc-opt-list {
  max-height: 200px;
  overflow-y: auto;
}

.cc-opt {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 4px;
  padding: 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  line-height: 1.4;
}

.cc-opt:hover:not(:disabled) {
  border-color: #409eff;
}

.cc-opt:disabled {
  cursor: not-allowed;
  opacity: 0.65;
  background: #f4f4f5;
  color: #a8abb2;
}

.cc-opt--chosen {
  opacity: 0.5;
}

.cc-opt-main {
  font-size: 13px;
  color: #303133;
  font-weight: 600;
}

.cc-opt-sub {
  font-size: 12px;
  color: #909399;
}

.cc-opt-reason {
  font-size: 12px;
  color: #e6a23c;
  margin-top: 2px;
}

.cc-state-mini {
  margin: 8px 0;
  font-size: 13px;
  color: #909399;
}

.cc-state-mini--err {
  color: #f56c6c;
}

.cc-pane--chosen .cc-chosen-list {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.cc-chip {
  max-width: 100%;
}

.cc-chip--bad {
  border-color: var(--el-color-danger);
}

.cc-save-hint {
  margin: 10px 0 0;
  font-size: 13px;
  color: #f56c6c;
}
</style>
