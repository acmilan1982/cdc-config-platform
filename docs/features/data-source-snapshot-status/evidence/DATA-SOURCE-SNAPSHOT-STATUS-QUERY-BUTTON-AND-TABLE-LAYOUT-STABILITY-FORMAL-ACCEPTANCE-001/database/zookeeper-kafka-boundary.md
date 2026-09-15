# ZooKeeper / Kafka boundary (prompt §11)

## Feature dependency

The 源库快照状态 feature reads Oracle only. Its backend package
`com.bsoft.cdcconfig.monitor.datasourcerunstate` contains zero ZooKeeper / Curator / sync-client
references (grep over the package returns no match), and DESIGN.md §2.3 lists
`Kafka / ZooKeeper / TongZK / sync-client 接入` explicitly as out of scope for this feature.

```text
feature_zookeeper_dependency=NONE
feature_kafka_dependency=NONE
```

## ZooKeeper environment (read-only availability probe only)

A single read-only `ls` was issued against the CDC root to record that the environment is reachable.
No `create`, `set`, `delete`, `setAcl`, `reconfig`, `multi` or any other mutating operation was issued,
by this task or by any process it started.

```text
$ZOOKEEPER_HOME/bin/zkCli.sh -server $CDC_ZK_CONNECT ls /bsoft-cdc/clients
  -> [hosp-012]
  -> CONNECTED, session established, session closed on exit
```

The single child `hosp-012` is the same 探针端 that the acceptance used for its SHORT (1 row) scenario,
which cross-checks the Oracle and ZooKeeper views of the environment against each other.

```text
zookeeper_environment_status=AVAILABLE
formal_acceptance_task_initiated_zookeeper_node_operation_status=NONE
zookeeper_write_status=NOT_REQUESTED
```

## Kafka boundary

No Kafka client is used by the feature or started by this task. The `kafkaEnqueueTime` identifiers that
exist elsewhere in the backend belong to the unrelated log-query feature and are column mappings, not a
Kafka client connection. No broker was contacted.

```text
kafka_access_status=NONE
```
