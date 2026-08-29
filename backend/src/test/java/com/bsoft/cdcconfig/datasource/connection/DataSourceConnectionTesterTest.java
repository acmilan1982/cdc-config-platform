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
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
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

    @Test
    void oracle_shouldBuildThinUrlAndSucceed() throws Exception {
        Connection connection = mock(Connection.class);
        Statement statement = mock(Statement.class);
        ResultSet resultSet = mock(ResultSet.class);
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);

        ConnectionTester tester = newTester(1000);
        try {
            TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                    "user", "pass", "service");

            assertTrue(result.getSuccess());
            assertEquals("连接成功", result.getMessage());
            verify(statement).setQueryTimeout(ConnectionTester.TIMEOUT_SECONDS);
            verify(statement).executeQuery("SELECT 1 FROM DUAL");

            ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
            ArgumentCaptor<String> driverCaptor = ArgumentCaptor.forClass(String.class);
            verify(connectionFactory).open(urlCaptor.capture(), driverCaptor.capture(), anyString(), anyString());
            assertEquals("jdbc:oracle:thin:@//10.1.1.1:1521/service", urlCaptor.getValue());
            assertEquals("oracle.jdbc.OracleDriver", driverCaptor.getValue());
        } finally {
            tester.close();
        }
    }

    @Test
    void mySql_shouldBuildJdbcUrlWithDriverTimeout() throws Exception {
        Connection connection = mock(Connection.class);
        Statement statement = mock(Statement.class);
        ResultSet resultSet = mock(ResultSet.class);
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);

        ConnectionTester tester = newTester(1000);
        try {
            TestConnectionResultVO result = tester.test("MYSQL", "10.1.1.2", 3306,
                    "user", "pass", "mydb");

            assertTrue(result.getSuccess());
            verify(statement).executeQuery("SELECT 1");
            ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
            verify(connectionFactory).open(urlCaptor.capture(), anyString(), anyString(), anyString());
            assertEquals("jdbc:mysql://10.1.1.2:3306/mydb?connectTimeout=1000&socketTimeout=1000",
                    urlCaptor.getValue());
        } finally {
            tester.close();
        }
    }

    @Test
    void doris_shouldUseMySqlProtocol() throws Exception {
        Connection connection = mock(Connection.class);
        Statement statement = mock(Statement.class);
        ResultSet resultSet = mock(ResultSet.class);
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);

        ConnectionTester tester = newTester(1000);
        try {
            TestConnectionResultVO result = tester.test("DORIS", "10.1.1.3", 9030,
                    "user", "pass", "dorisdb");

            assertTrue(result.getSuccess());
            verify(statement).executeQuery("SELECT 1");
        } finally {
            tester.close();
        }
    }

    @Test
    void totalDeadline_shouldTimeoutWhenConnectBlocks() throws Exception {
        CountDownLatch entered = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString())).thenAnswer(inv -> {
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
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
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
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
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
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
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
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
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
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
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
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
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
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
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
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
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
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
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
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
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
        Connection connection = mock(Connection.class);
        Statement statement = mock(Statement.class);
        ResultSet resultSet = mock(ResultSet.class);
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);

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
