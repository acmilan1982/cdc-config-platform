# 03_R1_REVISION_LOG — ZK-ENV-001-R1 文档一致性修订日志

修订日期: 2026-08-11
修订范围: ZK-ENV-001 完成后 ENVIRONMENT.md 和 3 份 ZK-ENV-001 报告的文档状态冲突修正
修订原则: 只修正文档状态冲突，不重新执行配置同步，不重新连接 ZK，不修改业务代码/依赖/数据库/ZK，不执行 chmod，不提交/推送

---

## R1-001: ENVIRONMENT.md §1 agent-env.sh 描述修正

| 项目 | 内容 |
|---|---|
| **原表述** | "`agent-env.sh` 当前仅声明 Java、Maven、Oracle Client、Node.js 和 npm 相关环境变量，**不包含任何 ZooKeeper 环境变量**" |
| **冲突原因** | ZK-ENV-001 已向 agent-env.sh 新增 ZOOKEEPER_HOME、CDC_ZK_CONNECT、CDC_ZK_ROOT 及 PATH 四行，§1 引导语未同步更新 |
| **修正后** | "`agent-env.sh` 初始（BASELINE-001 时期）仅声明 Java、Maven、Oracle Client、Node.js 和 npm 相关环境变量，ZK-ENV-001 已新增 ZOOKEEPER_HOME、CDC_ZK_CONNECT、CDC_ZK_ROOT 及 PATH 四行" |

---

## R1-002: ENVIRONMENT.md §1.1 zkCli.sh 权限状态修正

| 项目 | 内容 |
|---|---|
| **原表述** | "目录存在，zkCli.sh 需 chmod +x" |
| **冲突原因** | 用户于 R1 执行期间已修正 zkCli.sh 执行权限 |
| **修正后** | "目录存在，zkCli.sh 权限已修正" |

---

## R1-003: ENVIRONMENT.md §3.2 旧地址残留位置修正

| 项目 | 内容 |
|---|---|
| **原表述** | "CDC_ZK_CONNECT=192.168.174.51:2181 \| application-dev.yml, CLAUDE.md §14 \| 曾用地址，No route to host，已确认不可达" |
| **冲突原因** | ZK-ENV-001 已将 application-dev.yml 和 CLAUDE.md 的 ZK 地址同步为 10.19.16.111:2181，§3.2 仍标注这些文件含旧地址，与 §3.1 同步状态表矛盾 |
| **修正后** | "CDC_ZK_CONNECT=192.168.174.51:2181 \| 仅保留于本文档作为历史记录 \| 曾用地址，No route to host，已确认不可达。CLAUDE.md、application-dev.yml 已于 ZK-ENV-001 同步为新地址" |

---

## R1-004: ENVIRONMENT.md §3.3 D 运行时兼容性拆分

| 项目 | 内容 |
|---|---|
| **原表述** | "未验证 \| ZK连接不可达或未执行验证；10.19.16.111:2181 连通性待验证；ZK 3.4.14 与当前 Java 客户端、Curator 依赖的兼容性待验证" |
| **冲突原因** | ZK-ENV-001 已通过 CLI 验证 TCP 可达、会话建立、节点读取，原表述"不可达"和"待验证"与事实不符；但 CLI 成功确实不等于 Java/Curator 兼容性通过 |
| **修正后** | "CLI层已验证；Java/Curator层未验证 \| CLI 3.4.14→server 3.4.14: TCP可达，会话建立成功，/bsoft-cdc/clients 读取成功 (ZK-ENV-001)。Java客户端/Curator依赖与 ZK 3.4.14 服务端的兼容性仍待应用层独立验证" |

---

## R1-005: ENVIRONMENT.md §3.4 连接信息中连通性修正

| 项目 | 内容 |
|---|---|
| **原表述** | "用户于2026-08-11确认的正式配置；实际连通性尚待验证" |
| **冲突原因** | ZK-ENV-001 已执行连通性验证 |
| **修正后** | "用户于2026-08-11确认的正式配置；ZK-ENV-001 已验证 TCP 可达、会话建立成功" |

---

## R1-006: ENVIRONMENT.md §5 连接性状态修正

| 项目 | 内容 |
|---|---|
| **原表述** | "ZK (10.19.16.111:2181) \| **待验证** \| 用户于2026-08-11确认的正式地址，尚未验证连通性" |
| **冲突原因** | ZK-ENV-001 已执行 TCP、会话、节点读取、版本四层验证 |
| **修正后** | "ZK (10.19.16.111:2181) \| **可达** \| ZK-ENV-001 验证: TCP 2181端口可达，zkCli v3.4.14 会话建立成功，timeout=30000ms，/bsoft-cdc 及 /bsoft-cdc/clients 读取成功，服务端版本 3.4.14 (standalone, 200节点)" |

---

## R1-007: ENVIRONMENT.md §6 待处理事项清理

| 项目 | 内容 |
|---|---|
| **原表述** | 8项待处理：ZK连通性验证(高)、agent-env.sh同步(高)、CLAUDE.md更新(高)、application-dev.yml更新(高)、zkCli.sh权限(高)、Curator兼容性(中)、旧CLI清理(低)、pom.xml处理(中) |
| **冲突原因** | 前4项已在 ZK-ENV-001 完成；zkCli.sh 权限用户已修正；旧CLI清理非必须项 |
| **修正后** | 2项：Curator/ZK依赖兼容性验证(高)、未提交pom.xml处理(中) |

---

## R1-008: ZK-ENV-001 三份报告同步

| 文件 | 修改内容 |
|---|---|
| 00_EXECUTION_SUMMARY.md | 状态更新为"主体完成，R1文档一致性修订已完成"；移除 zkCli.sh 阻塞项；新增 R1 修订摘要段 |
| 01_CONFIGURATION_DIFF.md | §4 ENVIRONMENT.md 表全面更新为 R1 后状态，含 10 行变更记录；§6 PROJECT_STATUS.md zkCli.sh 项修正；新增 R1 修订注记 |
| 02_READ_ONLY_VERIFICATION.md | zkCli.sh 验证项 PARTIAL→PASS；权限描述修正；新增 R1 只读核验结论段 |

---

## R1-009: application-dev.yml 只读核验

| 项目 | 内容 |
|---|---|
| **核验方式** | 只读读取文件内容，不修改 |
| **connect-string** | `${CDC_ZK_CONNECT:10.19.16.111:2181}` — 符合用户确认正式值 |
| **root-path** | `${CDC_ZK_ROOT:/bsoft-cdc}` — 符合用户确认正式值 |
| **核验结果** | **PASS** — 与 ZK-ENV-001 同步后状态一致，无误修改或回退 |

---

## 不在允许修改范围内的残留 (仅记录，不修改)

| 文件 | 残留 | 处理 |
|---|---|---|
| docs/baseline-work/BASELINE-002/00_EXECUTION_SUMMARY.md | `/opt/module/zookeeper-3.4.14` (1处) | 仅记录 |
| docs/baseline-work/BASELINE-002/01_INPUT_DECISION_LOG.md | `/opt/module/zookeeper-3.4.14` (2处) | 仅记录 |
| docs/baseline-work/BASELINE-002/03_R1_REVISION_LOG.md | zkCli.sh 缺少执行权限 (待完成列表第2项) | 仅记录，待独立任务修正 |

---

## R1 修订后仍待处理的事项

1. **ZK Java 客户端/Curator 兼容性验证**: CLI 只读连接成功不等于项目 Curator 依赖兼容；已提交(Curator 4.3.0/ZK 3.5.6)和未提交(Curator 2.13.0/ZK 3.4.14)两套组合均需与 ZK 3.4.14 服务端验证
2. **未提交 pom.xml 处理**: Curator/ZK 降级修改（to match production）待独立任务验证后提交
3. **误记路径残留纠正**: BASELINE-002/00_EXECUTION_SUMMARY.md、01_INPUT_DECISION_LOG.md、03_R1_REVISION_LOG.md 中残留待独立任务修正

以上均不阻塞 ZK-ENV-001-R1 文档修订。
