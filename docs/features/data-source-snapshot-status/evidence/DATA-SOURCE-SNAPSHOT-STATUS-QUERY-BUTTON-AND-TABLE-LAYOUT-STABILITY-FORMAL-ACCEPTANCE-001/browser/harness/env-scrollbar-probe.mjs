// Environment probe: does the headless Chromium used for this acceptance actually give vertical scrollbars
// LAYOUT SPACE? If it did not (e.g. overlay scrollbars, or --hide-scrollbars), a `scrollbar-gutter: stable`
// test would be vacuous: clientWidth would be identical with or without the gutter for the wrong reason.
// This probe is evidence that the acceptance run is non-vacuous.
import { CDP } from './cdp.mjs'

const cdp = await CDP.attach()
await cdp.send('Page.enable')
await cdp.send('Runtime.enable')
await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false })

const html1 = `<!doctype html><html><body style="margin:0"><div style="height:3000px"></div></body></html>`
let loaded = cdp.once('Page.loadEventFired')
await cdp.send('Page.navigate', { url: 'data:text/html,' + encodeURIComponent(html1) })
await loaded
const pageLevel = await cdp.evaluate(`(() => { const d = document.documentElement;
  return { innerWidth: window.innerWidth, docClientWidth: d.clientWidth, pageScrollbarSpace: window.innerWidth - d.clientWidth }; })()`)

const html2 = `<!doctype html><html><body style="margin:0">
<div id="stableShort" style="height:200px;overflow-y:auto;scrollbar-gutter:stable;width:600px"><div style="height:100px"></div></div>
<div id="autoShort"   style="height:200px;overflow-y:auto;width:600px"><div style="height:100px"></div></div>
<div id="stableTall"  style="height:200px;overflow-y:auto;scrollbar-gutter:stable;width:600px"><div style="height:900px"></div></div>
<div id="autoTall"    style="height:200px;overflow-y:auto;width:600px"><div style="height:900px"></div></div>
</body></html>`
loaded = cdp.once('Page.loadEventFired')
await cdp.send('Page.navigate', { url: 'data:text/html,' + encodeURIComponent(html2) })
await loaded
const containers = await cdp.evaluate(`(() => { const g = (id) => { const e = document.getElementById(id);
  return { clientWidth: e.clientWidth, offsetWidth: e.offsetWidth, scrollH: e.scrollHeight, clientH: e.clientHeight }; };
  return { stableShort: g('stableShort'), autoShort: g('autoShort'), stableTall: g('stableTall'), autoTall: g('autoTall') }; })()`)

const scrollbarWidth = pageLevel.pageScrollbarSpace
const out = {
  chromium: (await cdp.send('Browser.getVersion')).product,
  page_level_scrollbar_space_px: scrollbarWidth,
  classic_scrollbars_take_layout_space: scrollbarWidth > 0,
  containers,
  reads: {
    stable_gutter_keeps_clientWidth_when_no_overflow:
      containers.stableShort.clientWidth === containers.stableTall.clientWidth,
    auto_gutter_changes_clientWidth_when_scrollbar_appears:
      containers.autoShort.clientWidth !== containers.autoTall.clientWidth,
    auto_gutter_width_cost_px: containers.autoShort.clientWidth - containers.autoTall.clientWidth,
  },
}
console.log(JSON.stringify(out, null, 2))
cdp.close()
