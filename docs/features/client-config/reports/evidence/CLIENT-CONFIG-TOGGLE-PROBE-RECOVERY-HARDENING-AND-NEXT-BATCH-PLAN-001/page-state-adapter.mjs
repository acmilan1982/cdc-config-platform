// Fail-closed page-state adapter shared by the real T02 probe and the offline
// fault simulation.
//
// Importing this module performs no I/O: no browser, no network, no mapping or
// pre-image read. `readPageState()` is the single implementation both the real
// probe and the offline tests call; nothing else may re-implement the page read.
//
// The page state is an explicit tri-state envelope, never a bare boolean:
//   { known: true,  writeAllowed: <bool>, inFlight: <bool>, pendingConfirm: <bool> }
//   { known: false, reason: <string>, detail: <any> }
//
// Unknown is NOT safe. The coordinator may only consider a page->API switch when
// the state is `known` and all three flags are explicitly false. Any read error,
// unavailable page/context, missing field, or non-boolean value yields unknown.

export function unknownPageState(reason, detail = null) {
  return { known: false, reason, detail };
}

export function knownPageState(state = {}) {
  return {
    known: true,
    writeAllowed: state.writeAllowed,
    inFlight: state.inFlight,
    pendingConfirm: state.pendingConfirm,
  };
}

function isBool(v) {
  return typeof v === 'boolean';
}

function describe(v) {
  if (v === undefined) return 'undefined';
  if (v === null) return 'null';
  return `${typeof v}:${String(v)}`;
}

export function isPageStateKnown(state) {
  return !!(
    state &&
    state.known === true &&
    isBool(state.writeAllowed) &&
    isBool(state.inFlight) &&
    isBool(state.pendingConfirm)
  );
}

// The only condition that permits switching the recovery write channel from the
// page to the API: the page state is explicitly known and every flag is exactly
// false. Unknown, a missing field, or any true flag blocks the switch.
export function pageStateAllowsApiSwitch(state) {
  return (
    isPageStateKnown(state) &&
    state.writeAllowed === false &&
    state.inFlight === false &&
    state.pendingConfirm === false
  );
}

// evaluate(): injected page.evaluate thunk; must resolve to an explicit boolean
//             meaning "a confirm dialog is currently pending". Any throw means
//             the page or context is unavailable -> unknown.
// lifecycle(): injected fact reader derived from the shared ledger and the real
//             request lifecycle. Must return explicit booleans:
//               writeAllowed - the page gate has already allowed a write whose
//                              result is unconfirmed (not a fixed literal)
//               inFlight     - a write is genuinely outstanding (allowed but not
//                              returned)
// Anything missing, malformed, or throwing -> unknown.
export async function readPageState({ evaluate, lifecycle } = {}) {
  if (typeof evaluate !== 'function') return unknownPageState('EVALUATE_UNAVAILABLE');
  if (typeof lifecycle !== 'function') return unknownPageState('LIFECYCLE_UNAVAILABLE');

  let pendingConfirm;
  try {
    pendingConfirm = await evaluate();
  } catch (e) {
    return unknownPageState('EVALUATE_FAILED', String((e && e.message) || e));
  }
  if (!isBool(pendingConfirm)) {
    return unknownPageState('PENDING_CONFIRM_NOT_BOOLEAN', describe(pendingConfirm));
  }

  let life;
  try {
    life = await lifecycle();
  } catch (e) {
    return unknownPageState('LIFECYCLE_FAILED', String((e && e.message) || e));
  }
  if (!life || typeof life !== 'object') {
    return unknownPageState('LIFECYCLE_INVALID', describe(life));
  }
  if (!isBool(life.writeAllowed)) {
    return unknownPageState('WRITE_ALLOWED_NOT_BOOLEAN', describe(life.writeAllowed));
  }
  if (!isBool(life.inFlight)) {
    return unknownPageState('IN_FLIGHT_NOT_BOOLEAN', describe(life.inFlight));
  }
  return knownPageState({ writeAllowed: life.writeAllowed, inFlight: life.inFlight, pendingConfirm });
}
