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
// Coordinator contract (see prompt sections 2 and 3):
//   * the page state is an explicit known/unknown envelope from the shared
//     page-state adapter; unknown is never treated as safe;
//   * identity safety requires explicit identityOk===true && exact===true, and
//     business safety requires an explicit businessDrift array; missing or
//     malformed values stop recovery instead of being read as "safe";
//   * the API is only considered when the page state is known and every flag
//     (writeAllowed / inFlight / pendingConfirm) is exactly false;
//   * once the page has allowed a write, the API is never used for that same
//     recovery: we re-read and report instead;
//   * the API fallback reserves budget synchronously immediately before the
//     write and never retries;
//   * recovery success is only claimed by a final read that shows the original
//     business pre-image and FG_ACTIVE === '0'. A click or HTTP 200 is never
//     enough on its own.

import {
  unknownPageState,
  isPageStateKnown,
  pageStateAllowsApiSwitch,
} from './page-state-adapter.mjs';

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
  RESTORED_BY_READ: 'RESTORED_BY_READ',
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
    getPageState,
    budgetKind = 'recovery-disable',
    allowPageAttempt = true,
  } = options;

  if (!ledger) throw new Error('createRecoveryCoordinator requires a ledger');
  if (typeof readSnapshot !== 'function') throw new Error('createRecoveryCoordinator requires readSnapshot()');
  if (typeof apiWrite !== 'function') throw new Error('createRecoveryCoordinator requires apiWrite()');
  // A missing page-state adapter must never silently stand in for a safe state.
  if (typeof getPageState !== 'function') {
    throw new Error('createRecoveryCoordinator requires getPageState()');
  }

  function stop(reason, extra = {}) {
    return { action: RECOVERY_ACTIONS.STOP, recovered: false, reason, apiSend: false, ...extra };
  }

  // An adapter throw is unknown, never safe.
  async function pageState() {
    try {
      return await getPageState();
    } catch (e) {
      return unknownPageState('GET_PAGE_STATE_THREW', String((e && e.message) || e));
    }
  }

  // Identity and business-preimage safety require explicit evidence. Missing
  // `identityOk`/`exact` is not `true`, and a missing/non-array `businessDrift`
  // is not "no drift" — both surface as unknown and stop recovery.
  async function verifyOnce() {
    let raw;
    try {
      raw = await readSnapshot();
    } catch (e) {
      return {
        raw: null,
        identityOk: false,
        fgActive: undefined,
        businessDrift: null,
        readError: String((e && e.message) || e),
      };
    }
    const identityOk = !!(raw && raw.identityOk === true && raw.exact === true);
    const fgActive = raw ? raw.fgActive : undefined;
    const businessDrift = raw && Array.isArray(raw.businessDrift) ? raw.businessDrift.slice() : null;
    return { raw, identityOk, fgActive, businessDrift };
  }

  function restored(v) {
    return !!(
      v.identityOk &&
      v.businessDrift !== null &&
      v.businessDrift.length === 0 &&
      v.fgActive === '0'
    );
  }

  async function recoveredByRead(vu, extra = {}) {
    return {
      action: RECOVERY_ACTIONS.RESTORED_BY_READ,
      recovered: true,
      reason: null,
      apiSend: false,
      final: vu.raw,
      limitation: 'result unconfirmed by channel; final read shows 0 but in-flight/pending could not be excluded',
      ...extra,
    };
  }

  async function recover() {
    const v0 = await verifyOnce();
    if (!v0.identityOk) return stop('IDENTITY_UNKNOWN', { final: v0.raw });
    if (v0.businessDrift === null) return stop('BUSINESS_DRIFT_UNKNOWN', { final: v0.raw });

    if (v0.fgActive === '0') {
      if (v0.businessDrift.length > 0) {
        return stop('BUSINESS_DRIFT', { final: v0.raw, businessDrift: v0.businessDrift });
      }
      // No write is needed. Report honestly whether the page could be confirmed
      // idle; a possibly in-flight request is not claimed to have safely ended.
      const ps = await pageState();
      const idle = pageStateAllowsApiSwitch(ps);
      return {
        action: RECOVERY_ACTIONS.ALREADY_RESTORED,
        recovered: true,
        reason: null,
        apiSend: false,
        final: v0.raw,
        pageState: ps,
        limitation: idle ? null : 'already 0 at read time; page idle (in-flight/pending) could not be confirmed',
      };
    }

    if (v0.fgActive !== '1') return stop('STATE_UNKNOWN', { final: v0.raw });
    if (v0.businessDrift.length > 0) {
      return stop('BUSINESS_DRIFT', { final: v0.raw, businessDrift: v0.businessDrift });
    }

    // A page write may already have been allowed before we were called. Only an
    // explicitly known, fully-idle page state lets recovery consider a switch.
    const ps0 = await pageState();
    if (!isPageStateKnown(ps0)) {
      const vu = await verifyOnce();
      if (restored(vu)) return recoveredByRead(vu, { pageState: ps0 });
      return stop('PAGE_STATE_UNKNOWN', { final: vu.raw, pageState: ps0 });
    }
    if (!pageStateAllowsApiSwitch(ps0)) {
      const v1 = await verifyOnce();
      if (restored(v1)) {
        return {
          action: RECOVERY_ACTIONS.RECOVERED_VIA_PAGE,
          recovered: true,
          reason: null,
          apiSend: false,
          final: v1.raw,
          pageState: ps0,
          limitation: 'restored at read time while the page reported an in-flight/pending write; that request could not be confirmed settled',
        };
      }
      return stop('PAGE_IN_FLIGHT_OR_PENDING', { final: v1.raw, pageState: ps0 });
    }

    if (allowPageAttempt && typeof pageAttempt === 'function') {
      let pr;
      let threw = false;
      try {
        pr = await pageAttempt();
      } catch (e) {
        threw = true;
        pr = { error: String((e && e.message) || e) };
      }

      // If we cannot prove the page did NOT allow a write, do not fall back to
      // the API: a thrown attempt or a non-boolean `sent` is unknown, not "not
      // sent". Only a confirming read can end this safely.
      if (threw || !pr || typeof pr.sent !== 'boolean') {
        const vu = await verifyOnce();
        if (restored(vu)) return recoveredByRead(vu, { pageAttempt: pr });
        return stop(threw ? 'PAGE_ATTEMPT_FAILED' : 'PAGE_SEND_UNKNOWN', { final: vu.raw, pageAttempt: pr });
      }

      if (pr.sent === true) {
        // The page already allowed a write for this recovery. Never add an API
        // request; only a fresh read can tell us what happened.
        const v2 = await verifyOnce();
        if (restored(v2)) {
          return {
            action: RECOVERY_ACTIONS.RECOVERED_VIA_PAGE,
            recovered: true,
            reason: null,
            apiSend: false,
            final: v2.raw,
            pageAttempt: pr,
            limitation: 'page write outcome inferred from the final read; the gate did not inspect the response',
          };
        }
        return stop('PAGE_WROTE_UNCONFIRMED', { final: v2.raw, pageAttempt: pr });
      }

      // Page explicitly did not send: re-read and re-verify before the API is
      // even considered as a fallback for this same recovery.
      const v3 = await verifyOnce();
      if (!v3.identityOk) return stop('IDENTITY_UNKNOWN', { final: v3.raw, pageAttempt: pr });
      if (v3.businessDrift === null) return stop('BUSINESS_DRIFT_UNKNOWN', { final: v3.raw, pageAttempt: pr });
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

    // Re-check the page just before switching channels: unknown still blocks.
    const ps1 = await pageState();
    if (!isPageStateKnown(ps1)) {
      const vu = await verifyOnce();
      if (restored(vu)) return recoveredByRead(vu, { pageState: ps1 });
      return stop('PAGE_STATE_UNKNOWN', { final: vu.raw, pageState: ps1 });
    }
    if (!pageStateAllowsApiSwitch(ps1)) {
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
    const recovered = restored(v4);
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
