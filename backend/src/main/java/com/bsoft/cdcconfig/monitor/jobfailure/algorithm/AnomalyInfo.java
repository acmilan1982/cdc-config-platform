package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import com.bsoft.cdcconfig.monitor.jobfailure.enums.AnomalyType;

import java.util.ArrayList;
import java.util.List;

/**
 * Describes one detected anomaly in a fault process.
 */
public class AnomalyInfo {

    private AnomalyType type;
    private List<Long> involvedEventIds = new ArrayList<>();
    private String description;

    public AnomalyInfo() {}

    public AnomalyInfo(AnomalyType type, String description) {
        this.type = type;
        this.description = description;
    }

    public AnomalyType getType() { return type; }
    public void setType(AnomalyType type) { this.type = type; }

    public List<Long> getInvolvedEventIds() { return involvedEventIds; }
    public void setInvolvedEventIds(List<Long> involvedEventIds) { this.involvedEventIds = involvedEventIds; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
