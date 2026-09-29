// Intentionally inert. This service worker exists only so the harness has an
// extension context in which `chrome.tabs.setZoom` / `chrome.tabs.getZoom` are
// callable. Zoom is applied by the harness via CDP, never by this worker, and
// the worker reads/writes nothing.
chrome.runtime.onInstalled.addListener(() => {});
chrome.runtime.onStartup.addListener(() => {});
