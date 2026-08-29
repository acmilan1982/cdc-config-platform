package com.bsoft.cdcconfig.datasource.connection;

import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DriverManager;
import java.util.Properties;

@Component
public class JdbcConnectionFactory implements ConnectionFactory {

    @Override
    public Connection open(String url, String driver, Properties connectionProperties, String userName, String password) throws Exception {
        Class.forName(driver);
        Properties info = new Properties();
        if (connectionProperties != null) {
            info.putAll(connectionProperties);
        }
        info.setProperty("user", userName);
        info.setProperty("password", password);
        return DriverManager.getConnection(url, info);
    }
}
