# 数据源管理 — 详细页面规格

> 任务编号：DATA_SOURCE_DESIGN_001
> 设计日期：2026-07-03
> 设计依据：DATABASE_ANALYSIS_001/002、PRODUCT_DESIGN_001/002、项目负责人交互决策
> 涉及表：CDC_DATA_SOURCE、CDC_DATA_SOURCE_EXTEND

## 1. 页面目标

### 业务目标

对 CDC 平台的源库和目标库连接配置进行增删改查维护。每条数据源记录代表一个可被 CDC 平台访问的数据库实例。

### 菜单归属

- 一级模块：配置管理
- 菜单名称：数据源管理
- 菜单数量：1 个（CDC_DATA_SOURCE_EXTEND 不单独建菜单）

### 涉及表

| 表 | 角色 | 读写 |
|----|------|------|
| CDC_DATA_SOURCE | 主表 | 可读写 |
| CDC_DATA_SOURCE_EXTEND | 1:1 扩展表 | 可读写（随主表联动） |

### 非本期范围

- 导出功能
- 批量操作
- 数据源连通性测试
- 列级筛选和自定义排序
- DATA_SOURCE_DOMAIN 字段

---

## 2. 页面结构

### 2.1 页面组成

```
数据源管理
├── 主列表页          /config/data-source
├── 新增页（新 Tab）   /config/data-source/new
└── 编辑页（新 Tab）   /config/data-source/{dataSourceId}
```

### 2.2 主列表页

- 查询区、操作按钮区、数据表格、分页
- 单页面，不使用 Tab
- 查询条件仅两个：数据源 ID（精确）、数据源名称（模糊）

### 2.3 新增/编辑页（浏览器新 Tab）

- 页面内双 Tab：基础信息 / 扩展配置
- 打开后字段直接可编辑，不区分查看模式和编辑模式
- 不使用"查看""编辑"切换按钮

### 2.4 页面间关系

```
主列表页 ──[新增]──→ 新增页（新 Tab）
主列表页 ──[双击行]──→ 编辑页（新 Tab）
新增/编辑页 ──[确认/取消/关闭]──→ 页面关闭，原列表页 focus 时刷新
```

---

## 3. 路由设计

| 路由 | 页面 | 打开方式 |
|------|------|----------|
| `/config/data-source` | 主列表页 | 菜单点击 |
| `/config/data-source/new` | 新增页 | `window.open` 新浏览器 Tab |
| `/config/data-source/:dataSourceId` | 编辑页 | `window.open` 新浏览器 Tab |

### 路由行为

- **直接刷新**：重新请求数据，表单数据丢失（符合预期，未保存数据不保留）
- **记录不存在**：编辑页路由中 dataSourceId 对应记录不存在时，页面展示"记录不存在"提示
- **新增页**：无 dataSourceId 参数，表单为空，所有可编辑字段展示默认值
- **新 Tab 方式**：使用 `window.open` 打开独立浏览器 Tab。页面在独立浏览器 Tab 中运行，拥有独立的 Vue 实例和路由上下文

---

## 4. 主列表规格

### 4.1 查询区

| 查询条件 | 匹配方式 | 输入控件 | 占位提示 |
|----------|----------|----------|----------|
| 数据源 ID | 精确匹配 | el-input | 请输入数据源 ID |
| 数据源名称 | 模糊匹配（LIKE %value%） | el-input | 请输入数据源名称 |

按钮：查询（执行搜索）、重置（清空条件 + 恢复默认查询）

### 4.2 表格列

| 列标签 | 对应字段 | 宽度 | 对齐 | 说明 |
|--------|----------|------|------|------|
| 数据源 ID | DATA_SOURCE_ID | 160 | 左 | 主键，可点击跳转 |
| 数据源名称 | DATA_SOURCE_NAME | 140 | 左 | |
| 数据源类别 | DATA_SOURCE_CATEGORY | 90 | 中 | 显示"源端/目标端" |
| 数据库类型 | DATA_SOURCE_TYPE | 100 | 中 | 显示 ORACLE/MYSQL/DORIS |
| 主机地址 | DATA_SOURCE_HOST | 140 | 左 | |
| 端口 | DATA_SOURCE_PORT | 80 | 中 | |
| Service Name | DATA_SOURCE_SERVICE_NAME | 140 | 左 | |
| 用户名 | DATA_SOURCE_USER_NAME | 100 | 左 | |
| 机构 | DATA_SOURCE_ORG | 120 | 左 | |
| 启用状态 | FG_ACTIVE | 80 | 中 | 启用/停用 Tag |
| 扩展配置 | — | 100 | 中 | 已配置/缺失 Tag |

### 4.3 列表不显示字段

- DATA_SOURCE_PASSWORD（密码）
- DATA_SOURCE_DOMAIN（本期隐藏）
- DATA_SOURCE_BIZ_ATTR（JSON 长文本）
- INSERT_TIME / UPDATE_TIME / DELETE_TIME
- SOURCE_APP

### 4.4 表格行为

| 行为 | 说明 |
|------|------|
| 默认排序 | 按 INSERT_TIME 降序 |
| 分页 | 默认每页 20 条，支持 10/20/50/100 |
| 双击行 | `window.open` 新浏览器 Tab 打开 `/config/data-source/{dataSourceId}` |
| 数据源 ID 列 | 显示为链接样式，单击等同双击行为 |
| 启用状态列 | 绿色 Tag "启用" / 灰色 Tag "停用" |
| 扩展配置列 | 绿色 Tag "已配置" / 橙色 Tag "缺失" |

### 4.5 状态展示

| 状态 | 展示 |
|------|------|
| 加载中 | 表格骨架屏或 el-table v-loading |
| 空数据 | el-empty 组件，提示"暂无数据源" |
| 加载失败 | el-alert type="error"，提示"加载失败，请刷新重试" |
| 网络异常 | el-message 全局错误提示，不阻塞已有数据展示 |

### 4.6 原列表页刷新规则

新 Tab 页完成保存、删除、启停操作后，原列表页在 `window` 获得 `focus` 事件时自动执行重新查询。实现方式：主列表页监听 `window.addEventListener('focus', ...)`。

---

## 5. 新增页面规格

### 5.1 基本信息

- 路由：`/config/data-source/new`
- 页面标题：新增数据源
- 打开方式：从主列表页 `window.open` 新浏览器 Tab

### 5.2 内部结构

```
新增数据源
├── [基础信息] [扩展配置]    ← el-tabs
├── 基础信息表单（默认激活）
└── 扩展配置表单
```

### 5.3 按钮

| 按钮 | 位置 | 说明 |
|------|------|------|
| 取消 | 页面底部右侧 | 放弃修改，关闭浏览器 Tab |
| 确认 | 页面底部右侧 | 校验 + 保存，成功后关闭 Tab |

### 5.4 行为

- **确认**：校验基础信息和扩展配置两个 Tab 的全部规则 → 同一事务 INSERT CDC_DATA_SOURCE 和 CDC_DATA_SOURCE_EXTEND → 成功后 `window.close()` 关闭当前 Tab → 原列表页 focus 时刷新
- **取消**：放弃所有未保存修改，`window.close()` 关闭当前 Tab
- **关闭 Tab**（用户直接关闭浏览器 Tab）：不保存，不弹确认框

### 5.5 新增默认值

| 字段 | 默认值 |
|------|--------|
| FG_ACTIVE | 1（启用） |
| DATA_SOURCE_CATEGORY | SOURCE |
| DATA_SOURCE_TYPE | ORACLE |
| TABLE_NAMING_STRATEGY | TABLE_MERGE |

---

## 6. 编辑页面规格

### 6.1 基本信息

- 路由：`/config/data-source/{dataSourceId}`
- 页面标题：编辑数据源 - {dataSourceId}
- 打开方式：从主列表页双击行 `window.open` 新浏览器 Tab

### 6.2 内部结构

与新增页相同：基础信息 + 扩展配置双 Tab。

### 6.3 数据回显

- 页面加载时根据 dataSourceId 查询 CDC_DATA_SOURCE 和 CDC_DATA_SOURCE_EXTEND
- 基础信息字段完整回显（密码除外）
- 扩展配置如存在则回显，如不存在则展示缺失提示（见 6.5）

### 6.4 按钮

| 按钮 | 显示条件 | 说明 |
|------|----------|------|
| 取消 | 始终 | 放弃修改，关闭 Tab |
| 确认 | 始终 | 校验 + 更新保存 |
| 删除 | 已有数据 | 同时删除主表和扩展表 |
| 停用 | FG_ACTIVE=1 | 将 FG_ACTIVE 改为 0 |
| 启用 | FG_ACTIVE=0 | 将 FG_ACTIVE 改为 1 |

### 6.5 缺失扩展配置处理

- 基础信息正常回显和展示
- 扩展配置 Tab 内展示 `el-alert type="warning"`："扩展配置缺失，请补录后保存"
- 手动选择 TABLE_NAMING_STRATEGY 并填写必要字段后即可保存
- 扩展配置未补齐时，确认按钮不阻止点击，但校验不通过，提示"请完成扩展配置后再保存"

### 6.6 直接可编辑

- 页面打开后所有可编辑字段直接处于可编辑状态
- 不提供"查看""编辑"按钮切换只读/编辑模式
- FG_ACTIVE=0（停用）的数据源仍可编辑和删除

---

## 7. 基础信息 Tab 字段规格

基于 CDC_DATA_SOURCE 表字段逐一定义：

| # | 字段名 | 页面标签 | 控件类型 | 必填 | 只读 | 新增默认值 | 编辑规则 | 校验规则 | 列表显示 | 查询使用 | 备注 |
|---|--------|----------|----------|------|------|-----------|----------|----------|----------|----------|------|
| 1 | DATA_SOURCE_ID | 数据源 ID | el-input | 是 | 编辑时只读 | — | 新增后可输入，编辑不可修改 | 必填，最大32字符，唯一 | 是 | 是（精确） | 主键，编辑时不可修改 |
| 2 | DATA_SOURCE_NAME | 数据源名称 | el-input | 是 | 否 | — | 可修改 | 必填，最大30字符，唯一 | 是 | 是（模糊） | |
| 3 | DATA_SOURCE_CATEGORY | 数据源类别 | el-select | 是 | 否 | SOURCE | 可修改 | 必填，取值 SOURCE/TARGET | 是（显示源端/目标端） | 否 | 保存时自动转大写 |
| 4 | DATA_SOURCE_TYPE | 数据库类型 | el-select | 是 | 否 | ORACLE | 可修改 | 必填，取值 ORACLE/MYSQL/DORIS | 是 | 否 | 下拉选项 |
| 5 | DATA_SOURCE_ORG | 数据源机构 | el-input | 是 | 否 | — | 可修改 | 必填，最大64字符 | 是 | 否 | |
| 6 | DATA_SOURCE_HOST | 主机地址 | el-input | 是 | 否 | — | 可修改 | 必填，最大64字符，IP或主机名格式 | 是 | 否 | |
| 7 | DATA_SOURCE_PORT | 端口 | el-input | 是 | 否 | — | 可修改 | 必填，最大64字符，数字1-65535 | 是 | 否 | 建议数字输入框 |
| 8 | DATA_SOURCE_USER_NAME | 用户名 | el-input | 是 | 否 | — | 可修改 | 必填，最大64字符 | 是 | 否 | |
| 9 | DATA_SOURCE_PASSWORD | 密码 | el-input（type=password） | 新增必填 | 否 | — | 留空不修改，输入则覆盖 | 新增必填，编辑留空表示不修改 | 否 | 否 | 支持切换明文/掩码 |
| 10 | DATA_SOURCE_SERVICE_NAME | Service Name | el-input | 是 | 否 | — | 可修改 | 必填，最大64字符 | 是 | 否 | Oracle=Service Name，MySQL/Doris=数据库名 |
| 11 | FG_ACTIVE | 启用状态 | el-switch | 否 | 否 | 1（启用） | 通过停用/启用按钮控制 | 取值 0 或 1 | 是（Tag） | 否 | 新增默认启用 |
| 12 | SOURCE_APP | 源应用 | el-input | 否 | 否 | — | 可修改 | 最大20字符 | 否 | 否 | |
| 13 | DATA_SOURCE_BIZ_ATTR | 业务属性 | el-input（type=textarea） | 否 | 否 | — | 可修改 | 最大2000字符，JSON格式校验 | 否 | 否 | 当前仅 DORIS 类型使用 |
| 14 | DATA_SOURCE_DOMAIN | — | 不渲染 | — | — | — | — | — | 否 | 否 | 第一版隐藏 |
| 15 | INSERT_TIME | — | 不渲染 | — | — | — | — | — | 否 | 否 | 数据库自动维护 |
| 16 | UPDATE_TIME | — | 不渲染 | — | — | — | — | — | 否 | 否 | 数据库自动维护 |
| 17 | DELETE_TIME | — | 不渲染 | — | — | — | — | — | 否 | 否 | 数据库自动维护 |

### 密码字段详细规则

| 场景 | 行为 |
|------|------|
| 列表 | 不展示密码列 |
| 新增 | 必填，密码输入框，默认掩码，可切换显示明文 |
| 编辑回显 | 不回显原密码，输入框为空 |
| 编辑提交 | 留空 = 不修改密码；输入新值 = 覆盖原密码 |
| 查看明文 | 编辑状态下可切换 type=text 查看已输入内容 |

### DATA_SOURCE_CATEGORY 展示规则

| 存储值 | 页面展示 | 下拉选项 |
|--------|----------|----------|
| SOURCE | 源端 | 源端 (SOURCE) |
| TARGET | 目标端 | 目标端 (TARGET) |

- 下拉选项展示中文 + 英文值，如"源端 (SOURCE)"
- 保存时提交英文大写值 SOURCE / TARGET
- 查询列表时展示为中文"源端""目标端"

---

## 8. 扩展配置 Tab 字段规格

基于 CDC_DATA_SOURCE_EXTEND 表字段逐一定义：

| # | 字段名 | 页面标签 | 控件类型 | 必填 | 默认值 | 校验规则 | 展示方式 | 缺失提示 | 保存规则 |
|---|--------|----------|----------|------|--------|----------|----------|----------|----------|
| 1 | DATA_SOURCE_ID | 数据源 ID | — | — | 关联主表 | — | 不独立展示 | — | 与主表 DATA_SOURCE_ID 一致，由后端设置 |
| 2 | TABLE_NAMING_STRATEGY | 命名策略 | el-select | 是 | TABLE_MERGE | 必填，取值 TABLE_MERGE / CUSTOM_PREFIX_SUFFIX | 下拉选择 | 缺失时默认 TABLE_MERGE | 与主表同一事务保存 |
| 3 | TABLE_NAME_PREFIX | 目标表前缀 | el-input | 条件必填 | — | CUSTOM_PREFIX_SUFFIX 时必填，最大128字符 | 输入框 | 缺失时提示填写 | |
| 4 | TABLE_NAME_SUFFIX | 目标表后缀 | el-input | 条件必填 | — | CUSTOM_PREFIX_SUFFIX 时必填，最大128字符 | 输入框 | 缺失时提示填写 | |

### 命名策略联动

| 选中策略 | 前缀输入框 | 后缀输入框 |
|----------|-----------|-----------|
| TABLE_MERGE | 隐藏（不渲染） | 隐藏（不渲染） |
| CUSTOM_PREFIX_SUFFIX | 显示，必填 | 显示，必填 |

### 缺失扩展配置完整性

扩展配置完整的判定标准：
- 存在对应 CDC_DATA_SOURCE_EXTEND 记录
- TABLE_NAMING_STRATEGY 非空
- 若策略为 CUSTOM_PREFIX_SUFFIX，TABLE_NAME_PREFIX 和 TABLE_NAME_SUFFIX 均非空

---

## 9. 按钮规则

### 9.1 主列表页

| 按钮 | 图标 | 位置 | 点击行为 |
|------|------|------|----------|
| 查询 | Search | 查询区 | 按当前条件重新请求列表 |
| 重置 | Refresh | 查询区 | 清空查询条件，恢复默认查询（第1页） |
| 新增 | Plus | 表格上方左侧 | `window.open('/config/data-source/new')` 新浏览器 Tab |

### 9.2 新增页

| 按钮 | 类型 | 点击行为 |
|------|------|----------|
| 取消 | default | 放弃修改，`window.close()` |
| 确认 | primary | 校验基础信息 + 扩展配置 → 同事务 INSERT 主表和扩展表 → 成功提示 → `window.close()` |

### 9.3 编辑页

| 按钮 | 类型 | 显示条件 | 点击行为 |
|------|------|----------|----------|
| 取消 | default | 始终 | 放弃修改，`window.close()` |
| 确认 | primary | 始终 | 校验基础信息 + 扩展配置 → 同事务 UPDATE 主表和扩展表（缺失则 INSERT） → 成功提示 → `window.close()` |
| 删除 | danger | 已有数据 | 确认弹窗："确认删除该数据源吗？对应扩展配置将同时删除。" → 同事务 DELETE 主表和扩展表 → 成功提示 → `window.close()` |
| 停用 | warning | FG_ACTIVE=1 | 确认弹窗 → UPDATE FG_ACTIVE=0 → 成功提示 → 刷新页面状态 |
| 启用 | success | FG_ACTIVE=0 | 确认弹窗 → UPDATE FG_ACTIVE=1 → 成功提示 → 刷新页面状态 |

### 9.4 按钮反馈

| 操作 | 成功反馈 | 失败反馈 |
|------|----------|----------|
| 确认 | el-message "保存成功" | el-message 具体错误信息 |
| 删除 | el-message "删除成功" | el-message 具体错误信息 |
| 停用 | el-message "已停用" | el-message 具体错误信息 |
| 启用 | el-message "已启用" | el-message 具体错误信息 |

---

## 10. 校验规则

### 10.1 基础信息

| 校验项 | 规则 | 触发时机 | 错误提示 |
|--------|------|----------|----------|
| DATA_SOURCE_ID 必填 | 非空 | 提交时 | 请输入数据源 ID |
| DATA_SOURCE_ID 长度 | 最大 32 字符 | 提交时 | 数据源 ID 不能超过 32 个字符 |
| DATA_SOURCE_ID 唯一 | 不与已有数据重复 | 提交时 | 数据源 ID 已存在 |
| DATA_SOURCE_ID 格式 | 字母、数字、下划线、短横线 | 提交时 | 数据源 ID 只能包含字母、数字、下划线和短横线 |
| DATA_SOURCE_NAME 必填 | 非空 | 提交时 | 请输入数据源名称 |
| DATA_SOURCE_NAME 长度 | 最大 30 字符 | 提交时 | 数据源名称不能超过 30 个字符 |
| DATA_SOURCE_NAME 唯一 | 不与已有数据重复 | 提交时 | 数据源名称已存在 |
| DATA_SOURCE_CATEGORY | SOURCE 或 TARGET | 提交时 | 请选择数据源类别 |
| DATA_SOURCE_TYPE | ORACLE/MYSQL/DORIS | 提交时 | 请选择数据库类型 |
| DATA_SOURCE_ORG 必填 | 非空 | 提交时 | 请输入数据源机构 |
| DATA_SOURCE_HOST 必填 | 非空 | 提交时 | 请输入主机地址 |
| DATA_SOURCE_HOST 格式 | 有效 IP 或主机名 | 失焦 | 请输入有效的 IP 地址或主机名 |
| DATA_SOURCE_PORT 必填 | 非空 | 提交时 | 请输入端口 |
| DATA_SOURCE_PORT 范围 | 1-65535 整数 | 失焦 | 端口范围为 1-65535 |
| DATA_SOURCE_USER_NAME 必填 | 非空 | 提交时 | 请输入用户名 |
| DATA_SOURCE_PASSWORD 新增必填 | 非空 | 提交时 | 请输入密码 |
| DATA_SOURCE_SERVICE_NAME 必填 | 非空 | 提交时 | 请输入 Service Name |
| DATA_SOURCE_BIZ_ATTR | 合法 JSON（如有值） | 失焦 | JSON 格式不正确 |

### 10.2 扩展配置

| 校验项 | 规则 | 触发时机 | 错误提示 |
|--------|------|----------|----------|
| 扩展配置完整性 | 存在扩展记录且必填字段齐全 | 提交时 | 请完成扩展配置后再保存 |
| TABLE_NAMING_STRATEGY 必填 | 非空 | 提交时 | 请选择命名策略 |
| TABLE_NAME_PREFIX 条件必填 | CUSTOM_PREFIX_SUFFIX 时非空 | 提交时 | 请输入目标表前缀 |
| TABLE_NAME_SUFFIX 条件必填 | CUSTOM_PREFIX_SUFFIX 时非空 | 提交时 | 请输入目标表后缀 |
| TABLE_NAME_PREFIX 长度 | 最大 128 字符 | 提交时 | 目标表前缀不能超过 128 个字符 |
| TABLE_NAME_SUFFIX 长度 | 最大 128 字符 | 提交时 | 目标表后缀不能超过 128 个字符 |

### 10.3 跨 Tab 校验

- 点击确认按钮时，同时校验基础信息和扩展配置两个 Tab
- 校验失败时，自动切换到包含第一个校验错误所在的 Tab
- 所有校验通过后才提交

---

## 11. 删除规则

### 删除范围

- 同时删除 CDC_DATA_SOURCE 主记录和对应 CDC_DATA_SOURCE_EXTEND 扩展记录
- 两表在同一事务中删除

### 不做引用检查

- 不检查 CDC_DATA_SUBSCRIBE 是否引用该数据源
- 不检查 CDC_CLIENT_MULTIPLE 是否引用该数据源
- 不检查 CDC_DATA_SOURCE_RUN_STATE 是否引用该数据源
- 不检查 CDC_LOG_CORRECT / CDC_LOG_ERROR 是否引用该数据源
- 不检查 CDC_SERVER 是否引用该数据源

### 删除确认

- 点击删除时弹出 `el-message-box` 确认框
- 确认文案："确认删除该数据源吗？对应扩展配置将同时删除。"
- 按钮：取消 / 确认删除
- 确认删除按钮类型为 danger

### 删除结果

| 情况 | 行为 |
|------|------|
| 删除成功 | el-message "删除成功"，`window.close()` |
| 主表外键冲突 | el-message 数据库返回的具体错误信息 |
| 网络异常 | el-message "网络异常，请重试" |

---

## 12. 启停规则

### FG_ACTIVE 映射

| 存储值 | 页面含义 | 列表 Tag | 按钮显示 |
|--------|----------|----------|----------|
| 1 | 启用 | 绿色 "启用" | 停用 |
| 0 | 停用 | 灰色 "停用" | 启用 |

### 行为

- 点击"停用"：确认弹窗 → UPDATE FG_ACTIVE=0 → "已停用" → 按钮变为"启用"
- 点击"启用"：确认弹窗 → UPDATE FG_ACTIVE=1 → "已启用" → 按钮变为"停用"
- 新增时 FG_ACTIVE 默认为 1（启用），不提供开关（统一为启用，后续可停用）
- 停用后数据源仍可编辑和删除

---

## 13. 事务规则

### 新增（INSERT）

```
BEGIN TRANSACTION
  INSERT INTO CDC_DATA_SOURCE (...)
  INSERT INTO CDC_DATA_SOURCE_EXTEND (DATA_SOURCE_ID, ...)
COMMIT
```

### 编辑（UPDATE）

```
BEGIN TRANSACTION
  UPDATE CDC_DATA_SOURCE SET ... WHERE DATA_SOURCE_ID = ?
  -- 扩展配置存在则 UPDATE，不存在则 INSERT
  MERGE/UPSERT CDC_DATA_SOURCE_EXTEND ...
COMMIT
```

### 删除（DELETE）

```
BEGIN TRANSACTION
  DELETE FROM CDC_DATA_SOURCE_EXTEND WHERE DATA_SOURCE_ID = ?
  DELETE FROM CDC_DATA_SOURCE WHERE DATA_SOURCE_ID = ?
COMMIT
```

失败时回滚整个事务。

---

## 14. 状态与异常处理

| 状态 | 触发条件 | 展示方式 |
|------|----------|----------|
| 列表加载中 | 主列表请求未完成 | el-table v-loading |
| 列表为空 | 查询结果 0 条 | el-empty "暂无数据源" |
| 列表加载失败 | 接口返回错误 | el-alert type="error" + 重试按钮 |
| 详情加载中 | 编辑页初始化未完成 | 页面级 v-loading |
| 记录不存在 | dataSourceId 无对应记录 | el-result status="warning" "记录不存在" |
| 新增表单默认值 | 页面打开即展示 | 表单控件展示默认值 |
| 扩展配置缺失 | 编辑时无对应 EXTEND 记录 | el-alert type="warning" + 允许补录 |
| 保存成功 | 事务提交成功 | el-message "保存成功" + window.close() |
| 保存失败 | 校验失败 | 切换到错误 Tab，字段下方展示错误信息 |
| 保存失败 | 唯一性冲突 | el-message "数据源 ID/名称已存在" |
| 保存失败 | 数据库错误 | el-message 后端返回的具体错误信息 |
| 删除成功 | 事务提交成功 | el-message "删除成功" + window.close() |
| 删除失败 | 数据库错误 | el-message 后端返回的具体错误信息 |
| 启停成功 | UPDATE 成功 | el-message + 按钮状态切换 |
| 启停失败 | 数据库错误 | el-message 后端返回的具体错误信息 |
| 网络异常 | 请求超时或网络中断 | el-message "网络异常，请重试" |
| 浏览器刷新（编辑页） | 用户按 F5 | 页面重新加载，未保存修改丢失 |
| 浏览器关闭（编辑页） | 用户关闭 Tab | 不弹确认框，未保存修改丢失 |

---

## 15. 原列表页刷新

### 触发条件

新 Tab 完成以下操作后，原列表页在 `window` 获得 `focus` 事件时自动重新查询：

- 新增保存成功
- 编辑保存成功
- 删除成功
- 停用/启用成功

### 实现方式

主列表页监听 `window` 的 `focus` 事件，获取焦点时执行查询（使用当前查询条件和分页位置）。

### 注意

- 仅重新查询，不重置查询条件
- 不重置分页到第 1 页
- 若用户已关闭原列表页 Tab，无任何影响

---

## 16. 结论分类汇总

### 项目负责人已确认

| 编号 | 结论 | 来源 |
|------|------|------|
| 1 | 单菜单，扩展配置不单独建菜单 | PRODUCT_DESIGN_001 |
| 2 | 新增和双击均打开浏览器新 Tab | 任务交互决策 |
| 3 | Tab 内双页（基础信息/扩展配置） | 任务交互决策 |
| 4 | 页面直接可编辑，不区分查看/编辑 | 任务交互决策 |
| 5 | 按钮：取消、确认、删除、停用/启用 | 任务交互决策 |
| 6 | 取消关闭 Tab，直接关闭不弹确认 | 任务交互决策 |
| 7 | 确认同事务保存主表+扩展表 | 任务交互决策 |
| 8 | 删除同时删扩展，不做引用检查 | 任务交互决策 |
| 9 | FG_ACTIVE：1=启用，0=停用，新增默认1 | 任务交互决策 |
| 10 | 扩展配置必填，一对一 | 任务交互决策 |
| 11 | 历史缺失扩展配置提示+补录 | 任务交互决策 |
| 12 | 密码列表不显示，详情掩码，留空不修改 | 任务交互决策 |
| 13 | DATA_SOURCE_ID 和 DATA_SOURCE_NAME 唯一 | 任务交互决策 |
| 14 | DATA_SOURCE_DOMAIN 第一版隐藏 | 任务交互决策 |
| 15 | 原列表页 focus 时自动刷新 | 任务交互决策 |
| 16 | 查询仅数据源 ID（精确）和名称（模糊） | 任务交互决策 |

### 数据库分析已确认

| 编号 | 结论 | 来源 |
|------|------|------|
| 17 | CDC_DATA_SOURCE 与 EXTEND 1:1，无外键 | DATABASE_ANALYSIS_001 |
| 18 | DATA_SOURCE_CATEGORY 统一大写 | DATABASE_ANALYSIS_001 |
| 19 | DATA_SOURCE_TYPE 取值 ORACLE/MYSQL/DORIS | dictionary-candidates |
| 20 | TABLE_NAMING_STRATEGY 取值 TABLE_MERGE/CUSTOM_PREFIX_SUFFIX | dictionary-candidates |
| 21 | 密码明文存储，不需要加密 | confirmed-business-rules |
| 22 | EXTEND 表无主键，业务约束 1:1 | table-detail |

### 页面设计建议

| 编号 | 结论 | 来源 |
|------|------|------|
| 23 | 列表默认按 INSERT_TIME 降序 | 页面设计建议 |
| 24 | 分页默认每页 20 条 | 页面设计建议 |
| 25 | DATA_SOURCE_CATEGORY 下拉展示中文+英文 | 页面设计建议 |
| 26 | 命名策略 CUSTOM_PREFIX_SUFFIX 时显示前后缀输入框 | 页面设计建议 |
| 27 | DATA_SOURCE_BIZ_ATTR 使用 textarea 输入 | 页面设计建议 |

### 待开发实现约束

| 编号 | 约束 | 来源 |
|------|------|------|
| 28 | 后端须在 INSERT_TIME/UPDATE_TIME 由数据库自动维护 | 开发实现约束 |
| 29 | DELETE_TIME 当前不使用，不通过 DELETE_TIME 实现软删除 | 开发实现约束 |
| 30 | 后端接口须提供 DATA_SOURCE_ID 和 DATA_SOURCE_NAME 唯一性检查 | 开发实现约束 |

---

## 17. 待确认事项

| 编号 | 问题 | 分类 | 是否阻塞开发 |
|------|------|------|-------------|
| DS-Q-001 | 编辑时 DATA_SOURCE_ID 是否允许修改？当前设计为编辑时只读。 | 交互 | 否（当前设计可接受） |
| DS-Q-002 | SOURCE_APP 字段（当前全部为"his应用"）在历史数据中未使用。新增时是否需要提供下拉选项，还是继续作为自由输入？ | 业务 | 否（可先自由输入） |

---

## 18. 页面验收标准

### 主列表页

- [ ] 进入"配置管理 > 数据源管理"或直接访问 `/config/data-source`，列表正常加载
- [ ] 按数据源 ID 精确查询正常
- [ ] 按数据源名称模糊查询正常
- [ ] 重置按钮清空条件并恢复默认查询
- [ ] 分页切换正常
- [ ] 空数据状态展示正常
- [ ] 加载失败状态展示正常
- [ ] 启用/停用 Tag 颜色正确
- [ ] 扩展配置 Tag（已配置/缺失）正确

### 新增页

- [ ] 点击"新增"，打开新浏览器 Tab，地址为 `/config/data-source/new`
- [ ] 页面标题为"新增数据源"
- [ ] 基础信息和扩展配置双 Tab 正常显示
- [ ] 字段默认值正确（FG_ACTIVE=启用, CATEGORY=SOURCE, TYPE=ORACLE, NAMING_STRATEGY=TABLE_MERGE）
- [ ] 基础信息 Tab 默认激活
- [ ] 密码输入框默认掩码，可切换明文
- [ ] TABLE_MERGE 策略时前后缀输入框隐藏
- [ ] CUSTOM_PREFIX_SUFFIX 策略时前后缀输入框显示且必填
- [ ] 确认：校验全部规则，不通过时切换到错误 Tab
- [ ] 确认：通过后保存成功提示，关闭 Tab
- [ ] 取消：放弃修改，关闭 Tab
- [ ] 直接关闭浏览器 Tab：不弹确认框

### 编辑页

- [ ] 双击列表行，打开新浏览器 Tab，地址为 `/config/data-source/{dataSourceId}`
- [ ] 页面标题为"编辑数据源 - {dataSourceId}"
- [ ] 基础信息字段完整回显
- [ ] DATA_SOURCE_ID 只读不可修改
- [ ] 密码输入框为空（不回显原密码）
- [ ] 扩展配置正常回显
- [ ] 缺失扩展配置时展示"扩展配置缺失"警告，允许补录
- [ ] 缺失扩展配置未补录时确认不通过
- [ ] 停用按钮（FG_ACTIVE=1 时显示）正常
- [ ] 启用按钮（FG_ACTIVE=0 时显示）正常
- [ ] 删除按钮正常，确认弹窗文案正确
- [ ] 删除成功后关闭 Tab
- [ ] 停用/启用后按钮状态切换

### 跨页面

- [ ] 新增/编辑/删除/启停完成后，原列表页 focus 时自动刷新
- [ ] 浏览器刷新后当前路由正常恢复
- [ ] 无白屏
- [ ] 无控制台致命错误
- [ ] 中文显示正常
