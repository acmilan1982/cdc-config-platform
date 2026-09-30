# 新增／编辑业务弹窗公共视觉模板 · 迁移盘点（已批准基线；公共 CSS 已实现，Vue 未创建）

```text
create_edit_dialog_visual_template_document_status=APPROVED
baseline_status=APPROVED
approval_status=APPROVED_BY_PROJECT_OWNER
approval_date=2026-09-30
approved_reviewed_commit=45ce16dffbf2747abeb75d4d6c43bc57165043c8
implementation_status=PUBLIC_CSS_IMPLEMENTED_VUE_NOT_CREATED
public_css_status=IMPLEMENTED_PENDING_CHATGPT_REMOTE_CODE_REVIEW
public_vue_component_status=NOT_CREATED
formal_acceptance_execution_status=NOT_EXECUTED
page_adoption_authorization_status=PAGE_ADOPTION_NOT_AUTHORIZED
migrated_page_count=0
```

> **本文件只做盘点与未来步骤设计，不实施任何迁移。** 设计契约已于 `2026-09-30` 批准；
> 公共 CSS 预设随后已落地（**待远程代码复审**），**Vue 组件仍未创建**。
> 当前依然 **0** 个页面接入本模板（`migrated_page_count=0`）。

---

## 1. 盘点方法（可复现）

```bash
# 全仓新增／编辑业务主弹窗候选盘点（只读）
cd /agent/cdc-config-platform/frontend/src
grep -rn '<el-dialog' views/
```

- 盘点对象：`frontend/src/views/**` 下的 `el-dialog` 使用点。
- 分类依据：是否属于**新增／编辑业务主弹窗**（页面主入口的增改弹窗）。
- **本设计只对两个页面做了**源码与条款的**深入核对**：
  探针端管理、数据源管理。其余使用点仅作**清单登记**，**未评估**（`UNASSESSED`）。

## 2. 全量盘点矩阵（现状）

| # | 页面／组件 | 弹窗 | 分类 | 本任务处理 |
|---|---|---|---|---|
| 1 | `views/client-config/ClientConfigPage.vue` | 新增探针／编辑探针（`class="cc-dialog" width="900px"`） | **新增／编辑主弹窗 · 在范围内** | **已深入核对**（`DESIGN.md` §1.1） |
| 2 | `views/data-source/DataSourcePage.vue` | 新增数据源／编辑数据源（`class="editor-dialog" width="620px"`） | **新增／编辑主弹窗 · 在范围内** | **已深入核对**（`DESIGN.md` §1.2） |
| 3 | `views/data-source/DataSourcePage.vue` | 业务属性（`width="560px"`） | **子弹窗 · 排除**（数据源业务属性） | 排除（记录，不评估） |
| 4 | `views/data-source/DataSourcePage.vue` | 目标库命名策略（`label-width="110px"`） | **子弹窗 · 排除**（命名策略） | 排除（记录，不评估） |
| 5 | `views/data-subscribe/components/SubscribeFormDialog.vue` | 新增订阅／编辑订阅 | **新增／编辑业务弹窗 · 候选（未评估）** | **未评估**（`UNASSESSED`）——组件形态、独立文件，本设计未读取其样式与条款 |
| 6 | `views/data-subscribe/components/SubscribeDetailDialog.vue` | 订阅详情 | 详情框 · 排除 | 排除 |
| 7 | `views/data-subscribe/components/SubscribeDeleteDialog.vue` | 删除确认 | 确认框 · 排除 | 排除 |
| 8 | `views/server-config/SaveConfirmDialog.vue` | 保存确认 | 确认框 · 排除 | 排除 |
| 9 | `views/monitor/job-failure/components/ClobDetailDialog.vue` | Clob 详情 | 详情框 · 排除 | 排除 |
| 10 | `views/log-query/components/RawMessageDialog.vue` | 原始消息 | 详情框 · 排除 | 排除 |
| 11 | `views/log-query/components/LogDetailDialog.vue` | 日志详情 | 详情框 · 排除 | 排除 |

### 2.1 分类计数（现状）

```text
in_scope_主新增编辑弹窗_已深入核对=2        # 探针端管理、数据源管理
in_scope_候选_未评估=1                       # 数据订阅 新增/编辑订阅
excluded_子弹窗=2                            # 数据源管理 业务属性、命名策略
excluded_确认框或详情框=6                     # 数据订阅 详情/删除确认、服务端配置 保存确认、Job 故障 Clob 详情、日志查询 原始消息/日志详情
migrated_page_count=0
```

> 计数为**本任务时点的只读盘点**；新增页面或弹窗后须重新盘点。**候选（未评估）不等于已判定适用**。

## 3. 未来选择性接入步骤（未授权、未实施）

对**已获授权**的**主新增／编辑弹窗**页，步骤：

1. **评估**：确认该弹窗属"新增／编辑业务主弹窗"，非确认框／子弹窗；
2. **授权**：取得项目负责人**单独明确授权**（本设计基线**未**授权任何页面接入）；
3. **接入**：在弹窗根元素挂显式 opt-in 根类 `ced-dialog`（**公共 CSS 已实现**），
   并以 Feature 覆盖表达**页面级差异值**（标签列宽 `--ced-label-column-width`、弹窗宽度、安全边距
   `--ced-dialog-safety-inset`、是否含全局错误区、loading 配色 `--ced-submit-bg-loading`）；
   私有表单页面的**标签行**另挂 `ced-label-row` 并由 `--ced-label-gap` 提供间距（**公共 CSS 已实现**）；
4. **消除私有同义规则**：**移除**该页私有的**标签排版**与**主提交按钮视觉**规则
   （如 cc 的 `.cc-form-label` 字体／对齐、`.cc-dialog-submit` 色序；
   ds 的 `.editor-dialog .el-form-item__label`、`.editor-submit-button` 色序），
   使公共模板成为**单一视觉来源**；
5. **保留业务**：字段级错误**实现模型**、全局错误区、校验／请求／时序、可点击条件、
   未保存确认、密码掩码、ID 解锁、候选项冲突、权限与提交 API **全部留在页面**；
6. **验证**：静态契约测试（`SHARED_COMPONENT_DESIGN.md` §7）+
   真实浏览器视觉核对；**未接入页面零影响**。

### 3.1 拟议回退流程（可逆闭环，未实测）

与上述正向步骤对应——其中第 4 步**先移除**页面私有同义视觉规则、以保持**单一视觉来源**；
因此回退**不能**只移除根类（那样会失去原有样式）。拟议回退某页接入时：

1. **移除**该页弹窗根元素上的 opt-in 根类，以及接入时新增的模板辅助类／引用；
2. **恢复**第 4 步中已移除的页面私有同义**标签排版**与**主提交按钮视觉**规则，
   并恢复页面差异值的**原承载方式**（组件属性／页面布局，而非模板变量）；
3. 按**接入前基线**核对：标签排版、主提交按钮**各状态**、错误呈现、窄视口行为；
4. 确认**未接入页面零影响**。

> **拟议，未实测。** **不得**在接入后的正常运行中**同时**保留公共与私有两套同义样式——
> 那会造成**双视觉来源**，违反单一视觉来源不变量；回退是「移除公共 + 恢复私有」的**一次性切换**，
> 而非两套并存。将来回退同样须**单独授权**。

## 4. 各页现状与差异摘要（现行事实）

| 页 | 弹窗根类／宽度 | 表单载体 | 标签列宽 | 字段错误模型 | 全局错误区 |
|---|---|---|---|---|---|
| 探针端管理 | `cc-dialog` / `900px`（`max-width: calc(100vw - 48px)`） | 页面私有 flex 表单 | `84px` | 页面私有字段级（红框 + 稳定占位 + `role="alert"`） | **无** |
| 数据源管理 | `editor-dialog` / `620px`（无 `max-width`） | EP `el-form`（`rules` / `label-width="120px"`） | `120px` | EP `el-form` 校验原生呈现 | **有**（`.form-error`，`role="alert"`） |

> 两页**可比对一致**的是**标签排版**与**主提交按钮视觉令牌序列**；
> **差异**（表单载体、标签列宽、错误模型、全局错误区、宽度、loading 配色）
> **必须**作为 Feature 级配置或页面私有保留，**不得**由模板静默统一。

## 5. 迁移授权与边界（严格）

- **当前授权状态**：`PAGE_ADOPTION_NOT_AUTHORIZED` —— **两页及其他任何页面均未获授权接入本模板**。
- **设计基线已批准（`2026-09-30`）**，且**公共 CSS 预设已实现**（**待远程代码复审**，
  提交 `c8785e1` 复审 `CHANGES_REQUIRED` 后已由 `...-R1` 定向纠错）；**Vue 组件仍未创建**。
- 任何页面接入须**独立评估、独立授权、独立实现、独立目测、独立验收**。
- **不得**据本设计修改页面；**不得**把「公共 CSS 已实现」读作「已通过远程代码复审」「页面已接入」或「正式验收通过」。
- 本模板**不**影响 `list-table-visual-template`、`query-list-page-template`
  及任何 Feature 现有状态。
