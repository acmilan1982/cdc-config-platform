package com.bsoft.cdcconfig.monitor.jobfailure.runtime;

import com.bsoft.cdcconfig.common.exception.BusinessException;
import com.bsoft.cdcconfig.monitor.jobfailure.exception.JobFailureErrorCode;
import com.bsoft.cdcconfig.monitor.zookeeper.client.ZooKeeperReadOnlyClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JobRuntimeStatusReaderTest {

    @Mock
    private ZooKeeperReadOnlyClient zkClient;

    private JobRuntimeStatusReader reader;

    @BeforeEach
    void setUp() {
        reader = new JobRuntimeStatusReader(zkClient);
        when(zkClient.getClientsPath()).thenReturn("/bsoft-cdc/clients");
    }

    private Map<String, List<String>> clientJobs(String clientId, String... jobIds) {
        Map<String, List<String>> map = new LinkedHashMap<>();
        map.put(clientId, Arrays.asList(jobIds));
        return map;
    }

    @Test
    void snapshot_shouldReadClientAndJobAlivePaths() throws Exception {
        when(zkClient.isConnected()).thenReturn(true);
        when(zkClient.nodeExists("/bsoft-cdc/clients/c1/alive")).thenReturn(true);
        when(zkClient.nodeExists("/bsoft-cdc/clients/c1/jobs/ds-a/alive")).thenReturn(true);
        when(zkClient.nodeExists("/bsoft-cdc/clients/c1/jobs/ds-b/alive")).thenReturn(false);

        JobRuntimeSnapshot snap = reader.snapshot(clientJobs("c1", "ds-a", "ds-b"));

        assertTrue(snap.clientOnline("c1"));
        assertTrue(snap.jobOnline("c1", "ds-a"));
        assertFalse(snap.jobOnline("c1", "ds-b"));
        verify(zkClient).nodeExists("/bsoft-cdc/clients/c1/alive");
        verify(zkClient).nodeExists("/bsoft-cdc/clients/c1/jobs/ds-a/alive");
        verify(zkClient).nodeExists("/bsoft-cdc/clients/c1/jobs/ds-b/alive");
    }

    @Test
    void snapshot_shouldShortCircuitJobsWhenClientOffline() throws Exception {
        when(zkClient.isConnected()).thenReturn(true);
        when(zkClient.nodeExists("/bsoft-cdc/clients/c1/alive")).thenReturn(false);

        JobRuntimeSnapshot snap = reader.snapshot(clientJobs("c1", "ds-a", "ds-b"));

        assertFalse(snap.clientOnline("c1"));
        assertFalse(snap.jobOnline("c1", "ds-a"));
        assertFalse(snap.jobOnline("c1", "ds-b"));
        verify(zkClient).nodeExists("/bsoft-cdc/clients/c1/alive");
        verify(zkClient, never()).nodeExists("/bsoft-cdc/clients/c1/jobs/ds-a/alive");
        verify(zkClient, never()).nodeExists("/bsoft-cdc/clients/c1/jobs/ds-b/alive");
    }

    @Test
    void snapshot_shouldMarkOnlineAndOfflineJobsIndependently() throws Exception {
        when(zkClient.isConnected()).thenReturn(true);
        when(zkClient.nodeExists("/bsoft-cdc/clients/c1/alive")).thenReturn(true);
        when(zkClient.nodeExists("/bsoft-cdc/clients/c1/jobs/on/alive")).thenReturn(true);
        when(zkClient.nodeExists("/bsoft-cdc/clients/c1/jobs/off/alive")).thenReturn(false);

        JobRuntimeSnapshot snap = reader.snapshot(clientJobs("c1", "on", "off"));

        assertTrue(snap.clientOnline("c1"));
        assertTrue(snap.jobOnline("c1", "on"));
        assertFalse(snap.jobOnline("c1", "off"));
    }

    @Test
    void snapshot_shouldFailWhenNotConnected() {
        when(zkClient.isConnected()).thenReturn(false);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> reader.snapshot(clientJobs("c1", "ds-a")));

        assertEquals(JobFailureErrorCode.ZK_STATUS_UNAVAILABLE, ex.getCode());
        assertEquals("ZooKeeper 连接失败，将在 60 秒重试", ex.getMessage());
    }

    @Test
    void snapshot_shouldFailWhenClientAliveReadThrows() throws Exception {
        when(zkClient.isConnected()).thenReturn(true);
        when(zkClient.nodeExists("/bsoft-cdc/clients/c1/alive"))
                .thenThrow(new RuntimeException("boom"));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> reader.snapshot(clientJobs("c1", "ds-a")));

        assertEquals(JobFailureErrorCode.ZK_STATUS_UNAVAILABLE, ex.getCode());
        assertEquals("ZooKeeper 连接失败，将在 60 秒重试", ex.getMessage());
    }

    @Test
    void snapshot_shouldFailWhenJobAliveReadThrows() throws Exception {
        when(zkClient.isConnected()).thenReturn(true);
        when(zkClient.nodeExists("/bsoft-cdc/clients/c1/alive")).thenReturn(true);
        when(zkClient.nodeExists("/bsoft-cdc/clients/c1/jobs/ds-a/alive"))
                .thenThrow(new RuntimeException("boom"));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> reader.snapshot(clientJobs("c1", "ds-a")));

        assertEquals(JobFailureErrorCode.ZK_STATUS_UNAVAILABLE, ex.getCode());
    }

    @Test
    void snapshot_shouldNeverCallIsAlive() throws Exception {
        when(zkClient.isConnected()).thenReturn(true);
        when(zkClient.nodeExists(anyString())).thenReturn(true);

        reader.snapshot(clientJobs("c1", "ds-a"));

        verify(zkClient, never()).isAlive(anyString());
    }
}
