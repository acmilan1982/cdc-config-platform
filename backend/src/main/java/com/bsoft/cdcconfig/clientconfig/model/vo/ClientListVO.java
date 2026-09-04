package com.bsoft.cdcconfig.clientconfig.model.vo;

import java.util.ArrayList;
import java.util.List;

/** E1 列表响应 data：ClientListVO { items: ClientListItemVO[] }（CCFG-API-005）。 */
public class ClientListVO {

    private List<ClientListItemVO> items = new ArrayList<>();

    public List<ClientListItemVO> getItems() {
        return items;
    }

    public void setItems(List<ClientListItemVO> items) {
        this.items = items;
    }
}
