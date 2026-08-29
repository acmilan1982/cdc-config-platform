/** 数据源角色（API.md §4.1 规范化输出）。 */
export type DataSourceCategory = 'SOURCE' | 'TARGET'

/** 数据库类型（源库仅 ORACLE，目标库可为 ORACLE/MYSQL/DORIS）。 */
export type DataSourceType = 'ORACLE' | 'MYSQL' | 'DORIS'

/** 列表/详情行（API.md §4.1/4.2，不含密码与隐藏字段）。 */
export interface DataSourceRow {
  dataSourceId: string
  dataSourceName: string
  dataSourceCategory: DataSourceCategory
  dataSourceType: DataSourceType
  host: string
  port: number
  serviceName: string
  userName: string
}

/** 列表查询参数（三条件忽略大小写模糊、AND、先 trim；无分页）。 */
export interface DataSourceListQuery {
  id?: string
  name?: string
  host?: string
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
