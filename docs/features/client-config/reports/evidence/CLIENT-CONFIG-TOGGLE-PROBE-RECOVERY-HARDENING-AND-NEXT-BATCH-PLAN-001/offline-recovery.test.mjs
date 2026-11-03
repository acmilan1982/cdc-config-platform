// Pure offline fault simulation for the recovery coordinator (R1).
//
// Only Node built-ins (node:test, node:assert/strict) and in-memory stubs are
// used. No browser, no network, no real business API, no SQL. This proves the
// decision logic only; it does NOT prove that fault recovery was exercised in a
// real environment.
//
// Every coordinator test routes its `getPageState` through the SAME shared
// `readPageState()` adapter the real probe imports, so the fail-closed page-read
// behaviour under test cannot drift from the real implementation.
//
// Run: node --test offline-recovery.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWriteLedger,
  createRecoveryCoordinator,
  RECOVERY_ACTIONS,
} from './recovery-coordinator.mjs';
import {
  readPageState,
  knownPageState,
  isPageStateKnown,
  pageStateAllowsApiSwitch,
} from './page-state-adapter.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function row(overrides = {}) {
  return { identityOk: true, exact: true, fgActive: '1', businessDrift: [], ...overrides };
}

// The real shared adapter with injected thunks. Returning a fresh readPageState()
// promise each call mirrors how the real probe invokes the same module.
function pageAdapter({
  evaluate = async () => false,
  lifecycle = () => ({ writeAllowed: false, inFlight: false }),
} = {}) {
  return () => readPageState({ evaluate, lifecycle });
}

const CLEAN_PAGE = pageAdapter();

// Returns the scripted snapshots in order and fails loudly on an unexpected
// extra read, so a logic change that reads more than intended is caught.
function scriptedReader(states) {
  let i = 0;
  const fn = async () => {
    if (i >= states.length) throw new Error(`readSnapshot overflow at call ${i + 1}`);
    const s = states[i];
    i += 1;
    return typeof s === 'function' ? s() : s;
  };
  fn.count = () => i;
  return fn;
}

function repeatingReader(state) {
  return async () => (typeof state === 'function' ? state() : state);
}

// ---------------------------------------------------------------- happy paths

test('S1 no recovery needed: already 0 -> zero writes', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row({ fgActive: '0' })]),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: CLEAN_PAGE,
  });

  const res = await coord.recover();
  assert.equal(res.action, RECOVERY_ACTIONS.ALREADY_RESTORED);
  assert.equal(res.recovered, true);
  assert.equal(res.limitation, null, 'a clean, idle page needs no limitation note');
  assert.equal(apiCalls, 0);
  const snap = ledger.snapshot();
  assert.equal(snap.attempts, 0);
  assert.equal(snap.total, 0);
});

test('S1b already 0 but page unknown -> no write, honest limitation', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row({ fgActive: '0' })]),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: pageAdapter({
      evaluate: async () => {
        throw new Error('Target page, context or browser has been closed');
      },
    }),
  });

  const res = await coord.recover();
  assert.equal(res.action, RECOVERY_ACTIONS.ALREADY_RESTORED);
  assert.equal(res.recovered, true);
  assert.equal(res.apiSend, false);
  assert.match(String(res.limitation), /could not be confirmed/);
  assert.equal(apiCalls, 0);
  assert.equal(ledger.snapshot().total, 0);
});

test('S2 page failed before sending; re-read still 1, no drift, no in-flight; API fallback exactly once', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([
      row(), // v0 initial
      row(), // v3 after page attempt
      row({ fgActive: '0' }), // v4 final verification
    ]),
    pageAttempt: async () => ({ sent: false, error: 'menu-missing' }),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: CLEAN_PAGE,
  });

  const res = await coord.recover();
  assert.equal(res.action, RECOVERY_ACTIONS.RECOVERED_VIA_API);
  assert.equal(res.recovered, true);
  assert.equal(res.apiSend, true);
  assert.equal(apiCalls, 1, 'API fallback must be attempted exactly once');
  const snap = ledger.snapshot();
  assert.equal(snap.counts['recovery-disable'], 1);
  assert.equal(snap.total, 1);
  assert.equal(snap.entries[0].outcome, 'success');
});

test('S3 page recovery request allowed but UI then throws; GET shows 0; no API resend', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row(), row({ fgActive: '0' })]),
    pageAttempt: async () => {
      const r = ledger.tryReserve('recovery-disable', { source: 'browser-gate' });
      return { sent: r.ok, error: 'ui-threw-after-allow' };
    },
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: CLEAN_PAGE,
  });

  const res = await coord.recover();
  assert.equal(res.action, RECOVERY_ACTIONS.RECOVERED_VIA_PAGE);
  assert.equal(res.recovered, true);
  assert.equal(res.apiSend, false);
  assert.match(String(res.limitation), /inferred from the final read/);
  assert.equal(apiCalls, 0, 'a page-allowed write must never trigger an API write');
  assert.equal(ledger.snapshot().counts['recovery-disable'], 1);
});

test('S4 page recovery allowed but result unknown / GET still 1 -> stop, no blind resend', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row(), row({ fgActive: '1' })]),
    pageAttempt: async () => {
      const r = ledger.tryReserve('recovery-disable', { source: 'browser-gate' });
      return { sent: r.ok, error: 'timeout-after-allow' };
    },
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: CLEAN_PAGE,
  });

  const res = await coord.recover();
  assert.equal(res.action, RECOVERY_ACTIONS.STOP);
  assert.equal(res.reason, 'PAGE_WROTE_UNCONFIRMED');
  assert.equal(res.recovered, false);
  assert.equal(apiCalls, 0, 'must not resend through the API');
  assert.equal(ledger.snapshot().counts['recovery-disable'], 1);
});

for (const [label, apiWrite] of [
  ['timeout', async () => ({ outcome: 'timeout' })],
  ['parse-error', async () => ({ outcome: 'parse-error' })],
  [
    'disconnect',
    async () => {
      const e = new Error('socket hang up');
      e.code = 'disconnect';
      throw e;
    },
  ],
]) {
  test(`S5 API ${label} still consumes budget and is not retried`, async () => {
    const ledger = createWriteLedger();
    let apiCalls = 0;
    const wrapped = async () => {
      apiCalls += 1;
      return apiWrite();
    };
    const coord = createRecoveryCoordinator({
      ledger,
      readSnapshot: scriptedReader([row(), row(), row({ fgActive: '1' })]),
      pageAttempt: async () => ({ sent: false, error: 'page-unusable' }),
      apiWrite: wrapped,
      getPageState: CLEAN_PAGE,
    });

    const res = await coord.recover();
    assert.equal(res.action, RECOVERY_ACTIONS.STOP);
    assert.equal(res.reason, 'API_WRITE_UNCONFIRMED');
    assert.equal(res.recovered, false);
    assert.equal(apiCalls, 1, 'must not auto-retry');
    const snap = ledger.snapshot();
    assert.equal(snap.attempts, 1, 'attempt counted even without a successful response');
    assert.equal(snap.entries[0].outcome, label);
    assert.equal(snap.entries[0].settledAt !== null, true);
  });
}

// ------------------------------------------------------------- safe stops (R0)

test('S6a unknown identity -> no write', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row({ identityOk: false })]),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: CLEAN_PAGE,
  });
  const res = await coord.recover();
  assert.equal(res.action, RECOVERY_ACTIONS.STOP);
  assert.equal(res.reason, 'IDENTITY_UNKNOWN');
  assert.equal(apiCalls, 0);
  assert.equal(ledger.snapshot().attempts, 0);
});

test('S6b business field drift -> no write', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row({ businessDrift: ['clientDesc'] })]),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: CLEAN_PAGE,
  });
  const res = await coord.recover();
  assert.equal(res.action, RECOVERY_ACTIONS.STOP);
  assert.equal(res.reason, 'BUSINESS_DRIFT');
  assert.equal(apiCalls, 0);
  assert.equal(ledger.snapshot().attempts, 0);
});

test('S6c unknown state -> no write', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row({ fgActive: null })]),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: CLEAN_PAGE,
  });
  const res = await coord.recover();
  assert.equal(res.action, RECOVERY_ACTIONS.STOP);
  assert.equal(res.reason, 'STATE_UNKNOWN');
  assert.equal(apiCalls, 0);
  assert.equal(ledger.snapshot().attempts, 0);
});

test('S6d recovery budget exhausted -> no write', async () => {
  const ledger = createWriteLedger();
  const pre = ledger.tryReserve('recovery-disable', { source: 'pre-consumed' });
  assert.equal(pre.ok, true);
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row()]),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: CLEAN_PAGE,
  });
  const res = await coord.recover();
  assert.equal(res.action, RECOVERY_ACTIONS.STOP);
  assert.equal(res.reason, 'BUDGET_EXHAUSTED');
  assert.equal(apiCalls, 0);
  assert.equal(ledger.snapshot().attempts, 1, 'only the pre-consumed reservation exists');
});

test('S7a page consumption blocks the API for the same recovery', async () => {
  const ledger = createWriteLedger();
  const page = ledger.tryReserve('recovery-disable', { source: 'browser-gate' });
  assert.equal(page.ok, true);
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row()]),
    allowPageAttempt: false,
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: CLEAN_PAGE,
  });
  const res = await coord.recover();
  assert.equal(res.action, RECOVERY_ACTIONS.STOP);
  assert.equal(res.reason, 'BUDGET_EXHAUSTED');
  assert.equal(apiCalls, 0);
  assert.equal(ledger.snapshot().counts['recovery-disable'], 1);
});

test('S7b concurrent recoveries share one ledger: extra recovery max 1, total max 3', async () => {
  const ledger = createWriteLedger();
  const en = ledger.tryReserve('enable', { source: 'normal' });
  assert.equal(en.ok, true);
  ledger.settle(en, 'success');
  const dis = ledger.tryReserve('disable', { source: 'normal' });
  assert.equal(dis.ok, true);
  ledger.settle(dis, 'success');
  assert.equal(ledger.snapshot().total, 2);

  let apiCalls = 0;
  const makeCoord = () =>
    createRecoveryCoordinator({
      ledger,
      readSnapshot: repeatingReader(row()),
      allowPageAttempt: false,
      apiWrite: async () => {
        apiCalls += 1;
        await sleep(5);
        return { outcome: 'success' };
      },
      getPageState: CLEAN_PAGE,
    });

  const [r1, r2] = await Promise.all([makeCoord().recover(), makeCoord().recover()]);
  const snap = ledger.snapshot();
  assert.equal(snap.counts['recovery-disable'], 1, 'only one extra recovery write may be reserved');
  assert.ok(snap.total <= 3, `total write attempts must not exceed 3, got ${snap.total}`);
  assert.equal(apiCalls, 1, 'only the reservation winner reaches the API');
  const stopped = [r1, r2].filter((r) => r.action === RECOVERY_ACTIONS.STOP && r.reason === 'BUDGET_EXHAUSTED');
  assert.equal(stopped.length, 1);
});

test('S7c ledger total cap is enforced across kinds', async () => {
  const ledger = createWriteLedger({ total: 2 });
  assert.equal(ledger.tryReserve('enable').ok, true);
  assert.equal(ledger.tryReserve('disable').ok, true);
  const third = ledger.tryReserve('recovery-disable');
  assert.equal(third.ok, false);
  assert.equal(third.reason, 'TOTAL_BUDGET_EXHAUSTED');
  assert.equal(ledger.snapshot().total, 2);
});

test('S8 page action completed but GET not confirming restore -> not reported as success', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row(), row({ fgActive: '1' })]),
    pageAttempt: async () => {
      const r = ledger.tryReserve('recovery-disable', { source: 'browser-gate' });
      return { sent: r.ok };
    },
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: CLEAN_PAGE,
  });
  const res = await coord.recover();
  assert.notEqual(res.action, RECOVERY_ACTIONS.RECOVERED_VIA_PAGE);
  assert.notEqual(res.action, RECOVERY_ACTIONS.RECOVERED_VIA_API);
  assert.equal(res.recovered, false);
  assert.equal(apiCalls, 0);
});

test('S9 success path keeps normal enable1+disable1, recovery not executed', async () => {
  const ledger = createWriteLedger();

  const enable = ledger.tryReserve('enable', { phase: 'B3-enable-confirm' });
  assert.equal(enable.ok, true);
  let snap = ledger.snapshot();
  assert.equal(snap.attempts, 1);
  assert.equal(snap.entries[0].outcome, 'reserved', 'attempt is charged before the response/parse');
  ledger.settle(enable, 'success');

  const disable = ledger.tryReserve('disable', { phase: 'B6-disable-confirm' });
  assert.equal(disable.ok, true);
  ledger.settle(disable, 'success');

  const secondEnable = ledger.tryReserve('enable');
  assert.equal(secondEnable.ok, false);
  assert.equal(secondEnable.reason, 'KIND_BUDGET_EXHAUSTED');

  snap = ledger.snapshot();
  assert.deepEqual(snap.counts, { enable: 1, disable: 1, 'recovery-disable': 0 });
  assert.equal(snap.total, 2);
  assert.equal(snap.counts['recovery-disable'], 0, 'normal success must not consume recovery budget');
});

// ------------------------------------------- R1: fail-closed page-state adapter
// These make the R0 fail-open behaviour fail: R0 turned every read failure into
// writeAllowed=false/pendingConfirm=false and would call the API. R1 must stop
// with zero API writes.

test('A1 page.evaluate throws (page/context unavailable) -> PAGE_STATE_UNKNOWN, API 0', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row(), row()]),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: pageAdapter({
      evaluate: async () => {
        throw new Error('Target page, context or browser has been closed');
      },
    }),
  });
  const res = await coord.recover();
  assert.equal(res.action, RECOVERY_ACTIONS.STOP);
  assert.equal(res.reason, 'PAGE_STATE_UNKNOWN');
  assert.equal(res.pageState.known, false);
  assert.equal(apiCalls, 0, 'unknown page state must never allow an API write');
  assert.equal(ledger.snapshot().total, 0);
});

test('A2 page.evaluate returns a non-boolean -> PAGE_STATE_UNKNOWN, API 0', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row(), row()]),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: pageAdapter({ evaluate: async () => 'yes' }),
  });
  const res = await coord.recover();
  assert.equal(res.reason, 'PAGE_STATE_UNKNOWN');
  assert.equal(res.pageState.known, false);
  assert.equal(apiCalls, 0);
});

for (const [label, lifecycle] of [
  ['writeAllowed missing', () => ({ inFlight: false })],
  ['inFlight missing', () => ({ writeAllowed: false })],
  ['writeAllowed null', () => ({ writeAllowed: null, inFlight: false })],
  ['inFlight non-boolean', () => ({ writeAllowed: false, inFlight: 'no' })],
  ['lifecycle not an object', () => true],
]) {
  test(`A3 lifecycle ${label} -> PAGE_STATE_UNKNOWN, API 0`, async () => {
    const ledger = createWriteLedger();
    let apiCalls = 0;
    const coord = createRecoveryCoordinator({
      ledger,
      readSnapshot: scriptedReader([row(), row()]),
      apiWrite: async () => {
        apiCalls += 1;
        return { outcome: 'success' };
      },
      getPageState: pageAdapter({ lifecycle }),
    });
    const res = await coord.recover();
    assert.equal(res.reason, 'PAGE_STATE_UNKNOWN');
    assert.equal(apiCalls, 0);
  });
}

test('A4 missing page-state adapter is rejected at construction', () => {
  const ledger = createWriteLedger();
  const base = { ledger, readSnapshot: async () => row(), apiWrite: async () => ({ outcome: 'success' }) };
  assert.throws(() => createRecoveryCoordinator(base), /getPageState/);
  assert.throws(() => createRecoveryCoordinator({ ...base, getPageState: null }), /getPageState/);
});

test('A5 adapter returns undefined -> PAGE_STATE_UNKNOWN, API 0', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row(), row()]),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: async () => undefined,
  });
  const res = await coord.recover();
  assert.equal(res.reason, 'PAGE_STATE_UNKNOWN');
  assert.equal(apiCalls, 0);
});

test('A6 pageAttempt throws (send outcome unknown) -> no API fallback', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row(), row()]),
    pageAttempt: async () => {
      throw new Error('confirm click crashed');
    },
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: CLEAN_PAGE,
  });
  const res = await coord.recover();
  assert.equal(res.action, RECOVERY_ACTIONS.STOP);
  assert.equal(res.reason, 'PAGE_ATTEMPT_FAILED');
  assert.equal(apiCalls, 0, 'a thrown page attempt is unknown, not "not sent"');
});

test('A7 pageAttempt returns non-boolean sent -> PAGE_SEND_UNKNOWN, no API', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row(), row()]),
    pageAttempt: async () => ({ sent: 'yes' }),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: CLEAN_PAGE,
  });
  const res = await coord.recover();
  assert.equal(res.reason, 'PAGE_SEND_UNKNOWN');
  assert.equal(apiCalls, 0);
});

test('A8 in-flight at entry -> PAGE_IN_FLIGHT_OR_PENDING, no API', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row(), row()]),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: pageAdapter({ lifecycle: () => ({ writeAllowed: false, inFlight: true }) }),
  });
  const res = await coord.recover();
  assert.equal(res.reason, 'PAGE_IN_FLIGHT_OR_PENDING');
  assert.equal(apiCalls, 0);
});

test('A9 pending confirm at entry -> PAGE_IN_FLIGHT_OR_PENDING, no API', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row(), row()]),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: pageAdapter({ evaluate: async () => true }),
  });
  const res = await coord.recover();
  assert.equal(res.reason, 'PAGE_IN_FLIGHT_OR_PENDING');
  assert.equal(apiCalls, 0);
});

test('A10 page-gate write already allowed (unsettled ledger) -> no API resend', async () => {
  const ledger = createWriteLedger();
  const gate = ledger.tryReserve('recovery-disable', { source: 'browser-gate' });
  assert.equal(gate.ok, true);
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row(), row()]),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    // Derive the state from the real ledger exactly as the probe's lifecycle does.
    getPageState: pageAdapter({
      lifecycle: () => {
        const snap = ledger.snapshot();
        return {
          writeAllowed: snap.counts['recovery-disable'] > 0,
          inFlight: snap.entries.some((e) => e.kind === 'recovery-disable' && e.outcome === 'reserved'),
        };
      },
    }),
  });
  const res = await coord.recover();
  assert.equal(res.reason, 'PAGE_IN_FLIGHT_OR_PENDING');
  assert.equal(apiCalls, 0, 'an allowed-but-unconfirmed page write must not be re-sent via API');
  assert.equal(ledger.snapshot().counts['recovery-disable'], 1);
});

test('A11 pageAttempt throws after allowing a write -> no API resend', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row(), row()]),
    pageAttempt: async () => {
      ledger.tryReserve('recovery-disable', { source: 'browser-gate' });
      throw new Error('crash after gate allowed the write');
    },
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: CLEAN_PAGE,
  });
  const res = await coord.recover();
  assert.equal(res.reason, 'PAGE_ATTEMPT_FAILED');
  assert.equal(apiCalls, 0);
  assert.equal(ledger.snapshot().counts['recovery-disable'], 1);
});

test('A12 explicit safe + page did not send -> exactly one API fallback', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row(), row(), row({ fgActive: '0' })]),
    pageAttempt: async () => ({ sent: false }),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: CLEAN_PAGE,
  });
  const res = await coord.recover();
  assert.equal(res.action, RECOVERY_ACTIONS.RECOVERED_VIA_API);
  assert.equal(apiCalls, 1);
  assert.equal(ledger.snapshot().counts['recovery-disable'], 1);
});

test('A13 page state unknown but final read 0 -> RESTORED_BY_READ with limitation', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row(), row({ fgActive: '0' })]),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: pageAdapter({
      evaluate: async () => {
        throw new Error('Target page, context or browser has been closed');
      },
    }),
  });
  const res = await coord.recover();
  assert.equal(res.action, RECOVERY_ACTIONS.RESTORED_BY_READ);
  assert.equal(res.recovered, true);
  assert.equal(res.apiSend, false);
  assert.match(String(res.limitation), /could not be excluded/);
  assert.equal(apiCalls, 0);
});

test('A14 readSnapshot throws -> IDENTITY_UNKNOWN, no write', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: async () => {
      throw new Error('api unavailable');
    },
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: CLEAN_PAGE,
  });
  const res = await coord.recover();
  assert.equal(res.reason, 'IDENTITY_UNKNOWN');
  assert.equal(apiCalls, 0);
  assert.equal(ledger.snapshot().total, 0);
});

test('A15 identity flag (exact) missing/non-true -> IDENTITY_UNKNOWN', async () => {
  for (const over of [{ exact: undefined }, { exact: false }, { identityOk: 'yes' }]) {
    const ledger = createWriteLedger();
    let apiCalls = 0;
    const coord = createRecoveryCoordinator({
      ledger,
      readSnapshot: scriptedReader([row(over)]),
      apiWrite: async () => {
        apiCalls += 1;
        return { outcome: 'success' };
      },
      getPageState: CLEAN_PAGE,
    });
    const res = await coord.recover();
    assert.equal(res.reason, 'IDENTITY_UNKNOWN', JSON.stringify(over));
    assert.equal(apiCalls, 0, JSON.stringify(over));
  }
});

test('A16 businessDrift missing / malformed -> BUSINESS_DRIFT_UNKNOWN', async () => {
  for (const over of [{ businessDrift: undefined }, { businessDrift: 'clientDesc' }, { businessDrift: null }]) {
    const ledger = createWriteLedger();
    let apiCalls = 0;
    const coord = createRecoveryCoordinator({
      ledger,
      readSnapshot: scriptedReader([row(over)]),
      apiWrite: async () => {
        apiCalls += 1;
        return { outcome: 'success' };
      },
      getPageState: CLEAN_PAGE,
    });
    const res = await coord.recover();
    assert.equal(res.reason, 'BUSINESS_DRIFT_UNKNOWN', JSON.stringify(over));
    assert.equal(apiCalls, 0, JSON.stringify(over));
  }
});

test('A18 in-flight at entry but final read 0 -> recovered with an honest limitation, no API', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: scriptedReader([row(), row({ fgActive: '0' })]),
    apiWrite: async () => {
      apiCalls += 1;
      return { outcome: 'success' };
    },
    getPageState: pageAdapter({ lifecycle: () => ({ writeAllowed: false, inFlight: true }) }),
  });
  const res = await coord.recover();
  assert.equal(res.action, RECOVERY_ACTIONS.RECOVERED_VIA_PAGE);
  assert.equal(res.recovered, true);
  assert.equal(res.apiSend, false);
  assert.match(String(res.limitation), /could not be confirmed settled/);
  assert.equal(apiCalls, 0);
});

test('A17 page-state unit semantics: only known + all-false permits switch', () => {
  assert.equal(isPageStateKnown(knownPageState({ writeAllowed: false, inFlight: false, pendingConfirm: false })), true);
  assert.equal(isPageStateKnown({ known: false, reason: 'x' }), false);
  assert.equal(isPageStateKnown({ known: true, writeAllowed: false, inFlight: false }), false);

  assert.equal(pageStateAllowsApiSwitch(knownPageState({ writeAllowed: false, inFlight: false, pendingConfirm: false })), true);
  assert.equal(pageStateAllowsApiSwitch(knownPageState({ writeAllowed: true, inFlight: false, pendingConfirm: false })), false);
  assert.equal(pageStateAllowsApiSwitch(knownPageState({ writeAllowed: false, inFlight: true, pendingConfirm: false })), false);
  assert.equal(pageStateAllowsApiSwitch(knownPageState({ writeAllowed: false, inFlight: false, pendingConfirm: true })), false);
  assert.equal(pageStateAllowsApiSwitch({ known: false, reason: 'EVALUATE_FAILED' }), false);
});

test('Ledger settle never refunds and refuses a double settle', () => {
  const ledger = createWriteLedger();
  const r = ledger.tryReserve('enable');
  assert.equal(r.ok, true);
  ledger.settle(r, 'timeout');
  const snap = ledger.snapshot();
  assert.equal(snap.counts.enable, 1);
  assert.equal(snap.entries[0].outcome, 'timeout');
  assert.throws(() => ledger.settle(r, 'success'), /already settled/);
});
