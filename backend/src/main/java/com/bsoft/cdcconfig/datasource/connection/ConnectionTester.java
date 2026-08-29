package com.bsoft.cdcconfig.datasource.connection;

import com.bsoft.cdcconfig.datasource.vo.TestConnectionResultVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Duration;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Component
public class ConnectionTester {

    /** 驱动级查询超时（秒），作为软超时辅助；总期限由 {@link #deadline} 硬性约束。 */
    static final int TIMEOUT_SECONDS = 10;

    private static final Duration DEFAULT_DEADLINE = Duration.ofSeconds(TIMEOUT_SECONDS);

    private final ConnectionFactory connectionFactory;
    private final Duration deadline;
    private final ExecutorService executor;

    @Autowired
    public ConnectionTester(ConnectionFactory connectionFactory) {
        this(connectionFactory, DEFAULT_DEADLINE);
    }

    ConnectionTester(ConnectionFactory connectionFactory, Duration deadline) {
        this.connectionFactory = connectionFactory;
        this.deadline = deadline == null ? DEFAULT_DEADLINE : deadline;
        ThreadFactory daemonFactory = runnable -> {
            Thread t = new Thread(runnable, "cdc-connection-test");
            t.setDaemon(true);
            return t;
        };
        this.executor = Executors.newFixedThreadPool(2, daemonFactory);
    }

    /** 供单元测试释放受控执行器；生产环境线程为 daemon，随 JVM 退出。 */
    void close() {
        executor.shutdownNow();
    }

    public TestConnectionResultVO test(String type, String host, Integer port, String userName,
                                       String password, String serviceName) {
        String driver;
        String url;
        String probeSql;
        long timeoutMs = deadline.toMillis();
        if (isMySqlProtocol(type)) {
            driver = "com.mysql.cj.jdbc.Driver";
            url = "jdbc:mysql://" + host + ":" + port + "/" + serviceName
                    + "?connectTimeout=" + timeoutMs + "&socketTimeout=" + timeoutMs;
            probeSql = "SELECT 1";
        } else {
            driver = "oracle.jdbc.OracleDriver";
            url = "jdbc:oracle:thin:@//" + host + ":" + port + "/" + serviceName;
            probeSql = "SELECT 1 FROM DUAL";
        }

        String finalDriver = driver;
        String finalUrl = url;
        String finalProbeSql = probeSql;
        Future<TestConnectionResultVO> future = executor.submit(() ->
                probe(finalDriver, finalUrl, userName, password, finalProbeSql));
        try {
            return future.get(timeoutMs, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            future.cancel(true);
            return new TestConnectionResultVO(false, "连接失败：连接超时");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new TestConnectionResultVO(false, "连接失败：连接超时");
        } catch (ExecutionException e) {
            return new TestConnectionResultVO(false, sanitizeMessage(e.getCause()));
        }
    }

    private TestConnectionResultVO probe(String driver, String url, String userName,
                                         String password, String probeSql) throws Exception {
        try (Connection connection = connectionFactory.open(url, driver, userName, password)) {
            try (Statement statement = connection.createStatement()) {
                statement.setQueryTimeout(TIMEOUT_SECONDS);
                try (ResultSet resultSet = statement.executeQuery(probeSql)) {
                    resultSet.next();
                }
            }
        }
        return new TestConnectionResultVO(true, "连接成功");
    }

    private static boolean isMySqlProtocol(String type) {
        return "MYSQL".equalsIgnoreCase(type) || "DORIS".equalsIgnoreCase(type);
    }

    /**
     * 遍历 cause 链并结合标准异常与 SQLState/驱动错误码分类；任何路径都不泄露密码、
     * 完整 JDBC URL 或内部异常文本。
     */
    private static String sanitizeMessage(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            if (t instanceof ClassNotFoundException) {
                return "连接失败：驱动不支持";
            }
            if (t instanceof UnknownHostException) {
                return "连接失败：主机无法解析";
            }
            if (t instanceof SocketTimeoutException) {
                return "连接失败：连接超时";
            }
            if (t instanceof ConnectException) {
                return "连接失败：无法连接";
            }
            if (t instanceof SQLException) {
                SQLException se = (SQLException) t;
                if (isAuthFailure(se)) {
                    return "连接失败：认证失败";
                }
                if (isConnectTimeout(se)) {
                    return "连接失败：连接超时";
                }
                if (isUnreachable(se)) {
                    return "连接失败：无法连接";
                }
            }
        }
        return "连接失败：数据库连接失败";
    }

    private static boolean isAuthFailure(SQLException e) {
        if ("28000".equals(e.getSQLState())) {
            return true;
        }
        String m = lowerMessage(e);
        return m.contains("ora-01017")
                || m.contains("access denied")
                || m.contains("invalid username or password")
                || m.contains("invalid username/password");
    }

    private static boolean isConnectTimeout(SQLException e) {
        String m = lowerMessage(e);
        if (m.contains("timeout") || m.contains("timed out")) {
            return true;
        }
        String state = e.getSQLState();
        return state != null && state.startsWith("08") && m.contains("link failure");
    }

    private static boolean isUnreachable(SQLException e) {
        String m = lowerMessage(e);
        return m.contains("connection refused")
                || m.contains("no route to host")
                || m.contains("network is unreachable")
                || m.contains("could not connect")
                || m.contains("cannot connect")
                || m.contains("unreachable");
    }

    private static String lowerMessage(SQLException e) {
        String m = e.getMessage();
        return StringUtils.hasText(m) ? m.toLowerCase() : "";
    }
}
