# Claude Code 任务：Oracle 配置表只读逆向分析

## 任务编号

```text
DATABASE_ANALYSIS_001
```

## 项目目录

```text
/agent/cdc-config-platform
```

## 任务目标

对项目负责人明确指定的 Oracle 配置表进行只读逆向分析，并形成结构化数据库分析文档。

本任务只允许分析白名单中的表，不允许扫描、分析或推断其他业务表。

本阶段只输出分析文档，不生成任何后端代码、前端代码、SQL 变更脚本或 CRUD 实现。

数据库连接信息、默认 Schema、SQL*Plus 连接方式以及数据库读写边界，以项目根目录中的 `CLAUDE.md` 为准。

不得自行猜测、补全或修改数据库连接参数。

---

## 一、任务开始前必须执行

进入项目目录：

```bash
cd /agent/cdc-config-platform
```

读取并严格遵守：

```text
/agent/cdc-config-platform/CLAUDE.md
```

加载项目环境：

```bash
source /agent/cdc-config-platform/agent-env.sh
```

执行 Git 检查：

```bash
git status
git branch --show-current
git fetch origin
git pull --ff-only origin develop
git rev-parse HEAD
```

必须确认：

1. 当前目录是 `/agent/cdc-config-platform`
2. 当前分支是 `develop`
3. 工作区干净
4. 已同步远程最新代码
5. 记录任务开始前 Commit ID

如果工作区不干净、当前分支不是 `develop`、拉取失败或出现任何异常，立即停止并报告。

禁止执行：

```bash
git reset --hard
git clean -fd
git restore .
git checkout -- .
git stash
git push --force
git rebase
git merge
```

---

## 二、数据库连接要求

数据库连接信息必须从项目根目录的 `CLAUDE.md` 获取。

开始分析前必须：

1. 确认已读取 `CLAUDE.md` 中的数据库连接信息。
2. 使用 `CLAUDE.md` 中已经配置并验证过的 SQL*Plus 连接方式连接开发数据库。
3. 只执行一次简单只读连接验证，例如：

```sql
SELECT USER FROM DUAL;
```

4. 确认当前用户和默认 Schema 与 `CLAUDE.md` 一致。
5. 连接失败时立即停止并报告完整错误。
6. 不得自行修改数据库地址、端口、Service Name、SID、用户名、密码或 Schema。
7. 不得切换到其他数据库账号或其他 Schema。

数据库密码可以用于连接，但不得在最终输出、分析文档或 Git 提交中重复展示。

---

## 三、数据库操作边界

本任务只允许执行只读 SQL。

允许：

- `SELECT`
- `WITH ... SELECT`
- `DESC`
- 查询 Oracle 数据字典视图
- 查询表结构、字段、注释、约束、索引、序列
- 查询少量样例数据
- 查询记录数
- 查询字段取值范围和候选字典值
- 查询表之间可能存在的结构关系

禁止：

- `INSERT`
- `UPDATE`
- `DELETE`
- `MERGE`
- `CREATE`
- `ALTER`
- `DROP`
- `TRUNCATE`
- `COMMENT`
- `GRANT`
- `REVOKE`
- 匿名 PL/SQL 块
- 存储过程调用
- 任何可能产生数据库写入或状态变化的操作

如果分析过程中发现需要任何写操作，必须停止，不得执行。

---

## 四、表分析白名单

只允许分析以下 10 张表：

```text
CDC_CLIENT_MULTIPLE
CDC_DATA_SOURCE
CDC_DATA_SOURCE_EXTEND
CDC_DATA_SOURCE_RUN_STATE
CDC_DATA_SUBSCRIBE
CDC_LOG_CORRECT
CDC_LOG_ERROR
CDC_SERVER
CDC_SERVER_CONFIG
CDC_TOPIC_OFFSET
```

严格要求：

1. 不允许分析白名单以外的任何业务表。
2. 不允许根据表名自动扩展分析范围。
3. 不允许扫描当前用户下全部业务表后再筛选。
4. 不允许查询其他业务表的样例数据。
5. 不允许将名称相似的表自动视为关联表。
6. 如果白名单中的表引用了其他表，只记录“存在外部引用候选”，不得继续分析被引用表。
7. 如果某张白名单表不存在，记录并向项目负责人提问，不得自行替换成相似表名。
8. 允许查询必要的 Oracle 数据字典视图，但必须显式限定当前 Schema 和白名单表。

---

## 五、疑问处理原则

发现任何无法从数据库结构、注释或有限样例数据中明确确认的问题时，禁止自行猜测。

必须执行：

```text
发现疑问
→ 写入 docs/database/open-questions.md
→ 分配问题编号
→ 输出问题
→ 暂停该问题相关的推断
→ 等待项目负责人答复
```

问题编号格式：

```text
DB-Q-001
DB-Q-002
DB-Q-003
```

每个问题必须包含：

- 问题编号
- 涉及表
- 涉及字段
- 已确认事实
- 无法确认的原因
- 禁止自行推断的内容
- 需要项目负责人回答的问题

以下情况必须提问：

- 字段注释缺失或含义不明确
- 状态值、类型值、标志值无法确认
- 表之间的业务关系只能通过命名猜测
- 字段是否为字典字段无法确认
- 字段是否允许用户自由输入无法确认
- 表是否已废弃或仅保留历史数据无法确认
- 删除、启停、引用关系的业务规则无法确认
- 某字段当前值很少，但不能确定是否封闭枚举
- 某表数据为空，无法判断其实际用途
- 数据与字段注释存在冲突
- 同一字段在不同表中的含义可能不一致
- 白名单表之间的关系无法通过约束或稳定数据对应确认
- 表或字段当前看似无用，但无法确认是否仍被程序使用

允许继续分析与疑问无关的部分，但不得基于未确认问题形成确定性结论。

---

## 六、分析范围

对每张白名单表至少分析以下内容。

### 1. 基本信息

- 表名
- 表注释
- 记录数
- 字段数
- 是否存在数据
- 是否存在主键
- 是否存在唯一约束
- 是否存在外键
- 是否存在索引
- 是否存在序列
- 是否存在触发器

### 2. 字段结构

逐字段记录：

- 字段名
- 数据类型
- 长度
- 精度
- 小数位
- 是否允许为空
- 默认值
- 字段注释
- 是否主键
- 是否唯一
- 是否索引字段
- 是否候选字典字段
- 是否候选关联字段
- 当前样例值特征
- 是否存在疑问

### 3. 约束和索引

- 主键名称及字段
- 唯一约束名称及字段
- 外键名称、字段及引用对象
- 普通索引名称及字段
- 复合索引字段顺序
- 约束是否启用

### 4. 样例数据

只查询少量样例数据。

要求：

- 每张表最多查询 10 行样例
- 不进行全表导出
- 不根据单条或少量数据直接确定业务规则
- 对密码、Token、密钥或疑似敏感内容只记录类型特征，不输出完整值

### 5. 数据特征

根据字段性质选择性分析：

- 空值数量
- 非空值数量
- distinct 数量
- 最小值
- 最大值
- 日期范围
- 数值范围
- 高频值
- 候选状态值
- 候选类型值
- 候选启用标志
- 候选删除标志

禁止对大字段、长文本字段或明显高基数字段进行无意义的全量 distinct 查询。

### 6. 表关系

只基于以下证据记录关系：

- 数据库外键
- 字段注释
- 明确相同的业务键
- 样例数据能够稳定对应

关系必须区分：

```text
已确认关系
候选关系
无法确认
```

不得只根据字段名相同就认定存在关系。

### 7. 字典分类

候选字段分为：

1. 明确字典
   - 字段注释明确列出代码和含义
   - 或存在明确、可验证的封闭取值范围

2. 候选字典
   - distinct 值较少
   - 但注释不完整
   - 需要项目负责人确认

3. 普通业务字段
   - 当前值较少
   - 但理论上允许自由输入

不得因 distinct 值少就自动认定为字典。

---

## 七、推荐查询对象

可查询但不限于以下 Oracle 数据字典视图：

```text
USER_TABLES
USER_TAB_COMMENTS
USER_TAB_COLUMNS
USER_COL_COMMENTS
USER_CONSTRAINTS
USER_CONS_COLUMNS
USER_INDEXES
USER_IND_COLUMNS
USER_SEQUENCES
USER_TRIGGERS
```

如果当前账号需要使用 `ALL_*` 视图，必须限定到当前目标 Schema 和白名单表。

所有 SQL 必须显式限定白名单表范围。

---

## 八、分析执行顺序

### 阶段 A：白名单存在性和基础信息确认

先完成：

- 10 张表是否存在
- 表注释
- 记录数
- 字段数
- 主键概览
- 约束概览

将结果写入：

```text
docs/database/table-list.md
```

如果发现：

- 表不存在
- 当前账号无法访问
- 查询报错
- 表名与白名单不一致
- 当前 Schema 与 `CLAUDE.md` 不一致

立即记录问题并向项目负责人提问。

### 阶段 B：详细结构分析

完成：

- 字段详情
- 注释
- 约束
- 索引
- 序列
- 触发器

### 阶段 C：有限样例和数据特征分析

完成：

- 少量样例数据
- 候选字典
- 候选关系
- 数据特征
- 疑问清单

---

## 九、输出文档

创建或更新：

```text
docs/database/
├── table-list.md
├── table-detail.md
├── table-relations.md
├── dictionary-candidates.md
├── data-characteristics.md
└── open-questions.md
```

### table-list.md

包含：

- 白名单表清单
- 是否存在
- 表注释
- 记录数
- 字段数
- 主键概览
- 是否存在数据
- 分析状态

### table-detail.md

按表分章节，包含：

- 表基本信息
- 字段明细
- 主键
- 唯一约束
- 外键
- 索引
- 序列
- 触发器
- 少量样例数据特征
- 已确认结论
- 待确认问题

### table-relations.md

关系必须分为：

```text
已确认关系
候选关系
无法确认关系
```

ZooKeeper 运行监控模块必须注明：

```text
数据来源：ZooKeeper
性质：只读运行监控
不对应本次 Oracle 配置表分析
```

### dictionary-candidates.md

按以下分类：

```text
明确字典
候选字典
普通业务字段
```

### data-characteristics.md

记录：

- 数据量
- 空值特征
- 取值范围
- 时间范围
- 状态分布
- 异常或冲突数据
- 可能已废弃但无法确认的内容

### open-questions.md

记录所有需要项目负责人确认的问题。

如果没有问题，也要明确写：

```text
当前未发现需要项目负责人确认的问题。
```

---

## 十、结论表达要求

文档中的结论必须使用明确等级：

```text
已确认
高可信候选
低可信候选
无法确认
```

禁止使用没有证据的确定性表述。

---

## 十一、禁止事项

本任务禁止：

- 修改数据库
- 创建数据库对象
- 生成建表脚本
- 生成更新脚本
- 开发 Entity、DTO、VO、Mapper、Service、Controller
- 创建 Spring Boot 工程
- 创建 Vue 工程
- 修改前后端代码
- 分析白名单以外的业务表
- 自行补充业务规则
- 自行决定页面、菜单或模块
- 自行把候选关系写成已确认关系
- 自行把候选字典写成正式字典
- 擅自开始下一任务

---

## 十二、Git 提交要求

分析完成后执行：

```bash
git status
git diff
```

只允许暂存本任务创建或修改的数据库分析文档。

禁止：

```bash
git add .
git add -A
```

应逐个暂存，例如：

```bash
git add docs/database/table-list.md
git add docs/database/table-detail.md
git add docs/database/table-relations.md
git add docs/database/dictionary-candidates.md
git add docs/database/data-characteristics.md
git add docs/database/open-questions.md
```

提交信息：

```text
docs(DATABASE_ANALYSIS_001): add Oracle configuration table analysis
```

提交后推送：

```bash
git push origin develop
```

完成后验证：

```bash
git status
git rev-parse HEAD
git ls-remote origin refs/heads/develop
```

必须确认：

- 工作区干净
- 本地 HEAD 与远程 `develop` 一致
- 未提交任何业务代码
- 未提交数据库写脚本
- 未分析白名单外的业务表

---

## 十三、最终输出格式

```text
任务编号：DATABASE_ANALYSIS_001
任务名称：Oracle 配置表只读逆向分析

一、执行结果
- 成功 / 部分完成 / 失败
- 当前分支
- 开始前 Commit ID
- 完成后 Commit ID
- 远程 develop Commit ID
- 工作区状态

二、数据库连接确认
- 是否从 CLAUDE.md 读取连接信息
- 当前数据库用户
- 当前 Schema
- 连接验证是否成功

三、分析范围
- 白名单表数量：10
- 已分析表
- 未分析表
- 不存在或无法访问的表

四、输出文档
- table-list.md
- table-detail.md
- table-relations.md
- dictionary-candidates.md
- data-characteristics.md
- open-questions.md

五、数据库操作确认
- 仅执行只读 SQL
- 未执行任何 DML
- 未执行任何 DDL
- 未执行任何 PL/SQL 写操作

六、关键发现
- 已确认关系
- 候选关系
- 明确字典
- 候选字典
- 数据异常或冲突

七、待项目负责人确认
- 问题数量
- 问题编号
- 每个问题的简要说明

八、Git 结果
- commit
- push
- 本地与远程 HEAD 是否一致
- 工作区是否干净

九、未执行事项
- 未开发后端
- 未开发前端
- 未生成 CRUD
- 未分析白名单外的业务表
- 未自行确定业务规则
- 未开始下一任务
```

完成后立即停止，等待项目负责人审核分析文档并回答 `open-questions.md` 中的问题。
