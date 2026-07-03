# 数据源管理 API 文档

> 模块：数据源管理
> 基础路径：`/api/data-sources`
> 涉及表：`CDC_DATA_SOURCE`、`CDC_DATA_SOURCE_EXTEND`

## API 清单

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/data-sources` | 分页查询数据源列表 |
| GET | `/api/data-sources/{dataSourceId}` | 查询数据源详情 |
| POST | `/api/data-sources` | 新增数据源 |
| PUT | `/api/data-sources/{originalDataSourceId}` | 修改数据源（支持ID修改） |
| DELETE | `/api/data-sources/{dataSourceId}` | 删除数据源 |
| PUT | `/api/data-sources/{dataSourceId}/enable` | 启用数据源 |
| PUT | `/api/data-sources/{dataSourceId}/disable` | 停用数据源 |

---

## 1. 分页查询

**请求**

```http
GET /api/data-sources?dataSourceId=DS001&dataSourceName=测试&pageNum=1&pageSize=20
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| dataSourceId | String | 否 | 数据源ID，精确匹配 |
| dataSourceName | String | 否 | 数据源名称，模糊匹配 |
| pageNum | Integer | 否 | 页码，默认 1 |
| pageSize | Integer | 否 | 每页条数，默认 20 |

默认按 `DATA_SOURCE_ID` 升序排列。不传任何查询条件时返回全部数据源。

**响应**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "dataSourceId": "DS001",
        "dataSourceName": "测试数据源",
        "dataSourceCategory": "SOURCE",
        "dataSourceType": "ORACLE",
        "dataSourceOrg": "测试机构",
        "dataSourceHost": "192.168.1.1",
        "dataSourcePort": "1521",
        "dataSourceUserName": "testuser",
        "dataSourceServiceName": "ORCL",
        "fgActive": "1",
        "extendConfigured": true
      }
    ],
    "total": 1,
    "pageNum": 1,
    "pageSize": 20,
    "pages": 1
  }
}
```

**字段说明**

| 字段 | 说明 |
|------|------|
| extendConfigured | true表示存在扩展配置，false表示缺失 |

**密码**：列表接口**不返回** `dataSourcePassword` 字段。

---

## 2. 详情查询

**请求**

```http
GET /api/data-sources/{dataSourceId}
```

**响应（存在扩展配置）**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "dataSourceId": "DS001",
    "dataSourceName": "测试数据源",
    "dataSourceCategory": "SOURCE",
    "dataSourceType": "ORACLE",
    "dataSourceOrg": "测试机构",
    "dataSourceHost": "192.168.1.1",
    "dataSourcePort": "1521",
    "dataSourceUserName": "testuser",
    "dataSourceServiceName": "ORCL",
    "fgActive": "1",
    "sourceApp": "",
    "dataSourceBizAttr": "",
    "extendExists": true,
    "extend": {
      "tableNamingStrategy": "TABLE_MERGE",
      "tableNamePrefix": "",
      "tableNameSuffix": ""
    }
  }
}
```

**响应（历史数据缺失扩展配置）**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "dataSourceId": "DS_HISTORICAL",
    "extendExists": false,
    "extend": null
  }
}
```

**密码**：详情接口**不返回** `dataSourcePassword` 字段。

**错误**

| 错误码 | 说明 |
|--------|------|
| 40400 | 数据源不存在 |

---

## 3. 新增数据源

**请求**

```http
POST /api/data-sources
Content-Type: application/json
```

```json
{
  "dataSourceId": "DS001",
  "dataSourceName": "测试数据源",
  "dataSourceCategory": "SOURCE",
  "dataSourceType": "ORACLE",
  "dataSourceOrg": "测试机构",
  "dataSourceHost": "192.168.1.1",
  "dataSourcePort": "1521",
  "dataSourceUserName": "testuser",
  "dataSourcePassword": "mypassword",
  "dataSourceServiceName": "ORCL",
  "sourceApp": "AppA",
  "dataSourceBizAttr": "",
  "extend": {
    "tableNamingStrategy": "TABLE_MERGE",
    "tableNamePrefix": "",
    "tableNameSuffix": ""
  }
}
```

**校验规则**

| 字段 | 规则 |
|------|------|
| dataSourceId | 非空，不可与已有记录重复 |
| dataSourceName | 非空，不可与已有记录重复 |
| dataSourceCategory | 非空，须为 SOURCE 或 TARGET（大小写兼容，保存时转大写） |
| dataSourceType | 非空，须为 ORACLE / MYSQL / DORIS（大小写兼容，保存时转大写） |
| dataSourcePassword | 非空 |
| extend | 非空，tableNamingStrategy 须为 TABLE_MERGE 或 CUSTOM_PREFIX_SUFFIX |

**事务**：主表与扩展表同一事务保存，默认 `FG_ACTIVE=1`（启用状态）。

**错误**

| 错误码 | 说明 |
|--------|------|
| 40900 | DATA_SOURCE_ID 已存在 |
| 40901 | 数据源名称已存在 |
| 40001 | 数据源类别无效 |
| 40002 | 数据库类型无效 |
| 40003 | 命名策略无效 |
| 40004 | 扩展配置不能为空 |

---

## 4. 修改数据源

**请求**

```http
PUT /api/data-sources/{originalDataSourceId}
Content-Type: application/json
```

```json
{
  "dataSourceId": "DS002",
  "dataSourceName": "新名称",
  "dataSourceCategory": "TARGET",
  "dataSourceType": "MYSQL",
  "dataSourceOrg": "新机构",
  "dataSourceHost": "10.0.0.1",
  "dataSourcePort": "3306",
  "dataSourceUserName": "newuser",
  "dataSourcePassword": "",
  "dataSourceServiceName": "newdb",
  "sourceApp": "",
  "dataSourceBizAttr": "",
  "extend": {
    "tableNamingStrategy": "CUSTOM_PREFIX_SUFFIX",
    "tableNamePrefix": "cdc_",
    "tableNameSuffix": "_bak"
  }
}
```

**规则**

| 场景 | 行为 |
|------|------|
| dataSourceId 与原始ID相同 | 不修改ID，仅更新其他字段 |
| dataSourceId 填新值 | 修改ID，同步更新扩展表关联ID，事务保证原子性 |
| 新ID已存在 | 拒绝，返回 40900 |
| 数据源名称修改 | 重新校验唯一性 |
| 密码为空或不提供 | 不修改原密码 |
| 密码非空 | 覆盖原密码 |
| 历史数据缺失扩展配置 | 允许补录（插入扩展记录） |
| DATA_SOURCE_DOMAIN | 不通过API暴露，编辑时保留原值不清空 |

**事务**：主表与扩展表同一事务更新。

**错误**

| 错误码 | 说明 |
|--------|------|
| 40400 | 数据源不存在 |
| 40900 | 新 DATA_SOURCE_ID 已存在 |
| 40901 | 数据源名称已存在 |

---

## 5. 删除数据源

**请求**

```http
DELETE /api/data-sources/{dataSourceId}
```

**规则**

- 不做任何引用检查（不检查客户端、订阅、服务端、运行状态）
- 先删除扩展表记录，再删除主表记录
- 同一事务完成
- 物理删除（非逻辑删除）

**错误**

| 错误码 | 说明 |
|--------|------|
| 40400 | 数据源不存在 |

---

## 6. 启用数据源

**请求**

```http
PUT /api/data-sources/{dataSourceId}/enable
```

将 `FG_ACTIVE` 设置为 `"1"`。

**错误**

| 错误码 | 说明 |
|--------|------|
| 40400 | 数据源不存在 |

---

## 7. 停用数据源

**请求**

```http
PUT /api/data-sources/{dataSourceId}/disable
```

将 `FG_ACTIVE` 设置为 `"0"`。停用后仍允许编辑和删除。

**错误**

| 错误码 | 说明 |
|--------|------|
| 40400 | 数据源不存在 |

---

## 业务规则汇总

| 规则 | 说明 |
|------|------|
| 主从一对一 | CDC_DATA_SOURCE ↔ CDC_DATA_SOURCE_EXTEND，同一事务 |
| 唯一性 | DATA_SOURCE_ID 唯一、数据源名称唯一 |
| ID 修改 | 支持，修改后重新校验唯一性，同步更新扩展表 |
| 密码 | 列表/详情不返回密码；编辑时空=不修改 |
| FG_ACTIVE | 1=启用(新增默认)，0=停用；删除为物理删除 |
| DATA_SOURCE_CATEGORY | 统一保存为大写 SOURCE / TARGET |
| 删除 | 不做引用检查，先扩展表后主表 |
| DATA_SOURCE_DOMAIN | v1 不通过 API 暴露 |
| SOURCE_APP | 自由文本输入 |

---

## 错误码汇总

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 参数校验失败 |
| 40001 | 数据源类别只能为 SOURCE 或 TARGET |
| 40002 | 数据库类型只能为 ORACLE、MYSQL 或 DORIS |
| 40003 | 命名策略无效 |
| 40004 | 扩展配置不能为空 |
| 40400 | 数据源不存在 |
| 40900 | DATA_SOURCE_ID 已存在 |
| 40901 | 数据源名称已存在 |
| 500 | 服务器内部错误 |

---

## 真实写操作审批

开发接口不等于获得真实数据库写入授权。以下接口未经项目负责人明确授权，不得对真实开发库调用：

- `POST /api/data-sources`（新增）
- `PUT /api/data-sources/{id}`（修改）
- `DELETE /api/data-sources/{id}`（删除）
- `PUT /api/data-sources/{id}/enable`（启用）
- `PUT /api/data-sources/{id}/disable`（停用）

只读接口（分页查询、详情查询）可连接真实开发库验证。
