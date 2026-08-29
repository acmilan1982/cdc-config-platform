package com.bsoft.cdcconfig.datasource.connection;

import java.sql.Connection;

public interface ConnectionFactory {

    Connection open(String url, String driver, String userName, String password) throws Exception;
}
