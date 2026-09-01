import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { useSubscribeForm } from './useSubscribeForm'
import type { SubscriptionEditOpenVO } from '@/types/subscription'

function editEcho(overrides: Partial<SubscriptionEditOpenVO> = {}): SubscriptionEditOpenVO {
  return {
    dataSubId: 'id1',
    dataSubDesc: '机构A到机构B全量订阅',
    source: { dataSourceId: 'S01', dataSourceOrg: '机构A', status: 'NORMAL' },
    targets: [{ dataSourceId: 'T01', dataSourceOrg: '机构B', status: 'NORMAL' }],
    tablesBySchema: [{ schema: 'SCHEMA_A', tables: ['TABLE_1', 'TABLE_2'] }],
    rawUnparseableTables: [],
    sourceReachable: true,
    sourceTableCheck: 'CHECKED',
    invalidTables: [],
    ...overrides,
  }
}

describe('useSubscribeForm 表单语义', () => {
  it('reset(create)：表单清空且脏为 false，新增模式空表单不算脏', () => {
    const { form, isDirty, reset } = useSubscribeForm()
    reset('create')
    expect(form.dataSubDesc).toBe('')
    expect(form.dataFromSourceId).toBeNull()
    expect(form.dataToSourceIds).toEqual([])
    expect(form.selectedTables).toEqual([])
    expect(isDirty.value).toBe(false)
  })

  it('新增模式有任何输入即为脏（关闭需确认）', () => {
    const { form, isDirty, reset } = useSubscribeForm()
    reset('create')
    form.dataSubDesc = 'x'
    expect(isDirty.value).toBe(true)
  })

  it('applyEcho 回填编辑回显并建立基线；未改动时编辑不脏', () => {
    const { form, isDirty, applyEcho, reset } = useSubscribeForm()
    reset('edit')
    applyEcho(editEcho())
    expect(form.dataSubDesc).toBe('机构A到机构B全量订阅')
    expect(form.dataFromSourceId).toBe('S01')
    expect(form.dataToSourceIds).toEqual(['T01'])
    expect(form.selectedTables).toEqual([
      { schemaName: 'SCHEMA_A', tableName: 'TABLE_1' },
      { schemaName: 'SCHEMA_A', tableName: 'TABLE_2' },
    ])
    expect(isDirty.value).toBe(false)
  })

  it('编辑只修改目标库→isDirty=true（不借助同时改描述间接覆盖）', async () => {
    const { form, isDirty, applyEcho, reset } = useSubscribeForm()
    reset('edit')
    applyEcho(editEcho())
    expect(isDirty.value).toBe(false)
    // 仅新增目标库，描述、源库、源表全部不动
    form.dataToSourceIds.push('T02')
    await nextTick()
    expect(isDirty.value).toBe(true)
  })

  it('编辑目标库仅顺序变化→isDirty=false，不误判为业务变化', async () => {
    const { form, isDirty, applyEcho, reset } = useSubscribeForm()
    reset('edit')
    applyEcho(
      editEcho({
        targets: [
          { dataSourceId: 'T01', dataSourceOrg: '机构B', status: 'NORMAL' },
          { dataSourceId: 'T02', dataSourceOrg: '机构C', status: 'NORMAL' },
        ],
      }),
    )
    expect(form.dataToSourceIds).toEqual(['T01', 'T02'])
    expect(isDirty.value).toBe(false)
    // 只调整顺序
    form.dataToSourceIds = ['T02', 'T01']
    await nextTick()
    expect(isDirty.value).toBe(false)
    // 真正替换目标库
    form.dataToSourceIds = ['T01', 'T03']
    await nextTick()
    expect(isDirty.value).toBe(true)
  })

  it('编辑仅改描述/目标库→源库与源表未变→不脏且保存为 PRESERVE（不提交 sourceTables）', async () => {
    const { form, isDirty, applyEcho, reset, buildUpdatePayload } = useSubscribeForm()
    reset('edit')
    applyEcho(editEcho())
    form.dataSubDesc = '新描述'
    form.dataToSourceIds.push('T02')
    await nextTick()
    expect(isDirty.value).toBe(true)
    const payload = buildUpdatePayload()
    expect(payload.sourceSelectionMode).toBe('PRESERVE')
    expect(payload.sourceTables).toBeUndefined()
    expect(payload.dataSubDesc).toBe('新描述')
    expect(payload.dataToSourceIds).toEqual(['T01', 'T02'])
  })

  it('编辑修改源表（顺序不同也判为变更）→ REPLACE 并提交完整 sourceTables', () => {
    const { form, applyEcho, reset, buildUpdatePayload } = useSubscribeForm()
    reset('edit')
    applyEcho(editEcho())
    // 仅调整顺序，不应误判为 PRESERVE
    form.selectedTables = [
      { schemaName: 'SCHEMA_A', tableName: 'TABLE_2' },
      { schemaName: 'SCHEMA_A', tableName: 'TABLE_1' },
    ]
    const payload = buildUpdatePayload()
    expect(payload.sourceSelectionMode).toBe('PRESERVE')

    // 真正变更表集
    form.selectedTables = [{ schemaName: 'SCHEMA_A', tableName: 'TABLE_1' }]
    const payload2 = buildUpdatePayload()
    expect(payload2.sourceSelectionMode).toBe('REPLACE')
    expect(payload2.sourceTables).toEqual([{ schemaName: 'SCHEMA_A', tableName: 'TABLE_1' }])
  })

  it('编辑修改源库 → REPLACE', () => {
    const { form, applyEcho, reset, buildUpdatePayload } = useSubscribeForm()
    reset('edit')
    applyEcho(editEcho())
    form.dataFromSourceId = 'S02'
    const payload = buildUpdatePayload()
    expect(payload.sourceSelectionMode).toBe('REPLACE')
    expect(payload.dataFromSourceId).toBe('S02')
  })

  it('新增恒为 REPLACE 并提交完整结构化源表', () => {
    const { form, reset, buildCreatePayload } = useSubscribeForm()
    reset('create')
    form.dataSubDesc = 'desc'
    form.dataFromSourceId = 'S01'
    form.dataToSourceIds = ['T01']
    form.selectedTables = [{ schemaName: 'A', tableName: 'T1' }]
    const payload = buildCreatePayload()
    expect(payload.sourceSelectionMode).toBe('REPLACE')
    expect(payload.sourceTables).toEqual([{ schemaName: 'A', tableName: 'T1' }])
    expect(payload.sourceSelectionMode).not.toBe('PRESERVE')
  })
})
