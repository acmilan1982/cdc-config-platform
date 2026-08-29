package com.bsoft.cdcconfig.datasource.connection;

import com.bsoft.cdcconfig.datasource.vo.TestConnectionResultVO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Duration;
import java.util.Properties;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataSourceConnectionTesterTest {

    @Mock
    private ConnectionFactory connectionFactory;

    /** 每个测试独立构造，避免受控执行器跨测试共享。 */
    private ConnectionTester newTester(long deadlineMs) {
        return new ConnectionTester(connectionFactory, Duration.ofMillis(deadlineMs));
    }

    /** 建立成功探活路径所需的 connection/statement/resultSet mock，返回 statement 供验证。 */
    private Statement mockConnection() throws Exception {
        Connection connection = mock(Connection.class);
        Statement statement = mock(Statement.class);
        ResultSet resultSet = mock(ResultSet.class);
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);
        return statement;
    }

    @Test
    void oracle_shouldBuildThinUrlAndSucceed() throws Exception {
        Statement statement = mockConnection();

        ConnectionTester tester = newTester(1000);
        try {
            TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                    "user", "pass", "service");

            assertTrue(result.getSuccess());
            assertEquals("连接成功", result.getMessage());
            verify(statement).executeQuery("SELECT 1 FROM DUAL");

            ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
            ArgumentCaptor<String> driverCaptor = ArgumentCaptor.forClass(String.class);
            verify(connectionFactory).open(urlCaptor.capture(), driverCaptor.capture(),
                    any(Properties.class), anyString(), anyString());
            assertEquals("jdbc:oracle:thin:@//10.1.1.1:1521/service", urlCaptor.getValue());
            assertEquals("oracle.jdbc.OracleDriver", driverCaptor.getValue());
        } finally {
            tester.close();
        }
    }

    @Test
    void oracle_queryTimeout_shouldRespectRemainingDeadlineNotFullSeconds() throws Exception {
        Connection connection = mock(Connection.class);
        Statement statement = mock(Statement.class);
        ResultSet resultSet = mock(ResultSet.class);
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);

        ConnectionTester tester = newTester(1000);
        try {
            tester.test("ORACLE", "10.1.1.1", 1521, "user", "pass", "service");

            ArgumentCaptor<Integer> timeoutCaptor = ArgumentCaptor.forClass(Integer.class);
            verify(statement).setQueryTimeout(timeoutCaptor.capture());
            int queryTimeout = timeoutCaptor.getValue();
            assertTrue(queryTimeout >= 1 && queryTimeout < ConnectionTester.TIMEOUT_SECONDS,
                    "query timeout must be based on remaining deadline (1s), got " + queryTimeout
                            + " instead of a full " + ConnectionTester.TIMEOUT_SECONDS + "s");
        } finally {
            tester.close();
        }
    }

    @Test
    void mySql_shouldBuildCleanUrlAndPassDriverTimeoutProperties() throws Exception {
        Statement statement = mockConnection();

        ConnectionTester tester = newTester(1000);
        try {
            TestConnectionResultVO result = tester.test("MYSQL", "10.1.1.2", 3306,
                    "user", "pass", "mydb");

            assertTrue(result.getSuccess());
            verify(statement).executeQuery("SELECT 1");
            ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
            ArgumentCaptor<Properties> propsCaptor = ArgumentCaptor.forClass(Properties.class);
            verify(connectionFactory).open(urlCaptor.capture(), anyString(), propsCaptor.capture(),
                    anyString(), anyString());
            assertEquals("jdbc:mysql://10.1.1.2:3306/mydb", urlCaptor.getValue());
            assertEquals("1000", propsCaptor.getValue().getProperty("connectTimeout"));
            assertEquals("1000", propsCaptor.getValue().getProperty("socketTimeout"));
        } finally {
            tester.close();
        }
    }

    @Test
    void doris_shouldUseMySqlProtocol() throws Exception {
        Statement statement = mockConnection();

        ConnectionTester tester = newTester(1000);
        try {
            TestConnectionResultVO result = tester.test("DORIS", "10.1.1.3", 9030,
                    "user", "pass", "dorisdb");

            assertTrue(result.getSuccess());
            verify(statement).executeQuery("SELECT 1");
            ArgumentCaptor<Properties> propsCaptor = ArgumentCaptor.forClass(Properties.class);
            verify(connectionFactory).open(anyString(), anyString(), propsCaptor.capture(),
                    anyString(), anyString());
            assertEquals("1000", propsCaptor.getValue().getProperty("connectTimeout"));
            assertEquals("1000", propsCaptor.getValue().getProperty("socketTimeout"));
        } finally {
            tester.close();
        }
    }

    @Test
    void oracle_shouldPassDriverTimeoutPropertiesToCurrentConnection() throws Exception {
        mockConnection();

        ConnectionTester tester = newTester(3000);
        try {
            tester.test("ORACLE", "10.1.1.1", 1521, "user", "pass", "service");

            ArgumentCaptor<Properties> propsCaptor = ArgumentCaptor.forClass(Properties.class);
            verify(connectionFactory).open(anyString(), anyString(), propsCaptor.capture(),
                    anyString(), anyString());
            Properties props = propsCaptor.getValue();
            assertEquals("3000", props.getProperty("oracle.net.CONNECT_TIMEOUT"));
            assertEquals("3000", props.getProperty("oracle.jdbc.ReadTimeout"));
            assertNull(props.getProperty("user"), "driver properties must not carry credentials");
            assertNull(props.getProperty("password"), "driver properties must not carry credentials");
        } finally {
            tester.close();
        }
    }

    @Test
    void executor_shouldBeExplicitlyBounded() {
        ConnectionTester tester = newTester(1000);
        try {
            ThreadPoolExecutor executor = tester.executor();
            BlockingQueue<Runnable> queue = executor.getQueue();
            assertEquals(2, executor.getCorePoolSize());
            assertEquals(2, executor.getMaximumPoolSize());
            assertTrue(queue instanceof ArrayBlockingQueue, "executor queue must be explicitly bounded");
            assertEquals(2, queue.remainingCapacity(), "bounded queue capacity");
        } finally {
            tester.close();
        }
    }

    @Test
    void saturation_shouldFastFailWhenWorkersBusyAndQueueFull() throws Exception {
        CountDownLatch workerBlock = new CountDownLatch(1);
        Runnable block = () -> {
            try {
                workerBlock.await();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        };

        ConnectionTester tester = newTester(500);
        try {
            // 占满 2 个工作线程（阻塞且不响应中断）
            tester.executor().execute(block);
            tester.executor().execute(block);
            // 填满有界队列（容量 2）
            tester.executor().execute(() -> { });
            tester.executor().execute(() -> { });

            long start = System.nanoTime();
            TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                    "user", "pass", "service");
            long elapsedMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);

            assertFalse(result.getSuccess());
            assertEquals("连接失败：连接繁忙", result.getMessage());
            assertTrue(elapsedMs < 500, "saturated request must fast-fail, took " + elapsedMs + "ms");
            // 无界排队场景下该请求会进入队列等待；此处证明队列有界且饱和直接拒绝。
        } finally {
            workerBlock.countDown();
            tester.close();
        }
    }

    @Test
    void shutdown_shouldStopAcceptingNewTasks() throws Exception {
        ConnectionTester tester = newTester(1000);
        tester.shutdown();
        try {
            assertTrue(tester.executor().isShutdown());

            TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                    "user", "pass", "service");
            assertFalse(result.getSuccess());
            assertTrue(result.getMessage().startsWith("连接失败："), result.getMessage());
            verify(connectionFactory, never())
                    .open(anyString(), anyString(), any(Properties.class), anyString(), anyString());
        } finally {
            tester.close();
        }
    }

    @Test
    void close_shouldShutdownExecutor() {
        ConnectionTester tester = newTester(1000);
        tester.close();
        assertTrue(tester.executor().isShutdown());
    }

    @Test
    void totalDeadline_shouldTimeoutWhenConnectBlocks() throws Exception {
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenAnswer(inv -> {
                    entered.countDown();
                    release.await(5, TimeUnit.SECONDS);
                    return mock(Connection.class);
                });

        ConnectionTester tester = newTester(200);
        try {
            long start = System.nanoTime();
            TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                    "user", "pass", "service");
            long elapsedMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start);

            assertTrue(entered.await(1, TimeUnit.SECONDS), "connection attempt should have started");
            assertFalse(result.getSuccess());
            assertEquals("连接失败：连接超时", result.getMessage());
            assertTrue(elapsedMs < 2000, "total deadline should fire quickly, took " + elapsedMs + "ms");
        } finally {
            release.countDown();
            tester.close();
        }
    }

    @Test
    void classNotFound_shouldMapToDriverUnsupported() throws Exception {
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenThrow(new ClassNotFoundException("no driver"));

        ConnectionTester tester = newTester(1000);
        try {
            TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                    "user", "pass", "service");

            assertFalse(result.getSuccess());
            assertEquals("连接失败：驱动不支持", result.getMessage());
        } finally {
            tester.close();
        }
    }

    @Test
    void unknownHost_shouldMapToHostUnresolved() throws Exception {
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenThrow(new UnknownHostException("unknown host"));

        ConnectionTester tester = newTester(1000);
        try {
            TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                    "user", "pass", "service");

            assertFalse(result.getSuccess());
            assertEquals("连接失败：主机无法解析", result.getMessage());
        } finally {
            tester.close();
        }
    }

    @Test
    void socketTimeout_shouldMapToTimeout() throws Exception {
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenThrow(new SocketTimeoutException("timeout"));

        ConnectionTester tester = newTester(1000);
        try {
            TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                    "user", "pass", "service");

            assertFalse(result.getSuccess());
            assertEquals("连接失败：连接超时", result.getMessage());
        } finally {
            tester.close();
        }
    }

    @Test
    void connectException_shouldMapToUnreachable() throws Exception {
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenThrow(new ConnectException("refused"));

        ConnectionTester tester = newTester(1000);
        try {
            TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                    "user", "pass", "service");

            assertFalse(result.getSuccess());
            assertEquals("连接失败：无法连接", result.getMessage());
        } finally {
            tester.close();
        }
    }

    @Test
    void sqlException_shouldMapToAuthFailure() throws Exception {
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenThrow(new SQLException("ORA-01017 invalid username/password"));

        ConnectionTester tester = newTester(1000);
        try {
            TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                    "user", "pass", "service");

            assertFalse(result.getSuccess());
            assertEquals("连接失败：认证失败", result.getMessage());
        } finally {
            tester.close();
        }
    }

    @Test
    void wrappedSqlException_shouldTraverseCauseChain() throws Exception {
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenThrow(new RuntimeException("outer",
                        new SQLException("ORA-01017 invalid username/password")));

        ConnectionTester tester = newTester(1000);
        try {
            TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                    "user", "pass", "service");

            assertFalse(result.getSuccess());
            assertEquals("连接失败：认证失败", result.getMessage());
        } finally {
            tester.close();
        }
    }

    @Test
    void wrappedConnectException_shouldMapToUnreachable() throws Exception {
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenThrow(new RuntimeException("outer", new ConnectException("connection refused")));

        ConnectionTester tester = newTester(1000);
        try {
            TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                    "user", "pass", "service");

            assertFalse(result.getSuccess());
            assertEquals("连接失败：无法连接", result.getMessage());
        } finally {
            tester.close();
        }
    }

    @Test
    void genericSqlException_shouldMapToGenericFailure() throws Exception {
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenThrow(new SQLException("ORA-00000 unknown error"));

        ConnectionTester tester = newTester(1000);
        try {
            TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                    "user", "pass", "service");

            assertFalse(result.getSuccess());
            assertEquals("连接失败：数据库连接失败", result.getMessage());
        } finally {
            tester.close();
        }
    }

    @Test
    void genericException_shouldMapToGenericFailure() throws Exception {
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenThrow(new RuntimeException("boom"));

        ConnectionTester tester = newTester(1000);
        try {
            TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                    "user", "pass", "service");

            assertFalse(result.getSuccess());
            assertEquals("连接失败：数据库连接失败", result.getMessage());
        } finally {
            tester.close();
        }
    }

    @Test
    void sqlExceptionInQuery_shouldCloseResources() throws Exception {
        Connection connection = mock(Connection.class);
        Statement statement = mock(Statement.class);
        when(connectionFactory.open(anyString(), anyString(), any(Properties.class), anyString(), anyString()))
                .thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString()))
                .thenThrow(new SQLException("ORA-01017 invalid username/password"));

        ConnectionTester tester = newTester(1000);
        try {
            TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                    "user", "pass", "service");

            assertFalse(result.getSuccess());
            assertEquals("连接失败：认证失败", result.getMessage());
            verify(statement).close();
            verify(connection).close();
        } finally {
            tester.close();
        }
    }

    @Test
    void connectionTester_shouldNotModifyGlobalLoginTimeout() throws Exception {
        mockConnection();

        int before = DriverManager.getLoginTimeout();
        ConnectionTester tester = newTester(1000);
        try {
            tester.test("ORACLE", "10.1.1.1", 1521, "user", "pass", "service");
            assertEquals(before, DriverManager.getLoginTimeout(),
                    "connection tester must not mutate the JVM-wide DriverManager login timeout");
        } finally {
            tester.close();
        }
    }

}
