// Screenshot the site at chosen scroll positions via headless Chrome (CDP).
// node tools/shots.mjs <url> <outdir> <W> <H>
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
const [,, url, out, Wa = '1440', Ha = '900'] = process.argv
const W = +Wa, H = +Ha
mkdirSync(out, { recursive: true })
const port = 9600 + Math.floor(Math.random() * 100)
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--hide-scrollbars', `--remote-debugging-port=${port}`, `--window-size=${W},${H}`, '--no-first-run', '--user-data-dir=/tmp/cdp-shot-' + port, '--use-angle=metal', 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let wsUrl
for (let i = 0; i < 60; i++) { try { const t = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page'); if (t) { wsUrl = t.webSocketDebuggerUrl; break } } catch {} await sleep(250) }
const ws = new WebSocket(wsUrl); await new Promise((r) => (ws.onopen = r))
let id = 0; const pending = new Map(); const logs = []
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } else if (m.method === 'Runtime.exceptionThrown') logs.push(JSON.stringify(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text)); else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push(m.params.args.map((a) => a.value || a.description).join(' ')) }
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value
await send('Page.enable'); await send('Runtime.enable')
const mobile = W < 760
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: mobile ? 2 : 1, mobile })
await send('Page.navigate', { url })
for (let i = 0; i < 120; i++) { await sleep(500); if (await ev('!!window.__film && window.__film.loaded() >= window.__film.N() - 2')) break }
await sleep(800)
const SEL = process.env.SEL || '#model'
await ev(`(() => { const y = document.querySelector('${SEL}').getBoundingClientRect().top + scrollY + (${+(process.env.OFF||0)}); window.scrollTo(0, y); window.__lenis && window.__lenis.scrollTo(y, { immediate: true, force: true }); return y })()`)
await sleep(+(process.env.WAIT || 7000))
const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 })
writeFileSync(`${out}/one.jpg`, Buffer.from(r.result.data, 'base64'))
console.log('errors:', logs.length ? logs.join('\n') : 'none')
ws.close(); chrome.kill()
process.exit(0)
