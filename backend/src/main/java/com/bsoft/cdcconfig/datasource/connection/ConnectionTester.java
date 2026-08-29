package com.bsoft.cdcconfig.datasource.connection;

import com.bsoft.cdcconfig.datasource.vo.TestConnectionResultVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.annotation.PreDestroy;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Duration;
import java.util.Properties;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class ConnectionTester {

    /** 驱动级查询超时（秒），作为软超时辅助；总期限由 {@link #deadline} 硬性约束。 */
    static final int TIMEOUT_SECONDS = 10;

    private static final Duration DEFAULT_DEADLINE = Duration.ofSeconds(TIMEOUT_SECONDS);

    private static final int MAX_CONCURRENT_CONNECTIONS = 2;
    private static final int MAX_QUEUE_CAPACITY = 2;

    private final ConnectionFactory connectionFactory;
    private final Duration deadline;
    private final ThreadPoolExecutor executor;
    private final AtomicBoolean shuttingDown = new AtomicBoolean(false);

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
        // 明确有界：固定 2 个工作线程 + 有界队列，饱和直接拒绝（AbortPolicy）。
        // 不使用 Executors.newFixedThreadPool 的无界队列，避免两个不可中断的连接尝试
        // 耗尽线程后让后续请求无限排队。
        this.executor = new ThreadPoolExecutor(
                MAX_CONCURRENT_CONNECTIONS,
                MAX_CONCURRENT_CONNECTIONS,
                0L, TimeUnit.MILLISECONDS,
                new ArrayBlockingQueue<Runnable>(MAX_QUEUE_CAPACITY),
                daemonFactory,
                new ThreadPoolExecutor.AbortPolicy());
    }

    /** 供单元测试释放受控执行器；生产关闭路径见 {@link #shutdown()}。 */
    void close() {
        shutdownNowQuietly();
    }

    /** Spring Bean 销毁时可靠关闭执行器并等待有限时间。 */
    @PreDestroy
    public void shutdown() {
        shutdownNowQuietly();
    }

    private void shutdownNowQuietly() {
        if (!shuttingDown.compareAndSet(false, true)) {
            return;
        }
        executor.shutdownNow();
        try {
            executor.awaitTermination(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /** 仅测试可见：暴露执行器以验证有界队列与生命周期行为。 */
    ThreadPoolExecutor executor() {
        return executor;
    }

    public TestConnectionResultVO test(String type, String host, Integer port, String userName,
                                       String password, String serviceName) {
        String driver;
        String url;
        String probeSql;
        long timeoutMs = deadline.toMillis();
        if (isMySqlProtocol(type)) {
            driver = "com.mysql.cj.jdbc.Driver";
            url = "jdbc:mysql://" + host + ":" + port + "/" + serviceName;
            probeSql = "SELECT 1";
        } else {
            driver = "oracle.jdbc.OracleDriver";
            url = "jdbc:oracle:thin:@//" + host + ":" + port + "/" + serviceName;
            probeSql = "SELECT 1 FROM DUAL";
        }

        Properties connectionProperties = buildConnectionProperties(type, timeoutMs);

        String finalDriver = driver;
        String finalUrl = url;
        String finalProbeSql = probeSql;
        long submitNanos = System.nanoTime();
        Future<TestConnectionResultVO> future;
        try {
            future = executor.submit(() ->
                    probe(finalDriver, finalUrl, connectionProperties, userName, password, finalProbeSql, submitNanos));
        } catch (RejectedExecutionException e) {
            return new TestConnectionResultVO(false, "连接失败：连接繁忙");
        }
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

    /**
     * 驱动级连接/读取级超时属性，只作用于当前临时连接，不写全局 JDBC 状态。
     * Oracle：oracle.net.CONNECT_TIMEOUT / oracle.jdbc.ReadTimeout（毫秒）；
     * MySQL/Doris：connectTimeout / socketTimeout（毫秒）。
     */
    private Properties buildConnectionProperties(String type, long timeoutMs) {
        Properties properties = new Properties();
        if (isMySqlProtocol(type)) {
            properties.setProperty("connectTimeout", String.valueOf(timeoutMs));
            properties.setProperty("socketTimeout", String.valueOf(timeoutMs));
        } else {
            properties.setProperty("oracle.net.CONNECT_TIMEOUT", String.valueOf(timeoutMs));
            properties.setProperty("oracle.jdbc.ReadTimeout", String.valueOf(timeoutMs));
        }
        return properties;
    }

    private TestConnectionResultVO probe(String driver, String url, Properties connectionProperties,
                                         String userName, String password, String probeSql,
                                         long submitNanos) throws Exception {
        try (Connection connection = connectionFactory.open(url, driver, connectionProperties, userName, password)) {
            // 查询超时基于剩余期限，避免连接 + 查询串联成两段独立超时（共 20 秒）。
            long elapsedMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - submitNanos);
            long remainingMs = Math.max(0, deadline.toMillis() - elapsedMs);
            long queryTimeoutSeconds = Math.max(1, TimeUnit.MILLISECONDS.toSeconds(remainingMs));
            try (Statement statement = connection.createStatement()) {
                statement.setQueryTimeout((int) queryTimeoutSeconds);
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
