package com.bsoft.cdcconfig.monitor.jobfailure.algorithm;

import java.time.LocalDateTime;

/**
 * Test data factory for algorithm unit tests.
 * All times are deterministic and reflect realistic fault process scenarios.
 */
final class TestDataFactory {

    private TestDataFactory() {}

    static final LocalDateTime T0 = LocalDateTime.of(2026, 7, 27, 19, 17, 24);
    static final LocalDateTime T1 = LocalDateTime.of(2026, 7, 27, 19, 17, 43);
    static final LocalDateTime T2 = LocalDateTime.of(2026, 7, 27, 19, 18, 43);
    static final LocalDateTime T3 = LocalDateTime.of(2026, 7, 27, 19, 18, 44);
    static final LocalDateTime T4 = LocalDateTime.of(2026, 7, 27, 19, 23, 44);

    static final String JOB_A = "aaaaaaaa0000bbbbbbbb1111cccccccc2222";
    static final String JOB_B = "bbbbbbbb2222cccccccc3333dddddddd4444";
    static final String JOB_C = "cccccccc4444dddddddd5555eeeeeeee6666";
    static final String JOB_D = "dddddddd6666eeeeeeee7777ffffffff8888";
    static final String JOB_X = "xxxxxxxx9999yyyyyyyy0000zzzzzzzz1111";

    static FaultEventModel event(Long id, String failedJobId, LocalDateTime failureTime, String eventResult) {
        FaultEventModel e = new FaultEventModel();
        e.setId(id);
        e.setClientId("test-client");
        e.setDataSourceId("test-ds");
        e.setFailedJobId(failedJobId);
        e.setFailureTime(failureTime);
        e.setEventResult(eventResult);
        e.setCreatedAt(failureTime.plusMinutes(1));
        return e;
    }

    static FaultLogModel log(Long id, Long failureEventId, String handleStage,
                             LocalDateTime handleTime, String newJobId) {
        FaultLogModel l = new FaultLogModel();
        l.setId(id);
        l.setFailureEventId(failureEventId);
        l.setHandleStage(handleStage);
        l.setHandleTime(handleTime);
        l.setNewJobId(newJobId);
        return l;
    }

    static FaultLogModel logWithAttempt(Long id, Long failureEventId, String handleStage,
                                        LocalDateTime handleTime, String newJobId, int attemptNo) {
        FaultLogModel l = log(id, failureEventId, handleStage, handleTime, newJobId);
        l.setAttemptNo(attemptNo);
        return l;
    }
}
