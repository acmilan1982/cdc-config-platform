import type { ApiResponse } from '@/types/monitor'

export type { ApiResponse }

/** 关联配置映射状态（API §6，clientRef/sourceRef.state）。 */
export type MappingState = 'ACTIVE' | 'INACTIVE' | 'NOT_FOUND'

/** 快照状态归一类别 token（API §4/§6）。UNKNOWN 为原始值非两已知值的宽容归类。 */
export type StatusToken = 'RUNNING' | 'COMPLETED' | 'UNKNOWN'

/** 探针端关联（API §6 clientRef）。desc 为 null 时 JSON 显式 null。 */
export interface ClientRef {
  state: MappingState
  desc: string | null
}

/** 源库关联（API §6 sourceRef）。org/category 为 null 时 JSON 显式 null。 */
export interface SourceRef {
  state: MappingState
  org: string | null
  category: string | null
  sourceRole: boolean
}

/** 列表行（API §6）。snapshotLastSeenAt/snapshotCompletedAt 为 null 时 JSON 显式 null。 */
export interface SnapshotStatusItem {
  clientId: string
  clientRef: ClientRef
  sourceId: string
  sourceRef: SourceRef
  /** 数据库原始状态值（如 SNAPSHOT_RUNNING），恒保留可见。 */
  snapshotStatus: string
  statusCategory: StatusToken
  snapshotLastSeenAt: string | null
  snapshotCompletedAt: string | null
  updatedAt: string | null
}

export interface ClientCandidate {
  id: string
  desc: string | null
  active: boolean
}

export interface SourceCandidate {
  id: string
  org: string | null
  active: boolean
}

/** 查询候选组（API §5.2）。statuses 恒含 RUNNING/COMPLETED，UNKNOWN 仅在全量确有未知行时出现。 */
export interface CandidateGroup {
  clients: ClientCandidate[]
  sources: SourceCandidate[]
  statuses: StatusToken[]
}

/** 接口 data（API §5）。records 顺序即前端“序号”顺序；候选与列表同请求同快照。 */
export interface SnapshotStatusListResult {
  records: SnapshotStatusItem[]
  candidates: CandidateGroup
}

/** 查询区草稿：各维度可能含 __ALL__ 哨兵（仅表单层，DESIGN §7.2）。 */
export interface QueryDraft {
  clients: string[]
  sources: string[]
  statuses: string[]
}

/** 已应用/请求快照条件：各维度为具体 ID/token，不含 __ALL__；空数组即该维“全部”。 */
export interface AppliedCriteria {
  clientIds: string[]
  sourceIds: string[]
  statuses: StatusToken[]
}

/** GET .../list 查询参数（API §4.1）；多值以重复参数传输。 */
export interface DataSourceSnapshotQueryParams {
  clientId: string[]
  sourceId: string[]
  status: string[]
}
