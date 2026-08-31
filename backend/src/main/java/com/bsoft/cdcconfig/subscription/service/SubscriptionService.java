package com.bsoft.cdcconfig.subscription.service;

import com.bsoft.cdcconfig.subscription.dto.SubscriptionQuery;
import com.bsoft.cdcconfig.subscription.dto.SubscriptionSaveDTO;
import com.bsoft.cdcconfig.subscription.vo.OptionsVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionDeletePreviewVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionDetailVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionEditOpenVO;
import com.bsoft.cdcconfig.subscription.vo.SubscriptionListVO;

/**
 * 数据订阅业务服务（API.md §4）。列表过滤、候选、详情、新增、编辑、删除预览与删除。
 * 源库 Oracle 元数据访问委托 {@link SourceMetadataService}；配置库写操作使用编程式事务
 * （DESIGN §5.4：源库校验与配置库写入不在同一事务，校验通过后才进入写入事务）。
 */
public interface SubscriptionService {

    OptionsVO options();

    SubscriptionListVO list(SubscriptionQuery query);

    SubscriptionDetailVO detail(String dataSubId);

    String create(SubscriptionSaveDTO dto);

    SubscriptionEditOpenVO editOpen(String dataSubId);

    void update(String dataSubId, SubscriptionSaveDTO dto);

    SubscriptionDeletePreviewVO deletePreview(String dataSubId);

    void delete(String dataSubId);
}
