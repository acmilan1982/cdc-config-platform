// Pure offline fault simulation for the recovery coordinator.
//
// Only Node built-ins (node:test, node:assert/strict) and in-memory stubs are
// used. No browser, no network, no real business API, no SQL. This proves the
// decision logic only; it does NOT prove that fault recovery was exercised in a
// real environment.
//
// Run: node --test offline-recovery.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWriteLedger,
  createRecoveryCoordinator,
  RECOVERY_ACTIONS,
} from './recovery-coordinator.mjs';

const CLEAN_PAGE = async () => ({ writeAllowed: false, inFlight: false, pendingConfirm: false });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function row(overrides = {}) {
  return { identityOk: true, exact: true, fgActive: '1', businessDrift: [], ...overrides };
}

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
  const fn = async () => (typeof state === 'function' ? state() : state);
  return fn;
}

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
  assert.equal(apiCalls, 0);
  const snap = ledger.snapshot();
  assert.equal(snap.attempts, 0);
  assert.equal(snap.total, 0);
});

test('S2 page failed before sending; re-read still 1, no drift, no in-flight; API fallback exactly once', async () => {
  const ledger = createWriteLedger();
  let apiCalls = 0;
  const reader = scriptedReader([
    row(), // v0 initial
    row(), // v3 after page attempt
    row({ fgActive: '0' }), // v4 final verification
  ]);
  const coord = createRecoveryCoordinator({
    ledger,
    readSnapshot: reader,
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
    // Simulate the page gate consuming the shared recovery budget, then the UI
    // throwing after the request had already been allowed.
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
  // At least one coordinator stopped without writing.
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
