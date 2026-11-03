// Shared write-budget ledger + recovery coordinator for the T02 UI toggle probe.
//
// Importing this module performs no I/O: it does not start a browser, read any
// mapping/preimage file, or open a network connection. All effects are injected
// by the caller, which lets the real probe and the offline fault simulation use
// exactly the same decision logic.
//
// Two exports:
//   createWriteLedger(options)          -> single shared write-attempt ledger
//   createRecoveryCoordinator(options)  -> bounded recovery state machine
//
// Ledger contract (see prompt section 3.2):
//   * reservation is synchronous: check + increment happen in one call, so a
//     concurrent caller in the single-threaded runtime can never observe a
//     budget that is not yet charged;
//   * an attempt is counted the moment the request is allowed to leave, not
//     after the HTTP response or JSON parse;
//   * success / timeout / disconnect / parse-error / unknown are settled AFTER
//     the fact and never refund the attempt;
//   * reads (GET/HEAD/OPTIONS) must never reserve.
//
// Coordinator contract (see prompt section 3.3):
//   * the page write is only attempted when the page gate reports no allowed
//     write, no in-flight request and no pending confirm;
//   * once the page has allowed a write, the API is never used for that same
//     recovery: we re-read and report instead;
//   * the API fallback reserves budget synchronously immediately before the
//     write and never retries;
//   * recovery success is only claimed by a final read that shows the original
//     business pre-image and FG_ACTIVE === '0'. A click or HTTP 200 is never
//     enough on its own.

export const WRITE_KINDS = Object.freeze(['enable', 'disable', 'recovery-disable']);

export const API_OUTCOMES = Object.freeze([
  'success',
  'http-error',
  'timeout',
  'disconnect',
  'parse-error',
  'unknown',
]);

export const RECOVERY_ACTIONS = Object.freeze({
  ALREADY_RESTORED: 'ALREADY_RESTORED',
  RECOVERED_VIA_PAGE: 'RECOVERED_VIA_PAGE',
  RECOVERED_VIA_API: 'RECOVERED_VIA_API',
  STOP: 'STOP',
});

function normalizeOutcome(value) {
  return API_OUTCOMES.includes(value) ? value : 'unknown';
}

export function createWriteLedger(options = {}) {
  const caps = {
    enable: options.enable ?? 1,
    disable: options.disable ?? 1,
    'recovery-disable': options.recoveryDisable ?? 1,
    total: options.total ?? 3,
  };
  const counts = { enable: 0, disable: 0, 'recovery-disable': 0 };
  const entries = [];
  let total = 0;
  let seq = 0;

  function snapshot() {
    const remaining = {};
    for (const kind of Object.keys(counts)) {
      remaining[kind] = Math.max(0, caps[kind] - counts[kind]);
    }
    return {
      caps: { ...caps },
      counts: { ...counts },
      total,
      totalRemaining: Math.max(0, caps.total - total),
      remaining,
      attempts: entries.length,
      unsettled: entries.filter((e) => e.outcome === 'reserved').length,
      entries: entries.map((e) => ({ ...e, meta: { ...e.meta } })),
    };
  }

  // Synchronous check + reserve. Returns { ok:true, seq, kind, entry, snapshot }
  // or { ok:false, reason, snapshot } without charging anything.
  function tryReserve(kind, meta = {}) {
    if (!Object.prototype.hasOwnProperty.call(counts, kind)) {
      return { ok: false, reason: 'UNKNOWN_KIND', kind, snapshot: snapshot() };
    }
    if (counts[kind] >= caps[kind]) {
      return { ok: false, reason: 'KIND_BUDGET_EXHAUSTED', kind, snapshot: snapshot() };
    }
    if (total >= caps.total) {
      return { ok: false, reason: 'TOTAL_BUDGET_EXHAUSTED', kind, snapshot: snapshot() };
    }
    counts[kind] += 1;
    total += 1;
    seq += 1;
    const entry = {
      seq,
      kind,
      meta: { ...meta },
      reservedAt: Date.now(),
      outcome: 'reserved', // allowed; result explicitly unknown until settle()
      detail: null,
      settledAt: null,
    };
    entries.push(entry);
    return { ok: true, seq, kind, entry: { ...entry }, snapshot: snapshot() };
  }

  // Record the post-hoc result of an already-reserved attempt. Never changes the
  // charged counts, never refunds, and refuses to settle the same attempt twice.
  function settle(reservation, outcome = 'unknown', detail = null) {
    if (!reservation || reservation.ok !== true) {
      throw new Error('settle() requires a successful reservation');
    }
    const entry = entries.find((e) => e.seq === reservation.seq);
    if (!entry) throw new Error(`settle(): unknown reservation seq=${reservation.seq}`);
    if (entry.outcome !== 'reserved') {
      throw new Error(`settle(): reservation seq=${reservation.seq} already settled as ${entry.outcome}`);
    }
    entry.outcome = normalizeOutcome(outcome);
    entry.detail = detail;
    entry.settledAt = Date.now();
    return { ...entry, meta: { ...entry.meta } };
  }

  return { caps: { ...caps }, tryReserve, settle, snapshot };
}

export function createRecoveryCoordinator(options = {}) {
  const {
    ledger,
    readSnapshot,
    pageAttempt = null,
    apiWrite,
    getPageState = async () => ({ writeAllowed: false, inFlight: false, pendingConfirm: false }),
    budgetKind = 'recovery-disable',
    allowPageAttempt = true,
  } = options;

  if (!ledger) throw new Error('createRecoveryCoordinator requires a ledger');
  if (typeof readSnapshot !== 'function') throw new Error('createRecoveryCoordinator requires readSnapshot()');
  if (typeof apiWrite !== 'function') throw new Error('createRecoveryCoordinator requires apiWrite()');

  function stop(reason, extra = {}) {
    return { action: RECOVERY_ACTIONS.STOP, recovered: false, reason, apiSend: false, ...extra };
  }

  async function verifyOnce() {
    const raw = await readSnapshot();
    const identityOk = !!(raw && raw.identityOk !== false && raw.exact !== false);
    const fgActive = raw ? raw.fgActive : undefined;
    let businessDrift = [];
    if (Array.isArray(raw && raw.businessDrift)) businessDrift = raw.businessDrift.slice();
    else if (raw && raw.businessDrift) businessDrift = [raw.businessDrift];
    return { raw, identityOk, fgActive, businessDrift };
  }

  async function recover() {
    const v0 = await verifyOnce();
    if (!v0.identityOk) return stop('IDENTITY_UNKNOWN', { final: v0.raw });

    if (v0.fgActive === '0') {
      if (v0.businessDrift.length === 0) {
        return {
          action: RECOVERY_ACTIONS.ALREADY_RESTORED,
          recovered: true,
          reason: null,
          apiSend: false,
          final: v0.raw,
        };
      }
      return stop('BUSINESS_DRIFT', { final: v0.raw, businessDrift: v0.businessDrift });
    }

    if (v0.fgActive !== '1') return stop('STATE_UNKNOWN', { final: v0.raw });
    if (v0.businessDrift.length > 0) {
      return stop('BUSINESS_DRIFT', { final: v0.raw, businessDrift: v0.businessDrift });
    }

    // A page write may already have been allowed before we were called.
    const ps0 = await getPageState();
    if (ps0.writeAllowed || ps0.inFlight || ps0.pendingConfirm) {
      const v1 = await verifyOnce();
      if (v1.identityOk && v1.fgActive === '0' && v1.businessDrift.length === 0) {
        return {
          action: RECOVERY_ACTIONS.RECOVERED_VIA_PAGE,
          recovered: true,
          reason: null,
          apiSend: false,
          final: v1.raw,
          pageState: ps0,
        };
      }
      return stop('PAGE_IN_FLIGHT_OR_PENDING', { final: v1.raw, pageState: ps0 });
    }

    if (allowPageAttempt && typeof pageAttempt === 'function') {
      let pr;
      try {
        pr = await pageAttempt();
      } catch (e) {
        pr = { sent: false, error: String((e && e.message) || e) };
      }

      if (pr && pr.sent) {
        // The page already allowed a write for this recovery. Never add an API
        // request; only a fresh read can tell us what happened.
        const v2 = await verifyOnce();
        if (v2.identityOk && v2.fgActive === '0' && v2.businessDrift.length === 0) {
          return {
            action: RECOVERY_ACTIONS.RECOVERED_VIA_PAGE,
            recovered: true,
            reason: null,
            apiSend: false,
            final: v2.raw,
            pageAttempt: pr,
          };
        }
        return stop('PAGE_WROTE_UNCONFIRMED', { final: v2.raw, pageAttempt: pr });
      }

      // Page failed without sending anything: re-read and re-verify before the
      // API is even considered as a fallback for this same recovery.
      const v3 = await verifyOnce();
      if (!v3.identityOk) return stop('IDENTITY_UNKNOWN', { final: v3.raw, pageAttempt: pr });
      if (v3.fgActive === '0') {
        if (v3.businessDrift.length === 0) {
          return {
            action: RECOVERY_ACTIONS.RECOVERED_VIA_PAGE,
            recovered: true,
            reason: null,
            apiSend: false,
            final: v3.raw,
            pageAttempt: pr,
          };
        }
        return stop('BUSINESS_DRIFT', { final: v3.raw, businessDrift: v3.businessDrift, pageAttempt: pr });
      }
      if (v3.fgActive !== '1') return stop('STATE_UNKNOWN', { final: v3.raw, pageAttempt: pr });
      if (v3.businessDrift.length > 0) {
        return stop('BUSINESS_DRIFT', { final: v3.raw, businessDrift: v3.businessDrift, pageAttempt: pr });
      }
    }

    // Re-check the page just before switching channels.
    const ps1 = await getPageState();
    if (ps1.writeAllowed || ps1.inFlight || ps1.pendingConfirm) {
      return stop('PAGE_IN_FLIGHT_OR_PENDING', { pageState: ps1 });
    }

    // Synchronous reservation, then a single write attempt. No retry.
    const reservation = ledger.tryReserve(budgetKind, { source: 'api-recovery' });
    if (!reservation || reservation.ok !== true) {
      return stop('BUDGET_EXHAUSTED', { ledger: reservation && reservation.snapshot });
    }

    let result;
    let settled = false;
    try {
      result = await apiWrite();
    } catch (e) {
      ledger.settle(reservation, normalizeOutcome(e && e.code), String((e && e.message) || e));
      settled = true;
      result = { outcome: normalizeOutcome(e && e.code), error: String((e && e.message) || e) };
    }
    if (!settled) {
      ledger.settle(
        reservation,
        normalizeOutcome(result && result.outcome),
        (result && result.detail !== undefined ? result.detail : result) ?? null,
      );
    }

    // Only the final read decides whether recovery is real.
    const v4 = await verifyOnce();
    const recovered = v4.identityOk && v4.fgActive === '0' && v4.businessDrift.length === 0;
    if (!recovered) {
      return stop('API_WRITE_UNCONFIRMED', {
        final: v4.raw,
        httpOutcome: result && result.outcome,
        ledger: ledger.snapshot(),
      });
    }
    return {
      action: RECOVERY_ACTIONS.RECOVERED_VIA_API,
      recovered: true,
      reason: null,
      apiSend: true,
      final: v4.raw,
      httpOutcome: result && result.outcome,
      ledger: ledger.snapshot(),
    };
  }

  return { recover };
}
