package com.bsoft.cdcconfig.subscription.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bsoft.cdcconfig.datasource.connection.ConnectionFactory;
import com.bsoft.cdcconfig.datasource.entity.DataSource;
import com.bsoft.cdcconfig.datasource.mapper.DataSourceMapper;
import com.bsoft.cdcconfig.subscription.dto.SourceTableInput;
import com.bsoft.cdcconfig.subscription.exception.SubscriptionErrorCode;
import com.bsoft.cdcconfig.subscription.service.SourceMetadataService;
import com.bsoft.cdcconfig.subscription.vo.SchemaVO;
import com.bsoft.cdcconfig.subscription.vo.TableVO;
import com.bsoft.cdcconfig.subscription.vo.ValidationErrorVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Properties;
import java.util.Set;

/**
 * 源库 Oracle 元数据只读访问实现（DESIGN §6）。复用 {@link ConnectionFactory} 打开
 * 一次性临时连接并设置连接/读取超时；只执行 SELECT 只读查询；try-with-resources /
 * finally 保证关闭。
 *
 * <p>能力分层（DESIGN §6.3）：优先使用 ALL_USERS.ORACLE_MAINTAINED='N' 模式；该列
 * 不存在或无权限时回退系统 Schema 排除清单，回退记录不含敏感信息日志。物化视图按
 * ALL_MVIEWS.MVIEW_NAME 与 CONTAINER_NAME 显式排除（Schema 列表、表清单、批量复核三处
 * 统一谓词）。</p>
 *
 * <p>错误脱敏：本地实现 ConnectionTester 的分类逻辑（其 sanitizeMessage 为 private，
 * 无法直接复用），任何路径不泄露密码、完整 JDBC 连接串或堆栈。</p>
 */
@Service
public class SourceMetadataServiceImpl implements SourceMetadataService {

    private static final Logger log = LoggerFactory.getLogger(SourceMetadataServiceImpl.class);

    private static final long CONNECTION_TIMEOUT_MS = 10000L;

    /** 集中维护、可测试的 Oracle 系统 Schema 排除清单（兼容回退；非“保证完整”的事实）。 */
    private static final String FALLBACK_EXCLUSION_LIST =
            "'SYS','SYSTEM','OUTLN','DBSNMP','XDB','MDSYS','CTXSYS','ORDDATA','ORDPLUGINS','OLAPSYS',"
                    + "'DMSYS','WMSYS','LBACSYS','TSMSYS','EXFSYS','SYSMAN','DVSYS','AUDSYS','APPQOSSYS',"
                    + "'GSMADMIN_INTERNAL','OJVMSYS'";

    private static final String CAPABILITY_SCHEMA_SQL =
            "SELECT DISTINCT t.OWNER FROM ALL_TABLES t "
                    + "JOIN ALL_USERS u ON u.USERNAME = t.OWNER "
                    + "WHERE u.ORACLE_MAINTAINED = 'N' "
                    + "AND NOT EXISTS (SELECT 1 FROM ALL_MVIEWS mv "
                    + "  WHERE mv.OWNER = t.OWNER AND (mv.MVIEW_NAME = t.TABLE_NAME OR mv.CONTAINER_NAME = t.TABLE_NAME)) "
                    + "ORDER BY t.OWNER";

    private static final String FALLBACK_SCHEMA_SQL =
            "SELECT DISTINCT t.OWNER FROM ALL_TABLES t "
                    + "WHERE t.OWNER NOT IN (" + FALLBACK_EXCLUSION_LIST + ") "
                    + "AND NOT EXISTS (SELECT 1 FROM ALL_MVIEWS mv "
                    + "  WHERE mv.OWNER = t.OWNER AND (mv.MVIEW_NAME = t.TABLE_NAME OR mv.CONTAINER_NAME = t.TABLE_NAME)) "
                    + "ORDER BY t.OWNER";

    private static final String TABLE_SQL =
            "SELECT TABLE_NAME FROM ALL_TABLES t "
                    + "WHERE t.OWNER = ? "
                    + "AND NOT EXISTS (SELECT 1 FROM ALL_MVIEWS mv "
                    + "  WHERE mv.OWNER = t.OWNER AND (mv.MVIEW_NAME = t.TABLE_NAME OR mv.CONTAINER_NAME = t.TABLE_NAME)) "
                    + "ORDER BY TABLE_NAME";

    private final DataSourceMapper dataSourceMapper;
    private final ConnectionFactory connectionFactory;

    public SourceMetadataServiceImpl(DataSourceMapper dataSourceMapper,
                                     ConnectionFactory connectionFactory) {
        this.dataSourceMapper = dataSourceMapper;
        this.connectionFactory = connectionFactory;
    }

    @Override
    public SchemaVO listSchemas(String dataSourceId) {
        DataSource ds = resolveSourceRecord(dataSourceId);
        return executeWithSource(ds, conn -> {
            try {
                return querySchemas(conn, dataSourceId, CAPABILITY_SCHEMA_SQL, "ORACLE_MAINTAINED");
            } catch (SQLException e) {
                if (isCapabilityUnsupported(e)) {
                    log.warn("ORACLE_MAINTAINED capability unavailable, fallback to exclusion list. dataSourceId={}", dataSourceId);
                    return querySchemas(conn, dataSourceId, FALLBACK_SCHEMA_SQL, "FALLBACK_EXCLUSION_LIST");
                }
                throw e;
            }
        });
    }

    @Override
    public TableVO listTables(String dataSourceId, String schema) {
        DataSource ds = resolveSourceRecord(dataSourceId);
        return executeWithSource(ds, conn -> {
            List<String> tables = new ArrayList<>();
            try (PreparedStatement ps = conn.prepareStatement(TABLE_SQL)) {
                ps.setString(1, schema);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        tables.add(rs.getString(1));
                    }
                }
            }
            TableVO vo = new TableVO();
            vo.setDataSourceId(dataSourceId);
            vo.setSchema(schema);
            vo.setTables(tables);
            return vo;
        });
    }

    @Override
    public List<ValidationErrorVO> validateTables(String dataSourceId, List<SourceTableInput> sourceTables) {
        DataSource ds = resolveSourceRecord(dataSourceId);
        if (sourceTables == null || sourceTables.isEmpty()) {
            return Collections.emptyList();
        }
        return executeWithSource(ds, conn -> validateAgainstSource(conn, sourceTables));
    }

    @Override
    public boolean probeReachable(String dataSourceId) {
        DataSource ds = dataSourceMapper.selectOne(
                new LambdaQueryWrapper<DataSource>().eq(DataSource::getDataSourceId, dataSourceId));
        if (ds == null || !"1".equals(ds.getFgActive()) || !"SOURCE".equalsIgnoreCase(ds.getDataSourceCategory())) {
            return false;
        }
        Connection conn = null;
        try {
            conn = openConnection(ds);
            try (Statement st = conn.createStatement();
                 ResultSet rs = st.executeQuery("SELECT 1 FROM DUAL")) {
                return rs.next();
            }
        } catch (Exception e) {
            log.warn("Source reachability probe failed. dataSourceId={}", dataSourceId);
            return false;
        } finally {
            closeQuietly(conn);
        }
    }

    // ---- metadata query helpers ----

    /**
     * 保存前批量复核（DESIGN §6.4 / DATABASE §4.8）：一次连接、两个批量查询。
     * 可订阅普通表集合（显式排除物化视图）与 ALL_MVIEWS 集合比对，缺失表按
     * “物化视图排除 → 40331，否则 → 40330”分类（见类注释）。
     */
    private List<ValidationErrorVO> validateAgainstSource(Connection conn,
                                                          List<SourceTableInput> sourceTables) throws SQLException {
        Set<String> schemaSet = new LinkedHashSet<>();
        for (SourceTableInput input : sourceTables) {
            schemaSet.add(input.getSchemaName());
        }
        List<String> schemas = new ArrayList<>(schemaSet);
        Set<String> normalTables = new HashSet<>();
        try (PreparedStatement ps = conn.prepareStatement(buildBatchNormalSql(schemas))) {
            bindSchemas(ps, schemas);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    normalTables.add(ownerKey(rs.getString(1), rs.getString(2)));
                }
            }
        }
        Set<String> mviewTables = new HashSet<>();
        try (PreparedStatement ps = conn.prepareStatement(buildBatchMviewSql(schemas))) {
            bindSchemas(ps, schemas);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String owner = rs.getString(1);
                    String mviewName = rs.getString(2);
                    String containerName = rs.getString(3);
                    if (mviewName != null) {
                        mviewTables.add(ownerKey(owner, mviewName));
                    }
                    if (containerName != null) {
                        mviewTables.add(ownerKey(owner, containerName));
                    }
                }
            }
        }
        List<ValidationErrorVO> errors = new ArrayList<>();
        for (SourceTableInput input : sourceTables) {
            String key = ownerKey(input.getSchemaName(), input.getTableName());
            if (normalTables.contains(key)) {
                continue;
            }
            if (mviewTables.contains(key)) {
                errors.add(tableError("40331", input));
            } else {
                errors.add(tableError("40330", input));
            }
        }
        return errors;
    }

    private static String ownerKey(String owner, String name) {
        return owner + "," + name;
    }

    private String buildBatchNormalSql(List<String> schemas) {
        StringBuilder sb = new StringBuilder(
                "SELECT t.OWNER, t.TABLE_NAME FROM ALL_TABLES t WHERE t.OWNER IN (");
        appendPlaceholders(sb, schemas.size());
        sb.append(") AND NOT EXISTS (SELECT 1 FROM ALL_MVIEWS mv "
                + " WHERE mv.OWNER = t.OWNER AND (mv.MVIEW_NAME = t.TABLE_NAME OR mv.CONTAINER_NAME = t.TABLE_NAME))");
        return sb.toString();
    }

    private String buildBatchMviewSql(List<String> schemas) {
        StringBuilder sb = new StringBuilder(
                "SELECT OWNER, MVIEW_NAME, CONTAINER_NAME FROM ALL_MVIEWS WHERE OWNER IN (");
        appendPlaceholders(sb, schemas.size());
        sb.append(')');
        return sb.toString();
    }

    private static void appendPlaceholders(StringBuilder sb, int count) {
        for (int i = 0; i < count; i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append('?');
        }
    }

    private static void bindSchemas(PreparedStatement ps, List<String> schemas) throws SQLException {
        for (int i = 0; i < schemas.size(); i++) {
            ps.setString(i + 1, schemas.get(i));
        }
    }

    private ValidationErrorVO tableError(String errorCode, SourceTableInput input) {
        ValidationErrorVO vo = new ValidationErrorVO();
        vo.setErrorCode(errorCode);
        vo.setField("sourceTables");
        vo.setName(input.getSchemaName() + "." + input.getTableName());
        vo.setMessage("40330".equals(errorCode)
                ? "源表中存在当前源库不存在的表"
                : "源表中存在当前账号不可访问的表");
        return vo;
    }

    private SchemaVO querySchemas(Connection conn, String dataSourceId, String sql, String filterMode)
            throws SQLException {
        List<String> schemas = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                schemas.add(rs.getString(1));
            }
        }
        SchemaVO vo = new SchemaVO();
        vo.setDataSourceId(dataSourceId);
        vo.setFilterMode(filterMode);
        vo.setSchemas(schemas);
        return vo;
    }

    /**
     * ALL_USERS.ORACLE_MAINTAINED 不可用时（列不存在 / 表或视图不存在 / 权限不足）走
     * 兼容回退；其他 SQL 失败不得静默返回全部 Schema。
     */
    private static boolean isCapabilityUnsupported(SQLException e) {
        for (SQLException t = e; t != null; t = t.getNextException()) {
            int code = t.getErrorCode();
            if (code == 904 || code == 942 || code == 1031) {
                return true;
            }
            String message = t.getMessage() == null ? "" : t.getMessage().toLowerCase();
            if (message.contains("ora-00904") || message.contains("ora-00942")
                    || message.contains("ora-01031")) {
                return true;
            }
        }
        return "42000".equals(e.getSQLState());
    }

    // ---- source record & connection ----

    private DataSource resolveSourceRecord(String dataSourceId) {
        DataSource ds = dataSourceMapper.selectOne(
                new LambdaQueryWrapper<DataSource>().eq(DataSource::getDataSourceId, dataSourceId));
        if (ds == null || !"1".equals(ds.getFgActive())) {
            throw SubscriptionErrorCode.sourceNotFoundOrInactive();
        }
        if (!"SOURCE".equalsIgnoreCase(ds.getDataSourceCategory())) {
            throw SubscriptionErrorCode.sourceCategoryMismatch();
        }
        return ds;
    }

    private interface ConnectionAction<T> {
        T run(Connection conn) throws SQLException;
    }

    private <T> T executeWithSource(DataSource ds, ConnectionAction<T> action) {
        Connection conn = openConnection(ds);
        try {
            return action.run(conn);
        } catch (SQLException e) {
            throw SubscriptionErrorCode.schemaLoadFailed(desensitize(e));
        } finally {
            closeQuietly(conn);
        }
    }

    private Connection openConnection(DataSource ds) {
        Properties connectionProperties = new Properties();
        connectionProperties.setProperty("oracle.net.CONNECT_TIMEOUT", String.valueOf(CONNECTION_TIMEOUT_MS));
        connectionProperties.setProperty("oracle.jdbc.ReadTimeout", String.valueOf(CONNECTION_TIMEOUT_MS));
        String url = "jdbc:oracle:thin:@//" + ds.getDataSourceHost() + ":" + ds.getDataSourcePort()
                + "/" + ds.getDataSourceServiceName();
        try {
            return connectionFactory.open(url, "oracle.jdbc.OracleDriver", connectionProperties,
                    ds.getDataSourceUserName(), ds.getDataSourcePassword());
        } catch (Exception e) {
            throw SubscriptionErrorCode.sourceConnectionFailed(desensitize(e));
        }
    }

    private static void closeQuietly(Connection conn) {
        if (conn == null) {
            return;
        }
        try {
            conn.close();
        } catch (SQLException ignored) {
            // 关闭失败不掩盖主路径结果
        }
    }

    /**
     * 脱敏分类（镜像 ConnectionTester 分类）：驱动不支持 / 主机无法解析 / 连接超时 /
     * 无法连接 / 认证失败 / 数据库连接失败。遍历 cause 链，任何路径不泄露密码、完整
     * JDBC 连接串或内部异常文本。
     */
    private static String desensitize(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            if (t instanceof ClassNotFoundException) {
                return "驱动不支持";
            }
            if (t instanceof UnknownHostException) {
                return "主机无法解析";
            }
            if (t instanceof SocketTimeoutException) {
                return "连接超时";
            }
            if (t instanceof ConnectException) {
                return "无法连接";
            }
            if (t instanceof SQLException) {
                SQLException se = (SQLException) t;
                if ("28000".equals(se.getSQLState())) {
                    return "认证失败";
                }
                String m = se.getMessage() == null ? "" : se.getMessage().toLowerCase();
                if (m.contains("ora-01017") || m.contains("invalid username")
                        || m.contains("invalid username/password") || m.contains("access denied")) {
                    return "认证失败";
                }
                if (m.contains("timeout") || m.contains("timed out")) {
                    return "连接超时";
                }
                if (m.contains("connection refused") || m.contains("no route to host")
                        || m.contains("network is unreachable") || m.contains("could not connect")
                        || m.contains("cannot connect") || m.contains("unreachable")) {
                    return "无法连接";
                }
            }
        }
        return "数据库连接失败";
    }
}
