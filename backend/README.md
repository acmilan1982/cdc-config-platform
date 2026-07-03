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

## 当前状态

本项目当前仅为 Spring Boot 后端骨架，已实现：

- 统一响应结构（ApiResponse）
- 统一分页结构（PageResult）
- 全局异常处理
- 参数校验（Bean Validation）
- Swagger/OpenAPI 文档
- 健康检查接口
- CORS 开发环境跨域配置
- Oracle 数据源连接

尚未实现任何业务模块 CRUD。
