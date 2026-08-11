# 01_CONFIGURATION_DIFF — ZK-ENV-001 配置差异报告

## 1. agent-env.sh

### 变更前

未包含任何 ZooKeeper 环境变量。仅有 Java、Maven、Oracle Client、Node.js 和 npm 配置。

### 变更后

在文件末尾新增 ZooKeeper 环境变量块：

```bash
# ZooKeeper environment
export ZOOKEEPER_HOME=/opt/zookeeper/zookeeper-3.4.14
export CDC_ZK_CONNECT=10.19.16.111:2181
export CDC_ZK_ROOT=/bsoft-cdc
export PATH="$ZOOKEEPER_HOME/bin:$PATH"
```

### 未变更部分

Java、Maven、Oracle Client、Node/npm 及字符集配置保持不变。

---

## 2. CLAUDE.md

### §7 预装基础环境

| 行 | 变更前 | 变更后 |
|---|---|---|
| ZK 客户端路径 | `/opt/module/zookeeper-3.4.14`（目标版本，待部署） | `/opt/zookeeper/zookeeper-3.4.14` |

### §14.1 环境信息

| 字段 | 变更前 | 变更后 |
|---|---|---|
| ZooKeeper 服务端目标版本 | (不存在此行) | 3.4.14 |
| ZooKeeper 客户端版本 | 3.5.6 | (移除，改为服务端目标版本) |
| ZooKeeper 客户端目录 | `/opt/module/zookeeper-3.4.14`（ZOOKEEPER_HOME，目标路径，待部署） | `/opt/zookeeper/zookeeper-3.4.14`（ZOOKEEPER_HOME） |
| ZooKeeper 客户端命令 | `/opt/zookeeper/apache-zookeeper-3.5.6-bin/bin/zkCli.sh` | `${ZOOKEEPER_HOME}/bin/zkCli.sh` |
| CDC ZooKeeper 地址 | `192.168.174.51:2181` | `10.19.16.111:2181` |
| CDC 根路径 | `/bsoft-cdc` | `/bsoft-cdc`（不变） |

### §8.5 ZooKeeper 环境预检

| 行 | 变更前 | 变更后 |
|---|---|---|
| zkCli.sh 路径检查 | `test -x /opt/zookeeper/apache-zookeeper-3.5.6-bin/bin/zkCli.sh` | `test -x ${ZOOKEEPER_HOME}/bin/zkCli.sh` |

---

## 3. application-dev.yml

| 字段 | 变更前 | 变更后 |
|---|---|---|
| connect-string | `${CDC_ZK_CONNECT:192.168.174.51:2181}` | `${CDC_ZK_CONNECT:10.19.16.111:2181}` |
| root-path | `${CDC_ZK_ROOT:/bsoft-cdc}` | `${CDC_ZK_ROOT:/bsoft-cdc}`（不变） |

---

## 4. ENVIRONMENT.md

> **R1 修订 (2026-08-11)**: ENVIRONMENT.md 在 ZK-ENV-001 初次编辑后遗留 6 处状态冲突（§1 agent-env.sh 仍标注"不包含 ZK 变量"、§3.2 旧地址仍标记在已同步文件中、§3.3 运行时兼容性未区分 CLI/Curator、§3.4 连通性"待验证"、§5 ZK 连通性"待验证"、§6 4项已完成事项仍列在待处理）。ZK-ENV-001-R1 已全部修正。详情见 `03_R1_REVISION_LOG.md`。

| 位置 | 变更前 | 变更后 (含 R1) |
|---|---|---|
| §1 引导语 | "由 agent-env.sh 统一管理环境变量" | agent-env.sh 初始仅声明 Java/Maven/Oracle/Node/npm，ZK-ENV-001 已新增 ZK 变量 (R1) |
| §1.1 ZOOKEEPER_HOME | `/opt/module/zookeeper-3.4.14`，目录尚不存在 | `/opt/zookeeper/zookeeper-3.4.14`，目录存在，zkCli.sh 权限已修正 (R1) |
| §1.1 agent-env.sh ZK 变量 | "未包含" | "已于 ZK-ENV-001 同步" |
| §3.1 ZOOKEEPER_HOME 值 | `/opt/module/zookeeper-3.4.14` | `/opt/zookeeper/zookeeper-3.4.14` |
| §3.1 同步状态表 | 全部"未包含/未更新" | 全部"已同步 (ZK-ENV-001)" |
| §3.2 旧地址残留位置 | "application-dev.yml, CLAUDE.md §14" | "仅保留于本文档作为历史记录" (R1) |
| §3.3 D 运行时兼容性 | "ZK连接不可达或未执行验证；连通性待验证" | "CLI层已验证；Java/Curator层未验证" (R1) |
| §3.4 连通性 | "实际连通性尚待验证" | "TCP可达、会话建立成功" (R1) |
| §5 ZK 连通性 | "待验证" | "可达"，补充完整验证结果 (R1) |
| §6 待处理事项 | 8项含4项已完成 + zkCli.sh权限 | 2项：Curator兼容性 + pom.xml处理 (R1) |

---

## 5. DEVELOPMENT_RULES.md

无修改。§5 ZooKeeper 操作规则引用 CLAUDE.md，已随 CLAUDE.md 更新而间接触达当前正式配置。

---

## 6. PROJECT_STATUS.md

| 位置 | 变更前 | 变更后 |
|---|---|---|
| §4 ZK 复核状态 | "ZK不可达，无法运行时复核" | "ZK-ENV-001: ZK 10.19.16.111:2181 可达，v3.4.14，会话建立成功，/bsoft-cdc/clients 读取成功" |
| §5 运行验证 | 仅"ZK连接运行时验证: 不可达" | 扩展为 7 行验证结果（TCP/会话/节点读取/版本/兼容性） |
| §8 待处理事项 | "ZK新地址连通性验证" (高) | 移除（已完成）；"application-dev.yml ZK地址更新" 移除（已完成）；新增 "ZK Java客户端/Curator兼容性验证" (高)；zkCli.sh 权限已修正，不再列为待处理 (R1) |

---

## 7. 03_R1_REVISION_LOG.md

- 全文件 `/opt/module/zookeeper-3.4.14` → `/opt/zookeeper/zookeeper-3.4.14`（4处）
- 新增 R1-008：ZOOKEEPER_HOME 目标路径纠正
- 配置同步状态总览表更新为 ZK-ENV-001 完成后状态
- 尚待完成事项更新：移除已完成的配置同步和连通性验证，保留兼容性验证

---

## 8. 错误路径 `/opt/module/zookeeper-3.4.14` 搜索与处理

### 允许修改范围外残留（仅记录，不修改）

| 文件 | 行内容（摘要） | 处理 |
|---|---|---|
| `docs/baseline-work/BASELINE-002/00_EXECUTION_SUMMARY.md` | `ZOOKEEPER_HOME=/opt/module/zookeeper-3.4.14` | 仅记录 |
| `docs/baseline-work/BASELINE-002/01_INPUT_DECISION_LOG.md` | `ZOOKEEPER_HOME=/opt/module/zookeeper-3.4.14 (用户确认正式目标)` | 仅记录 |
| `docs/baseline-work/BASELINE-002/01_INPUT_DECISION_LOG.md` | `ZOOKEEPER_HOME=/opt/module/zookeeper-3.4.14 为用户于2026-08-11确认` | 仅记录 |

### 允许修改范围内（已全部纠正）

CLAUDE.md (2处)、agent-env.sh (1处)、ENVIRONMENT.md (4处)、03_R1_REVISION_LOG.md (4处) — 全部已纠正为 `/opt/zookeeper/zookeeper-3.4.14`。
