import type { AppliedCriteria, StatusToken } from '@/types/dataSourceSnapshot'

/** “全部”哨兵，仅在查询区草稿层存在，绝不作为真实值请求（DESIGN §7.2，API §4.1）。 */
export const ALL_OPTION = '__ALL__'

/**
 * 多选互斥：“全部”与具体值互斥（DESIGN §7.2）。
 * 原值含“全部”时新增具体值 → 去掉“全部”；原值无“全部”时选了“全部” → 只保留“全部”。
 * 清空后恢复“全部”，避免出现无任何选择的空白态。
 */
export function normalizeDimension(prev: string[], next: string[]): string[] {
  if (next.length === 0) return [ALL_OPTION]
  if (next.includes(ALL_OPTION)) {
    if (prev.includes(ALL_OPTION)) {
      return Array.from(new Set(next.filter((v) => v !== ALL_OPTION)))
    }
    return [ALL_OPTION]
  }
  return Array.from(new Set(next))
}

/** 移除“全部”哨兵，仅保留具体选中值。 */
export function concreteIds(selection: string[]): string[] {
  return selection.filter((v) => v !== ALL_OPTION)
}

/** 将查询区草稿（可能含 __ALL__）生成不可变待提交条件（DESIGN §7.2/§7.3）。 */
export function buildCriteriaFromDraft(clients: string[], sources: string[], statuses: string[]): AppliedCriteria {
  return {
    clientIds: concreteIds(clients),
    sourceIds: concreteIds(sources),
    statuses: concreteIds(statuses) as StatusToken[],
  }
}

/** 缺省条件 = 三维全“全部”（DESIGN §7.1 每次路由进入的初始已应用条件）。 */
export function defaultCriteria(): AppliedCriteria {
  return { clientIds: [], sourceIds: [], statuses: [] }
}

/** 将已生效条件还原为查询区草稿（具体值空即表示“全部”）。 */
export function draftFromCriteria(criteria: AppliedCriteria | null): {
  clients: string[]
  sources: string[]
  statuses: string[]
} {
  if (!criteria) {
    return { clients: [ALL_OPTION], sources: [ALL_OPTION], statuses: [ALL_OPTION] }
  }
  return {
    clients: criteria.clientIds.length > 0 ? [...criteria.clientIds] : [ALL_OPTION],
    sources: criteria.sourceIds.length > 0 ? [...criteria.sourceIds] : [ALL_OPTION],
    statuses: criteria.statuses.length > 0 ? [...criteria.statuses] : [ALL_OPTION],
  }
}

/** 两个已生效条件是否等价（数组无序等价，DESIGN §5.2 去重后顺序不影响语义）。 */
export function criteriaEqual(a: AppliedCriteria, b: AppliedCriteria): boolean {
  return (
    sameList(a.clientIds, b.clientIds) &&
    sameList(a.sourceIds, b.sourceIds) &&
    sameList(a.statuses, b.statuses)
  )
}

function sameList(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((v) => set.has(v))
}
