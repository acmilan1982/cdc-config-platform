# Claude Code 任务：根据项目负责人答复固化数据库分析结论

## 任务编号

DATABASE_ANALYSIS_002

## 项目目录

/agent/cdc-config-platform

## 任务目标

读取数据库逆向分析阶段的问题清单和项目负责人答复，将已确认结论回写到数据库分析文档中，完成数据库分析阶段收口。

本任务只允许更新数据库分析文档，不允许连接数据库、不允许执行 SQL、不允许生成前后端代码，也不允许开始下一阶段开发。

## 一、任务开始前

```bash
cd /agent/cdc-config-platform
cat CLAUDE.md
source /agent/cdc-config-platform/agent-env.sh

git status
git branch --show-current
git fetch origin
git pull --ff-only origin develop
git rev-parse HEAD
```

必须确认：

1. 当前目录正确
2. 当前分支是 develop
3. 工作区干净
4. 已同步远程最新代码
5. 记录任务开始前 Commit ID

异常时立即停止并报告。

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

## 二、必须读取的文档

```text
docs/database/open-questions.md
docs/database/open-questions-answers.md
docs/database/table-list.md
docs/database/table-detail.md
docs/database/table-relations.md
docs/database/dictionary-candidates.md
docs/database/data-characteristics.md
```

如果 `open-questions.md` 或 `open-questions-answers.md` 不存在，立即停止并报告。

## 三、处理原则

1. 以 `open-questions-answers.md` 中项目负责人的答复为最高业务依据。
2. 已明确答复的问题，必须更新到相关数据库分析文档。
3. 不得继续保留与答复冲突的旧推断。
4. 不得自行扩展答复未覆盖的内容。
5. 保留全部问题编号，禁止删除历史问题。
6. 问题状态统一使用：
   - 已确认
   - 部分确认
   - 暂不处理
   - 已废弃
   - 待后续专项任务
7. 未回答或未完全回答的问题，不得自行推断。

## 四、需要更新的文档

### table-detail.md

更新：

- 字段业务含义
- 主键和唯一性结论
- 表是否仍在使用
- 是否允许重复
- CLOB/BLOB 存储格式
- 状态值和字段取值规则
- 是否纳入后续页面
- 是否保留现有数据库结构
- 是否需要后续专项任务

### table-relations.md

更新：

- 已确认关系
- 被否定的候选关系
- 允许重复的业务关系
- 孤立数据的性质
- 程序维护但数据库未建外键的关系

必须明确区分：

```text
数据库约束关系
业务逻辑关系
候选关系
无法确认关系
```

### dictionary-candidates.md

更新：

- 明确字典
- 非字典字段
- 大小写规则
- 状态值含义
- 类型值含义
- 是否允许自由输入

### data-characteristics.md

更新：

- 空表原因
- 数据量偏少原因
- 测试数据
- 孤立数据
- 占位数据
- 全 NULL 字段
- 明文密码
- 大小写混用
- 异常后缀
- 运行状态记录偏少

明确区分：

```text
正常现象
测试数据
历史遗留
暂不处理
待专项处理
```

### open-questions.md

将问题清单更新为闭环记录。

每个问题建议格式：

```markdown
## DB-Q-001

- 原问题：
- 项目负责人答复：
- 最终状态：
- 最终结论：
- 对后续开发的影响：
- 是否需要后续专项任务：
```

如果是部分确认：

```markdown
- 最终状态：部分确认
- 已确认内容：
- 剩余未确认内容：
- 后续限制：
```

不得删除历史问题。

### open-questions-answers.md

原则上不修改项目负责人的原始答复。

只允许修正明显 Markdown 格式问题，不得改变答复原意。

## 五、建议新增文档

新增：

```text
docs/database/confirmed-business-rules.md
```

建议结构：

```markdown
# 已确认数据库业务规则

## 1. 表使用状态
## 2. 主键与唯一性规则
## 3. 表间关系
## 4. 字段含义
## 5. 字典与状态值
## 6. 数据保留与清理原则
## 7. 页面开发约束
## 8. 后续专项任务
```

只允许记录项目负责人已经确认的规则。

## 六、禁止事项

本任务禁止：

- 连接数据库
- 执行任何 SQL
- 修改数据库结构或数据
- 清理数据
- 新增约束
- 修改表注释
- 开发后端
- 开发前端
- 创建 Spring Boot 工程
- 创建 Vue 工程
- 设计菜单和页面
- 生成 CRUD
- 分析白名单外的表
- 自行补充未确认规则
- 开始下一阶段任务

## 七、自检

完成后检查：

1. 每个问题是否有最终状态
2. 已确认答复是否反映到相关文档
3. 是否仍存在与答复冲突的旧结论
4. 是否误删问题编号
5. 是否误改项目负责人原始答复
6. 是否新增未经确认的业务规则
7. 是否只修改数据库分析文档

执行：

```bash
git status
git diff
```

## 八、Git 提交

只允许逐个暂存本任务修改或新增的数据库分析文档。

禁止：

```bash
git add .
git add -A
```

提交信息：

```text
docs(DATABASE_ANALYSIS_002): finalize confirmed database analysis
```

推送：

```bash
git push origin develop
```

验证：

```bash
git status
git rev-parse HEAD
git ls-remote origin refs/heads/develop
```

必须确认：

- 工作区干净
- 本地 HEAD 与远程 develop 一致
- 未提交业务代码
- 未提交数据库脚本
- 未修改数据库

## 九、最终输出格式

```text
任务编号：DATABASE_ANALYSIS_002
任务名称：根据项目负责人答复固化数据库分析结论

一、执行结果
- 成功 / 部分完成 / 失败
- 当前分支
- 开始前 Commit ID
- 完成后 Commit ID
- 远程 develop Commit ID
- 工作区状态

二、读取文档
- open-questions.md
- open-questions-answers.md
- 其他数据库分析文档

三、问题闭环结果
- 问题总数
- 已确认数量
- 部分确认数量
- 暂不处理数量
- 已废弃数量
- 待后续专项任务数量
- 仍未回答的问题

四、更新文档
- table-detail.md
- table-relations.md
- dictionary-candidates.md
- data-characteristics.md
- open-questions.md
- confirmed-business-rules.md

五、关键固化结论
- 表使用状态
- 主键与唯一性规则
- 表间关系
- 字段含义
- 字典和状态值
- 数据保留原则
- 后续开发约束

六、数据库操作确认
- 未连接数据库
- 未执行 SQL
- 未执行 DML
- 未执行 DDL
- 未修改任何数据

七、Git 结果
- commit
- push
- 本地与远程 HEAD 是否一致
- 工作区是否干净

八、未执行事项
- 未开发后端
- 未开发前端
- 未设计菜单和页面
- 未生成 CRUD
- 未开始下一阶段任务
```

完成后立即停止，等待项目负责人审核。
