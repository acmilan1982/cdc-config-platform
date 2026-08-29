<template>
  <div class="data-source-page">
    <!-- 查询区 -->
    <el-card class="query-card" shadow="never">
      <el-form inline :model="query" class="query-form">
        <el-form-item label="数据源ID">
          <el-input
            v-model="query.id"
            placeholder="数据源ID模糊查询"
            clearable
            maxlength="32"
            @keyup.enter="onQuery"
          />
        </el-form-item>
        <el-form-item label="名称">
          <el-input
            v-model="query.name"
            placeholder="数据源名称模糊查询"
            clearable
            maxlength="30"
            @keyup.enter="onQuery"
          />
        </el-form-item>
        <el-form-item label="主机">
          <el-input
            v-model="query.host"
            placeholder="主机地址模糊查询"
            clearable
            maxlength="64"
            @keyup.enter="onQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onQuery">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 主列表 -->
    <el-card class="table-card" shadow="never" v-loading="loading">
      <div class="card-toolbar">
        <span class="table-title">数据源列表</span>
        <el-button type="primary" @click="openCreate">新增数据源</el-button>
      </div>

      <el-alert
        v-if="loadError"
        :title="loadError"
        type="error"
        show-icon
        :closable="false"
        class="load-error"
      />

      <el-table
        :data="rows"
        class="data-table"
        empty-text="暂无数据源"
        @row-dblclick="onRowDoubleClick"
      >
        <el-table-column prop="dataSourceId" label="数据源ID" min-width="120" show-overflow-tooltip />
        <el-table-column prop="dataSourceName" label="数据源名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="角色" width="90">
          <template #default="{ row }">
            <el-tag :type="row.dataSourceCategory === 'SOURCE' ? 'warning' : 'success'" size="small">
              {{ categoryLabel(row.dataSourceCategory) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataSourceType" label="类型" width="90" />
        <el-table-column prop="host" label="主机" min-width="130" show-overflow-tooltip />
        <el-table-column prop="port" label="端口" width="80" />
        <el-table-column prop="serviceName" label="Service Name/数据库名" min-width="150" show-overflow-tooltip />
        <el-table-column prop="userName" label="用户名" min-width="110" show-overflow-tooltip />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button
              link
              type="danger"
              :loading="deletingId === row.dataSourceId"
              :disabled="deletingId !== ''"
              @click="onDelete(row)"
            >删除</el-button>
            <el-button
              v-if="row.dataSourceCategory === 'TARGET'"
              link
              type="primary"
              @click="openBizAttr(row)"
            >
              业务属性
            </el-button>
            <el-button
              v-if="row.dataSourceCategory === 'SOURCE'"
              link
              type="primary"
              @click="openNamingStrategy(row)"
            >
              目标库命名策略
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑数据源 -->
    <el-dialog
      v-model="editorVisible"
      :title="isEdit ? '编辑数据源' : '新增数据源'"
      width="620px"
      destroy-on-close
      :close-on-click-modal="false"
      :before-close="onEditorBeforeClose"
      @closed="onEditorClosed"
    >
      <el-form
        ref="editorFormRef"
        :model="editorForm"
        :rules="editorRules"
        label-width="120px"
        class="editor-form"
        v-loading="editorLoading"
      >
        <el-form-item label="数据源ID" prop="dataSourceId">
          <el-input v-model="editorForm.dataSourceId" placeholder="请输入数据源ID" maxlength="32" />
          <div class="field-tip">仅允许字母、数字、下划线、中划线</div>
        </el-form-item>
        <el-form-item label="数据源名称" prop="dataSourceName">
          <el-input v-model="editorForm.dataSourceName" placeholder="请输入数据源名称" maxlength="30" />
        </el-form-item>
        <el-form-item label="角色" prop="dataSourceCategory">
          <el-select
            v-model="editorForm.dataSourceCategory"
            placeholder="请选择角色"
            @change="onCategoryChange"
          >
            <el-option label="源库（SOURCE）" value="SOURCE" />
            <el-option label="目标库（TARGET）" value="TARGET" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型" prop="dataSourceType">
          <el-select v-model="editorForm.dataSourceType" placeholder="请选择类型">
            <el-option
              v-for="opt in typeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="主机" prop="host">
          <el-input v-model="editorForm.host" placeholder="请输入主机地址" maxlength="64" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input-number
            v-model="editorForm.port"
            :min="1"
            :max="65535"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item :label="serviceNameLabel" prop="serviceName">
          <el-input v-model="editorForm.serviceName" placeholder="请输入" maxlength="64" />
        </el-form-item>
        <el-form-item label="用户名" prop="userName">
          <el-input v-model="editorForm.userName" placeholder="请输入用户名" maxlength="64" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="passwordInput"
            type="password"
            show-password
            :placeholder="isEdit ? '不修改请留空' : '请输入密码'"
            maxlength="64"
            @focus="onPasswordFocus"
            @blur="onPasswordBlur"
            @input="onPasswordInput"
          />
          <div v-if="isEdit && !passwordEdited" class="field-tip">显示掩码表示沿用原密码</div>
        </el-form-item>
      </el-form>

      <div v-if="editorFormError" class="form-error" role="alert">{{ editorFormError }}</div>

      <div class="test-bar">
        <el-button
          :disabled="testing || editorLoading"
          :loading="testing"
          @click="onTestConnection"
        >
          测试连接
        </el-button>
        <span v-if="testing" class="test-result is-testing">测试连接中，剩余 {{ testCountdown }} 秒</span>
        <span
          v-else-if="testResult"
          class="test-result"
          :class="testResult.success ? 'is-ok' : 'is-fail'"
        >
          {{ testResult.success ? '连接成功' : testResult.message }}
        </span>
      </div>

      <template #footer>
        <el-button :disabled="saving" @click="requestCloseEditor">取消</el-button>
        <el-button type="primary" :loading="saving" :disabled="editorLoading" @click="onSaveEditor">
          {{ isEdit ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 业务属性（仅目标库） -->
    <el-dialog
      v-model="bizAttrVisible"
      title="业务属性"
      width="560px"
      destroy-on-close
      :close-on-click-modal="false"
      :before-close="onBizAttrBeforeClose"
    >
      <div v-loading="bizAttrLoading" class="biz-attr-body">
        <div class="biz-attr-target">
          目标库：{{ bizAttrTarget?.dataSourceId }}（{{ bizAttrTarget?.dataSourceName }}）
        </div>
        <el-input
          v-model="bizAttrText"
          type="textarea"
          :rows="12"
          placeholder="请输入业务属性内容（原样保存，不做校验）"
        />
        <div class="field-tip">业务属性以 JSON 字符串原样保存，不裁剪、不校验格式。</div>
      </div>
      <template #footer>
        <el-button @click="closeBizAttr">取消</el-button>
        <el-button type="primary" :loading="bizAttrSaving" @click="onSaveBizAttr">保存</el-button>
      </template>
    </el-dialog>

    <!-- 目标库命名策略（仅源库） -->
    <el-dialog
      v-model="namingVisible"
      :title="`目标库命名策略 - ${namingSource?.dataSourceId}（${namingSource?.dataSourceName}）`"
      width="760px"
      destroy-on-close
      :close-on-click-modal="false"
      :before-close="onNamingBeforeClose"
    >
      <el-table :data="namingRows" v-loading="namingLoading" empty-text="暂无命名策略" class="naming-table">
        <el-table-column prop="targetDataSourceId" label="目标库ID" min-width="120" show-overflow-tooltip />
        <el-table-column prop="targetDataSourceName" label="目标库名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="targetDataSourceType" label="数据库类型" min-width="90" show-overflow-tooltip />
        <el-table-column label="命名策略" width="110">
          <template #default="{ row }">
            {{ strategyLabel(row.tableNamingStrategy) }}
          </template>
        </el-table-column>
        <el-table-column prop="tableNamePrefix" label="前缀" min-width="90" show-overflow-tooltip />
        <el-table-column prop="tableNameSuffix" label="后缀" min-width="90" show-overflow-tooltip />
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :disabled="namingSaving"
              @click="openNamingEdit(row)"
            >编辑</el-button>
            <el-button
              link
              type="danger"
              :loading="namingDeletingId === row.targetDataSourceId"
              :disabled="namingSaving || namingDeletingId !== ''"
              @click="onDeleteNaming(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-divider content-position="left">{{ isNamingEdit ? '编辑命名策略' : '新增命名策略' }}</el-divider>

      <el-form
        ref="namingFormRef"
        :model="namingForm"
        :rules="namingRules"
        label-width="110px"
        class="naming-form"
      >
        <el-form-item label="目标库" prop="targetDataSourceId">
          <el-select
            v-model="namingForm.targetDataSourceId"
            placeholder="请选择目标库"
            filterable
          >
            <el-option
              v-for="opt in targetOptions"
              :key="opt.dataSourceId"
              :label="`${opt.dataSourceId}（${opt.dataSourceName}）`"
              :value="opt.dataSourceId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="表命名策略" prop="tableNamingStrategy">
          <el-radio-group v-model="namingForm.tableNamingStrategy" @change="onNamingStrategyChange">
            <el-radio value="TABLE_MERGE">表合并</el-radio>
            <el-radio value="CUSTOM_PREFIX_SUFFIX">自定义前后缀</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="表名前缀" prop="tableNamePrefix">
          <el-input
            v-model="namingForm.tableNamePrefix"
            :disabled="namingForm.tableNamingStrategy === 'TABLE_MERGE'"
            placeholder="表合并时无需填写"
            maxlength="128"
          />
        </el-form-item>
        <el-form-item label="表名后缀" prop="tableNameSuffix">
          <el-input
            v-model="namingForm.tableNameSuffix"
            :disabled="namingForm.tableNamingStrategy === 'TABLE_MERGE'"
            placeholder="表合并时无需填写"
            maxlength="128"
          />
        </el-form-item>
      </el-form>

      <div v-if="namingFormError" class="form-error" role="alert">{{ namingFormError }}</div>

      <template #footer>
        <el-button :disabled="namingSaving" @click="requestCloseNaming">取消</el-button>
        <el-button type="primary" :loading="namingSaving" :disabled="namingSaving" @click="onSaveNaming">
          {{ isNamingEdit ? '保存' : '新增' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import Schema from 'async-validator'
import {
  createDataSource,
  createNamingStrategy,
  deleteDataSource,
  deleteNamingStrategy,
  fetchBizAttr,
  fetchDataSourceDetail,
  fetchDataSourceList,
  fetchNamingStrategies,
  fetchTargetOptions,
  saveBizAttr,
  testDataSourceConnection,
  updateDataSource,
  updateNamingStrategy,
} from '@/api/dataSource'
import type {
  DataSourceCreateRequest,
  DataSourceListQuery,
  DataSourceRow,
  DataSourceUpdateRequest,
  NamingStrategySaveRequest,
  NamingStrategyVO,
  TargetOptionVO,
  TestConnectionRequest,
  TestConnectionResult,
} from '@/types/dataSource'

const PASSWORD_MASK = '*********'
const TEST_COUNTDOWN_SECONDS = 10

const rows = ref<DataSourceRow[]>([])
const loading = ref(false)
const loadError = ref('')
const query = ref<DataSourceListQuery>({ id: '', name: '', host: '' })

function categoryLabel(category: string): string {
  return category === 'SOURCE' ? '源库' : '目标库'
}

function strategyLabel(strategy: string): string {
  return strategy === 'TABLE_MERGE' ? '表合并' : '自定义前后缀'
}

async function loadList() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await fetchDataSourceList(normalizeQuery())
    if (res.code === 200) {
      rows.value = res.data ?? []
    } else {
      loadError.value = res.message || '数据源列表加载失败'
      rows.value = []
    }
  } catch (e) {
    loadError.value = resolveHttpMessage(e)
    rows.value = []
  } finally {
    loading.value = false
  }
}

function normalizeQuery(): DataSourceListQuery {
  const q: DataSourceListQuery = {}
  const id = (query.value.id ?? '').trim()
  const name = (query.value.name ?? '').trim()
  const host = (query.value.host ?? '').trim()
  if (id) q.id = id
  if (name) q.name = name
  if (host) q.host = host
  return q
}

function onQuery() {
  loadList()
}

function onReset() {
  query.value = { id: '', name: '', host: '' }
  loadList()
}

const deletingId = ref('')

async function onDelete(row: DataSourceRow) {
  if (deletingId.value) {
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定删除数据源 ${row.dataSourceId}（${row.dataSourceName}）吗？`,
      '提示',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  deletingId.value = row.dataSourceId
  try {
    const res = await deleteDataSource(row.dataSourceId)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await loadList()
    } else {
      ElMessage.error(res.message || '删除失败，请稍后重试')
    }
  } catch (e) {
    ElMessage.error(resolveHttpMessage(e))
  } finally {
    deletingId.value = ''
  }
}

// ---- 新增/编辑 ----

interface EditorForm {
  dataSourceId: string
  dataSourceName: string
  dataSourceCategory: string
  dataSourceType: string
  host: string
  port: number | undefined
  userName: string
  serviceName: string
}

interface EditorSnapshot {
  form: EditorForm
  passwordEdited: boolean
}

const editorVisible = ref(false)
const editorFormError = ref('')
const editorMode = ref<'create' | 'edit'>('create')
const editorFormRef = ref<FormInstance>()
const editorForm = ref<EditorForm>(emptyEditorForm())
const originalDataSourceId = ref('')
const passwordInput = ref('')
const passwordEdited = ref(false)
const saving = ref(false)
const editorLoading = ref(false)
const detailToken = ref(0)
const editorSnapshot = ref<EditorSnapshot | null>(null)

const testResult = ref<TestConnectionResult | null>(null)
const testing = ref(false)
const testCountdown = ref(0)
const testToken = ref(0)
let testTimer: number | null = null

const isEdit = computed(() => editorMode.value === 'edit')

function emptyEditorForm(): EditorForm {
  return {
    dataSourceId: '',
    dataSourceName: '',
    dataSourceCategory: 'SOURCE',
    dataSourceType: 'ORACLE',
    host: '',
    port: 1521,
    userName: '',
    serviceName: '',
  }
}

type SchemaDescriptor = ConstructorParameters<typeof Schema>[0]
type SchemaSource = Parameters<typeof Schema.prototype.validate>[0]

/**
 * 提交前的权威校验：直接用 async-validator 跑与 el-form 相同的规则。
 * jsdom 下 element-plus 外部化后 node 对 async-validator 的 ESM/CJS 互操作会令
 * el-form 的 validate() 静默通过，因此提交门槛不依赖 el-form，改用本函数。
 */
async function validateWithSchema(
  rules: FormRules,
  model: Record<string, unknown>,
): Promise<{ valid: boolean; firstMessage: string }> {
  try {
    await new Schema(rules as SchemaDescriptor).validate(model as SchemaSource, {
      firstFields: true,
    })
    return { valid: true, firstMessage: '' }
  } catch (e) {
    const errors = (e as { fields?: Record<string, Array<{ message: string }>> }).fields ?? {}
    const first = Object.values(errors).flat()[0]?.message
    return { valid: false, firstMessage: first || '提交失败，请检查表单填写' }
  }
}

const typeOptions = computed(() => {
  if (editorForm.value.dataSourceCategory === 'SOURCE') {
    return [{ label: 'ORACLE', value: 'ORACLE' }]
  }
  return [
    { label: 'ORACLE', value: 'ORACLE' },
    { label: 'MYSQL', value: 'MYSQL' },
    { label: 'DORIS', value: 'DORIS' },
  ]
})

const serviceNameLabel = computed(() =>
  editorForm.value.dataSourceType === 'ORACLE' ? 'Service Name' : '数据库名',
)

function onCategoryChange() {
  if (
    editorForm.value.dataSourceType &&
    !typeOptions.value.some((o) => o.value === editorForm.value.dataSourceType)
  ) {
    editorForm.value.dataSourceType = ''
  }
}

function validatePassword(_rule: unknown, _value: unknown, callback: (err?: Error) => void) {
  if (passwordInput.value.trim() === '') {
    if (!isEdit.value) {
      callback(new Error('请输入密码'))
    } else if (passwordEdited.value) {
      callback(new Error('请输入新密码'))
    } else {
      callback()
    }
    return
  }
  callback()
}

const editorRules: FormRules = {
  dataSourceId: [
    { required: true, message: '请输入数据源ID', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_-]+$/, message: '仅允许字母、数字、下划线、中划线', trigger: 'blur' },
    { max: 32, message: '长度不能超过 32 个字符', trigger: 'blur' },
  ],
  dataSourceName: [
    { required: true, message: '请输入数据源名称', trigger: 'blur' },
    { max: 30, message: '长度不能超过 30 个字符', trigger: 'blur' },
  ],
  dataSourceCategory: [{ required: true, message: '请选择角色', trigger: 'change' }],
  dataSourceType: [{ required: true, message: '请选择类型', trigger: 'change' }],
  host: [
    { required: true, message: '请输入主机', trigger: 'blur' },
    { max: 64, message: '长度不能超过 64 个字符', trigger: 'blur' },
  ],
  port: [{ type: 'number', required: true, message: '请输入端口', trigger: 'change' }],
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { max: 64, message: '长度不能超过 64 个字符', trigger: 'blur' },
  ],
  serviceName: [
    { required: true, message: '请输入 Service Name 或数据库名', trigger: 'blur' },
    { max: 64, message: '长度不能超过 64 个字符', trigger: 'blur' },
  ],
  password: [{ validator: validatePassword, trigger: 'blur' }],
}

function takeEditorSnapshot() {
  editorSnapshot.value = {
    form: {
      ...editorForm.value,
    },
    passwordEdited: passwordEdited.value,
  }
}

/** 主弹窗未保存判定：任何表单字段或密码编辑状态与规范化快照不一致即为脏。 */
const editorDirty = computed(() => {
  const s = editorSnapshot.value
  if (!s) {
    return false
  }
  const f = editorForm.value
  return (
    f.dataSourceId !== s.form.dataSourceId ||
    f.dataSourceName !== s.form.dataSourceName ||
    f.dataSourceCategory !== s.form.dataSourceCategory ||
    f.dataSourceType !== s.form.dataSourceType ||
    f.host !== s.form.host ||
    f.port !== s.form.port ||
    f.userName !== s.form.userName ||
    f.serviceName !== s.form.serviceName ||
    passwordEdited.value !== s.passwordEdited
  )
})

function openCreate() {
  editorMode.value = 'create'
  originalDataSourceId.value = ''
  editorForm.value = emptyEditorForm()
  passwordInput.value = ''
  passwordEdited.value = false
  editorLoading.value = false
  resetTestState()
  editorFormError.value = ''
  editorVisible.value = true
  editorFormRef.value?.clearValidate()
  takeEditorSnapshot()
}

/** 打开编辑弹窗即加载详情；originalDataSourceId 取自列表行并保持不变。 */
function openEdit(row: DataSourceRow) {
  editorMode.value = 'edit'
  originalDataSourceId.value = row.dataSourceId
  passwordInput.value = PASSWORD_MASK
  passwordEdited.value = false
  editorForm.value = emptyEditorForm()
  editorFormError.value = ''
  resetTestState()
  editorVisible.value = true
  editorFormRef.value?.clearValidate()
  loadEditorDetail(row.dataSourceId)
}

function onRowDoubleClick(row: DataSourceRow) {
  openEdit(row)
}

async function loadEditorDetail(dataSourceId: string) {
  const token = ++detailToken.value
  editorLoading.value = true
  editorFormError.value = ''
  try {
    const res = await fetchDataSourceDetail(dataSourceId)
    if (token !== detailToken.value) {
      return
    }
    if (res.code === 200) {
      const d = res.data
      editorForm.value = {
        dataSourceId: d.dataSourceId,
        dataSourceName: d.dataSourceName,
        dataSourceCategory: d.dataSourceCategory,
        dataSourceType: d.dataSourceType,
        host: d.host,
        port: d.port,
        userName: d.userName,
        serviceName: d.serviceName,
      }
      passwordInput.value = PASSWORD_MASK
      passwordEdited.value = false
    } else {
      editorFormError.value = res.message || '数据源详情加载失败'
    }
  } catch (e) {
    if (token !== detailToken.value) {
      return
    }
    editorFormError.value = resolveHttpMessage(e)
  } finally {
    if (token === detailToken.value) {
      editorLoading.value = false
      takeEditorSnapshot()
    }
  }
}

function onPasswordFocus() {
  if (isEdit.value && !passwordEdited.value) {
    passwordInput.value = ''
  }
}

function onPasswordBlur() {
  // 未编辑时失焦恢复固定星号视觉状态，避免误判为已修改
  if (isEdit.value && !passwordEdited.value) {
    passwordInput.value = PASSWORD_MASK
  }
}

function onPasswordInput() {
  passwordEdited.value = true
}

function clearTestTimer() {
  if (testTimer !== null) {
    window.clearInterval(testTimer)
    testTimer = null
  }
  testCountdown.value = 0
}

/** 失效当前测试连接状态：代次 +1，使在途请求的迟到响应成为过期响应。 */
function resetTestState() {
  testToken.value += 1
  testing.value = false
  clearTestTimer()
  testResult.value = null
}

function onEditorClosed() {
  resetTestState()
}

/** 主弹窗关闭确认：取消按钮、右上角 X、ESC、遮罩均走同一逻辑。 */
function onEditorBeforeClose(done: () => void) {
  if (editorDirty.value) {
    ElMessageBox.confirm('表单有未保存的修改，确定关闭吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定关闭',
      cancelButtonText: '取消',
    })
      .then(() => {
        done()
      })
      .catch(() => {
        /* 用户拒绝关闭，保持弹窗与表单 */
      })
    return
  }
  done()
}

async function requestCloseEditor() {
  if (editorDirty.value) {
    try {
      await ElMessageBox.confirm('表单有未保存的修改，确定关闭吗？', '提示', {
        type: 'warning',
        confirmButtonText: '确定关闭',
        cancelButtonText: '取消',
      })
    } catch {
      return
    }
  }
  editorVisible.value = false
}

onBeforeUnmount(() => {
  clearTestTimer()
})

watch(
  () => [
    editorForm.value.dataSourceType,
    editorForm.value.host,
    editorForm.value.port,
    editorForm.value.userName,
    editorForm.value.serviceName,
    passwordInput.value,
  ],
  () => {
    if (testResult.value || testCountdown.value > 0 || testing.value) {
      resetTestState()
    }
  },
)

function buildTestRequest(): TestConnectionRequest {
  const req: TestConnectionRequest = {
    originalDataSourceId: isEdit.value ? originalDataSourceId.value : undefined,
    dataSourceType: editorForm.value.dataSourceType,
    host: editorForm.value.host,
    port: editorForm.value.port as number,
    userName: editorForm.value.userName,
    serviceName: editorForm.value.serviceName,
  }
  if (passwordInput.value.trim() !== '' && (!isEdit.value || passwordEdited.value)) {
    req.password = passwordInput.value.trim()
  }
  return req
}

/** 发起请求的同时启动 10 秒倒计时；到 0 直接判定超时并使在途响应失效。 */
async function onTestConnection() {
  if (testing.value || editorLoading.value) {
    return
  }
  resetTestState()
  const token = testToken.value
  testing.value = true
  startCountdownTimer(token)
  try {
    const res = await testDataSourceConnection(buildTestRequest())
    if (token !== testToken.value) {
      return
    }
    clearTestTimer()
    testing.value = false
    if (res.code === 200) {
      testResult.value = res.data
    } else {
      testResult.value = { success: false, message: res.message || '连接测试失败' }
    }
  } catch (e) {
    if (token !== testToken.value) {
      return
    }
    clearTestTimer()
    testing.value = false
    testResult.value = { success: false, message: resolveHttpMessage(e) }
  }
}

function startCountdownTimer(token: number) {
  clearTestTimer()
  testCountdown.value = TEST_COUNTDOWN_SECONDS
  testTimer = window.setInterval(() => {
    testCountdown.value -= 1
    if (testCountdown.value <= 0) {
      clearTestTimer()
      if (token === testToken.value) {
        // 到 0 结束本次 UI 测试状态，同时 +1 代次，迟到响应不得覆盖超时结果
        testing.value = false
        testResult.value = { success: false, message: '连接超时' }
        testToken.value += 1
      }
    }
  }, 1000)
}

async function onSaveEditor() {
  if (saving.value || editorLoading.value) {
    return
  }
  const form = editorFormRef.value
  if (form) {
    try {
      await form.validate()
    } catch {
      return
    }
  }
  const editorCheck = await validateWithSchema(
    editorRules,
    editorForm.value as unknown as Record<string, unknown>,
  )
  if (!editorCheck.valid) {
    editorFormError.value = editorCheck.firstMessage
    return
  }
  editorFormError.value = ''
  saving.value = true
  try {
    const base = {
      dataSourceName: editorForm.value.dataSourceName.trim(),
      dataSourceCategory: editorForm.value.dataSourceCategory,
      dataSourceType: editorForm.value.dataSourceType,
      host: editorForm.value.host.trim(),
      port: editorForm.value.port as number,
      userName: editorForm.value.userName.trim(),
      serviceName: editorForm.value.serviceName.trim(),
    }
    if (isEdit.value) {
      const request: DataSourceUpdateRequest = {
        ...base,
        dataSourceId: editorForm.value.dataSourceId.trim(),
      }
      if (passwordEdited.value) {
        request.password = passwordInput.value.trim()
      }
      const res = await updateDataSource(originalDataSourceId.value, request)
      if (res.code === 200) {
        ElMessage.success('保存成功')
        takeEditorSnapshot()
        editorVisible.value = false
        await loadList()
      } else {
        ElMessage.error(res.message || '保存失败，请稍后重试')
      }
    } else {
      const request: DataSourceCreateRequest = {
        ...base,
        dataSourceId: editorForm.value.dataSourceId.trim(),
        password: passwordInput.value.trim(),
      }
      const res = await createDataSource(request)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        takeEditorSnapshot()
        editorVisible.value = false
        await loadList()
      } else {
        ElMessage.error(res.message || '新增失败，请稍后重试')
      }
    }
  } catch (e) {
    ElMessage.error(resolveHttpMessage(e))
  } finally {
    saving.value = false
  }
}

// ---- 业务属性 ----

const bizAttrVisible = ref(false)
const bizAttrLoading = ref(false)
const bizAttrSaving = ref(false)
const bizAttrTarget = ref<DataSourceRow | null>(null)
const bizAttrText = ref('')
const bizAttrOriginal = ref('')

const bizAttrDirty = computed(() => bizAttrText.value !== bizAttrOriginal.value)

async function openBizAttr(row: DataSourceRow) {
  bizAttrTarget.value = row
  bizAttrText.value = ''
  bizAttrOriginal.value = ''
  bizAttrVisible.value = true
  await loadBizAttr(row.dataSourceId)
}

async function loadBizAttr(dataSourceId: string) {
  bizAttrLoading.value = true
  try {
    const res = await fetchBizAttr(dataSourceId)
    if (res.code === 200) {
      bizAttrText.value = res.data.bizAttr ?? ''
    } else {
      ElMessage.error(res.message || '业务属性加载失败')
      bizAttrText.value = ''
    }
  } catch (e) {
    ElMessage.error(resolveHttpMessage(e))
    bizAttrText.value = ''
  } finally {
    bizAttrLoading.value = false
    bizAttrOriginal.value = bizAttrText.value
  }
}

function onBizAttrBeforeClose(done: () => void) {
  if (bizAttrDirty.value) {
    ElMessageBox.confirm('业务属性有未保存的修改，确定关闭吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定关闭',
      cancelButtonText: '取消',
    })
      .then(() => {
        done()
      })
      .catch(() => {
        /* 用户取消关闭 */
      })
    return
  }
  done()
}

async function closeBizAttr() {
  if (bizAttrDirty.value) {
    try {
      await ElMessageBox.confirm('业务属性有未保存的修改，确定关闭吗？', '提示', {
        type: 'warning',
        confirmButtonText: '确定关闭',
        cancelButtonText: '取消',
      })
    } catch {
      return
    }
  }
  bizAttrVisible.value = false
}

async function onSaveBizAttr() {
  if (bizAttrSaving.value || !bizAttrTarget.value) {
    return
  }
  bizAttrSaving.value = true
  try {
    const res = await saveBizAttr(bizAttrTarget.value.dataSourceId, {
      bizAttr: bizAttrText.value,
    })
    if (res.code === 200) {
      ElMessage.success('保存成功')
      bizAttrVisible.value = false
    } else {
      ElMessage.error(res.message || '保存失败，请稍后重试')
    }
  } catch (e) {
    ElMessage.error(resolveHttpMessage(e))
  } finally {
    bizAttrSaving.value = false
  }
}

// ---- 目标库命名策略 ----

const namingVisible = ref(false)
const namingFormError = ref('')
const namingLoading = ref(false)
const namingSaving = ref(false)
const namingDeletingId = ref('')
const namingSource = ref<DataSourceRow | null>(null)
const namingRows = ref<NamingStrategyVO[]>([])
const targetOptions = ref<TargetOptionVO[]>([])
const namingFormRef = ref<FormInstance>()
const namingOriginalTargetId = ref('')
const namingForm = ref<NamingStrategySaveRequest>(emptyNamingForm())
const namingSnapshot = ref<NamingStrategySaveRequest | null>(null)

const isNamingEdit = computed(() => namingOriginalTargetId.value !== '')

function takeNamingSnapshot() {
  namingSnapshot.value = { ...namingForm.value }
}

/** 命名策略表单未保存判定：与规范化快照不一致即为脏。 */
const namingDirty = computed(() => {
  const s = namingSnapshot.value
  if (!s) {
    return false
  }
  const f = namingForm.value
  return (
    s.targetDataSourceId !== f.targetDataSourceId ||
    s.tableNamingStrategy !== f.tableNamingStrategy ||
    s.tableNamePrefix !== f.tableNamePrefix ||
    s.tableNameSuffix !== f.tableNameSuffix
  )
})

function emptyNamingForm(): NamingStrategySaveRequest {
  return {
    targetDataSourceId: '',
    tableNamingStrategy: 'TABLE_MERGE',
    tableNamePrefix: '',
    tableNameSuffix: '',
  }
}

function validatePrefix(_rule: unknown, value: string, callback: (err?: Error) => void) {
  if (
    namingForm.value.tableNamingStrategy === 'CUSTOM_PREFIX_SUFFIX' &&
    (value ?? '').trim() === ''
  ) {
    callback(new Error('请输入表名前缀'))
    return
  }
  callback()
}

function validateSuffix(_rule: unknown, value: string, callback: (err?: Error) => void) {
  if (
    namingForm.value.tableNamingStrategy === 'CUSTOM_PREFIX_SUFFIX' &&
    (value ?? '').trim() === ''
  ) {
    callback(new Error('请输入表名后缀'))
    return
  }
  callback()
}

const namingRules: FormRules = {
  targetDataSourceId: [{ required: true, message: '请选择目标库', trigger: 'change' }],
  tableNamingStrategy: [{ required: true, message: '请选择表命名策略', trigger: 'change' }],
  tableNamePrefix: [{ validator: validatePrefix, trigger: 'blur' }],
  tableNameSuffix: [{ validator: validateSuffix, trigger: 'blur' }],
}

async function openNamingStrategy(row: DataSourceRow) {
  namingSource.value = row
  namingRows.value = []
  doResetNamingForm()
  namingVisible.value = true
  loadTargetOptions()
  await loadNaming(row.dataSourceId)
}

function doResetNamingForm() {
  namingOriginalTargetId.value = ''
  namingForm.value = emptyNamingForm()
  namingFormError.value = ''
  namingFormRef.value?.clearValidate()
  takeNamingSnapshot()
}

/** 切换到新增/清空表单；当前表单已修改时先确认放弃。 */
async function resetNamingFormWithConfirm() {
  if (namingDirty.value) {
    try {
      await ElMessageBox.confirm('命名策略有未保存的修改，确定放弃吗？', '提示', {
        type: 'warning',
        confirmButtonText: '确定放弃',
        cancelButtonText: '取消',
      })
    } catch {
      return false
    }
  }
  doResetNamingForm()
  return true
}

async function loadNaming(sourceId: string) {
  namingLoading.value = true
  try {
    const res = await fetchNamingStrategies(sourceId)
    if (res.code === 200) {
      namingRows.value = res.data ?? []
    } else {
      ElMessage.error(res.message || '命名策略加载失败')
      namingRows.value = []
    }
  } catch (e) {
    ElMessage.error(resolveHttpMessage(e))
    namingRows.value = []
  } finally {
    namingLoading.value = false
  }
}

async function loadTargetOptions() {
  try {
    const res = await fetchTargetOptions()
    if (res.code === 200) {
      targetOptions.value = res.data ?? []
    } else {
      targetOptions.value = []
    }
  } catch {
    targetOptions.value = []
  }
}

async function openNamingEdit(row: NamingStrategyVO) {
  if (namingSaving.value) {
    return
  }
  if (namingDirty.value) {
    try {
      await ElMessageBox.confirm('命名策略有未保存的修改，确定放弃吗？', '提示', {
        type: 'warning',
        confirmButtonText: '确定放弃',
        cancelButtonText: '取消',
      })
    } catch {
      return
    }
  }
  namingOriginalTargetId.value = row.targetDataSourceId
  namingForm.value = {
    targetDataSourceId: row.targetDataSourceId,
    tableNamingStrategy: row.tableNamingStrategy,
    tableNamePrefix: row.tableNamePrefix ?? '',
    tableNameSuffix: row.tableNameSuffix ?? '',
  }
  namingFormRef.value?.clearValidate()
  takeNamingSnapshot()
}

/** 命名策略大弹窗关闭确认：取消、右上角 X、ESC、遮罩统一走同一逻辑。 */
function onNamingBeforeClose(done: () => void) {
  if (namingDirty.value) {
    ElMessageBox.confirm('命名策略有未保存的修改，确定关闭吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定关闭',
      cancelButtonText: '取消',
    })
      .then(() => {
        done()
      })
      .catch(() => {
        /* 用户拒绝关闭 */
      })
    return
  }
  done()
}

async function requestCloseNaming() {
  if (namingDirty.value) {
    try {
      await ElMessageBox.confirm('命名策略有未保存的修改，确定关闭吗？', '提示', {
        type: 'warning',
        confirmButtonText: '确定关闭',
        cancelButtonText: '取消',
      })
    } catch {
      return
    }
  }
  namingVisible.value = false
}

function onNamingStrategyChange() {
  if (namingForm.value.tableNamingStrategy === 'TABLE_MERGE') {
    namingForm.value.tableNamePrefix = ''
    namingForm.value.tableNameSuffix = ''
  }
  namingFormRef.value?.clearValidate(['tableNamePrefix', 'tableNameSuffix'])
}

async function onSaveNaming() {
  if (namingSaving.value || !namingSource.value) {
    return
  }
  const form = namingFormRef.value
  if (form) {
    try {
      await form.validate()
    } catch {
      return
    }
  }
  const namingCheck = await validateWithSchema(
    namingRules,
    namingForm.value as unknown as Record<string, unknown>,
  )
  if (!namingCheck.valid) {
    namingFormError.value = namingCheck.firstMessage
    return
  }
  namingFormError.value = ''
  namingSaving.value = true
  try {
    const request: NamingStrategySaveRequest = {
      targetDataSourceId: namingForm.value.targetDataSourceId,
      tableNamingStrategy: namingForm.value.tableNamingStrategy,
      tableNamePrefix: namingForm.value.tableNamePrefix.trim(),
      tableNameSuffix: namingForm.value.tableNameSuffix.trim(),
    }
    const sourceId = namingSource.value.dataSourceId
    if (isNamingEdit.value) {
      const res = await updateNamingStrategy(
        sourceId,
        namingOriginalTargetId.value,
        request,
      )
      if (res.code === 200) {
        ElMessage.success('保存成功')
        doResetNamingForm()
        await loadNaming(sourceId)
      } else {
        ElMessage.error(res.message || '保存失败，请稍后重试')
      }
    } else {
      const res = await createNamingStrategy(sourceId, request)
      if (res.code === 200) {
        ElMessage.success('新增成功')
        doResetNamingForm()
        await loadNaming(sourceId)
      } else {
        ElMessage.error(res.message || '新增失败，请稍后重试')
      }
    }
  } catch (e) {
    ElMessage.error(resolveHttpMessage(e))
  } finally {
    namingSaving.value = false
  }
}

async function onDeleteNaming(row: NamingStrategyVO) {
  if (namingDeletingId.value || namingSaving.value || !namingSource.value) {
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定删除目标库 ${row.targetDataSourceId} 的命名策略吗？`,
      '提示',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch {
    return
  }
  namingDeletingId.value = row.targetDataSourceId
  try {
    const res = await deleteNamingStrategy(namingSource.value.dataSourceId, row.targetDataSourceId)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      await loadNaming(namingSource.value.dataSourceId)
    } else {
      ElMessage.error(res.message || '删除失败，请稍后重试')
    }
  } catch (e) {
    ElMessage.error(resolveHttpMessage(e))
  } finally {
    namingDeletingId.value = ''
  }
}

function resolveHttpMessage(e: unknown): string {
  return e instanceof Error && e.message ? e.message : '网络请求失败'
}

onMounted(() => {
  loadList()
})
</script>

<style scoped>
.data-source-page {
  padding: 4px;
}

.query-card {
  margin-bottom: 12px;
}

.query-form {
  display: flex;
  flex-wrap: wrap;
  gap: 0 8px;
}

.table-card {
  width: 100%;
}

.card-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.table-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.load-error {
  margin-bottom: 12px;
}

.data-table {
  width: 100%;
}

.editor-form .el-select {
  width: 100%;
}

.field-tip {
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.form-error {
  margin: 8px 0 0;
  padding: 6px 10px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-radius: 4px;
}

.test-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  padding-left: 120px;
}

.test-result {
  font-size: 13px;
}

.test-result.is-ok {
  color: var(--el-color-success);
}

.test-result.is-fail {
  color: var(--el-color-danger);
}

.test-result.is-testing {
  color: var(--el-text-color-secondary);
}

.biz-attr-body {
  min-height: 120px;
}

.biz-attr-target {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.naming-table {
  margin-bottom: 4px;
}
</style>
