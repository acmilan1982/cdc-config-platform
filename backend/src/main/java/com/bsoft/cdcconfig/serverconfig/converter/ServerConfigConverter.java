package com.bsoft.cdcconfig.serverconfig.converter;

import com.bsoft.cdcconfig.serverconfig.entity.CdcServerConfig;
import com.bsoft.cdcconfig.serverconfig.enums.ServerConfigEditableKey;
import com.bsoft.cdcconfig.serverconfig.vo.ServerConfigItemVO;

/**
 * Entity → VO 映射（同 DataSourceConverter 风格，不含业务校验）。
 */
public final class ServerConfigConverter {

    private ServerConfigConverter() {
    }

    public static ServerConfigItemVO toItemVO(CdcServerConfig record) {
        if (record == null) {
            return null;
        }
        ServerConfigItemVO vo = new ServerConfigItemVO();
        vo.setIdServerConfig(record.getIdServerConfig());
        vo.setConfigKey(record.getConfigKey());
        vo.setConfigDesc(record.getConfigDesc());
        vo.setConfigValue(record.getConfigValue());
        vo.setEditable(isEditable(record));
        return vo;
    }

    /**
     * 可编辑双重判定（SC-EDIT-01）：IS_EDITABLE 规范值精确为 '1' 且 CONFIG_KEY ∈ 白名单。
     */
    public static boolean isEditable(CdcServerConfig record) {
        if (record == null) {
            return false;
        }
        String isEditable = record.getIsEditable();
        boolean flagOne = isEditable != null && "1".equals(isEditable.trim());
        boolean keyInWhitelist = ServerConfigEditableKey.fromValue(record.getConfigKey()) != null;
        return flagOne && keyInWhitelist;
    }
}
