import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import type { ApiResponse } from '@/types/monitor'
import type { SubscriptionDetailVO } from '@/types/subscription'

vi.mock('@/api/subscription', () => ({
  fetchSubscriptionDetail: vi.fn(),
}))

import { fetchSubscriptionDetail } from '@/api/subscription'
import SubscribeDetailDialog from './SubscribeDetailDialog.vue'

const mockedDetail = vi.mocked(fetchSubscriptionDetail)

function okDetail(data: SubscriptionDetailVO): ApiResponse<SubscriptionDetailVO> {
  return { code: 200, message: 'success', timestamp: '', data }
}

const detail: SubscriptionDetailVO = {
  dataSubId: 'id1',
  dataSubDesc: '机构A到机构B全量订阅',
  source: { dataSourceId: 'S01', dataSourceOrg: '机构A', status: 'INACTIVE' },
  tablesBySchema: [
    { schema: 'SCHEMA_A', tables: ['T1', 'T2'] },
    { schema: 'SCHEMA_B', tables: ['T3'] },
  ],
  rawUnparseableTables: ['LEGACY_FRAG'],
  targets: [{ dataSourceId: 'T01', dataSourceOrg: '机构B', status: 'NORMAL' }],
  insertTime: '2026-08-01T10:00:00',
  updateTime: '2026-08-02T11:00:00',
  warnings: ['源库 S01 已停用'],
}

/** el-dialog append-to-body 会 teleport 到 body，正文断言一律查 document.body。 */
function bodyText(): string {
  return document.body.textContent ?? ''
}

async function openDialog(dataSubId: string) {
  const wrapper = mount(SubscribeDetailDialog, {
    props: { modelValue: false, dataSubId },
    global: { plugins: [ElementPlus] },
  })
  // 真实用法：父组件 false→true 触发打开 watcher 再加载
  await wrapper.setProps({ modelValue: true })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  mockedDetail.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('SubscribeDetailDialog 详情展示', () => {
  it('打开即加载并完整渲染：分组源表、时间/ID、目标库、警告与不可解析区', async () => {
    mockedDetail.mockResolvedValue(okDetail(detail))
    await openDialog('id1')

    expect(mockedDetail).toHaveBeenCalledWith('id1')
    const text = bodyText()
    // 基本信息：描述、ID、源库机构与 ID、状态标签
    expect(text).toContain('机构A到机构B全量订阅')
    expect(text).toContain('id1')
    expect(text).toContain('机构A')
    expect(text).toContain('S01')
    expect(text).toContain('已停用')
    // 源表按 Schema 分组且每张表逐行显示（R1 §5.3.2）
    expect(text).toContain('SCHEMA_A')
    expect(text).toContain('T1')
    expect(text).toContain('T2')
    expect(text).toContain('SCHEMA_B')
    expect(text).toContain('T3')
    expect(text).not.toContain('T1、T2')
    // 源表总数包含无法解析的非空历史 token（3 可解析 + 1 不可解析 = 4，R1 §5.3.1）
    expect(text).toContain('源表（共 4 张）')
    // 不可解析片段独立警示分区
    expect(text).toContain('LEGACY_FRAG')
    // 目标库机构与 ID
    expect(text).toContain('机构B')
    expect(text).toContain('T01')
    // 时间
    expect(text).toContain('2026-08-01T10:00:00')
    expect(text).toContain('2026-08-02T11:00:00')
    // 警告
    expect(text).toContain('源库 S01 已停用')
  })

  it('源表总数对无法解析 token 按逗号拆分统计非空 token（R1 §5.3.1）', async () => {
    mockedDetail.mockResolvedValue(
      okDetail({
        ...detail,
        tablesBySchema: [{ schema: 'SCHEMA_A', tables: ['T1'] }],
        rawUnparseableTables: ['FRAG1,FRAG2'],
      }),
    )
    await openDialog('id1')
    // 1 可解析 + 2 非空无法解析 token = 3
    expect(bodyText()).toContain('源表（共 3 张）')
  })

  it('加载失败显示错误并可重试', async () => {
    mockedDetail.mockRejectedValueOnce(new Error('详情加载失败'))
    await openDialog('id1')
    expect(bodyText()).toContain('详情加载失败')

    mockedDetail.mockResolvedValue(okDetail(detail))
    const retry = Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent?.includes('重试'))
    expect(retry).toBeTruthy()
    ;(retry as HTMLButtonElement).click()
    await flushPromises()
    expect(bodyText()).toContain('机构A到机构B全量订阅')
  })

  it('404 业务错误显示 message 而非加载成功', async () => {
    mockedDetail.mockResolvedValue({ code: 40430, message: '记录不存在或已被删除', timestamp: '', data: null as unknown as SubscriptionDetailVO })
    await openDialog('id1')
    expect(bodyText()).toContain('记录不存在或已被删除')
  })
})

describe('SubscribeDetailDialog 关闭', () => {
  it('点击关闭发射 update:modelValue(false)', async () => {
    mockedDetail.mockResolvedValue(okDetail(detail))
    const wrapper = await openDialog('id1')
    await nextTick()
    const closeBtn = Array.from(document.body.querySelectorAll('button')).find((b) => b.textContent?.trim() === '关闭')
    expect(closeBtn).toBeTruthy()
    ;(closeBtn as HTMLButtonElement).click()
    await nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    const last = wrapper.emitted('update:modelValue')![wrapper.emitted('update:modelValue')!.length - 1]
    expect(last).toEqual([false])
  })
})
