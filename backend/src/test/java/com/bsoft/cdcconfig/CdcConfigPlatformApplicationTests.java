package com.bsoft.cdcconfig;

import com.bsoft.cdcconfig.health.HealthController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CdcConfigPlatformApplicationTests {

    @Autowired
    private ApplicationContext context;

    @Autowired
    private HealthController healthController;

    @Test
    void contextLoads() {
        assertNotNull(context);
    }

    @Test
    void healthControllerBeanExists() {
        assertNotNull(healthController);
    }
}
