# CDC配置管理平台 - 后端服务

## 技术栈

- JDK 8
- Spring Boot 2.7.18
- Maven
- MyBatis-Plus 3.5.3.1
- Oracle 19c (ojdbc8)
- SpringDoc OpenAPI 1.7.0
- Bean Validation

## 构建命令

```bash
cd backend

# 编译（跳过测试）
mvn clean compile -DskipTests

# 运行测试
mvn clean test

# 打包
mvn clean package
```

## 启动命令

```bash
# 方式一：Maven 插件启动
mvn spring-boot:run

# 方式二：JAR 包启动
java -jar target/cdc-config-platform-backend-1.0.0-SNAPSHOT.jar
```

## 配置文件

| 文件 | 说明 |
|------|------|
| `src/main/resources/application.yml` | 主配置（端口、MyBatis-Plus、SpringDoc） |
| `src/main/resources/application-dev.yml` | 开发环境配置（Oracle 数据源、日志级别） |

默认激活 `dev` profile。

## 接口地址

| 接口 | 地址 |
|------|------|
| 健康检查 | http://localhost:8080/api/health |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs |

## 接口地址

| 接口 | 地址 |
|------|------|
| 健康检查 | http://localhost:8080/api/health |
| 数据源分页查询 | GET /api/data-sources |
| 数据源详情 | GET /api/data-sources/{dataSourceId} |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs |

## 数据源管理 API

已实现数据源管理完整 CRUD（7 个接口），详见 `docs/api/data-source-api.md`。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/data-sources` | 分页查询（ID精确/名称模糊） |
| GET | `/api/data-sources/{id}` | 详情（含扩展配置） |
| POST | `/api/data-sources` | 新增（主+扩展同事务） |
| PUT | `/api/data-sources/{id}` | 修改（支持ID修改、密码留空不覆盖） |
| DELETE | `/api/data-sources/{id}` | 删除（先扩展后主表，物理删除） |
| PUT | `/api/data-sources/{id}/enable` | 启用（FG_ACTIVE=1） |
| PUT | `/api/data-sources/{id}/disable` | 停用（FG_ACTIVE=0） |

### 只读验证方式

```bash
# 分页查询
curl http://localhost:8080/api/data-sources?pageNum=1\&pageSize=20

# 详情查询
curl http://localhost:8080/api/data-sources/DS001
```

### 真实写操作审批说明

以下接口已开发完成但**未获得真实开发库写入授权**，调用前须经项目负责人审批：

- POST /api/data-sources（新增）
- PUT /api/data-sources/{id}（修改）
- DELETE /api/data-sources/{id}（删除）
- PUT /api/data-sources/{id}/enable（启用）
- PUT /api/data-sources/{id}/disable（停用）

## 当前状态

已实现：

- 统一响应结构（ApiResponse）
- 统一分页结构（PageResult）
- 全局异常处理
- 参数校验（Bean Validation）
- Swagger/OpenAPI 文档
- 健康检查接口
- CORS 开发环境跨域配置
- Oracle 数据源连接
- 数据源管理 CRUD（含扩展表一对一事务）
- ZooKeeper 客户端监控只读 API

## ZooKeeper 客户端监控 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/monitor/zookeeper/clients` | 查询全部 CDC 客户端节点（聚合 clients/status/ip/jobs/scn） |
| GET | `/api/monitor/zookeeper/health` | ZooKeeper 连接健康检查 |

详见 `docs/api/zk-client-monitor-api.md`。

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| CDC_ZK_CONNECT | 192.168.174.51:2181 | ZooKeeper 连接地址 |
| CDC_ZK_ROOT | /bsoft-cdc | ZooKeeper 根路径 |

### 只读安全边界

本模块仅使用 Curator 的 `checkExists`、`getChildren`、`getData` 操作。项目业务代码不调用任何 ZooKeeper 写 API（create、setData、delete、setACL 等）。

### 真实 ZooKeeper 只读验证

```bash
# 查询所有客户端
curl http://localhost:8080/api/monitor/zookeeper/clients

# ZK 连接健康
curl http://localhost:8080/api/monitor/zookeeper/health
```
