import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus, { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types/monitor'
import type { SubscriptionDeletePreviewVO } from '@/types/subscription'

vi.mock('@/api/subscription', () => ({
  fetchSubscriptionDeletePreview: vi.fn(),
  deleteSubscription: vi.fn(),
}))

import { fetchSubscriptionDeletePreview, deleteSubscription } from '@/api/subscription'
import SubscribeDeleteDialog from './SubscribeDeleteDialog.vue'

const mockedPreview = vi.mocked(fetchSubscriptionDeletePreview)
const mockedDelete = vi.mocked(deleteSubscription)

const preview: SubscriptionDeletePreviewVO = {
  dataSubId: 'id1',
  dataSubDesc: '机构A到机构B全量订阅',
  source: { dataSourceId: 'S01', dataSourceOrg: '机构A', status: 'NORMAL' },
  schemaCount: 2,
  tableCount: 5,
  targets: [{ dataSourceId: 'T01', dataSourceOrg: '机构B', status: 'NORMAL' }],
  warnings: ['源表包含不可解析片段'],
}

function okPreview(): ApiResponse<SubscriptionDeletePreviewVO> {
  return { code: 200, message: 'success', timestamp: '', data: preview }
}

function bodyText(): string {
  return document.body.textContent ?? ''
}

async function openDialog(dataSubId: string) {
  const wrapper = mount(SubscribeDeleteDialog, {
    props: { modelValue: false, dataSubId },
    global: { plugins: [ElementPlus] },
  })
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return wrapper
}

function buttonByTextInBody(text: string): HTMLButtonElement | null {
  return (
    Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent?.includes(text)) ??
    null
  )
}

beforeEach(() => {
  mockedPreview.mockReset()
  mockedDelete.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('SubscribeDeleteDialog 删除预览', () => {
  it('打开即加载预览并完整渲染：不可恢复提示、描述、源库、Schema/表数、目标库、警告与重启说明', async () => {
    mockedPreview.mockResolvedValue(okPreview())
    await openDialog('id1')

    expect(mockedPreview).toHaveBeenCalledWith('id1')
    const text = bodyText()
    expect(text).toContain('数据库记录物理删除且无法恢复')
    expect(text).toContain('机构A到机构B全量订阅')
    expect(text).toContain('机构A')
    expect(text).toContain('S01')
    expect(text).toContain('Schema 数')
    expect(text).toContain('2')
    expect(text).toContain('5')
    expect(text).toContain('机构B')
    expect(text).toContain('T01')
    expect(text).toContain('源表包含不可解析片段')
    expect(text).toContain('当前运行中的同步任务不会立即停止，需要重启相关 sync-client 后生效。')
  })

  it('预览加载失败显示错误并可重试', async () => {
    mockedPreview.mockRejectedValueOnce(new Error('预览加载失败'))
    await openDialog('id1')
    expect(bodyText()).toContain('预览加载失败')

    mockedPreview.mockResolvedValue(okPreview())
    buttonByTextInBody('重试')!.click()
    await flushPromises()
    expect(bodyText()).toContain('机构A到机构B全量订阅')
  })

  it('取消不调用 DELETE', async () => {
    mockedPreview.mockResolvedValue(okPreview())
    const wrapper = await openDialog('id1')
    buttonByTextInBody('取消')!.click()
    await nextTick()
    expect(mockedDelete).not.toHaveBeenCalled()
    expect(wrapper.emitted('deleted')).toBeUndefined()
  })
})

describe('SubscribeDeleteDialog 确认删除', () => {
  it('确认删除调用 DELETE 无 body；成功发射 deleted(true) 并关闭', async () => {
    mockedPreview.mockResolvedValue(okPreview())
    mockedDelete.mockResolvedValue({ code: 200, message: 'success', timestamp: '', data: null })
    const wrapper = await openDialog('id1')

    buttonByTextInBody('确认删除')!.click()
    await flushPromises()

    expect(mockedDelete).toHaveBeenCalledWith('id1')
    expect(wrapper.emitted('deleted')).toEqual([[true]])
    expect(wrapper.emitted('update:modelValue')![wrapper.emitted('update:modelValue')!.length - 1]).toEqual([false])
  })

  it('40430 记录已删除：警告提示、发射 deleted(false) 并关闭', async () => {
    const warnSpy = vi.spyOn(ElMessage, 'warning').mockImplementation(() => undefined as never)
    mockedPreview.mockResolvedValue(okPreview())
    mockedDelete.mockResolvedValue({ code: 40430, message: '记录不存在或已被删除', timestamp: '', data: null })
    const wrapper = await openDialog('id1')

    buttonByTextInBody('确认删除')!.click()
    await flushPromises()

    expect(warnSpy).toHaveBeenCalledWith('记录不存在或已被删除')
    expect(wrapper.emitted('deleted')).toEqual([[false]])
  })

  it('其他业务错误提示错误但不关闭', async () => {
    const errorSpy = vi.spyOn(ElMessage, 'error').mockImplementation(() => undefined as never)
    mockedPreview.mockResolvedValue(okPreview())
    mockedDelete.mockResolvedValue({ code: 40399, message: '删除被拒绝', timestamp: '', data: null })
    const wrapper = await openDialog('id1')

    buttonByTextInBody('确认删除')!.click()
    await flushPromises()

    expect(errorSpy).toHaveBeenCalledWith('删除被拒绝')
    expect(wrapper.emitted('deleted')).toBeUndefined()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('删除请求进行中重复点击不重复发起（防双击）', async () => {
    mockedPreview.mockResolvedValue(okPreview())
    let resolveDelete!: (v: ApiResponse<null>) => void
    mockedDelete.mockImplementation(
      () => new Promise<ApiResponse<null>>((res) => { resolveDelete = res }),
    )
    const wrapper = await openDialog('id1')

    buttonByTextInBody('确认删除')!.click()
    await nextTick()
    buttonByTextInBody('确认删除')!.click()
    await nextTick()
    expect(mockedDelete).toHaveBeenCalledTimes(1)

    resolveDelete({ code: 200, message: 'success', timestamp: '', data: null })
    await flushPromises()
    expect(wrapper.emitted('deleted')).toEqual([[true]])
  })
})
