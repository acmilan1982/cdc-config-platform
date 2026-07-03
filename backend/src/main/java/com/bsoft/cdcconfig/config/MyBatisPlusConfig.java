package com.bsoft.cdcconfig.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.bsoft.cdcconfig.**.mapper")
public class MyBatisPlusConfig {
}
