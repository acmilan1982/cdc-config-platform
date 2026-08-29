package com.bsoft.cdcconfig.datasource.connection;

import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DriverManager;

@Component
public class JdbcConnectionFactory implements ConnectionFactory {

    @Override
    public Connection open(String url, String driver, String userName, String password) throws Exception {
        DriverManager.setLoginTimeout(ConnectionTester.TIMEOUT_SECONDS);
        Class.forName(driver);
        return DriverManager.getConnection(url, userName, password);
    }
}
