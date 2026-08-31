package com.bsoft.cdcconfig.subscription.vo;

import java.util.List;

/**
 * 源库/目标库启用候选一次返回（API.md §4.1）。
 */
public class OptionsVO {

    private List<SourceOptionVO> sources;
    private List<SubscriptionTargetOptionVO> targets;

    public List<SourceOptionVO> getSources() { return sources; }
    public void setSources(List<SourceOptionVO> sources) { this.sources = sources; }

    public List<SubscriptionTargetOptionVO> getTargets() { return targets; }
    public void setTargets(List<SubscriptionTargetOptionVO> targets) { this.targets = targets; }
}
