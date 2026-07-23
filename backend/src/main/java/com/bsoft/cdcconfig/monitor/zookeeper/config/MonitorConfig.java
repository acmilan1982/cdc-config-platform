package com.bsoft.cdcconfig.monitor.zookeeper.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import javax.validation.constraints.Min;

@Component
@Validated
@ConfigurationProperties(prefix = "cdc.monitor")
public class MonitorConfig {

    @Min(1)
    private long scnStaleThresholdHours = 24;

    public long getScnStaleThresholdHours() {
        return scnStaleThresholdHours;
    }

    public void setScnStaleThresholdHours(long scnStaleThresholdHours) {
        this.scnStaleThresholdHours = scnStaleThresholdHours;
    }
}
