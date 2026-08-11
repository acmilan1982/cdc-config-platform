# 04_R1_REVISION_LOG — ZK-COMPAT-001-R1 / R2 修订日志

修订日期：2026-08-11
修订范围：ZK-COMPAT-001 报告纠错（R1）+ 证据补齐（R2）

---

## R1 修订（依赖统一 + 报告纠错）

### R1-001：curator-recipes 跨版本混用不存在

| 项目 | 内容 |
|---|---|
| **原表述** | "curator-recipes 4.3.0 与 curator-framework 2.13.0 跨版本混用" |
| **修正后** | 三次验证（dependency:tree, build-classpath, Class.forName）均确认 curator-recipes 未声明、未解析、未加载 |

### R1-002：01_DEPENDENCY_COMPARISON.md 依赖链修正

移除所有 curator-recipes 4.3.0 相关内容，补充实际 mvn 命令输出和 effective-pom 分析。

### R1-003：02_READ_ONLY_COMPATIBILITY_VERIFICATION.md 业务数据删除

原 Phase 4 输出中的客户端名称、IP、Job ID、SCN、医院名称替换为布尔值（online, running, hasScn）和数量统计（clientCount, jobCount）。

### R1-004：02 报告 R1 验证补充

新增 Phase 6 应用层验证结果 + Runtime 版本确认。

### R1-005：03_POM_DECISION.md 裁决方向修正

原裁决建议恢复 Curator 4.3.0，R1 改为建议保留 Curator 2.13.0（生产约束 + 版本对齐原则）。

### R1-006：03 报告补充验证范围与剩余风险

新增已验证/未验证对照表、Recipes API 剩余风险说明。

### R1-007：pom.xml 注释修正

`match production 3.5.6` → `match production 3.4.14`

### R1-008：00_EXECUTION_SUMMARY.md 全面更新

新增 Git 状态、目标变化、阶段结果、构建结果、各层验证表。

### R1-009：应用层补验方式

mktemp + 项目真实 Bean 方法 + ProtectionDomain 版本确认。

### R1-010：基线测试隔离

经HEAD隔离基线确认属于PRE-EXISTING；OracleDateMappingTest为数据库返回值与硬编码预期不一致，JobFailureServiceTest按实际Surefire异常记录归因。。

---

## R2 修订（证据补齐 + 最终纠错）

### R2-001：Git 现场完整记录

00 报告新增：完整 `git status --short`、`git diff -- pom.xml`、`git diff -- application-dev.yml`、`git diff -- ZK-COMPAT-001/` 输出。

### R2-002：测试统计精确修正

| 项目 | R1 表述 | R2 修正 |
|---|---|---|
| 总数 | "396 个中 394 通过、2 个失败" | tests=396, failures=2, errors=9, skipped=0, 成功=385 |
| 失败类数 | 未明确 | 2 类 (OracleDateMappingTest, JobFailureServiceTest) |
| 失败用例数 | 未明确 | 11 用例 (2 failures + 9 errors) |
| 异常信息 | 不详 | 逐类列出 type/message |
| OracleDateMappingTest 归因 | "缺少Oracle连接" | AssertionFailedError: expected 27 but was 30（数据值不匹配，非连接缺失） |
| JobFailureServiceTest 归因 | 不详 | 1 failure (FG_ACTIVE) + 9 errors (NoSuchElementException) |
| 基线证据 | 无 | HEAD=8822795, 相同 2 failures + 9 errors, 可复核 |

### R2-003：Runtime / Test classpath 分离

| classpath | 生成命令 | curator-framework | curator-client | curator-test | curator-recipes | zookeeper |
|---|---|---|---|---|---|---|
| Runtime | `includeScope=runtime` | 2.13.0 | 2.13.0 | 不在 | 不在 | 3.4.14 |
| Test | default scope | 2.13.0 | 2.13.0 | 2.13.0 | 不在 | 3.4.14 |

准确表述：当前实际解析的 Curator 组件均为 2.13.0；curator-recipes 未声明、未解析、未加载。

### R2-004：项目配置解析补验

不再硬编码正式地址。验证方式：

1. SnakeYAML 解析 `application-dev.yml`
2. `${CDC_ZK_CONNECT:10.19.16.111:2181}` → `System.getenv("CDC_ZK_CONNECT")` → `10.19.16.111:2181`
3. `${CDC_ZK_ROOT:/bsoft-cdc}` → `System.getenv("CDC_ZK_ROOT")` → `/bsoft-cdc`
4. 解析值注入 ZooKeeperConfig → curatorFramework() → 连接 → getClients()
5. 退出码 0

### R2-005：验证命令补齐

00 报告新增完整验证命令：mktemp 路径、javac 命令、java 命令、runtime classpath、配置加载方式、Bean/Client/Service 构造方式、退出码。

### R2-006：打包结论区分

| R1 表述 | R2 修正 |
|---|---|
| "打包层 PASS" | compile PASS, test PRE-EXISTING_FAILURE, package with tests FAIL, package with skipped tests PASS |

### R2-007：log4j 安全风险表述修正

| R1 表述 | R2 修正 |
|---|---|
| "log4j 1.2.17 旧版但无已知漏洞影响 ZK 使用场景" | "log4j 1.2.17 由 ZooKeeper 3.4.14 传递引入，属于已停止维护的遗留风险。本任务不扩大范围修改，登记为后续依赖治理事项。" |

### R2-008：各层独立结论

00 报告新增 12 层独立结论：依赖解析层、runtime classpath 层、test classpath 层、编译层、测试层、跳过测试的打包层、项目配置解析层、项目 Bean 层、Client 层、Service 层、安全层、Git 范围层。

---

## 仍未覆盖的风险

1. **长时间运行稳定性**：验证为瞬时连接，未测试长时间 ZK 会话维持
2. **ZK 集群故障转移**：当前 ZK 为 standalone，未测试集群切换
3. **Recipes API**：项目不使用，未验证
4. **log4j 1.2.17 遗留风险**：登记为后续治理事项
5. **完整 Spring Boot 集成**：未启动完整应用，Bean 创建和 Service 调用为手工构造依赖

## 未执行操作（R1 + R2 均遵守）

- 未修改 pom.xml（除 R1 注释修正）
- 未修改业务代码、测试代码、application-dev.yml、前端代码
- 未操作数据库
- 未写入 ZooKeeper
- 未 commit，未 push
