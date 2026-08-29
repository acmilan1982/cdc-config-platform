package com.bsoft.cdcconfig.datasource.connection;

import com.bsoft.cdcconfig.datasource.vo.TestConnectionResultVO;
import org.springframework.stereotype.Component;

import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

@Component
public class ConnectionTester {

    static final int TIMEOUT_SECONDS = 10;

    private final ConnectionFactory connectionFactory;

    public ConnectionTester(ConnectionFactory connectionFactory) {
        this.connectionFactory = connectionFactory;
    }

    public TestConnectionResultVO test(String type, String host, Integer port, String userName,
                                       String password, String serviceName) {
        String driver;
        String url;
        String probeSql;
        if (isMySqlProtocol(type)) {
            driver = "com.mysql.cj.jdbc.Driver";
            url = "jdbc:mysql://" + host + ":" + port + "/" + serviceName;
            probeSql = "SELECT 1";
        } else {
            driver = "oracle.jdbc.OracleDriver";
            url = "jdbc:oracle:thin:@//" + host + ":" + port + "/" + serviceName;
            probeSql = "SELECT 1 FROM DUAL";
        }

        try (Connection connection = connectionFactory.open(url, driver, userName, password)) {
            try (Statement statement = connection.createStatement()) {
                statement.setQueryTimeout(TIMEOUT_SECONDS);
                try (ResultSet resultSet = statement.executeQuery(probeSql)) {
                    resultSet.next();
                }
            }
            return new TestConnectionResultVO(true, "连接成功");
        } catch (Exception e) {
            return new TestConnectionResultVO(false, sanitizeMessage(e));
        }
    }

    private static boolean isMySqlProtocol(String type) {
        return "MYSQL".equalsIgnoreCase(type) || "DORIS".equalsIgnoreCase(type);
    }

    private static String sanitizeMessage(Exception e) {
        if (e instanceof ClassNotFoundException) {
            return "连接失败：驱动不支持";
        }
        if (e instanceof UnknownHostException) {
            return "连接失败：主机无法解析";
        }
        if (e instanceof SocketTimeoutException) {
            return "连接失败：连接超时";
        }
        if (e instanceof ConnectException) {
            return "连接失败：无法连接";
        }
        if (e instanceof SQLException) {
            return "连接失败：认证失败";
        }
        return "连接失败：数据库连接失败";
    }
}
