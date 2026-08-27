/** 保存确认弹窗中的单条变更（SC-UI-DESIGN-100~105）。 */
export interface SaveChange {
  idServerConfig: string
  displayName: string
  configKey: string | null
  fromRaw: string
  toValue: string
}
