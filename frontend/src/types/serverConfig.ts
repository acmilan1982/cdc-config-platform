/** 中心端配置项行（API.md SC-API-026~030）。 */
export interface ServerConfigItemVO {
  idServerConfig: string
  configKey: string | null
  configDesc: string | null
  configValue: string | null
  /** 计算可编辑布尔，仅用于控件形态判定（SC-API-032）。 */
  editable: boolean
}

/** 中心端配置页面查询响应 data（API.md SC-API-023~025）。 */
export interface ServerConfigPageVO {
  serverId: string
  configCount: number
  items: ServerConfigItemVO[]
}

/** 批量保存单条（API.md SC-API-040）。 */
export interface ServerConfigSaveItem {
  idServerConfig: string
  configValue: string
}

/** 批量保存请求体（仅 items）。 */
export interface ServerConfigSaveRequest {
  items: ServerConfigSaveItem[]
}
