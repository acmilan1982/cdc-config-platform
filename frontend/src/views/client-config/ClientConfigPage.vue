<template>
  <!-- 页面外壳、查询区容器、查询/重置动作与结果卡片来自查询列表页模板的四个公共组件
       （CCFG-REQ-091/CCFG-DESIGN-038）：本页只持有 Feature 文案、查询草稿与生效条件、
       请求与错误语义、表格与行操作、三个业务弹窗。默认槽内容逐一成为 .ql-page 直接子节点。 -->
  <QueryListPageShell
    title="探针端管理"
    description="维护 sync-client 探针及其采集数据源配置"
  >
    <!-- 查询区：探针信息 + 探针状态，操作组由公共查询/重置动作组件提供；本页无刷新能力（CCFG-UI-033） -->
    <QueryListQueryPanel>
      <div class="cc-q-group">
        <span class="cc-q-label">探针信息</span>
        <el-input
          v-model="queryKeyword"
          class="cc-q-keyword"
          placeholder="请输入探针 ID 或探针描述"
          clearable
          @keyup.enter="onQuery"
        />
      </div>
      <div class="cc-q-group">
        <span class="cc-q-label">探针状态</span>
        <el-select v-model="queryStatus" class="cc-q-status">
          <el-option label="全部" value="ALL" />
          <el-option label="启用" value="ENABLED" />
          <el-option label="停用" value="DISABLED" />
        </el-select>
      </div>
      <template #actions>
        <QueryListActions :query-loading="listLoading" @query="onQuery" @reset="onReset" />
      </template>
    </QueryListQueryPanel>

    <!-- 结果区：头部（左摘要 / 最右“新增探针”）→ 固定错误槽 → 固定分隔线 → 表格 body -->
    <QueryListResultPanel v-loading="listLoading">
      <template #summary>
        <span class="cc-result-count">共 {{ listRows.length }} 条</span>
      </template>
      <template #toolbar>
        <el-button class="cc-btn-add" @click="openCreate">
          <el-icon class="cc-btn-icon"><Plus /></el-icon>新增探针
        </el-button>
      </template>
      <template #error>
        <div v-if="listFailed" class="cc-load-error" role="alert">
          <span class="cc-load-error-text">列表加载失败，请重试。</span>
          <el-button size="small" :loading="listLoading" @click="loadList">重试</el-button>
        </div>
      </template>
      <template #body>
        <!-- 主列表显式接入列表表格视觉模板（根类 + scoped 预设），弹窗内表格不接入（CCFG-REQ-099）。
             行单击切换“唯一一行固定选中”（页面会话内本地状态），行双击进入编辑，二者按
             CCFG-DESIGN-078 的判定规则协调；固定选中行以 row-class-name 加类，不改行内结构。 -->
        <el-table
          class="cc-table"
          :class="[LT_MAIN_TABLE_CLASS]"
          :data="listRows"
          empty-text="暂无符合条件的探针"
          :row-class-name="rowClassName"
          @row-click="onRowClick"
          @row-dblclick="onRowDblClick"
        >
          <el-table-column label="序号" width="70" align="center" class-name="cc-col-seq">
            <template #default="{ $index }">
              <span class="cc-seq">{{ $index + 1 }}</span>
            </template>
          </el-table-column>

          <el-table-column label="探针 ID" width="176" class-name="cc-col-id">
            <template #default="{ row }">
              <div class="cc-id-cell">
                <span
                  class="cc-id"
                  tabindex="0"
                  role="button"
                  :aria-label="`编辑探针 ${row.clientId}`"
                  @keydown="onRowKeyEdit($event, row)"
                  @mouseenter="onIdEnter($event, row)"
                  @mouseleave="onTipLeave"
                >{{ row.clientId }}</span>
                <!-- FG_ACTIVE 三态：'1' 不显示；'0' 显示与数据源管理“数据源 ID”同款“停用”标识；
                     其余历史异常值显示红色 `异常：{原始值}`（CCFG-UI-031/CCFG-UI-035）。
                     异常标识自带悬停 Tooltip，属真行内交互控件：其 click/dblclick 不冒泡到行，
                     既不切换固定选中也不误触发行双击编辑（CCFG-DESIGN-079/CCFG-UI-067）。 -->
                <span v-if="idState(row) === 'off'" class="cc-inactive-mark">停用</span>
                <span
                  v-else-if="idState(row) === 'abnormal'"
                  class="cc-abnormal-mark"
                  @mouseenter="onAbnormalEnter($event, row)"
                  @mouseleave="onTipLeave"
                  @click.stop
                  @dblclick.stop
                >{{ abnormalBadgeText(row) }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="探针描述" width="300">
            <template #default="{ row }">
              <span
                class="cc-desc"
                :class="{ 'cc-desc--empty': isBlankDesc(row) }"
                @mouseenter="onDescEnter($event, row)"
                @mouseleave="onTipLeave"
              >{{ isBlankDesc(row) ? '—' : row.clientDesc }}</span>
            </template>
          </el-table-column>

          <el-table-column label="采集数据源" min-width="260">
            <template #default="{ row }">
              <div
                class="cc-src"
                :data-client-id="row.clientId"
                :ref="(el) => setSrcEl(el as HTMLElement | null, row.clientId)"
              >
                <span
                  v-if="isRowAmbiguous(row)"
                  class="cc-rowbad"
                  @mouseenter="onTipEnter($event, tipForRowbad(row))"
                  @mouseleave="onTipLeave"
                  @click.stop
                  @dblclick.stop
                ><span class="cc-txt">含逗号歧义</span></span>

                <span
                  v-for="(ds, idx) in orderedSources(row)"
                  :key="`${row.clientId}-${ds.dataSourceId}-${idx}`"
                  v-show="idx < shownCount(row)"
                  class="cc-dstag"
                  :class="`cc-dstag--${dsTagState(row, ds)}`"
                  @mouseenter="onTipEnter($event, tipForDs(ds))"
                  @mouseleave="onTipLeave"
                  @click.stop
                  @dblclick.stop
                ><span class="cc-txt">{{ dsBodyText(ds) }}</span></span>

                <!-- `+N` 与数据源标签 Tooltip 触发器等真行内交互控件的 click/dblclick 不冒泡到行，
                     不切换固定选中、也不误触发行双击编辑（CCFG-DESIGN-079/CCFG-UI-067）。 -->
                <el-popover
                  v-if="hiddenCount(row) > 0"
                  placement="top"
                  :width="380"
                  trigger="click"
                  :popper-options="FULL_LIST_POPPER_OPTIONS"
                  @show="clearTip"
                >
                  <template #reference>
                    <span
                      class="cc-more"
                      @click.stop
                      @dblclick.stop
                    ><span class="cc-txt">+{{ hiddenCount(row) }}</span></span>
                  </template>
                  <div class="cc-full-list">
                    <p v-if="isRowAmbiguous(row)" class="cc-full-note">
                      以下为普通 CSV 解析的展示结果（行级含逗号歧义），非已确定分配。
                    </p>
                    <ul>
                      <!-- 两级信息（CCFG-REQ-113/CCFG-DESIGN-054）：主行为机构名称，次行以可见前缀
                           `数据源 ID：` 引导完整原始 ID；机构名缺失时只把原始 ID 放主行，不再重复次行 -->
                      <li
                        v-for="ds in row.dataSources"
                        :key="`${row.clientId}-full-${ds.dataSourceId}`"
                        class="cc-full-item"
                      >
                        <span class="cc-full-org">{{ hasOrg(ds) ? ds.org : ds.dataSourceId }}</span>
                        <span v-if="hasOrg(ds)" class="cc-full-id">数据源 ID：{{ ds.dataSourceId }}</span>
                        <span v-if="ds.anomalies.length" class="cc-full-bad">
                          {{ anomalyText(ds.anomalies, ds.conflictClientIds) }}
                        </span>
                      </li>
                    </ul>
                  </div>
                </el-popover>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="数据源数量" width="110" align="center">
            <template #default="{ row }">
              <span class="cc-count">{{ row.dataSourceCount }}</span>
              <span
                v-if="isRowAmbiguous(row)"
                class="cc-count-note"
                @mouseenter="onTipEnter($event, { lines: [{ text: '普通 CSV 解析的展示结果（行级含逗号歧义，非已确定分配）', tone: 'muted' }] })"
                @mouseleave="onTipLeave"
                @click.stop
                @dblclick.stop
              >（展示）</span>
            </template>
          </el-table-column>

          <!-- 最右固定“操作”列：唯一入口为水平三点图标（CCFG-UI-040）；入口与菜单的 click/dblclick
               均不冒泡到行双击，菜单靠右对齐以避免贴近右边缘时被裁切（CCFG-UI-041） -->
          <el-table-column label="操作" width="110" fixed="right">
            <template #default="{ row }">
              <el-dropdown
                trigger="click"
                placement="bottom-end"
                popper-class="cc-more-popper"
                @command="(command: string) => onRowCommand(command, row)"
                @click.stop
                @dblclick.stop
              >
                <span
                  class="cc-more-link"
                  role="button"
                  tabindex="0"
                  :aria-label="`更多操作：${row.clientId}`"
                  @click.stop
                  @dblclick.stop
                >
                  <el-icon class="cc-more-icon"><MoreFilled /></el-icon>
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <!-- 条目顺序固定为先“停用/启用”、后“删除”；历史异常行只提供“停用”与“删除”；
                         “删除”以分隔线单独隔开（CCFG-UI-041） -->
                    <el-dropdown-item
                      v-if="idState(row) !== 'off'"
                      command="disable"
                      class="cc-more-warning"
                      :disabled="rowBusy(row)"
                    >停用</el-dropdown-item>
                    <el-dropdown-item
                      v-else
                      command="enable"
                      :disabled="rowBusy(row)"
                    >启用</el-dropdown-item>
                    <el-dropdown-item
                      command="delete"
                      divided
                      class="cc-more-danger"
                      :disabled="rowBusy(row)"
                    >删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </QueryListResultPanel>

    <!-- 新增/编辑弹窗（CCFG-UI-013/014/015/016/017）：不接入列表表格视觉模板 -->
    <el-dialog
      v-model="dialogOpen"
      class="cc-dialog"
      :title="mode === 'edit' ? '编辑探针' : '新增探针'"
      width="900px"
      :close-on-click-modal="false"
      @closed="onDialogClosed"
    >
      <div class="cc-form">
        <div class="cc-form-item">
          <span class="cc-form-label">探针 ID</span>
          <div
            ref="idControlEl"
            class="cc-form-control cc-field"
            :class="{ 'cc-field--error': idFieldError !== null }"
          >
            <div class="cc-id-control">
              <el-input
                v-if="!clientIdLocked"
                v-model="clientIdModel"
                placeholder="1~32 位字母、数字、点、下划线或连字符"
                :maxlength="ID_MAX_LENGTH"
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
            <div class="cc-field-feedback">
              <p v-if="idFieldError" class="cc-field-error" role="alert">{{ idFieldError }}</p>
            </div>
          </div>
        </div>

        <div class="cc-form-item">
          <span class="cc-form-label">探针描述</span>
          <div
            ref="descControlEl"
            class="cc-form-control cc-field"
            :class="{ 'cc-field--error': descFieldError !== null }"
          >
            <div class="cc-desc-row">
              <el-input
                v-model="clientDescModel"
                type="textarea"
                :rows="2"
                placeholder="探针用途描述（最多 256 个字符）"
                :disabled="submitting"
              />
              <el-button class="cc-autogen" @click="onAutoGenerate">
                自动生成
              </el-button>
            </div>
            <div class="cc-field-feedback">
              <p v-if="descFieldError" class="cc-field-error" role="alert">{{ descFieldError }}</p>
            </div>
          </div>
        </div>

        <div class="cc-form-item">
          <span class="cc-form-label">采集数据源</span>
          <div ref="sourceControlEl" class="cc-form-control cc-source-field">
            <div class="cc-split" :class="{ 'cc-split--error': sourceFieldInvalid }">
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
            <div class="cc-field-feedback">
              <p
                v-if="sourceFeedback"
                class="cc-field-feedback__text"
                :class="sourceFeedback.tone === 'error' ? 'cc-field-error' : 'cc-field-hint'"
                :role="sourceFeedback.tone === 'error' ? 'alert' : 'note'"
              >
                {{ sourceFeedback.text }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button :disabled="submitting" @click="dialogOpen = false">取消</el-button>
        <el-button
          type="primary"
          class="cc-dialog-submit"
          :disabled="submitting"
          :loading="submitting"
          @click="submitDialog"
        >
          {{ mode === 'edit' ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 页面级单实例悬停 Tooltip（CCFG-UI-005/008）：Teleport 到 body，任意时刻最多一个 -->
    <Teleport to="body">
      <div
        v-show="tipVisible"
        ref="tipHostRef"
        class="cc-single-tip"
        :class="{ 'cc-single-tip--below': tipBelow }"
        :style="{ left: `${tipPos.x}px`, top: `${tipPos.y}px` }"
        role="tooltip"
        aria-live="polite"
      >
        <p
          v-for="(ln, i) in tipLines"
          :key="i"
          :class="`cc-single-line cc-single-line--${ln.tone ?? 'normal'}`"
        >{{ ln.text }}</p>
      </div>
    </Teleport>
  </QueryListPageShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MoreFilled, Plus } from '@element-plus/icons-vue'
import {
  QueryListActions,
  QueryListPageShell,
  QueryListQueryPanel,
  QueryListResultPanel,
} from '@/components/query-list'
import { LT_MAIN_TABLE_CLASS } from '@/styles/list-table'
import { CHIP_BOX, descNeedsTip, measureChipWidth, packChips } from './listLayout'
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

type DataSourceViewItem = ClientListItemVO['dataSources'][number]

const DS_GAP = 8
const DS_MAX_VISIBLE = 6
const MORE_SLOT_TEXT = '+88'
const TIP_DELAY_MS = 240

/**
 * `+N` 完整清单弹层的 Popper 碰撞选项（CCFG-REQ-115/CCFG-DESIGN-055/CCFG-UI-044）。
 *
 * 清单按内容自然增高（不设固定最大高度、不设内部滚动），高度可能超过锚点上方与下方的
 * 可用空间。Popper v2 的 `preventOverflow` 对 `top`/`bottom` 定位只在 `altAxis`（此处的
 * **竖直**轴）上做贴边避让，而 Element Plus 只传了 `padding`、把 `altAxis` 留在默认 `false`，
 * 于是“上下都放不下”时既不翻转也不避让：首行 9 项清单在 1440×900 下保持 `top` 并被视口
 * 上缘裁掉前面数项（真实浏览器实测 overflow top ≈ -166px）。
 *
 * 这里打开 `altAxis` 并把碰撞边界显式定为**视口**：`placement="top"` 仍为首选方向，顶部
 * 放不下时先由 `flip` 翻转到底部，两个方向都放不下时再由 `preventOverflow` 沿竖直方向
 * 贴边避让，把整份清单收进视口内可读。仅调整碰撞处理，不改变清单内容与顺序、`+N` 语义、
 * 主表行高，也不引入内部滚动或固定最大高度。
 */
type FullListPopperModifier = { name: string; options?: Record<string, unknown> }

const FULL_LIST_POPPER_OPTIONS: { modifiers: FullListPopperModifier[] } = {
  modifiers: [
    {
      name: 'preventOverflow',
      options: {
        boundary: 'viewport',
        rootBoundary: 'viewport',
        mainAxis: true,
        altAxis: true,
        tether: false,
        padding: 8,
      },
    },
  ],
}

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/

/** 探针 ID 输入层上限（ASCII 规则，原生 maxlength 即可，CCFG-REQ-131/CCFG-DESIGN-069）。 */
const ID_MAX_LENGTH = 32

/** 探针描述界面输入层上限：按 Unicode 完整字符（码点）计数（CCFG-REQ-132/CCFG-DESIGN-070）。 */
const DESC_MAX_CHARS = 256

/** 服务端错误码 → 字段归属映射（API.md §9，仅归属既有错误码，不新增/更改错误码）。
 * 历史异常阻断 `40942`、候选加载失败与无法归属的错误码不在映射内，保留全局提示（CCFG-UI-052）。 */
const ID_ERROR_CODES = new Set([40100, 40101, 40940])
const DESC_ERROR_CODES = new Set([40102])
const SOURCE_ERROR_CODES = new Set([40103, 40104, 40105, 40941])

const ANOMALY_TEXT: Record<string, string> = {
  INACTIVE: '已停用',
  NOT_FOUND: '不存在',
  CATEGORY_MISMATCH: '类别非 SOURCE',
  TYPE_MISMATCH: '类型非 ORACLE',
  COMMA_IN_ID: 'ID 含英文逗号',
  DUPLICATE_IN_ROW: '行内重复',
  ASSIGNED_TO_MULTIPLE_CLIENTS: '已分配给其他探针',
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

/**
 * 按 Unicode 完整字符（码点）截断：`Array.from` 按码点迭代，代理对（含四字节 Emoji 等补充平面字符）
 * 不会在中间被切开（CCFG-REQ-132/CCFG-REQ-133/CCFG-REQ-134、CCFG-DESIGN-070/071）。
 * 原生 `maxlength` 按 UTF-16 code unit 计数，对这些字符会误算，故统一走本函数。
 */
function truncateCodePoints(value: string, max: number): string {
  const chars = Array.from(value)
  return chars.length <= max ? value : chars.slice(0, max).join('')
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
  // 后端 JSON 序列化省略 null 字段时 clientDesc 为 undefined，须与 null 一视同仁。
  const desc = row.clientDesc
  return desc == null || javaTrim(desc).length === 0
}

function isRowAmbiguous(row: ClientListItemVO): boolean {
  return row.rowAnomalies.includes('COMMA_PROTOCOL_AMBIGUOUS')
}

/** 采集数据源展示顺序：异常优先、组内保持接口原顺序（CCFG-UI-010，不改原数组）。 */
function orderedSources(row: ClientListItemVO): DataSourceViewItem[] {
  const abnormal = row.dataSources.filter((d) => d.anomalies.length > 0)
  const normal = row.dataSources.filter((d) => d.anomalies.length === 0)
  return [...abnormal, ...normal]
}

/** 标签正文：优先机构名称；数据源不存在且无法取得机构名称时才显示原始 ID（CCFG-UI-009）。 */
function dsBodyText(ds: DataSourceViewItem): string {
  const org = (ds.org ?? '').trim()
  return org.length ? org : ds.dataSourceId
}

function hasOrg(ds: DataSourceViewItem): boolean {
  return (ds.org ?? '').trim().length > 0
}

/** 采集数据源标签三态：'ok' 绿 / 'neutral' 中性 / 'bad' 红（CCFG-REQ-108/CCFG-UI-039）。 */
type DsTagState = 'ok' | 'neutral' | 'bad'

/**
 * 标签取色优先级自高至低：① 该数据源存在项级 `anomalies` → 红；② 否则整行存在
 * `COMMA_PROTOCOL_AMBIGUOUS` → 中性（不得暗示已确认为正常）；③ 否则 → 绿（仅表示
 * 当前未检测到异常）。红色不因整行歧义降级为中性色。
 */
function dsTagState(row: ClientListItemVO, ds: DataSourceViewItem): DsTagState {
  if (ds.anomalies.length > 0) return 'bad'
  if (isRowAmbiguous(row)) return 'neutral'
  return 'ok'
}

// ------------------------------------------------- 探针 ID 三态标识（不归一化原始值）

/** `FG_ACTIVE` 原始字符串三态：'1' 无标识、'0' 停用标识、其余为历史异常（CCFG-REQ-101）。 */
function idState(row: ClientListItemVO): 'on' | 'off' | 'abnormal' {
  if (row.fgActive === '1') return 'on'
  if (row.fgActive === '0') return 'off'
  return 'abnormal'
}

/** 单个不可见空白字符（含零宽字符）需以可见定界呈现，保证可辨认、可核对（CCFG-UI-035）。 */
function isInvisibleOnly(value: unknown): boolean {
  return typeof value === 'string' && value.length > 0 && /^[\s​‌‍﻿]+$/.test(value)
}

/** 历史异常固定文案 `异常：{原始值}`；原始值原样展示，不静默转换、不隐藏值（CCFG-REQ-102）。 */
function abnormalBadgeText(row: ClientListItemVO): string {
  const raw: unknown = row.fgActive
  const shown = isInvisibleOnly(raw) ? `"${String(raw)}"` : String(raw)
  return `异常：${shown}`
}

// ------------------------------------------------------------------ 列表状态

const listRows = ref<ClientListItemVO[]>([])
const listLoading = ref(false)
const listFailed = ref(false)
let listSeq = 0

const queryKeyword = ref('')
const queryStatus = ref<ClientStatusFilter>('ALL')
const appliedKeyword = ref<string | undefined>(undefined)
const appliedStatus = ref<ClientStatusFilter>('ALL')

/**
 * 固定选中（CCFG-REQ-142/CCFG-DESIGN-077/CCFG-UI-065）：当前页面会话内**唯一一行**的视觉定位状态，
 * 实现为一个可为空的单个探针 ID。该值只活在本页实例内，不写 URL／`localStorage`／`sessionStorage`／
 * 接口／数据库，也不是启用／停用／删除入口的前置条件；不构成任何批量或业务选择能力。
 */
const selectedClientId = ref<string | null>(null)

/**
 * 单击取消固定选中的判定窗口（毫秒）。行双击由两次 `click` 组成（CCFG-DESIGN-078）：
 * “固定／转移”始终**立即**生效；只有“再次点击同一行取消”被推迟到本窗口，
 * 以便双击达成时由 `row-dblclick` 先取消该待定取消动作，从而不把已固定行误取消、不留抖动。
 * 该计时器只可能把**同一个**探针 ID 清空，且清空前复检其仍是当前固定选中，故不会“复活不可见选中行”。
 */
const CLICK_CANCEL_DELAY_MS = 260
let pendingCancelTimer: ReturnType<typeof setTimeout> | undefined

/** 取消待定的“单击取消固定选中”，并（可选）记录该次待取消的探针 ID。 */
function cancelPendingRowClick(): void {
  if (pendingCancelTimer !== undefined) {
    clearTimeout(pendingCancelTimer)
    pendingCancelTimer = undefined
  }
}

/** 行单击：切换唯一一行固定选中。双击所含的第二次及以后点击不参与切换（`event.detail > 1`）。 */
function onRowClick(row: ClientListItemVO, _column: unknown, event: MouseEvent): void {
  if (event && event.detail > 1) return
  cancelPendingRowClick()
  if (selectedClientId.value !== row.clientId) {
    selectedClientId.value = row.clientId
    return
  }
  const target = row.clientId
  pendingCancelTimer = setTimeout(() => {
    pendingCancelTimer = undefined
    if (selectedClientId.value === target) selectedClientId.value = null
  }, CLICK_CANCEL_DELAY_MS)
}

/** 固定选中行加类，供页面作用域样式渲染行高亮；最多一行。 */
function rowClassName({ row }: { row: ClientListItemVO }): string {
  return row.clientId === selectedClientId.value ? 'cc-row--selected' : ''
}

function onRowDblClick(row: ClientListItemVO): void {
  // 双击为编辑入口：先撤销待定的“单击取消”，再保持该行固定选中并进入编辑（CCFG-DESIGN-078）。
  cancelPendingRowClick()
  selectedClientId.value = row.clientId
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

/** 重置只清空查询控件：不发请求、不动当前已生效条件与已展示结果（CCFG-UI-003）。 */
function onReset(): void {
  clearTip()
  queryKeyword.value = ''
  queryStatus.value = 'ALL'
}

/**
 * 下一次列表加载成功后要“按稳定探针 ID 重新固定”的目标（仅启停成功自身触发的重载会设置，
 * CCFG-REQ-146/CCFG-DESIGN-081）。其余普通重载一律清除固定选中（CCFG-REQ-145/CCFG-DESIGN-080）。
 */
let reselectAfterLoad: string | null = null

/**
 * 列表重载后的固定选中口径：先撤销待定的单击动作（不让迟到的点击计时器写回旧行），
 * 再在“本次重载由启停成功触发且目标仍在当前结果中”时固定目标行，否则清除固定选中。
 */
function applySelectionAfterReload(): void {
  cancelPendingRowClick()
  const target = reselectAfterLoad
  reselectAfterLoad = null
  selectedClientId.value =
    target !== null && listRows.value.some((r) => r.clientId === target) ? target : null
}

async function loadList(): Promise<void> {
  clearTip()
  cancelPendingRowClick()
  // 普通重载（首次加载、查询、失败后重试及其他非启停成功触发的重载）先清除此前固定选中；
  // 启停成功自身触发的重载是唯一例外：由 reselectAfterLoad 记下目标 ID，加载成功后按 ID 重新固定。
  if (reselectAfterLoad === null) selectedClientId.value = null
  const seq = ++listSeq
  listLoading.value = true
  listFailed.value = false
  try {
    const res = await fetchClientList({ keyword: appliedKeyword.value, status: appliedStatus.value })
    if (seq !== listSeq) return
    if (res.code === 200) {
      listRows.value = res.data?.items ?? []
      applySelectionAfterReload()
      shownMap.clear()
      // 数据渲染并完成真实布局后，按各容器实际宽度重新打包单行布局；
      // 不依赖 ResizeObserver 是否恰好再触发（行元素复用且宽度不变时 RO 不再回调，
      // 否则会退回“全部直接展示”，窄列下既无 +N 又溢出被裁切）。
      if (seq === listSeq) {
        await settleListLayout()
        if (seq === listSeq) recomputeAllRows()
      }
    } else {
      // 失败保留上一次成功结果（不清空 listRows），仅提示失败并提供重试（CCFG-UI-012/034）
      listFailed.value = true
      // 启停成功的“按 ID 重新固定”只对本次重载有效：本次未成功即作废，
      // 否则迟到的目标会在之后某次普通重载里复活一个用户没点过的选中行（CCFG-REQ-146）。
      reselectAfterLoad = null
    }
  } catch (e) {
    if (seq !== listSeq) return
    listFailed.value = true
    reselectAfterLoad = null
  } finally {
    if (seq === listSeq) listLoading.value = false
  }
}

function onDialogClosed(): void {
  // 弹窗关闭无额外副作用
}

// ------------------------------------------------------------------ 行操作（“更多”下拉）

/** 行级忙碌：按探针 ID 记录在途行，只锁对应行，其他行的独立操作不被阻塞（CCFG-DESIGN-042）。 */
const busyClientIds = reactive(new Set<string>())

function rowBusy(row: ClientListItemVO): boolean {
  return busyClientIds.has(row.clientId)
}

function markBusy(clientId: string, busy: boolean): void {
  if (busy) busyClientIds.add(clientId)
  else busyClientIds.delete(clientId)
}

function onRowCommand(command: string, row: ClientListItemVO): void {
  if (command === 'enable') {
    void onEnable(row)
  } else if (command === 'disable') {
    void onDisable(row)
  } else if (command === 'delete') {
    void onDelete(row)
  }
}

/** 启用：先二次确认（新增步骤，CCFG-REQ-141），确认后才调 E6；确认阶段即置忙，防止同一行重复提交。 */
async function onEnable(row: ClientListItemVO): Promise<void> {
  if (rowBusy(row)) return
  markBusy(row.clientId, true)
  try {
    await ElMessageBox.confirm(`确定启用探针 ${row.clientId} 吗？`, '启用探针', {
      confirmButtonText: '启用',
      cancelButtonText: '取消',
    })
  } catch (e) {
    // 取消或关闭确认框：不发出启用写请求，也不改变原有固定选中
    markBusy(row.clientId, false)
    return
  }
  try {
    const res = await enableClient(row.clientId)
    if (res.code === 200) {
      ElMessage.success('启用成功')
      reselectAfterLoad = row.clientId
      await loadList()
    } else {
      ElMessage.error(res.message || '启用失败')
    }
  } catch (e) {
    ElMessage.error('启用失败，请检查网络后重试。')
  } finally {
    markBusy(row.clientId, false)
  }
}

/** 停用：二次确认后调 E7；确认阶段即置忙，防止同一行重复提交（CCFG-REQ-098/140）。 */
async function onDisable(row: ClientListItemVO): Promise<void> {
  if (rowBusy(row)) return
  markBusy(row.clientId, true)
  try {
    await ElMessageBox.confirm(`确定停用探针 ${row.clientId} 吗？`, '停用探针', {
      confirmButtonText: '停用',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch (e) {
    markBusy(row.clientId, false)
    return
  }
  try {
    const res = await disableClient(row.clientId)
    if (res.code === 200) {
      ElMessage.success('停用成功')
      reselectAfterLoad = row.clientId
      await loadList()
    } else {
      ElMessage.error(res.message || '停用失败')
    }
  } catch (e) {
    ElMessage.error('停用失败，请检查网络后重试。')
  } finally {
    markBusy(row.clientId, false)
  }
}

/** 删除：二次确认后调 E5，成功按已生效条件重载（CCFG-DESIGN-043）。 */
async function onDelete(row: ClientListItemVO): Promise<void> {
  if (rowBusy(row)) return
  markBusy(row.clientId, true)
  try {
    await ElMessageBox.confirm(`确定删除探针 ${row.clientId} 吗？该操作不可恢复。`, '删除探针', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch (e) {
    markBusy(row.clientId, false)
    return
  }
  try {
    const res = await deleteClient(row.clientId)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await loadList()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (e) {
    ElMessage.error('删除失败，请检查网络后重试。')
  } finally {
    markBusy(row.clientId, false)
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

/** 字段级错误状态与“本次弹窗会话是否已尝试提交”（CCFG-REQ-123/127、CCFG-DESIGN-061/065）。
 * `submitAttempted` 只活在本次弹窗会话内，`resetDialog()` 重新打开时复位，不写持久化状态。 */
const idFieldError = ref<string | null>(null)
const descFieldError = ref<string | null>(null)
const sourceFieldError = ref<string | null>(null)
const submitAttempted = ref(false)
const idControlEl = ref<HTMLElement | null>(null)
const descControlEl = ref<HTMLElement | null>(null)
const sourceControlEl = ref<HTMLElement | null>(null)

/**
 * 输入层上限（前端输入限制，不替代后端校验）：
 * - 探针 ID 为 ASCII 规则，除原生 `maxlength=32` 外同口径截断，手工输入与粘贴一致
 *   （CCFG-REQ-131/CCFG-DESIGN-069/CCFG-UI-058）。
 * - 探针描述按 Unicode 完整字符计数、只保留前 256 个字符；不使用原生 `maxlength`（按 UTF-16
 *   code unit 计数会误算四字节字符并可能拆开代理对）（CCFG-REQ-132/CCFG-DESIGN-070/CCFG-UI-059）。
 * 两者都只是长度截断，不做字符剥离或替换，非法字符仍由提交时的字段级错误指出。
 */
const clientIdModel = computed({
  get: () => clientIdDraft.value,
  set: (value: string) => {
    clientIdDraft.value = value.slice(0, ID_MAX_LENGTH)
  },
})

const clientDescModel = computed({
  get: () => clientDescDraft.value,
  set: (value: string) => {
    clientDescDraft.value = truncateCodePoints(value, DESC_MAX_CHARS)
  },
})

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
  clearTip()
  cancelPendingRowClick()
  resetDialog()
  mode.value = 'create'
  clientIdLocked.value = false
  dialogOpen.value = true
  void loadOptions()
}

function openEdit(row: ClientListItemVO): void {
  clearTip()
  cancelPendingRowClick()
  resetDialog()
  mode.value = 'edit'
  editRow.value = row
  clientIdLocked.value = true
  clientIdDraft.value = row.clientId
  // 历史 `CLIENT_DESC` 超过 256 字符时，只把前 256 个完整字符回显为本次编辑草稿；
  // 打开弹窗不写数据库、不改动列表原记录（CCFG-REQ-134/CCFG-DESIGN-071）。
  clientDescDraft.value = truncateCodePoints(row.clientDesc ?? '', DESC_MAX_CHARS)
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
  // 关闭后重新打开不得残留上一会话的字段错误与“已尝试提交”状态（CCFG-REQ-123/127）
  idFieldError.value = null
  descFieldError.value = null
  sourceFieldError.value = null
  submitAttempted.value = false
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
  // 解锁／取消修改后不得残留上一个锁定态的 ID 错误：按当前草稿重新判定
  idFieldError.value = validateClientId()
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

/** 编辑模式既有的保存前业务阻断（CCFG-REQ-049/CCFG-UI-017）：本轮只改变呈现与按钮口径，
 * 判定内容不变——歧义优先于项级异常（歧义是根因，项级异常多为歧义解析的派生结果）。 */
const editBlockReason = computed<string | null>(() => {
  if (mode.value !== 'edit') return null
  if (ambiguityNotCleared.value) {
    return '原配置含英文逗号歧义：请移除歧义展示项并重新选择合法候选后再保存'
  }
  if (hasAnomalousChosen.value) {
    return '存在异常数据源（见红色标记），请先移除异常项后再保存'
  }
  return null
})

/** 字段级校验：探针 ID（沿用 CCFG-REQ-037/038 判定内容，不新增保存条件）。 */
function validateClientId(): string | null {
  const finalId = javaTrim(clientIdDraft.value)
  if (finalId.length === 0) return '探针 ID 不能为空。'
  if (!ID_PATTERN.test(finalId)) {
    return '探针 ID 格式不正确：须为 1~32 位字母、数字、点、下划线或连字符，且以字母或数字开头。'
  }
  return null
}

/** 字段级校验：探针描述（Trim 仅判空，原文按 UTF-8 字节 `<=1024` 预校验，CCFG-REQ-039/059）。 */
function validateDesc(): string | null {
  const desc = clientDescDraft.value
  if (javaTrim(desc).length === 0) return '探针描述不能为空。'
  if (utf8Bytes(desc) > 1024) {
    return '探针描述原文超过 1024 字节（UTF-8），请缩短后再保存。'
  }
  return null
}

/**
 * “采集数据源”字段反馈区的唯一文案与语气（CCFG-REQ-126/127、CCFG-UI-053/054/055）：
 * 业务阻断（歧义／异常项）与服务端归属错误为红色错误态；未选数据源且尚未尝试提交为中性灰色说明；
 * 已尝试提交仍未选则为红色错误态。三者共用同一反馈区与同一稳定空间。
 */
const sourceFeedback = computed<{ text: string; tone: 'neutral' | 'error' } | null>(() => {
  if (editBlockReason.value) return { text: editBlockReason.value, tone: 'error' }
  if (sourceFieldError.value) return { text: sourceFieldError.value, tone: 'error' }
  if (chosen.value.length === 0) {
    return {
      text: '至少选择 1 个数据源',
      tone: submitAttempted.value ? 'error' : 'neutral',
    }
  }
  return null
})

/** 数据源选择区域是否呈红色错误边框（与反馈区的错误态一致）。 */
const sourceFieldInvalid = computed(() => sourceFeedback.value?.tone === 'error')

/**
 * 把可明确归属字段的服务端错误落到该字段下方；无法归属的错误返回 false 由调用方走全局提示
 * （CCFG-REQ-125、CCFG-UI-052、CCFG-DESIGN-063）。不新增、不改写任何错误码。
 */
function applyServerFieldError(code: number, message: string): boolean {
  const text = message || '保存失败'
  if (ID_ERROR_CODES.has(code)) {
    idFieldError.value = text
    return true
  }
  if (DESC_ERROR_CODES.has(code)) {
    descFieldError.value = text
    return true
  }
  if (SOURCE_ERROR_CODES.has(code)) {
    sourceFieldError.value = text
    return true
  }
  return false
}

/** 定位到第一个错误字段：优先聚焦可聚焦控件；锁定态不可聚焦时退化为滚动到该字段。 */
async function focusFirstError(): Promise<void> {
  await nextTick()
  const candidates: Array<[boolean, HTMLElement | null]> = [
    [idFieldError.value !== null, idControlEl.value],
    [descFieldError.value !== null, descControlEl.value],
    [sourceFieldInvalid.value, sourceControlEl.value],
  ]
  const hit = candidates.find(([hasError, el]) => hasError && el !== null)
  if (!hit) return
  const host = hit[1] as HTMLElement
  const input = host.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea')
  if (input && !input.disabled) {
    input.focus()
    return
  }
  try {
    host.scrollIntoView({ block: 'nearest' })
  } catch {
    // jsdom 无布局：忽略滚动定位，几何行为由真实浏览器核对
  }
}

function clearServerFieldErrors(): void {
  sourceFieldError.value = null
}

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
  // 先按原有选择顺序生成完整描述，再直接保留前 256 个完整字符写入草稿；
  // 超过 256 字符不失败、不弹超长提示（末尾机构名或分隔符可能被截断，为明确接受的截断行为），
  // 最终草稿仍由提交时的判空与 UTF-8 字节校验把关（CCFG-REQ-133/CCFG-DESIGN-070）。
  const generated = chosen.value.map((c) => (c.org ?? '').trim()).join(',')
  if (javaTrim(generated).length === 0) {
    ElMessage.warning('自动生成失败：结果为空白。')
    return
  }
  clientDescDraft.value = truncateCodePoints(generated, DESC_MAX_CHARS)
}

async function submitDialog(): Promise<void> {
  if (mode.value === null || submitting.value) return
  submitAttempted.value = true
  clearServerFieldErrors()
  // 一次校验全部字段：逐字段显示各自错误，不做“提前 return 只报第一个”
  idFieldError.value = validateClientId()
  descFieldError.value = validateDesc()
  const blocked =
    idFieldError.value !== null ||
    descFieldError.value !== null ||
    chosen.value.length === 0 ||
    editBlockReason.value !== null
  if (blocked) {
    // 点击后就地反馈并以字段级错误拒绝写入；反馈不可见时定位到第一个错误
    await focusFirstError()
    return
  }
  const request = {
    clientId: javaTrim(clientIdDraft.value),
    clientDesc: clientDescDraft.value,
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
      await loadList()
    } else if (!applyServerFieldError(res.code, res.message)) {
      // 网络不可用或无法归属到具体字段的系统错误保留全局提示（CCFG-REQ-125）
      ElMessage.error(res.message || (isEdit ? '编辑失败' : '新增失败'))
    } else {
      await focusFirstError()
    }
  } catch (e) {
    ElMessage.error(isEdit ? '编辑失败，请检查网络后重试。' : '新增失败，请检查网络后重试。')
  } finally {
    submitting.value = false
  }
}

// 逐字段修正：只清除／更新该字段自己的错误，其他字段的错误保持（CCFG-REQ-123/CCFG-UI-050）。
watch(clientIdDraft, () => {
  if (idFieldError.value !== null) idFieldError.value = validateClientId()
})
watch(clientDescDraft, () => {
  if (descFieldError.value !== null) descFieldError.value = validateDesc()
})
watch(
  chosen,
  () => {
    if (sourceFieldError.value !== null) sourceFieldError.value = null
  },
  { deep: true },
)

// ------------------------------------------------- 单行动态 +N 布局
// 决策依赖真实元素尺寸：用 ResizeObserver 观察每个采集数据源单元格，取到容器宽度后
// 用与标签一致的盒模型离屏测量各标签宽度，再交给纯函数 packChips 决定直接展示数与 +N
// （可见数量 = min(单行实际可容纳数, 6)，见 R1 §5.4/§5.6）。
// jsdom 无布局：不安装/触发 ResizeObserver 时按“单行前 6 项”兜底（配合真机目测）。

const shownMap = reactive(new Map<string, number>())
const srcEls = reactive(new Map<string, HTMLElement>())
let rowObserver: ResizeObserver | null = null
let resizeHandler: (() => void) | null = null

function shownCount(row: ClientListItemVO): number {
  return shownMap.get(row.clientId) ?? Math.min(orderedSources(row).length, DS_MAX_VISIBLE)
}

function hiddenCount(row: ClientListItemVO): number {
  return Math.max(0, orderedSources(row).length - shownCount(row))
}

function setSrcEl(el: HTMLElement | null, clientId: string): void {
  const prev = srcEls.get(clientId)
  if (prev && prev !== el) rowObserver?.unobserve(prev)
  if (el === null) {
    srcEls.delete(clientId)
    return
  }
  srcEls.set(clientId, el)
  rowObserver?.observe(el)
}

function recomputeRow(clientId: string, containerWidth: number, srcEl?: HTMLElement | null): void {
  if (!Number.isFinite(containerWidth) || containerWidth <= 0) return
  const row = listRows.value.find((r) => r.clientId === clientId)
  if (!row) return
  const dss = orderedSources(row)
  const total = dss.length
  if (total === 0) {
    shownMap.set(clientId, 0)
    return
  }
  // 行级歧义标签与标签同行流动，先扣除其宽度 + 间距，避免把可展示标签挤进 +N。
  let avail = containerWidth
  const el = srcEl || srcEls.get(clientId)
  if (el) {
    const rb = el.querySelector<HTMLElement>('.cc-rowbad')
    if (rb && rb.offsetWidth > 0) avail = Math.max(0, avail - rb.offsetWidth - DS_GAP)
  }
  // 标签与 `+N` 槽位都按当前紧凑盒模型（CHIP_BOX）测量，与实际渲染宽度一致（CCFG-REQ-107）。
  const widths = dss.map((ds) => measureChipWidth(dsBodyText(ds), CHIP_BOX))
  const moreWidth = measureChipWidth(MORE_SLOT_TEXT, CHIP_BOX) || 40
  const { shown } = packChips({
    widths,
    containerWidth: avail,
    gap: DS_GAP,
    moreWidth,
    maxVisible: DS_MAX_VISIBLE,
  })
  shownMap.set(clientId, shown)
}

/** 依当前 DOM（data-client-id）逐行打包。el-table 数据变化时会复用行 DOM 节点且不重建 ref，
 * 按渲染期捕获的 clientId 维护的 srcEls 会过期，故直接读当前渲染结果，而非信任 ref 映射。 */
function recomputeAllRows(): void {
  if (typeof document === 'undefined') return
  document.querySelectorAll<HTMLElement>('.cc-src[data-client-id]').forEach((el) => {
    const clientId = el.getAttribute('data-client-id')
    if (!clientId || !listRows.value.some((r) => r.clientId === clientId)) return
    const width = el.clientWidth || el.getBoundingClientRect().width
    recomputeRow(clientId, width, el)
  })
}

/** 等 el-table 完成真实布局（nextTick 之后再过两帧）再按真实容器宽度打包，供 loadList 成功后调用。 */
function settleListLayout(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'undefined') {
      resolve()
      return
    }
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)))
  })
}

// ------------------------------------------------- 单实例悬停 Tooltip
// 整个列表任意时刻最多一个悬停 Tooltip（CCFG-UI-005/007/008）：进入新目标立即关闭上一个，
// 稳定悬停约 240ms 后显示，鼠标离开立即隐藏；查询/重置/重载/弹窗/卸载时清除。

type TipTone = 'main' | 'bad' | 'muted'
interface TipLine {
  text: string
  tone?: TipTone
}
interface TipContent {
  lines: TipLine[]
}

const tipVisible = ref(false)
const tipBelow = ref(false)
const tipPos = reactive({ x: 0, y: 0 })
const tipLines = ref<TipLine[]>([])
const tipHostRef = ref<HTMLElement | null>(null)
let tipTimer: ReturnType<typeof setTimeout> | undefined
let tipTarget: HTMLElement | null = null

function clearTip(): void {
  if (tipTimer !== undefined) {
    clearTimeout(tipTimer)
    tipTimer = undefined
  }
  tipTarget = null
  tipVisible.value = false
  tipLines.value = []
}

function positionTip(): void {
  const host = tipHostRef.value
  if (!host) return
  const hw = host.offsetWidth || 0
  const hh = host.offsetHeight || 0
  const vw = window.innerWidth || 0
  const vh = window.innerHeight || 0
  const half = hw / 2
  let x = tipPos.x
  if (vw > 0) x = Math.min(Math.max(x, half + 8), Math.max(half + 8, vw - half - 8))
  let y = tipPos.y
  if (!tipBelow.value && tipTarget && y - hh < 8) {
    const r = tipTarget.getBoundingClientRect()
    y = r.bottom + 8
    tipBelow.value = true
  }
  if (vh > 0 && y + hh > vh - 8) y = vh - hh - 8
  y = Math.max(y, 8)
  tipPos.x = Math.round(Math.max(x, 8))
  tipPos.y = Math.round(y)
}

function showTip(target: HTMLElement, lines: TipLine[]): void {
  clearTip()
  tipTarget = target
  tipLines.value = lines
  tipBelow.value = false
  const rect = target.getBoundingClientRect()
  tipPos.x = rect.left + rect.width / 2
  tipPos.y = rect.top - 8
  tipVisible.value = true
  void nextTick(() => positionTip())
}

function scheduleTip(target: HTMLElement, lines: TipLine[]): void {
  clearTip()
  tipTimer = setTimeout(() => {
    tipTimer = undefined
    showTip(target, lines)
  }, TIP_DELAY_MS)
}

function onTipEnter(event: MouseEvent, content: TipContent): void {
  const el = event.currentTarget
  if (!(el instanceof HTMLElement)) return
  scheduleTip(el, content.lines)
}

function onTipLeave(): void {
  clearTip()
}

function tipForDs(ds: DataSourceViewItem): TipContent {
  const lines: TipLine[] = []
  if (hasOrg(ds)) {
    lines.push({ text: (ds.org ?? '').trim(), tone: 'main' })
    lines.push({ text: `数据源 ID：${ds.dataSourceId}`, tone: 'muted' })
  } else {
    lines.push({ text: ds.dataSourceId, tone: 'main' })
  }
  ds.anomalies.forEach((a) => {
    lines.push({ text: `异常原因：${ANOMALY_TEXT[a] ?? a}`, tone: 'bad' })
  })
  if (ds.anomalies.includes('ASSIGNED_TO_MULTIPLE_CLIENTS') && ds.conflictClientIds.length) {
    lines.push({ text: `冲突探针：${ds.conflictClientIds.join('、')}`, tone: 'bad' })
  }
  return { lines }
}

function tipForRowbad(row: ClientListItemVO): TipContent {
  void row
  return {
    lines: [
      { text: '行级存在英文逗号歧义（历史 CSV），非已确定分配', tone: 'bad' },
      { text: '列表按普通 CSV 解析展示，请进入编辑确认实际分配', tone: 'muted' },
    ],
  }
}

function onDescEnter(event: MouseEvent, row: ClientListItemVO): void {
  const el = event.currentTarget
  if (!(el instanceof HTMLElement)) return
  if (isBlankDesc(row)) {
    scheduleTip(el, [{ text: '未填写探针描述', tone: 'muted' }])
    return
  }
  if (descNeedsTip(el.clientWidth, el.scrollWidth)) {
    scheduleTip(el, [{ text: row.clientDesc ?? '', tone: 'main' }])
  } else {
    clearTip()
  }
}

function onIdEnter(event: MouseEvent, row: ClientListItemVO): void {
  const el = event.currentTarget
  if (!(el instanceof HTMLElement)) return
  if (descNeedsTip(el.clientWidth, el.scrollWidth)) {
    scheduleTip(el, [{ text: row.clientId, tone: 'main' }])
  } else {
    clearTip()
  }
}

/** 异常标识完整文案经 Tooltip 可见：列宽不足被截断时仍可核对原始值（CCFG-UI-035）。 */
function onAbnormalEnter(event: MouseEvent, row: ClientListItemVO): void {
  const el = event.currentTarget
  if (!(el instanceof HTMLElement)) return
  scheduleTip(el, [{ text: abnormalBadgeText(row), tone: 'bad' }])
}

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    rowObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target
        if (!(el instanceof HTMLElement)) continue
        const clientId = el.getAttribute('data-client-id')
        if (!clientId) continue
        const width = entry.contentRect ? entry.contentRect.width : el.clientWidth
        recomputeRow(clientId, width, el)
      }
    })
    srcEls.forEach((el) => rowObserver?.observe(el))
    resizeHandler = recomputeAllRows
    window.addEventListener('resize', resizeHandler)
  }
  void loadList()
})

onBeforeUnmount(() => {
  clearTip()
  cancelPendingRowClick()
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  rowObserver?.disconnect()
  rowObserver = null
  srcEls.clear()
  shownMap.clear()
})
</script>

<!-- 主列表表格视觉模板：显式引用公共预设源（显式启用，非全局），
     并由 el-table 根元素上的并列类 `lt-main-table` 启用（CCFG-REQ-099）。 -->
<style scoped src="@/styles/list-table/list-table-visual.css"></style>

<style scoped>
/* 页面外壳、查询区容器、查询/重置动作与结果卡片盒模型全部由公共层提供
   （.ql-page / .ql-q-panel / .ql-actions / .ql-result-panel）；本文件只保留 Feature 专属
   字段组、结果区摘要、错误槽内容与表格样式，不复制公共层等价 CSS。 */
.cc-q-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.cc-q-label {
  flex: 0 0 auto;
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.cc-q-keyword {
  width: 300px;
}

.cc-q-status {
  width: 150px;
}

/* 结果区左上角摘要：共 n 条 */
.cc-result-count {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* “新增探针”：黑色实心主按钮，与参考页“新增数据源”同款（CCFG-REQ-104/CCFG-UI-036）。
   `:not(.is-disabled)` 限定仅正常态换色，禁用态沿用 Element Plus 既有禁用视觉。 */
.cc-btn-add:not(.is-disabled) {
  background: #09090b;
  border-color: #09090b;
  color: #ffffff;
  border-radius: 6px;
  font-weight: 500;
}

.cc-btn-add:not(.is-disabled):hover,
.cc-btn-add:not(.is-disabled):focus {
  background: #27272a;
  border-color: #27272a;
  color: #ffffff;
}

.cc-btn-add:not(.is-disabled):active {
  background: #18181b;
  border-color: #18181b;
  color: #ffffff;
}

.cc-btn-icon {
  margin-right: 2px;
  font-size: 14px;
}

/* 错误槽内容：失败提示 + 重试，不出现“刷新/重新加载”等本页已取消的刷新语义控件 */
.cc-load-error {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--el-color-danger);
}

.cc-load-error-text {
  flex: 0 1 auto;
  min-width: 0;
}

/* 本页不为行声明固定像素行高：行高由公共表格视觉预设的单元格上下内边距
   （`var(--lt-body-cell-padding, 12px 0)`）与行内容共同决定，与参考页“数据源管理”实际规则一致
   （CCFG-REQ-106/CCFG-DESIGN-049/CCFG-UI-038）。普通悬停仍是 Element Plus 既有的浅色临时高亮
   （移走即消失），行双击编辑由 @row-dblclick 承担。 */

/* 固定选中行（CCFG-REQ-142/CCFG-DESIGN-077/CCFG-UI-065）：页面会话内最多一行，视觉层级明显
   强于普通悬停——更实的蓝色底 + 首格左侧强调线；配色与强调线为本轮页面作用域的新参数，
   不沿用已取消选择能力的历史参数、不写死与侧栏宽度相关的偏移。选择器以 `:deep` 限定在本页
   表格根类 `.cc-table` 内并提高特异性（不借助强制声明）以压过 Element Plus 的行悬停
   与“当前行”底色，使固定选中在悬停其他行或悬停自身时都清晰可辨。
   兼容浏览器：本项目前端以 Chromium 系现代浏览器为目标（见 docs/baseline/ENVIRONMENT.md）。 */
/* 本页不提供“当前行”语义：el-table 在行单击时会自行落下 `current-row` 底色，若不归零，
   则“再次点击同一行取消固定选中”后仍会残留蓝色行底。本规则与下方固定选中规则**同特异性**，
   故置于其**前**，使两者同时命中时由固定选中规则按源码顺序胜出。 */
:deep(.cc-table .el-table__body tr.current-row > td.el-table__cell) {
  background-color: transparent;
}

:deep(.cc-table .el-table__body tr.cc-row--selected > td.el-table__cell) {
  background-color: #e8f0fd;
}

/* 悬停自身时仍保持固定选中底色（不被临时悬停高亮盖过） */
:deep(.cc-table .el-table__body tr.cc-row--selected:hover > td.el-table__cell) {
  background-color: #e8f0fd;
}

/* 固定选中行的左侧强调线：只画在首格，避免每格一条线 */
:deep(.cc-table .el-table__body tr.cc-row--selected > td.el-table__cell:first-child) {
  box-shadow: inset 3px 0 0 0 #1d4ed8;
}

/* 序号列：展示派生值，按当前展示数组 $index + 1 连续编号（CCFG-REQ-100） */
.cc-seq {
  font-size: 13px;
  color: #71717a;
  font-variant-numeric: tabular-nums;
}

/* 探针 ID 单元格：ID 文本 + 三态标识同行；标识不得挤压/覆盖最右固定“操作”列 */
.cc-id-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
}

/* 探针 ID 正文：字重与颜色对齐参考页“数据源 ID”（CCFG-REQ-105/CCFG-UI-037）；
   其后的“停用”与历史异常标识保持各自现行视觉，不随本规则加粗改色。 */
.cc-id {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
  color: #09090b;
  cursor: pointer;
}

.cc-id:focus-visible {
  outline: 1px solid var(--el-color-primary);
  outline-offset: 1px;
}

/* 停用标识：与数据源管理主列表“数据源 ID”后的“停用”标识同一视觉语言（CCFG-UI-031） */
.cc-inactive-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  box-sizing: border-box;
  padding: 0 6px;
  height: 20px;
  border-radius: 4px;
  background: #fee2e2;
  color: #991b1b;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

/* 历史异常标识：红色、固定文案 `异常：{原始值}`；文字本身承载语义，不只靠颜色（CCFG-REQ-102）。
   列宽不足时随本列省略号截断，完整值经单实例 Tooltip 可见（CCFG-UI-035）。 */
.cc-abnormal-mark {
  display: inline-block;
  flex: 0 1 auto;
  min-width: 0;
  box-sizing: border-box;
  max-width: 100%;
  padding: 0 6px;
  height: 20px;
  border-radius: 4px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* 采集数据源：单行展示，永不折行/换第二行，超出单行实际可容纳数与数量上限（6）的以
   动态 `+N` 表示（CCFG-UI-004/007，R1 §5.4/§5.6）。不声明固定高度：行高交由单元格内边距
   与内容决定（CCFG-UI-038），故本容器高度随标签/行级歧义标识的实际内容自适应。 */
.cc-src {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  min-width: 0;
  overflow: hidden;
}

.cc-rowbad {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-sizing: border-box;
  height: 27px;
  padding: 0 10px;
  border: 1px solid #f1a7a7;
  border-radius: 4px;
  background: #fef0f0;
  font-size: 14px;
  color: #d54949;
}

/* 标签文字统一承载元素：block 容器使 nowrap/省略号稳定生效（对 flex 容器的匿名文本节点
   text-overflow 不可靠），水平居中由外层 justify-content、垂直居中由 align-items 承担；
   不依赖字体基线，不使用 translate/负 margin/padding-top 等脆弱偏移（R2 §3） */
.cc-txt {
  display: block;
  min-width: 0;
  line-height: 1;
  white-space: nowrap;
}

.cc-dstag > .cc-txt {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 采集数据源标签：借用参考页“角色”标签视觉语言（高 20px、12px/600、圆角 4px、无边框、
   柔和底色，CCFG-REQ-107/CCFG-UI-039）。底色/文字色按三态由 `cc-dstag--ok|neutral|bad` 决定；
   基础块即绿色态，其语义为“当前未检测到异常”。 */
.cc-dstag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 20px;
  max-width: 10em;
  padding: 0 9px;
  border: none;
  border-radius: 4px;
  background: #ecfdf5;
  font-size: 12px;
  font-weight: 600;
  color: #047857;
  overflow: hidden;
  flex-shrink: 0;
}

/* ① 该项存在既有 anomalies → 红色（优先于整行歧义，不因歧义降级为中性色） */
.cc-dstag--bad {
  background: #fef0f0;
  color: #d54949;
}

/* ② 无项级异常但整行含 COMMA_PROTOCOL_AMBIGUOUS → 中性色，不暗示该关联已确认为正常 */
.cc-dstag--neutral {
  background: #f4f4f5;
  color: #606266;
}

/* 动态 `+N` 槽位：与本列标签同一紧凑盒模型，保持单行观感与行高一致；
   仍是点击交互入口（CCFG-REQ-109）。 */
.cc-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 20px;
  padding: 0 9px;
  border: none;
  border-radius: 4px;
  background: #f4f4f5;
  font-size: 12px;
  font-weight: 600;
  color: #409eff;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
}

.cc-more:hover {
  background: #e9e9eb;
}

/* 最右固定“操作”列唯一入口：水平三点图标（CCFG-REQ-110/CCFG-UI-040）。
   命中区域按 28×28 提供，键盘焦点可见；可访问名称由触发器上的 aria-label 提供。 */
.cc-more-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: var(--el-color-primary);
  cursor: pointer;
}

.cc-more-link:hover {
  background: #ecf5ff;
}

.cc-more-link:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 1px;
}

.cc-more-icon {
  font-size: 18px;
}

/* 页面级单实例悬停 Tooltip：Teleport 到 body，pointer-events:none（CCFG-UI-005/008） */
.cc-single-tip {
  position: fixed;
  z-index: 3000;
  max-width: 380px;
  padding: 6px 10px;
  border-radius: 6px;
  background: #303133;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  font-size: 12px;
  line-height: 1.5;
  color: #fff;
  pointer-events: none;
  transform: translate(-50%, -100%);
}

.cc-single-tip--below {
  transform: translate(-50%, 0);
}

.cc-single-line {
  margin: 0;
  word-break: break-word;
}

.cc-single-line--main {
  font-weight: 600;
}

.cc-single-line--bad {
  color: #ffb8b8;
}

.cc-single-line--muted {
  color: #d4d7dd;
}

/* +N 完整清单按内容自然增高：不设内部滚动、不设固定最大高度
   （CCFG-REQ-115/CCFG-DESIGN-055/CCFG-UI-044）。该“无内部滚动”决定仅适用于本清单，
   不影响新增／编辑弹窗及其候选列表的受控滚动。 */

.cc-full-list ul {
  margin: 4px 0;
  padding-left: 16px;
}

/* 清单项两级信息：主行为机构名称（机构名缺失时即原始 ID），次行以较弱样式显示
   `数据源 ID：` + 完整原始 ID；两级各占一行、不连读成同一字符串；项间以浅分隔线与间距
   区分，长 ID 允许在项内换行（CCFG-REQ-113/CCFG-DESIGN-054/CCFG-UI-043）。 */
.cc-full-item {
  line-height: 1.6;
  padding: 6px 0;
  overflow-wrap: anywhere;
}

.cc-full-item + .cc-full-item {
  border-top: 1px solid #f0f0f0;
}

.cc-full-note {
  margin: 0 0 4px;
  font-size: 12px;
  color: #e6a23c;
}

.cc-full-org {
  display: block;
  font-weight: 600;
}

/* 项级异常／冲突探针信息：保留在项内独立一行，维持既有红色警示语义（CCFG-REQ-114）。 */
.cc-full-bad {
  display: block;
  color: #f56c6c;
}

.cc-full-id {
  display: block;
  color: #909399;
  font-size: 12px;
}

.cc-count-note {
  margin-left: 2px;
  font-size: 12px;
  color: #e6a23c;
}

/* 弹窗（新增／编辑共用同一实例）桌面目标宽度约 900px，由 el-dialog 的 width 属性给出；
   并受视口限制保留左右安全间距——窄视口按可用空间收缩、不横向溢出
   （CCFG-REQ-116/CCFG-DESIGN-056/CCFG-UI-045）。 */
:deep(.cc-dialog) {
  max-width: calc(100vw - 48px);
}

/* 主提交按钮对齐数据源管理 `.editor-submit-button` 的黑色实心视觉
   （CCFG-REQ-120/CCFG-DESIGN-059/CCFG-UI-047）。`:not(.is-disabled)` 限定仅正常态换色，
   禁用态与 loading 态沿用 Element Plus 既有视觉、不被正常态规则覆盖；
   仅此主按钮改色，“取消”“自动生成”“修改探针 ID”不跟随变黑。 */
.cc-dialog-submit:not(.is-disabled) {
  background: #09090b;
  border-color: #09090b;
  color: #ffffff;
  border-radius: 6px;
  font-weight: 500;
}

.cc-dialog-submit:not(.is-disabled):hover,
.cc-dialog-submit:not(.is-disabled):focus {
  background: #27272a;
  border-color: #27272a;
  color: #ffffff;
}

.cc-dialog-submit:not(.is-disabled):active {
  background: #18181b;
  border-color: #18181b;
  color: #ffffff;
}

/* 提交请求处理中的加载态：仍为黑色系深灰，避免正常态黑色与 Element Plus
   主色蓝之间跳色；以略浅于常态的深灰底 + 加载图标 + 不可重复点击游标与
   “可点击的黑色常态”区分，白字与加载图标保持可读。选择器仅限定本主提交
   按钮的加载态（不新增全局覆盖，也不强制提升优先级），`:loading="submitting"`
   与 `:disabled="submitting"` 的防重复提交逻辑不变。
   CCFG-REQ-120/124、CCFG-AC-115/120、CCFG-DESIGN-059/062、CCFG-UI-047/051。 */
.cc-dialog-submit.is-loading,
.cc-dialog-submit.is-loading:hover,
.cc-dialog-submit.is-loading:focus,
.cc-dialog-submit.is-loading:active {
  background: #3f3f46;
  border-color: #3f3f46;
  color: #ffffff;
  border-radius: 6px;
  font-weight: 500;
  cursor: not-allowed;
}

/* Element Plus 在加载态以 30% 白色遮罩涂抹按钮（其 `is-loading:before` 伪元素
   的 `--el-mask-color-extra-light`）；在深色加载态下该遮罩会冲淡底色并削弱与
   常态的对比，故在本按钮的加载态内置为透明。 */
.cc-dialog-submit.is-loading::before {
  background-color: transparent;
}

.cc-dialog :deep(.el-dialog__body) {
  padding-top: 8px;
}

/* 字段纵向节奏（CCFG-REQ-138/CCFG-DESIGN-073/CCFG-UI-061）：以参考页“新增数据源”弹窗的
   配置项节奏为参照。本页每个字段都带 `.cc-field-feedback` 的稳定占位（min-height + margin，见下），
   它已独自提供字段间的可见留白；原先再叠加的字段 `gap: 14px` 会把三个字段的间距推到参考页节奏的
   约两倍，故移除该层叠加（不新增像素值），只保留反馈区提供的稳定间隔与受控滚动。
   反馈区、红色框／文字反馈与长文案换行口径均不变。 */
.cc-form {
  display: flex;
  flex-direction: column;
  /* CCFG-UI-024：内容区相对视口安全高度，超出内部纵向滚动 */
  max-height: calc(100vh - 240px);
  overflow-y: auto;
}

/* 水平间距（CCFG-REQ-137/CCFG-DESIGN-072/CCFG-UI-060）：标签列宽与三项控件左边界由
   本项 flex 行统一决定——标签右缘与控件左缘之间统一留 12px，标签仍右对齐，
   三项控件左边界继续对齐；控件为 `flex: 1`，多出的 12px 从控件宽度中扣除，
   故控件右边界保持调整前布局位置。不改单个输入框宽度、不改公共组件、不引入全局样式。 */
.cc-form-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

/* 配置项名称标签对齐参考页 `/config/data-source` 新增／编辑主弹窗标签
   （`.editor-dialog .el-form-item__label`：14px / 500 / #3f3f46）；沿用页面默认无衬线字体族，
   不套用主表探针 ID 的等宽粗体样式；必填红星与校验语义保留（CCFG-REQ-119/CCFG-UI-046）。
   标签列宽固定并右对齐：右边缘整齐、左边缘允许参差，红星仍在名称前
   （CCFG-REQ-130/CCFG-DESIGN-068/CCFG-UI-057）。 */
.cc-form-label {
  flex: 0 0 84px;
  padding-top: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #3f3f46;
  text-align: right;
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

/* 字段级错误态：控件红色边框（CCFG-REQ-123/CCFG-DESIGN-061/CCFG-UI-050）。
   输入框与文本域沿用 Element Plus 的 inset box-shadow 边框表现，聚焦态仍保持红色。 */
.cc-field--error :deep(.el-input__wrapper),
.cc-field--error :deep(.el-input__wrapper.is-focus),
.cc-field--error :deep(.el-textarea__inner),
.cc-field--error :deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--el-color-danger) inset;
}

/* 字段反馈区预留稳定空间：选中／取消选择与普通错误状态切换时弹窗底边与页脚不明显跳动
   （CCFG-REQ-128/CCFG-DESIGN-066/CCFG-UI-055）。用最小高度而非固定高度，
   需要换行的真实错误文案完整可读、不裁剪（不设 overflow:hidden、不固定单行高度）。 */
.cc-field-feedback {
  min-height: 20px;
  margin-top: 2px;
}

.cc-field-feedback__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.cc-field-error {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--el-color-danger);
  overflow-wrap: anywhere;
}

.cc-field-hint {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: #909399;
  overflow-wrap: anywhere;
}

.cc-split {
  display: flex;
  gap: 10px;
  width: 100%;
}

/* “采集数据源”选择区域整体呈错误态：红色边框（CCFG-REQ-123/CCFG-UI-054）。 */
.cc-split--error .cc-pane {
  border-color: var(--el-color-danger);
}

.cc-pane {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fafafa;
  padding: 8px;
  flex: 1;
  min-width: 0;
}

/* 横向比例：“可选数据源”略宽于“已选”，以改善机构名称、`DATA_SOURCE_ID` 与
   不可选择原因的可读性（CCFG-REQ-117/CCFG-DESIGN-057/CCFG-UI-045）。 */
.cc-pane--options {
  flex: 1.15;
}

.cc-pane--chosen {
  flex: 1;
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

/* 候选数据源可见高度提高，使一次能显示的条数多于调整前；空间不足时仍为受控滚动
   （该受控滚动仅限弹窗候选区，`+N` 清单的“无内部滚动”规则不适用于此，CCFG-REQ-117）。 */
.cc-opt-list {
  max-height: 260px;
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

/* 已选区可见高度与候选区同步提高（受控滚动保留，CCFG-REQ-117）。 */
.cc-pane--chosen .cc-chosen-list {
  max-height: 260px;
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
</style>

<!-- “更多”下拉菜单（Teleport 到 body，故必须为全局作用域并只限定在本页 popper-class 命名空间内）：
     条目顺序为先“停用/启用”、后“删除”；“停用”为警告语义、“删除”为危险语义并以分隔线单独隔开
     （CCFG-UI-041）。柔和圆角、弥散阴影、适当内边距与清晰 Hover／焦点反馈；下拉内不出现状态标签、
     不出现批量操作。 -->
<style>
.cc-more-popper.el-popper {
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
}

.cc-more-popper .el-dropdown-menu {
  border-radius: 8px;
  padding: 4px;
}

/* 菜单条目统一字重：危险项“删除”不加粗，与“启用／停用”保持一致；危险语义仅由红色文字、
   上方分隔线与 Hover／焦点反馈承载（CCFG-REQ-122/CCFG-DESIGN-060/CCFG-UI-049）。 */
.cc-more-popper .el-dropdown-menu__item {
  border-radius: 6px;
  padding: 6px 12px;
  font-weight: 400;
}

.cc-more-popper .el-dropdown-menu__item--divided {
  margin: 4px 0;
}

.cc-more-popper .el-dropdown-menu__item.cc-more-danger {
  color: var(--el-color-danger);
}

/* Hover／焦点反馈沿用 Element Plus 既有高亮，但危险/警告语义色在任何交互态下都不被覆盖 */
.cc-more-popper .el-dropdown-menu__item.cc-more-danger:not(.is-disabled):hover,
.cc-more-popper .el-dropdown-menu__item.cc-more-danger:not(.is-disabled):focus {
  color: var(--el-color-danger);
}

.cc-more-popper .el-dropdown-menu__item.cc-more-warning:not(.is-disabled):hover,
.cc-more-popper .el-dropdown-menu__item.cc-more-warning:not(.is-disabled):focus {
  color: #b45309;
}

.cc-more-popper .el-dropdown-menu__item.cc-more-danger.is-disabled,
.cc-more-popper .el-dropdown-menu__item.cc-more-danger.is-disabled:hover {
  color: var(--el-color-danger-light-5);
}

.cc-more-popper .el-dropdown-menu__item.cc-more-warning {
  color: #b45309;
}

.cc-more-popper .el-dropdown-menu__item.cc-more-warning.is-disabled,
.cc-more-popper .el-dropdown-menu__item.cc-more-warning.is-disabled:hover {
  color: #f0b775;
}
</style>
