package com.bsoft.cdcconfig.clientconfig;

import org.apache.ibatis.type.TypeAliasRegistry;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * 真实 MyBatis 类型别名注册回归测试。
 *
 * <p>与 `application.yml` 的 `mybatis-plus.type-aliases-package: com.bsoft.cdcconfig` 一致，
 * 本测试把 log-query 与 client-config 两侧类型放入同一个真实 `TypeAliasRegistry` 按包扫描注册：
 * 修复前，`logquery.vo` 与 `clientconfig.model.vo` 各含一个简单类名 `DataSourceOptionVO`，
 * 后注册方会抛出与启动根因一致的
 * `TypeException: The alias 'DataSourceOptionVO' is already mapped to ...`；
 * 修复后（client-config 侧更名为 ClientConfigDataSourceOptionVO）注册必须无冲突并可按名解析。
 *
 * <p>不连接数据库、不启动 Spring、不依赖外部系统；红灯只作为修复前证据，
 * 本测试最终断言期待无冲突并通过。
 */
class ClientConfigTypeAliasIntegrationTest {

    @Test
    void clientConfigAndLogQueryPackages_shouldRegisterUnderRealAliasScanWithoutCollision() {
        TypeAliasRegistry registry = new TypeAliasRegistry();

        // 与 MyBatis-Plus type-aliases-package 递归扫描一致的真实注册路径（按简单类名注册）。
        registry.registerAliases("com.bsoft.cdcconfig.logquery.vo");
        registry.registerAliases("com.bsoft.cdcconfig.clientconfig.model.vo");

        // log-query 侧简单类名 DataSourceOptionVO 仍存在且唯一指向 logquery.vo.DataSourceOptionVO。
        Class<?> logqueryAlias = registry.resolveAlias("DataSourceOptionVO");
        assertEquals("com.bsoft.cdcconfig.logquery.vo.DataSourceOptionVO", logqueryAlias.getName());

        // client-config 侧候选 VO 已更名为 ClientConfigDataSourceOptionVO，无冲突且可按名解析。
        Class<?> clientConfigAlias = registry.resolveAlias("ClientConfigDataSourceOptionVO");
        assertEquals("com.bsoft.cdcconfig.clientconfig.model.vo.ClientConfigDataSourceOptionVO",
                clientConfigAlias.getName());
    }
}
