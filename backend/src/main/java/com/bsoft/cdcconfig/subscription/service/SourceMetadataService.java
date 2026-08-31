package com.bsoft.cdcconfig.subscription.service;

import com.bsoft.cdcconfig.subscription.dto.SourceTableInput;
import com.bsoft.cdcconfig.subscription.vo.SchemaVO;
import com.bsoft.cdcconfig.subscription.vo.TableVO;
import com.bsoft.cdcconfig.subscription.vo.ValidationErrorVO;

import java.util.List;

/**
 * 源库 Oracle 元数据只读访问接口（DESIGN §6）。目标库只选择、不连接。
 * 错误语义：源库不存在/停用 → 40320；类别非 SOURCE → 40322；连接失败 → 40340（脱敏）；
 * Schema/表加载失败 → 40341（脱敏）。密码只在建立源 Oracle 连接时按需读取，绝不外泄。
 */
public interface SourceMetadataService {

    SchemaVO listSchemas(String dataSourceId);

    TableVO listTables(String dataSourceId, String schema);

    /**
     * 保存前/编辑打开批量复核（DESIGN §6.4）：一次源库连接、按 Schema 批量查询
     * ALL_TABLES（显式排除物化视图）。返回失效项（errorCode 40330/40331，field=
     * sourceTables，name=Schema.表名）；连接/加载失败抛 40340/40341。
     */
    List<ValidationErrorVO> validateTables(String dataSourceId, List<SourceTableInput> sourceTables);

    /**
     * best-effort 可达性探测（编辑打开有限编辑判定，DESIGN §3.5）：任何失败返回 false，
     * 不抛业务错误。
     */
    boolean probeReachable(String dataSourceId);
}
