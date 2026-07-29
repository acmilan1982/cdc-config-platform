package com.bsoft.cdcconfig.monitor.jobfailure.vo;

import java.util.List;

public class AnomalyVO {

    private String type;
    private String typeLabel;
    private String description;
    private List<Long> involvedEventIds;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTypeLabel() { return typeLabel; }
    public void setTypeLabel(String typeLabel) { this.typeLabel = typeLabel; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<Long> getInvolvedEventIds() { return involvedEventIds; }
    public void setInvolvedEventIds(List<Long> involvedEventIds) { this.involvedEventIds = involvedEventIds; }
}
