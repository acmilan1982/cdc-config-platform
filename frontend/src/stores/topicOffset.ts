import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AppliedCriteria, CandidateGroup, TopicOffsetItem, TopicOffsetPageResult } from '@/types/topicOffset'

/** 最近成功刷新时间的 HH:mm:ss 显示。 */
function formatHms(epochMs: number): string {
  const d = new Date(epochMs)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * topic-offset 路由级会话 store（DESIGN §6.3）。
 * 仅保存“上一次成功”的生效条件、页码、结果与最近成功刷新时间；跨路由往返保留，
 * 浏览器刷新/重新登录则随 Pinia 内存清空恢复缺省。不使用 localStorage/sessionStorage。
 * 请求并发、两阶段提交、自动刷新计时等页面实例瞬态不在本 store，见 useTopicOffset 组合式。
 */
export const useTopicOffsetStore = defineStore('topicOffset', () => {
  /** 上一次成功提交的生效条件；null 表示本会话尚未成功。 */
  const appliedCriteria = ref<AppliedCriteria | null>(null)
  /** 已成功页码（成功时才提交）。 */
  const pageNum = ref(1)
  const pageSize = ref(150)
  const total = ref(0)
  const pages = ref(0)
  const unparseableTotal = ref(0)
  const records = ref<TopicOffsetItem[]>([])
  /** 前端成功返回时刻（epoch ms），非数据库 UPDATED_AT。 */
  const lastSuccessAt = ref<number | null>(null)
  const candidates = ref<CandidateGroup | null>(null)

  const hasSuccess = computed(() => appliedCriteria.value !== null)

  const lastRefreshText = computed(() =>
    lastSuccessAt.value === null ? null : formatHms(lastSuccessAt.value),
  )

  function setCandidates(group: CandidateGroup | null): void {
    candidates.value = group
  }

  /** 查询/分页/刷新成功且仍是当前请求时一次性原子提交（DESIGN §6.5）。 */
  function commitSuccess(criteria: AppliedCriteria, page: number, data: TopicOffsetPageResult, atMs: number): void {
    appliedCriteria.value = criteria
    pageNum.value = data.pageNum >= 1 ? data.pageNum : page
    pageSize.value = data.pageSize
    total.value = data.total
    pages.value = data.pages
    unparseableTotal.value = data.unparseableTotal
    records.value = data.records
    lastSuccessAt.value = atMs
  }

  return {
    appliedCriteria,
    pageNum,
    pageSize,
    total,
    pages,
    unparseableTotal,
    records,
    lastSuccessAt,
    lastRefreshText,
    candidates,
    hasSuccess,
    setCandidates,
    commitSuccess,
  }
})
