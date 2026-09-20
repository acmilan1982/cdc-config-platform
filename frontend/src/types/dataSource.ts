/** 数据源角色（API.md §4.1 规范化输出）。 */
export type DataSourceCategory = 'SOURCE' | 'TARGET'

/** 数据库类型（源库仅 ORACLE，目标库可为 ORACLE/MYSQL/DORIS）。 */
export type DataSourceType = 'ORACLE' | 'MYSQL' | 'DORIS'

/**
 * 列表记录（API.md §4.1/§11.2，不含密码与隐藏字段）。
 * `fgActive` 为列表接口专属字段，必填；后端不归一化，原值直传。
 */
export interface DataSourceListRow {
  dataSourceId: string
  dataSourceName: string
  dataSourceCategory: DataSourceCategory
  dataSourceType: DataSourceType
  host: string
  port: number
  serviceName: string
  userName: string
  /** 原始 FG_ACTIVE：`'1'`/`'0'`/`null`/其他历史字符串原样返回，不归一化（API.md §11.2）。 */
  fgActive: string | null
}

/**
 * 详情响应（API.md §4.2）。后端详情契约**不包含** `fgActive`，
 * 此处不得虚构该字段（详见 `DataSourceDetailVO`）。
 */
export interface DataSourceDetail {
  dataSourceId: string
  dataSourceName: string
  dataSourceCategory: DataSourceCategory
  dataSourceType: DataSourceType
  host: string
  port: number
  serviceName: string
  userName: string
}

/** 启用/停用成功结果（API.md §11.1）：成功响应 `data.success=true`。 */
export interface DataSourceStatusResult {
  success: boolean
}

/** 列表查询参数（三文本条件忽略大小写模糊 + 可选角色 `category`，AND、先 trim；无分页）。 */
export interface DataSourceListQuery {
  id?: string
  name?: string
  host?: string
  /** 角色过滤：缺席/空串 = 全部；非空只接受精确大写 `SOURCE`/`TARGET`（API.md §9.1）。 */
  category?: string
}

/** 新增请求体（API.md §4.3，password 必填）。 */
export interface DataSourceCreateRequest {
  dataSourceId: string
  dataSourceName: string
  dataSourceCategory: string
  dataSourceType: string
  host: string
  port: number
  userName: string
  password: string
  serviceName: string
}

/** 编辑请求体（API.md §4.4，password 缺席=未修改，dataSourceId 必填且可修改）。 */
export interface DataSourceUpdateRequest {
  dataSourceId: string
  dataSourceName: string
  dataSourceCategory: string
  dataSourceType: string
  host: string
  port: number
  userName: string
  password?: string
  serviceName: string
}

/** 测试连接请求体（API.md §4.6）。 */
export interface TestConnectionRequest {
  dataSourceId?: string
  originalDataSourceId?: string
  dataSourceType: string
  host: string
  port: number
  userName: string
  password?: string
  serviceName: string
}

/** 测试连接结果（脱敏，成功/失败均返回）。 */
export interface TestConnectionResult {
  success: boolean
  message: string
}

/** 目标库候选选项（API.md §4.7）。 */
export interface TargetOptionVO {
  dataSourceId: string
  dataSourceName: string
  dataSourceType: DataSourceType
}

/** 业务属性读取（API.md §4.8，bizAttr 原样返回）。 */
export interface BizAttrVO {
  dataSourceId: string
  bizAttr: string | null
}

/** 业务属性保存请求体（API.md §4.9，原样保存不 trim 不校验）。 */
export interface BizAttrSaveRequest {
  bizAttr: string
}

/** 命名策略行（API.md §4.10）。 */
export interface NamingStrategyVO {
  sourceDataSourceId: string
  targetDataSourceId: string
  targetDataSourceName: string | null
  targetDataSourceType: string | null
  tableNamingStrategy: 'TABLE_MERGE' | 'CUSTOM_PREFIX_SUFFIX'
  tableNamePrefix: string
  tableNameSuffix: string
}

/** 命名策略新增/编辑请求体（API.md §4.11/4.12）。 */
export interface NamingStrategySaveRequest {
  targetDataSourceId: string
  tableNamingStrategy: 'TABLE_MERGE' | 'CUSTOM_PREFIX_SUFFIX'
  tableNamePrefix: string
  tableNameSuffix: string
}
