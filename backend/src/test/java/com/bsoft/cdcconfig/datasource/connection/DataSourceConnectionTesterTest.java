package com.bsoft.cdcconfig.datasource.connection;

import com.bsoft.cdcconfig.datasource.vo.TestConnectionResultVO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

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

    @InjectMocks
    private ConnectionTester tester;

    @Test
    void oracle_shouldBuildThinUrlAndSucceed() throws Exception {
        Connection connection = mock(Connection.class);
        Statement statement = mock(Statement.class);
        ResultSet resultSet = mock(ResultSet.class);
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);

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
    }

    @Test
    void mySql_shouldBuildJdbcUrl() throws Exception {
        Connection connection = mock(Connection.class);
        Statement statement = mock(Statement.class);
        ResultSet resultSet = mock(ResultSet.class);
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(connection);
        when(connection.createStatement()).thenReturn(statement);
        when(statement.executeQuery(anyString())).thenReturn(resultSet);

        TestConnectionResultVO result = tester.test("MYSQL", "10.1.1.2", 3306,
                "user", "pass", "mydb");

        assertTrue(result.getSuccess());
        verify(statement).executeQuery("SELECT 1");
        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(connectionFactory).open(urlCaptor.capture(), anyString(), anyString(), anyString());
        assertEquals("jdbc:mysql://10.1.1.2:3306/mydb", urlCaptor.getValue());
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

        TestConnectionResultVO result = tester.test("DORIS", "10.1.1.3", 9030,
                "user", "pass", "dorisdb");

        assertTrue(result.getSuccess());
        verify(statement).executeQuery("SELECT 1");
    }

    @Test
    void classNotFound_shouldMapToDriverUnsupported() throws Exception {
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
                .thenThrow(new ClassNotFoundException("no driver"));

        TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                "user", "pass", "service");

        assertFalse(result.getSuccess());
        assertEquals("连接失败：驱动不支持", result.getMessage());
    }

    @Test
    void unknownHost_shouldMapToHostUnresolved() throws Exception {
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
                .thenThrow(new UnknownHostException("unknown host"));

        TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                "user", "pass", "service");

        assertFalse(result.getSuccess());
        assertEquals("连接失败：主机无法解析", result.getMessage());
    }

    @Test
    void socketTimeout_shouldMapToTimeout() throws Exception {
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
                .thenThrow(new SocketTimeoutException("timeout"));

        TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                "user", "pass", "service");

        assertFalse(result.getSuccess());
        assertEquals("连接失败：连接超时", result.getMessage());
    }

    @Test
    void connectException_shouldMapToUnreachable() throws Exception {
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
                .thenThrow(new ConnectException("refused"));

        TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                "user", "pass", "service");

        assertFalse(result.getSuccess());
        assertEquals("连接失败：无法连接", result.getMessage());
    }

    @Test
    void sqlException_shouldMapToAuthFailure() throws Exception {
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
                .thenThrow(new SQLException("ORA-01017 invalid username/password"));

        TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                "user", "pass", "service");

        assertFalse(result.getSuccess());
        assertEquals("连接失败：认证失败", result.getMessage());
    }

    @Test
    void genericException_shouldMapToGenericFailure() throws Exception {
        when(connectionFactory.open(anyString(), anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("boom"));

        TestConnectionResultVO result = tester.test("ORACLE", "10.1.1.1", 1521,
                "user", "pass", "service");

        assertFalse(result.getSuccess());
        assertEquals("连接失败：数据库连接失败", result.getMessage());
    }
}
