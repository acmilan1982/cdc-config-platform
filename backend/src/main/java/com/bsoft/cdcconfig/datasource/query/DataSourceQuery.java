package com.bsoft.cdcconfig.datasource.query;

import javax.validation.constraints.Pattern;

public class DataSourceQuery {

    private String id;
    private String name;
    private String host;

    @Pattern(regexp = "SOURCE|TARGET", message = "角色仅支持 SOURCE 或 TARGET")
    private String category;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }

    public String getCategory() { return category; }

    /** null 或 trim 后空串统一为 null（“全部”）；非空值为 trim 后原值，不自动转大写。 */
    public void setCategory(String category) {
        if (category == null) {
            this.category = null;
            return;
        }
        String trimmed = category.trim();
        this.category = trimmed.isEmpty() ? null : trimmed;
    }
}
