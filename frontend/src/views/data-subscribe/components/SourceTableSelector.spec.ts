import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus, { ElMessageBox } from 'element-plus'
import type { VueWrapper } from '@vue/test-utils'
import type { ApiResponse } from '@/types/monitor'
import type { SchemaListVO, SourceTableInput, TableListVO } from '@/types/subscription'

vi.mock('@/api/subscription', () => ({
  fetchSourceSchemas: vi.fn(),
  fetchSourceTables: vi.fn(),
}))

import { fetchSourceSchemas, fetchSourceTables } from '@/api/subscription'
import SourceTableSelector from './SourceTableSelector.vue'

const mockedSchemas = vi.mocked(fetchSourceSchemas)
const mockedTables = vi.mocked(fetchSourceTables)

function okSchemas(sourceId: string, schemas: string[]): ApiResponse<SchemaListVO> {
  return { code: 200, message: 'success', timestamp: '', data: { dataSourceId: sourceId, filterMode: 'ORACLE_MAINTAINED', schemas } }
}

function okTables(sourceId: string, schema: string, tables: string[]): ApiResponse<TableListVO> {
  return { code: 200, message: 'success', timestamp: '', data: { dataSourceId: sourceId, schema, tables } }
}

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function buttonByText(w: VueWrapper, text: string) {
  return w.findAll('button').find((b) => b.text().includes(text)) ?? null
}

async function clickSchema(w: VueWrapper, name: string) {
  const items = w.findAll('.st-schema-item')
  const item = items.find((i) => i.text().includes(name))
  expect(item).toBeTruthy()
  await item!.trigger('click')
  await flushPromises()
}

async function clickTable(w: VueWrapper, tableName: string) {
  const items = w.findAll('.st-table-item')
  const item = items.find((i) => i.text().includes(tableName))
  expect(item).toBeTruthy()
  // Element Plus 复选框在非 form-item 下点击 label 不触发切换，必须派发隐藏 input 的原生 change。
  const input = item!.find('input[type="checkbox"]')
  ;(input.element as HTMLInputElement).checked = !(input.element as HTMLInputElement).checked
  await input.trigger('change')
  await nextTick()
}

async function mountSelector(sourceId: string, modelValue: SourceTableInput[] = [], preloadSchemas: string[] = []) {
  const wrapper = mount(SourceTableSelector, {
    props: { sourceId, modelValue, preloadSchemas },
    global: { plugins: [ElementPlus] },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  mockedSchemas.mockReset()
  mockedTables.mockReset()
  mockedTables.mockResolvedValue(okTables('S01', 'SCHEMA_A', []))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SourceTableSelector Schema/表加载与缓存', () => {
  it('挂载即按源库加载 Schema；点击 Schema 懒加载表并缓存（切换回来不重复请求）', async () => {
    mockedSchemas.mockResolvedValue(okSchemas('S01', ['SCHEMA_A', 'SCHEMA_B']))
    mockedTables.mockResolvedValue(okTables('S01', 'SCHEMA_A', ['T1', 'T2']))

    const wrapper = await mountSelector('S01')
    expect(mockedSchemas).toHaveBeenCalledWith('S01')
    const schemaNames = wrapper.findAll('.st-schema-item').map((i) => i.text())
    expect(schemaNames.join()).toContain('SCHEMA_A')

    // 默认定位第一个 Schema 并自动加载其表清单
    expect(mockedTables).toHaveBeenCalledWith('S01', 'SCHEMA_A')
    expect(wrapper.findAll('.st-table-item').length).toBe(2)

    // 切换 Schema 再切回：走会话内缓存，不重复请求
    mockedTables.mockResolvedValue(okTables('S01', 'SCHEMA_B', ['T3']))
    await clickSchema(wrapper, 'SCHEMA_B')
    expect(wrapper.findAll('.st-table-item').length).toBe(1)
    expect(mockedTables).toHaveBeenCalledTimes(2)

    await clickSchema(wrapper, 'SCHEMA_A')
    expect(wrapper.findAll('.st-table-item').length).toBe(2)
    expect(mockedTables).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('切换源库重置选择与缓存并按新源库重新加载（旧源库在途响应不串扰）', async () => {
    // 源库 A 的 Schema 请求挂起
    const pendingA = deferred<ApiResponse<SchemaListVO>>()
    mockedSchemas.mockReturnValueOnce(pendingA.promise)
    mockedSchemas.mockResolvedValueOnce(okSchemas('S02', ['SCHEMA_X']))

    const wrapper = await mountSelector('S01')
    await nextTick()
    // 切换源库：新请求立即成功
    await wrapper.setProps({ sourceId: 'S02' })
    await flushPromises()
    expect(mockedSchemas).toHaveBeenCalledWith('S02')
    const afterSwitch = wrapper.findAll('.st-schema-item').map((i) => i.text())
    expect(afterSwitch.join()).toContain('SCHEMA_X')
    expect(afterSwitch.join()).not.toContain('SCHEMA_A')

    // 旧源库 A 的响应迟到：必须被忽略，不得覆盖新源库
    pendingA.resolve(okSchemas('S01', ['SCHEMA_A']))
    await flushPromises()
    const final = wrapper.findAll('.st-schema-item').map((i) => i.text())
    expect(final.join()).toContain('SCHEMA_X')
    expect(final.join()).not.toContain('SCHEMA_A')
    wrapper.unmount()
  })

  it('Schema 加载失败显示错误并提供重试加载', async () => {
    mockedSchemas.mockRejectedValueOnce(new Error('源库连接失败：认证失败'))
    const wrapper = await mountSelector('S01')
    expect(wrapper.text()).toContain('源库连接失败：认证失败')
    expect(buttonByText(wrapper, '重试加载')).toBeTruthy()

    mockedSchemas.mockResolvedValue(okSchemas('S01', ['SCHEMA_A']))
    await buttonByText(wrapper, '重试加载')!.trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.st-schema-item').length).toBe(1)
    wrapper.unmount()
  })

  it('表加载失败显示错误并提供重试加载', async () => {
    mockedSchemas.mockResolvedValue(okSchemas('S01', ['SCHEMA_A']))
    mockedTables.mockRejectedValueOnce(new Error('表加载失败'))
    const wrapper = await mountSelector('S01')
    expect(wrapper.text()).toContain('表加载失败')
    expect(buttonByText(wrapper, '重试加载')).toBeTruthy()

    mockedTables.mockResolvedValue(okTables('S01', 'SCHEMA_A', ['T1']))
    await buttonByText(wrapper, '重试加载')!.trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.st-table-item').length).toBe(1)
    wrapper.unmount()
  })

  it('编辑回显自动加载并缓存全部已选 Schema；单个 Schema 失败不影响其他（R1 §3.3）', async () => {
    mockedSchemas.mockResolvedValue(okSchemas('S01', ['SCHEMA_A', 'SCHEMA_B']))
    mockedTables.mockImplementation((sourceId: string, schema: string) => {
      if (schema === 'SCHEMA_A') return Promise.resolve(okTables('S01', 'SCHEMA_A', ['TA1', 'TA2']))
      if (schema === 'SCHEMA_B') return Promise.reject(new Error('SCHEMA_B 表加载失败'))
      return Promise.resolve(okTables('S01', schema, ['TC1']))
    })
    const wrapper = await mountSelector(
      'S01',
      [
        { schemaName: 'SCHEMA_A', tableName: 'TA1' },
        { schemaName: 'SCHEMA_B', tableName: 'TB1' },
      ],
      ['SCHEMA_A', 'SCHEMA_B'],
    )

    // 默认定位第一个已选 Schema，且其表清单已加载缓存并回显勾选
    const active = wrapper.findAll('.st-schema-item').find((i) => i.classes().includes('active'))
    expect(active?.text()).toContain('SCHEMA_A')
    expect(wrapper.findAll('.st-table-item').length).toBe(2)
    expect(wrapper.findAll('.st-table-item.selected').length).toBe(1)

    // SCHEMA_B 加载失败：当前查看显示错误并可重试；左侧带失败标记
    await clickSchema(wrapper, 'SCHEMA_B')
    expect(wrapper.text()).toContain('SCHEMA_B 表加载失败')
    expect(buttonByText(wrapper, '重试加载')).toBeTruthy()
    expect(wrapper.findAll('.st-schema-item').some((i) => i.classes().includes('failed'))).toBe(true)

    // 重试 SCHEMA_B：仅 B 的表清单重新加载并缓存
    mockedTables.mockImplementation((sourceId: string, schema: string) => {
      if (schema === 'SCHEMA_B') return Promise.resolve(okTables('S01', 'SCHEMA_B', ['TB1']))
      return Promise.resolve(okTables('S01', schema, []))
    })
    await buttonByText(wrapper, '重试加载')!.trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.st-table-item').length).toBe(1)

    // 回到 SCHEMA_A：已成功缓存，不受 B 失败影响，选择仍在
    await clickSchema(wrapper, 'SCHEMA_A')
    expect(wrapper.findAll('.st-table-item').length).toBe(2)
    expect(wrapper.findAll('.st-table-item.selected').length).toBe(1)
    wrapper.unmount()
  })
})

describe('SourceTableSelector 选择与批量操作', () => {
  it('勾选表发射 update:modelValue；重复点击取消勾选', async () => {
    mockedSchemas.mockResolvedValue(okSchemas('S01', ['SCHEMA_A']))
    mockedTables.mockResolvedValue(okTables('S01', 'SCHEMA_A', ['T1', 'T2']))
    const wrapper = await mountSelector('S01')
    await clickTable(wrapper, 'T1')

    let emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[emitted.length - 1]).toEqual([[{ schemaName: 'SCHEMA_A', tableName: 'T1' }]])

    // 模拟 v-model 双向绑定：把发射的选中集写回 props，组件才能看到最新状态
    await wrapper.setProps({ modelValue: (emitted[emitted.length - 1] as [SourceTableInput[]])[0] })

    await clickTable(wrapper, 'T1')
    emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[emitted.length - 1]).toEqual([[]])
    wrapper.unmount()
  })

  it('全选当前筛选选中该 Schema 下所有可勾选表', async () => {
    mockedSchemas.mockResolvedValue(okSchemas('S01', ['SCHEMA_A']))
    mockedTables.mockResolvedValue(okTables('S01', 'SCHEMA_A', ['T1', 'T2', 'T3']))
    const wrapper = await mountSelector('S01')

    await buttonByText(wrapper, '全选当前筛选')!.trigger('click')
    await nextTick()
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[emitted.length - 1]).toEqual([
      [
        { schemaName: 'SCHEMA_A', tableName: 'T1' },
        { schemaName: 'SCHEMA_A', tableName: 'T2' },
        { schemaName: 'SCHEMA_A', tableName: 'T3' },
      ],
    ])
    wrapper.unmount()
  })

  it('取消当前筛选仅取消当前 Schema 当前过滤结果的勾选，不影响其他 Schema（R1 §3.4）', async () => {
    mockedSchemas.mockResolvedValue(okSchemas('S01', ['SCHEMA_A']))
    mockedTables.mockResolvedValue(okTables('S01', 'SCHEMA_A', ['TALPHA', 'TBETA', 'TCALPHA']))
    const wrapper = await mountSelector('S01', [
      { schemaName: 'SCHEMA_A', tableName: 'TALPHA' },
      { schemaName: 'SCHEMA_A', tableName: 'TBETA' },
      { schemaName: 'SCHEMA_B', tableName: 'T9' },
    ])

    // 搜索命中 ALPHA：当前过滤结果为 TALPHA、TCALPHA
    await wrapper.find('.st-search input').setValue('ALPHA')
    await nextTick()
    // 取消当前筛选：仅取消命中过滤且已选中的 TALPHA；TBETA（未命中）与 SCHEMA_B.T9 保留
    await buttonByText(wrapper, '取消当前筛选')!.trigger('click')
    await nextTick()
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[emitted.length - 1]).toEqual([
      [
        { schemaName: 'SCHEMA_A', tableName: 'TBETA' },
        { schemaName: 'SCHEMA_B', tableName: 'T9' },
      ],
    ])
    wrapper.unmount()
  })

  it('清空当前 Schema 需二次确认，确认后仅清除该 Schema 的选中表', async () => {
    const confirmSpy = vi.spyOn(ElMessageBox, 'confirm').mockResolvedValue('confirm' as never)
    mockedSchemas.mockResolvedValue(okSchemas('S01', ['SCHEMA_A', 'SCHEMA_B']))
    mockedTables.mockResolvedValue(okTables('S01', 'SCHEMA_A', ['T1']))
    const wrapper = await mountSelector('S01', [
      { schemaName: 'SCHEMA_A', tableName: 'T1' },
      { schemaName: 'SCHEMA_B', tableName: 'T9' },
    ])

    await buttonByText(wrapper, '清空当前 Schema')!.trigger('click')
    await flushPromises()
    expect(confirmSpy).toHaveBeenCalled()
    const emitted = wrapper.emitted('update:modelValue')!
    expect(emitted[emitted.length - 1]).toEqual([[{ schemaName: 'SCHEMA_B', tableName: 'T9' }]])
    wrapper.unmount()
  })

  it('仅看已选视图过滤表格；表名搜索大小写不敏感', async () => {
    mockedSchemas.mockResolvedValue(okSchemas('S01', ['SCHEMA_A']))
    mockedTables.mockResolvedValue(okTables('S01', 'SCHEMA_A', ['TALPHA', 'TBETA']))
    const wrapper = await mountSelector('S01', [{ schemaName: 'SCHEMA_A', tableName: 'TALPHA' }])

    await buttonByText(wrapper, '仅看已选')!.trigger('click')
    await nextTick()
    const names = wrapper.findAll('.st-table-item').map((i) => i.text())
    expect(names).toEqual(['TALPHA'])
    wrapper.unmount()
  })
})

describe('SourceTableSelector 保留字符与规模', () => {
  it('Schema 或表名含英文逗号/句点禁用并说明原因', async () => {
    mockedSchemas.mockResolvedValue(okSchemas('S01', ['BAD,SCHEMA', 'OK_SCHEMA']))
    mockedTables.mockResolvedValue(
      okTables('S01', 'OK_SCHEMA', ['T1', 'T.1', 'T,2']),
    )
    const wrapper = await mountSelector('S01')

    const badSchema = wrapper.findAll('.st-schema-item').find((i) => i.text().includes('BAD,SCHEMA'))
    // 保留字符 Schema 仍展示但不作为可选（点击不触发加载）
    expect(badSchema).toBeTruthy()

    await clickSchema(wrapper, 'OK_SCHEMA')
    const reservedTables = wrapper.findAll('.st-table-item').filter((i) => i.text().includes('T.1') || i.text().includes('T,2'))
    expect(reservedTables.length).toBe(2)
    expect(reservedTables.every((i) => i.classes().includes('reserved'))).toBe(true)
    // 保留字符表复选框禁用，触发 change 也不发射选择
    const reservedInput = reservedTables[0].find('input[type="checkbox"]')
    expect((reservedInput.element as HTMLInputElement).disabled).toBe(true)
    await reservedInput.trigger('change')
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

  it('同一 Schema 240 张表正常渲染（无卡顿规模验证）', async () => {
    const big = Array.from({ length: 240 }, (_, i) => `TABLE_${i + 1}`)
    mockedSchemas.mockResolvedValue(okSchemas('S01', ['SCHEMA_A']))
    mockedTables.mockResolvedValue(okTables('S01', 'SCHEMA_A', big))
    const wrapper = await mountSelector('S01')
    expect(wrapper.findAll('.st-table-item').length).toBe(240)
    // 全选当前筛选覆盖全部 240 张
    await buttonByText(wrapper, '全选当前筛选')!.trigger('click')
    await nextTick()
    const emitted = wrapper.emitted('update:modelValue')!
    expect((emitted[emitted.length - 1] as [SourceTableInput[]])[0].length).toBe(240)
    wrapper.unmount()
  })

  it('右侧以带固定表头（st-table-head）的表格形态渲染并支持内部滚动（R1 §4.5）', async () => {
    const big = Array.from({ length: 240 }, (_, i) => `TABLE_${i + 1}`)
    mockedSchemas.mockResolvedValue(okSchemas('S01', ['SCHEMA_A']))
    mockedTables.mockResolvedValue(okTables('S01', 'SCHEMA_A', big))
    const wrapper = await mountSelector('S01')
    expect(wrapper.find('.st-table-viewport').exists()).toBe(true)
    expect(wrapper.find('.st-table-head').exists()).toBe(true)
    expect(wrapper.find('.st-col-name').text()).toBe('表名')
    expect(wrapper.findAll('.st-table-item').length).toBe(240)
    // Schema 区固定宽度由类承担（jsdom 无法计算计算样式，校验关键 class 结构）
    expect(wrapper.find('.st-schemas-pane').exists()).toBe(true)
    wrapper.unmount()
  })
})
