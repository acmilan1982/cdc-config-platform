package com.bsoft.cdcconfig.datasource.connection;

import java.sql.Connection;
import java.util.Properties;

public interface ConnectionFactory {

    /**
     * 打开一次性临时连接。{@code connectionProperties} 为驱动级每连接属性
     * （如 Oracle 的 oracle.net.CONNECT_TIMEOUT / oracle.jdbc.ReadTimeout，
     * MySQL/Doris 的 connectTimeout / socketTimeout），只作用于当前临时连接，
     * 不写全局 JDBC 状态、不写应用连接池。
     */
    Connection open(String url, String driver, Properties connectionProperties, String userName, String password) throws Exception;
}
