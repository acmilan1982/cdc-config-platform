package com.bsoft.cdcconfig.serverconfig.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.serverconfig.converter.ServerConfigConverter;
import com.bsoft.cdcconfig.serverconfig.dto.ServerConfigSaveItem;
import com.bsoft.cdcconfig.serverconfig.dto.ServerConfigSaveRequest;
import com.bsoft.cdcconfig.serverconfig.entity.CdcServer;
import com.bsoft.cdcconfig.serverconfig.entity.CdcServerConfig;
import com.bsoft.cdcconfig.serverconfig.enums.ServerConfigEditableKey;
import com.bsoft.cdcconfig.serverconfig.exception.ServerConfigErrorCode;
import com.bsoft.cdcconfig.serverconfig.mapper.CdcServerConfigMapper;
import com.bsoft.cdcconfig.serverconfig.mapper.CdcServerMapper;
import com.bsoft.cdcconfig.serverconfig.service.ServerConfigService;
import com.bsoft.cdcconfig.serverconfig.validator.ServerConfigValueValidator;
import com.bsoft.cdcconfig.serverconfig.vo.ServerConfigItemVO;
import com.bsoft.cdcconfig.serverconfig.vo.ServerConfigPageVO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * 中心端配置服务实现（SC-DESIGN-022）。
 * 查询为单次只读；批量保存在一个事务内完成唯一中心端识别、逐条重查、校验与逐条更新。
 */
@Service
public class ServerConfigServiceImpl implements ServerConfigService {

    private static final Logger log = LoggerFactory.getLogger(ServerConfigServiceImpl.class);

    private static final String ORDER_BY_SQL =
            "ORDER BY CONFIG_KEY ASC NULLS LAST, ID_SERVER_CONFIG ASC";

    private final CdcServerMapper cdcServerMapper;
    private final CdcServerConfigMapper cdcServerConfigMapper;

    public ServerConfigServiceImpl(CdcServerMapper cdcServerMapper,
                                   CdcServerConfigMapper cdcServerConfigMapper) {
        this.cdcServerMapper = cdcServerMapper;
        this.cdcServerConfigMapper = cdcServerConfigMapper;
    }

    @Override
    public ServerConfigPageVO getPage() {
        String serverId = resolveUniqueServerId();
        List<CdcServerConfig> configs = cdcServerConfigMapper.selectList(
                new LambdaQueryWrapper<CdcServerConfig>()
                        .eq(CdcServerConfig::getServerId, serverId)
                        .last(ORDER_BY_SQL));

        List<ServerConfigItemVO> items = new ArrayList<>(configs.size());
        for (CdcServerConfig config : configs) {
            items.add(ServerConfigConverter.toItemVO(config));
        }

        ServerConfigPageVO vo = new ServerConfigPageVO();
        vo.setServerId(serverId);
        vo.setConfigCount(items.size());
        vo.setItems(items);
        return vo;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void save(ServerConfigSaveRequest request) {
        try {
            String serverId = resolveUniqueServerId();
            for (ServerConfigSaveItem item : request.getItems()) {
                CdcServerConfig record = cdcServerConfigMapper.selectById(item.getIdServerConfig());
                if (record == null) {
                    throw ServerConfigErrorCode.configRecordNotFound();
                }
                if (!Objects.equals(serverId, record.getServerId())) {
                    throw ServerConfigErrorCode.serverBelongingMismatch();
                }
                if (record.getIsEditable() == null || !"1".equals(record.getIsEditable().trim())) {
                    throw ServerConfigErrorCode.configNotEditable();
                }
                if (ServerConfigEditableKey.fromValue(record.getConfigKey()) == null) {
                    throw ServerConfigErrorCode.configKeyNotSupported();
                }
                String canonical = ServerConfigValueValidator.validateAndNormalize(
                        record.getConfigKey(), item.getConfigValue());

                int rows = cdcServerConfigMapper.update(null, new LambdaUpdateWrapper<CdcServerConfig>()
                        .eq(CdcServerConfig::getIdServerConfig, item.getIdServerConfig())
                        .set(CdcServerConfig::getConfigValue, canonical));
                if (rows != 1) {
                    log.warn("中心端配置更新影响行数异常，id={}", item.getIdServerConfig());
                    throw ServerConfigErrorCode.saveFailed();
                }
            }
            log.info("中心端配置批量保存成功，影响 {} 条记录", request.getItems().size());
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("中心端配置批量保存失败，整批回滚", e);
            throw ServerConfigErrorCode.saveFailed();
        }
    }

    /**
     * 识别唯一中心端（SC-DB-030）：0 条 → 40210；>1 条 → 40211；恰 1 条取 SERVER_ID。
     */
    private String resolveUniqueServerId() {
        List<CdcServer> servers = cdcServerMapper.selectList(
                new LambdaQueryWrapper<CdcServer>().orderByAsc(CdcServer::getServerId));
        if (servers.isEmpty()) {
            throw ServerConfigErrorCode.serverNotRegistered();
        }
        if (servers.size() > 1) {
            throw ServerConfigErrorCode.serverMultipleFound();
        }
        return servers.get(0).getServerId();
    }
}
