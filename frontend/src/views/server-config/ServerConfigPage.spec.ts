import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import type { ApiResponse } from '@/types/monitor'
import type { ServerConfigItemVO, ServerConfigPageVO } from '@/types/serverConfig'

vi.mock('@/api/serverConfig', () => ({
  fetchServerConfigPage: vi.fn(),
  saveServerConfig: vi.fn(),
}))

import { fetchServerConfigPage, saveServerConfig } from '@/api/serverConfig'
import ServerConfigPage from '@/views/server-config/ServerConfigPage.vue'

const mockedFetch = vi.mocked(fetchServerConfigPage)
const mockedSave = vi.mocked(saveServerConfig)

function item(
  id: string,
  key: string | null,
  desc: string | null,
  value: string | null,
  editable: boolean,
): ServerConfigItemVO {
  return { idServerConfig: id, configKey: key, configDesc: desc, configValue: value, editable }
}

function okPage(data: ServerConfigPageVO): ApiResponse<ServerConfigPageVO> {
  return { code: 200, message: 'success', timestamp: '', data }
}

function failPage(code: number, message: string): ApiResponse<ServerConfigPageVO> {
  return { code, message, timestamp: '', data: null as unknown as ServerConfigPageVO }
}

function okSave(): ApiResponse<null> {
  return { code: 200, message: 'success', timestamp: '', data: null }
}

function failSave(code: number, message: string): ApiResponse<null> {
  return { code, message, timestamp: '', data: null }
}

const boolItem = item('0001', 'auto-create-table', '自动建表', 'true', true)
const dbItem = item(
  '0002',
  'realtime-insert-batch-enabled-database-types',
  '实时插入批量启用数据库类型',
  'doris',
  true,
)
const readonlyItem = item('0003', 'monitor-metric-topic-name', '监控指标 Topic 名称', 'cdc-metric', false)
const intItem = item('0004', 'snapshotBatchSize', '快照批次大小', '1000', true)

const twoItemPage: ServerConfigPageVO = {
  serverId: 'S1',
  configCount: 2,
  items: [boolItem, dbItem],
}

async function mountPage() {
  const wrapper = mount(ServerConfigPage, {
    global: {
      plugins: [ElementPlus],
      stubs: { SaveConfirmDialog: true },
    },
  })
  await flushPromises()
  return wrapper
}

type PageWrapper = Awaited<ReturnType<typeof mountPage>>
const editors = (w: PageWrapper) => w.findAllComponents({ name: 'ConfigValueEditor' })
const dialog = (w: PageWrapper) => w.findComponent({ name: 'SaveConfirmDialog' })

beforeEach(() => {
  mockedFetch.mockReset()
  mockedSave.mockReset()
})

describe('加载状态', () => {
  it('成功加载展示中心端信息与两列表格', async () => {
    mockedFetch.mockResolvedValue(okPage(twoItemPage))
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('中心端 ID：S1')
    expect(wrapper.text()).toContain('配置项总数：2')
    expect(wrapper.text()).toContain('配置项说明')
    expect(wrapper.text()).toContain('配置值')
    expect(wrapper.text()).toContain('自动建表')
    expect(wrapper.text()).toContain('实时插入批量启用数据库类型')
    expect(editors(wrapper)).toHaveLength(2)
    expect(wrapper.text()).toContain('保存全部')
    wrapper.unmount()
  })

  it('配置项 Key 以提示图标展示（无独立 Key 列）', async () => {
    mockedFetch.mockResolvedValue(okPage(twoItemPage))
    const wrapper = await mountPage()

    expect(wrapper.findAll('.key-icon')).toHaveLength(2)
    wrapper.unmount()
  })

  it('中心端未注册（40210）展示阻断页', async () => {
    mockedFetch.mockResolvedValue(failPage(40210, '中心端尚未注册，请先启动 sync-server'))
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('中心端尚未注册')
    expect(wrapper.text()).toContain('sync-server')
    expect(wrapper.find('button').exists()).toBe(false)
    wrapper.unmount()
  })

  it('多个中心端（40211）展示阻断页', async () => {
    mockedFetch.mockResolvedValue(failPage(40211, '检测到多个中心端'))
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('检测到多个中心端')
    wrapper.unmount()
  })

  it('加载失败展示失败页，重试重新请求', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('network'))
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('配置加载失败')
    expect(wrapper.text()).toContain('network')

    mockedFetch.mockResolvedValue(okPage(twoItemPage))
    await wrapper.find('.page-state button').trigger('click')
    await flushPromises()

    expect(mockedFetch).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('中心端 ID：S1')
    wrapper.unmount()
  })

  it('空配置为正常态，展示暂无配置项', async () => {
    mockedFetch.mockResolvedValue(okPage({ serverId: 'S1', configCount: 0, items: [] }))
    const wrapper = await mountPage()

    expect(wrapper.text()).toContain('配置项总数：0')
    expect(wrapper.text()).toContain('暂无配置项')
    wrapper.unmount()
  })
})

describe('不可编辑行原样展示', () => {
  it('editable=false 行展示原始值且不渲染编辑器控件', async () => {
    mockedFetch.mockResolvedValue(okPage({ serverId: 'S1', configCount: 1, items: [readonlyItem] }))
    const wrapper = await mountPage()

    expect(editors(wrapper)).toHaveLength(1)
    expect(wrapper.find('.raw-value').text()).toBe('cdc-metric')
    expect(wrapper.findAll('.editor-control')).toHaveLength(0)
    wrapper.unmount()
  })

  it('editable=false 且值为空时展示（空值）占位', async () => {
    mockedFetch.mockResolvedValue(
      okPage({ serverId: 'S1', configCount: 1, items: [item('0003', 'k', 'd', null, false)] }),
    )
    const wrapper = await mountPage()

    expect(wrapper.find('.raw-value').text()).toBe('（空值）')
    wrapper.unmount()
  })
})

describe('脏值计算与保存/撤销按钮（SC-DESIGN-070~076）', () => {
  it('初始无修改：保存与撤销均禁用', async () => {
    mockedFetch.mockResolvedValue(okPage(twoItemPage))
    const wrapper = await mountPage()

    const btns = wrapper.findAll('.card-actions button')
    expect(btns[0].attributes('disabled')).toBeDefined()
    expect(btns[1].attributes('disabled')).toBeDefined()
    expect(wrapper.text()).not.toContain('存在未保存的修改')
    wrapper.unmount()
  })

  it('编辑后显示未保存提示且按钮启用；改回原值后恢复禁用', async () => {
    mockedFetch.mockResolvedValue(okPage(twoItemPage))
    const wrapper = await mountPage()

    editors(wrapper)[0].vm.$emit('update:value', 'false')
    await flushPromises()
    expect(wrapper.text()).toContain('存在未保存的修改')
    const btns = wrapper.findAll('.card-actions button')
    expect(btns[0].attributes('disabled')).toBeUndefined()
    expect(btns[1].attributes('disabled')).toBeUndefined()

    // 改回原值 canonical 相等 → 恢复未修改
    editors(wrapper)[0].vm.$emit('update:value', 'true')
    await flushPromises()
    expect(wrapper.text()).not.toContain('存在未保存的修改')
    expect(wrapper.findAll('.card-actions button')[1].attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('撤销修改清空全部编辑', async () => {
    mockedFetch.mockResolvedValue(okPage(twoItemPage))
    const wrapper = await mountPage()

    editors(wrapper)[0].vm.$emit('update:value', 'false')
    editors(wrapper)[1].vm.$emit('update:value', 'mysql')
    await flushPromises()
    expect(wrapper.text()).toContain('存在未保存的修改')

    await wrapper.findAll('.card-actions button')[0].trigger('click')
    await flushPromises()
    expect(wrapper.text()).not.toContain('存在未保存的修改')
    expect(wrapper.findAll('.card-actions button')[1].attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('非法编辑显示内联错误且保存禁用', async () => {
    mockedFetch.mockResolvedValue(okPage(twoItemPage))
    const wrapper = await mountPage()

    editors(wrapper)[0].vm.$emit('update:value', 'TRUE')
    await flushPromises()

    expect(wrapper.text()).toContain('存在未保存的修改')
    expect(wrapper.text()).toContain('当前值无效')
    expect(wrapper.findAll('.card-actions button')[1].attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})

describe('保存流程', () => {
  it('确认弹窗列出原值/新值，确认后按规范化值提交并重新加载', async () => {
    mockedFetch.mockResolvedValue(okPage(twoItemPage))
    mockedSave.mockResolvedValue(okSave())
    const wrapper = await mountPage()

    editors(wrapper)[1].vm.$emit('update:value', ' MYSQL ,doris ')
    await flushPromises()
    await wrapper.findAll('.card-actions button')[1].trigger('click')
    await flushPromises()

    expect(dialog(wrapper).props('visible')).toBe(true)
    const changes = dialog(wrapper).props('changes')
    expect(changes).toHaveLength(1)
    expect(changes[0].displayName).toBe('实时插入批量启用数据库类型')
    expect(changes[0].fromRaw).toBe('doris')
    expect(changes[0].toValue).toBe('doris,mysql')

    dialog(wrapper).vm.$emit('confirm')
    await flushPromises()

    expect(mockedSave).toHaveBeenCalledTimes(1)
    expect(mockedSave.mock.calls[0][0]).toEqual({
      items: [{ idServerConfig: '0002', configValue: 'doris,mysql' }],
    })
    // 保存成功后重新 GET 加载
    expect(mockedFetch).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain('存在未保存的修改')
    wrapper.unmount()
  })

  it('保存业务失败保留修改并可再次保存', async () => {
    mockedFetch.mockResolvedValue(okPage(twoItemPage))
    mockedSave.mockResolvedValue(failSave(50030, '保存失败，请稍后重试'))
    const wrapper = await mountPage()

    editors(wrapper)[0].vm.$emit('update:value', 'false')
    await flushPromises()
    await wrapper.findAll('.card-actions button')[1].trigger('click')
    await flushPromises()
    dialog(wrapper).vm.$emit('confirm')
    await flushPromises()

    expect(wrapper.text()).toContain('保存失败：保存失败，请稍后重试')
    expect(wrapper.text()).toContain('存在未保存的修改')
    expect(mockedFetch).toHaveBeenCalledTimes(1)
    // 保存按钮仍可用（修改保留）
    expect(wrapper.findAll('.card-actions button')[1].attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('保存成功后刷新列表失败展示可重试加载（仅 GET）', async () => {
    mockedFetch.mockResolvedValue(okPage(twoItemPage))
    mockedSave.mockResolvedValue(okSave())
    const wrapper = await mountPage()

    editors(wrapper)[0].vm.$emit('update:value', 'false')
    await flushPromises()
    await wrapper.findAll('.card-actions button')[1].trigger('click')
    await flushPromises()
    // 保存成功后的重载失败
    mockedFetch.mockRejectedValueOnce(new Error('network'))
    dialog(wrapper).vm.$emit('confirm')
    await flushPromises()

    expect(wrapper.text()).toContain('保存成功，但刷新配置列表失败')
    expect(wrapper.text()).toContain('network')

    // 重试加载重新 GET 成功 → 清除错误横幅
    mockedFetch.mockResolvedValue(okPage(twoItemPage))
    await wrapper.find('.save-reload-error .retry-load-btn').trigger('click')
    await flushPromises()
    expect(mockedFetch).toHaveBeenCalledTimes(3)
    expect(wrapper.text()).not.toContain('保存成功，但刷新配置列表失败')
    expect(wrapper.text()).toContain('中心端 ID：S1')
    wrapper.unmount()
  })

  it('保存成功后未修改任何项时点击保存不触发请求', async () => {
    mockedFetch.mockResolvedValue(okPage(twoItemPage))
    const wrapper = await mountPage()

    await wrapper.findAll('.card-actions button')[1].trigger('click')
    await flushPromises()

    expect(mockedSave).not.toHaveBeenCalled()
    expect(dialog(wrapper).props('visible')).toBe(false)
    wrapper.unmount()
  })
})

describe('整数编辑器（snapshotBatchSize）', () => {
  it('仅渲染数字输入且过滤非数字', async () => {
    mockedFetch.mockResolvedValue(okPage({ serverId: 'S1', configCount: 1, items: [intItem] }))
    const wrapper = await mountPage()

    const editor = editors(wrapper)[0]
    const input = editor.find('input')
    expect(input.exists()).toBe(true)

    editor.vm.$emit('update:value', '12a3')
    await flushPromises()
    expect(wrapper.text()).toContain('存在未保存的修改')
    wrapper.unmount()
  })
})
