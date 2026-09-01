/**
 * 数据订阅新增/编辑表单语义（DESIGN §2.2）。
 *
 * 职责：表单模型、编辑打开回显基线、脏判断、PRESERVE/REPLACE 保存载荷计算。
 * 不包含 Element Plus 或网络依赖，便于纯函数级测试。
 */
import { computed, reactive, ref } from 'vue'
import type {
  SourceTableInput,
  SubscriptionCreateDTO,
  SubscriptionEditOpenVO,
  SubscriptionUpdateDTO,
} from '@/types/subscription'
import { tableKey } from '../utils/subscriptionFormat'

export interface SubscribeFormModel {
  dataSubDesc: string
  dataFromSourceId: string | null
  dataToSourceIds: string[]
  selectedTables: SourceTableInput[]
}

function tableKeys(tables: SourceTableInput[]): string[] {
  return tables.map((t) => tableKey(t.schemaName, t.tableName)).sort()
}

function sameKeys(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

export function useSubscribeForm() {
  const form = reactive<SubscribeFormModel>({
    dataSubDesc: '',
    dataFromSourceId: null,
    dataToSourceIds: [],
    selectedTables: [],
  })

  const isEditMode = ref(false)
  let baselineDesc = ''
  let baselineSourceId: string | null = null
  let baselineTableKeys: string[] = []
  let baselineTargetIds: string[] = []

  const sourceChanged = computed(() => form.dataFromSourceId !== baselineSourceId)
  const tablesChanged = computed(
    () => !sameKeys(tableKeys(form.selectedTables), baselineTableKeys),
  )
  const descChanged = computed(() => form.dataSubDesc !== baselineDesc)

  /**
   * 目标库按集合语义比较：仅顺序变化不得误判为业务变化；
   * 仅新增、删除或替换目标库时返回 true。
   */
  const targetsChanged = computed(
    () => !sameKeys([...form.dataToSourceIds].sort(), [...baselineTargetIds].sort()),
  )

  /** 编辑：任一字段相对基线变化即脏；新增：表单有任意输入即脏（关闭需确认）。 */
  const isDirty = computed(() =>
    isEditMode.value
      ? sourceChanged.value || tablesChanged.value || descChanged.value || targetsChanged.value
      : form.dataSubDesc !== '' ||
        form.dataFromSourceId !== null ||
        form.dataToSourceIds.length > 0 ||
        form.selectedTables.length > 0,
  )

  function reset(mode: 'create' | 'edit') {
    form.dataSubDesc = ''
    form.dataFromSourceId = null
    form.dataToSourceIds = []
    form.selectedTables = []
    isEditMode.value = mode === 'edit'
    baselineDesc = ''
    baselineSourceId = null
    baselineTableKeys = []
    baselineTargetIds = []
  }

  /** 编辑打开回显：回填表单并以回显内容建立基线。 */
  function applyEcho(echo: SubscriptionEditOpenVO) {
    isEditMode.value = true
    form.dataSubDesc = echo.dataSubDesc
    form.dataFromSourceId = echo.source.dataSourceId
    form.dataToSourceIds = echo.targets.map((t) => t.dataSourceId)
    const tables: SourceTableInput[] = []
    for (const group of echo.tablesBySchema) {
      for (const table of group.tables) {
        tables.push({ schemaName: group.schema, tableName: table })
      }
    }
    form.selectedTables = tables
    baselineDesc = echo.dataSubDesc
    baselineSourceId = echo.source.dataSourceId
    baselineTableKeys = tableKeys(tables)
    baselineTargetIds = echo.targets.map((t) => t.dataSourceId)
  }

  /** 新增恒为 REPLACE，提交完整结构化源表。 */
  function buildCreatePayload(): SubscriptionCreateDTO {
    return {
      dataSubDesc: form.dataSubDesc,
      dataFromSourceId: form.dataFromSourceId as string,
      dataToSourceIds: [...form.dataToSourceIds],
      sourceSelectionMode: 'REPLACE',
      sourceTables: form.selectedTables.map((t) => ({ ...t })),
    }
  }

  /**
   * 编辑保存载荷：源库或源表相对基线变化 → REPLACE（完整 sourceTables）；
   * 否则 PRESERVE（不提交 sourceTables，后端不写 DATA_SOURCE_TABLE）。
   */
  function buildUpdatePayload(): SubscriptionUpdateDTO {
    const replace = sourceChanged.value || tablesChanged.value
    const payload: SubscriptionUpdateDTO = {
      dataSubDesc: form.dataSubDesc,
      dataFromSourceId: form.dataFromSourceId as string,
      dataToSourceIds: [...form.dataToSourceIds],
      sourceSelectionMode: replace ? 'REPLACE' : 'PRESERVE',
    }
    if (replace) {
      payload.sourceTables = form.selectedTables.map((t) => ({ ...t }))
    }
    return payload
  }

  return {
    form,
    isEditMode,
    sourceChanged,
    tablesChanged,
    targetsChanged,
    isDirty,
    reset,
    applyEcho,
    buildCreatePayload,
    buildUpdatePayload,
  }
}
