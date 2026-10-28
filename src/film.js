// Scroll-driven walk-through: two long continuous Seedance shots played as an image sequence.
// Scroll never rests on a still: frames carry a weight, and the reading zones have a heavier weight,
// so the camera slows to a crawl there instead of stopping. Text, labels and effects ride on top.
import { makeConfig } from './walk-config.js'

let SPEED, ZONES, PANELS, SWEEPS, SPOTS, CHAPTERS, GLOW, FX
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const smooth = (t) => t * t * (3 - 2 * t)
const lerp = (a, b, t) => a + (b - a) * t
const win = (x, a, b, fade) => clamp((x - a) / fade) * clamp((b - x) / fade)

export function initFilm(opts) {
  let api = null
  const pending = { tick() { api?.tick(...arguments) }, chapterY: (i) => api?.chapterY(i) ?? 0 }
  fetch('frames/manifest.json').then((r) => r.json()).then((m) => {
    ;({ SPEED, ZONES, PANELS, SWEEPS, SPOTS, CHAPTERS, GLOW, FX } = makeConfig(m))
    api = setup(opts, m)
  }).catch((e) => { console.error(e); document.querySelector('.loader')?.classList.add('is-done') })
  return pending
}

function setup({ scrollToY }, manifest) {
  const root = document.documentElement
  const walk = document.querySelector('.walk')
  const canvas = document.querySelector('.film__canvas')
  const ctx = canvas.getContext('2d')
  const fx = document.querySelector('.film__fx')
  const fctx = fx.getContext('2d')
  const loader = document.querySelector('.loader')
  const rail = document.querySelector('.rail')
  const book = document.querySelector('.after')
  const nav = document.querySelector('.nav')
  const sweepsEl = document.querySelector('.sweeps')
  const spotsEl = document.querySelector('.spots')
  const tc = document.querySelector('.timecode')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

  let frames = []
  let N = manifest.count
  let W = [0] // cumulative weight at each frame
  let total = 1 // in screens
  let current = 0
  let vh = innerHeight
  let pointer = { x: 0, y: 0, tx: 0, ty: 0 }

  // ---------- weights ----------
  function weightAt(f) {
    let w = 1
    for (const z of ZONES) {
      const ramp = z.ramp ?? 14
      const k = clamp((f - (z.from - ramp)) / ramp) * clamp((z.to + ramp - f) / ramp)
      w = Math.max(w, 1 + (z.slow - 1) * smooth(k))
    }
    return w
  }
  function buildWeights() {
    W = new Float64Array(N)
    for (let f = 1; f < N; f++) W[f] = W[f - 1] + weightAt(f - 0.5)
    total = W[N - 1] / SPEED
    layout()
  }
  const wOf = (f) => {
    if (f > N - 1) return W[N - 1] + (f - (N - 1)) * SPEED
    const i = clamp(Math.floor(f), 0, N - 1)
    const j = Math.min(N - 1, i + 1)
    return lerp(W[i], W[j], f - i)
  }
  function frameOfW(w) {
    let lo = 0, hi = N - 1
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (W[m] <= w) lo = m; else hi = m }
    const span = W[hi] - W[lo] || 1
    return clamp(lo + (w - W[lo]) / span, 0, N - 1)
  }

  // ---------- layout ----------
  function layout() {
    vh = innerHeight
    walk.style.height = `${(total + 1) * vh}px`
    const dpr = Math.min(devicePixelRatio || 1, 2)
    for (const c of [canvas, fx]) { c.width = Math.round(innerWidth * dpr); c.height = Math.round(innerHeight * dpr) }
  }
  layout()
  addEventListener('resize', layout)
  addEventListener('pointermove', (e) => { pointer.tx = e.clientX / innerWidth - 0.5; pointer.ty = e.clientY / innerHeight - 0.5 }, { passive: true })

  const walkTop = () => walk.offsetTop
  const yForW = (w) => walkTop() + (w / (total * SPEED)) * (walk.offsetHeight - vh)
  const yForFrame = (f) => yForW(wOf(f))

  // ---------- panels: split headlines into words, mark every line for the staggered reveal ----------
  const panels = Object.entries(PANELS).map(([key, p]) => {
    const el = document.querySelector(`[data-panel="${key}"]`)
    const h = el.querySelector('h1, h2')
    if (h && key !== 'hero') {
      h.innerHTML = h.textContent.trim().split(/\s+/).map((w) => `<span class="w"><span>${w}</span></span>`).join(' ')
    }
    if (key === 'hero') {
      h.innerHTML = h.textContent.trim().split(/\s+/).map((w) => `<span class="word">${[...w].map((c) => `<span class="ch">${c}</span>`).join('')}</span>`).join(' ')
    }
    if (key === 'hero') h.querySelectorAll('.ch').forEach((c, i) => { c.style.transitionDelay = `${i * 0.04}s` })
    const items = []
    for (const child of el.children) {
      if (child.matches('h1, h2')) items.push(...[...child.querySelectorAll('.w, .ch')].map((n) => ({ el: n, word: true })))
      else if (child.matches('.specs, .suites, .hero__facts')) items.push(...[...child.children].map((n) => ({ el: n })))
      else items.push({ el: child })
    }
    items.forEach((it) => it.el.setAttribute('data-r', ''))
    return { key, ...p, el, items }
  })

  // ---------- sweeping chapter words ----------
  const sweeps = SWEEPS.map((s) => {
    const el = document.createElement('span')
    el.className = 'sweep'
    el.textContent = s.word
    sweepsEl.append(el)
    return { ...s, el }
  })

  // ---------- hotspots ----------
  const spots = SPOTS.map((s) => {
    const el = document.createElement('div')
    el.className = `spot spot--${s.side || 'r'}`
    el.innerHTML = `<i class="spot__dot"></i><span class="spot__line"></span><span class="spot__label"><b>${s.title}</b><small>${s.sub}</small></span>`
    spotsEl.append(el)
    return { ...s, el }
  })

  // ---------- rail ----------
  CHAPTERS.forEach((c, i) => {
    const li = document.createElement('li')
    li.innerHTML = `<button type="button" aria-label="Go to ${c.name}"><span>${c.name}</span></button>`
    li.querySelector('button').addEventListener('click', () => scrollToY(i === 0 ? 0 : yForFrame(c.frame)))
    rail.append(li)
  })
  const railItems = [...rail.children]

  // ---------- frames ----------
  function nearestLoaded(i) {
    for (let d = 0; d < N; d++) {
      if (frames[i - d]?.ok) return i - d
      if (frames[i + d]?.ok) return i + d
    }
    return -1
  }

  let view = { s: 1, ox: 0, oy: 0, w: 0, h: 0 } // image -> canvas transform, for hotspots
  function draw(f, t, sNorm) {
    const i0 = Math.floor(f)
    const a = nearestLoaded(i0)
    if (a < 0) return
    const img = frames[a].img
    const cw = canvas.width, ch = canvas.height
    // camera life: a slow push with the scroll, a breath with time, a little parallax from the pointer
    const breathe = reduce ? 0 : Math.sin(t / 5200) * 0.006
    const zoom = 1.04 + 0.025 * Math.sin(sNorm * Math.PI * 5) + breathe
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight) * zoom
    const w = img.naturalWidth * s, h = img.naturalHeight * s
    const px = reduce ? 0 : pointer.x * cw * 0.012
    const py = reduce ? 0 : pointer.y * ch * 0.012
    const ox = (cw - w) / 2 - px, oy = (ch - h) / 2 - py
    ctx.globalAlpha = 1
    ctx.drawImage(img, ox, oy, w, h)
    const b = i0 + 1
    const frac = f - i0
    if (a === i0 && frac > 0.02 && frames[b]?.ok) {
      ctx.globalAlpha = frac
      ctx.drawImage(frames[b].img, ox, oy, w, h)
      ctx.globalAlpha = 1
    }
    const dpr = cw / innerWidth
    view = { s: s / dpr, ox: ox / dpr, oy: oy / dpr, iw: img.naturalWidth, ih: img.naturalHeight }
  }

  buildWeights()
  async function load() {
    const small = innerWidth <= 760 || innerWidth * Math.min(devicePixelRatio || 1, 2) < 1400
    const set = small ? 'm' : 'd'
    frames = Array.from({ length: N }, (_, i) => ({ src: `frames/${set}/${String(i).padStart(4, '0')}.webp`, ok: false, img: null }))
    const order = [0]
    const seen = new Set(order)
    for (const step of [12, 6, 3, 1]) for (let i = 0; i < N; i += step) if (!seen.has(i)) { seen.add(i); order.push(i) }
    const gate = Math.ceil(N / 12) + 1
    let done = 0
    let next = 0
    const worker = async () => {
      while (next < order.length) {
        const i = order[next++]
        const img = new Image()
        img.src = frames[i].src
        try { await img.decode() } catch { continue }
        frames[i].img = img
        frames[i].ok = true
        done++
        if (done <= gate) {
          loader.style.setProperty('--p', done / gate)
          loader.querySelector('.loader__pct').textContent = `${Math.round((done / gate) * 100)}%`
          if (done === gate) { loader.classList.add('is-done'); root.classList.add('is-ready') }
        }
      }
    }
    await Promise.all(Array.from({ length: 8 }, worker))
  }
  load().catch((e) => { console.error(e); loader.classList.add('is-done') })

  // ---------- particles: dust in the warm rooms, fireflies outside ----------
  const motes = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: 0.6 + Math.random() * 1.8, v: 0.2 + Math.random() * 0.8, p: Math.random() * 6.28 }))
  function drawFx(t, f, scrollV) {
    const cw = fx.width, ch = fx.height
    fctx.clearRect(0, 0, cw, ch)
    let amount = 0, hue = 'warm'
    for (const z of FX) { const k = win(f, z.from, z.to, 20); if (k > amount) { amount = k * z.amount; hue = z.hue } }
    if (amount < 0.01 || reduce) return
    const dpr = cw / innerWidth
    fctx.globalCompositeOperation = 'lighter'
    for (const m of motes) {
      m.y -= (0.00004 * m.v + scrollV * 0.00002) * 16
      m.x += Math.sin(t / 2400 + m.p) * 0.00012
      if (m.y < -0.05) { m.y = 1.05; m.x = Math.random() }
      const tw = 0.5 + 0.5 * Math.sin(t / (hue === 'fire' ? 420 : 900) + m.p * 3)
      const a = amount * (hue === 'fire' ? 0.85 * tw : 0.32 + 0.25 * tw)
      const r = m.r * dpr * (hue === 'fire' ? 1.4 : 1)
      const g = fctx.createRadialGradient(m.x * cw, m.y * ch, 0, m.x * cw, m.y * ch, r * 4)
      const col = hue === 'fire' ? '255, 214, 140' : '255, 232, 200'
      g.addColorStop(0, `rgba(${col}, ${a})`)
      g.addColorStop(1, `rgba(${col}, 0)`)
      fctx.fillStyle = g
      fctx.fillRect(m.x * cw - r * 4, m.y * ch - r * 4, r * 8, r * 8)
    }
    fctx.globalCompositeOperation = 'source-over'
  }

  // ---------- per frame ----------
  let lastActive = -1
  let lastY = scrollY
  let vel = 0
  function tick(t = performance.now()) {
    const range = walk.offsetHeight - vh
    const p = clamp((scrollY - walkTop()) / range)
    const sW = p * total * SPEED
    const target = N > 1 ? frameOfW(sW) : 0
    current += (target - current) * 0.16
    if (Math.abs(target - current) < 0.004) current = target
    pointer.x += (pointer.tx - pointer.x) * 0.05
    pointer.y += (pointer.ty - pointer.y) * 0.05
    vel = vel * 0.9 + Math.abs(scrollY - lastY) * 0.1
    lastY = scrollY
    const f = current
    const fw = wOf(f)
    draw(f, t, p)
    drawFx(t, f, vel)

    // panels with staggered, scroll-driven reveals
    const scrim = { l: 0, r: 0, b: 0, c: 0 }
    for (const pn of panels) {
      const fromW = wOf(pn.from), toW = wOf(pn.to)
      const inK = pn.key === 'hero' ? 1 : clamp((fw - fromW) / (SPEED * 0.55))
      const outK = clamp((toW - fw) / (SPEED * 0.3))
      const a = Math.min(1, inK * 4) * outK
      pn.el.classList.toggle('is-on', a > 0.001)
      pn.el.style.opacity = a.toFixed(3)
      pn.el.style.translate = `0 ${((1 - outK) * -30).toFixed(1)}px`
      const n = pn.items.length
      pn.items.forEach((it, k) => {
        const start = (k / Math.max(1, n)) * 0.7
        const r = pn.key === 'hero' && !root.classList.contains('is-ready') ? 0 : smooth(clamp((inK - start) / 0.3))
        it.el.style.setProperty('--r', r.toFixed(3))
      })
      scrim[pn.side] = Math.max(scrim[pn.side], a)
    }
    const narrow = innerWidth <= 760
    root.style.setProperty('--scrim-l', (narrow ? 0 : scrim.l).toFixed(3))
    root.style.setProperty('--scrim-r', (narrow ? 0 : scrim.r).toFixed(3))
    root.style.setProperty('--scrim-b', Math.max(scrim.b, narrow ? Math.max(scrim.l, scrim.r) : 0).toFixed(3))
    root.style.setProperty('--scrim-t', scrim.c.toFixed(3))

    // sweeping words across the moves
    for (const s of sweeps) {
      const a = wOf(s.from), b = wOf(s.to)
      const k = clamp((fw - a) / (b - a))
      const on = k > 0 && k < 1
      s.el.style.opacity = on ? (Math.sin(k * Math.PI) * 0.9).toFixed(3) : 0
      s.el.style.transform = `translate3d(${lerp(55, -55, k).toFixed(2)}vw, -50%, 0)`
    }

    // hotspots pinned into the picture
    for (const sp of spots) {
      const a = win(f, sp.from, sp.to, 10)
      sp.el.style.opacity = a.toFixed(3)
      sp.el.classList.toggle('is-on', a > 0.05)
      if (a <= 0) continue
      const tr = sp.track
      let x = tr[0][1], y = tr[0][2]
      for (let i = 0; i < tr.length - 1; i++) {
        if (f >= tr[i][0] && f <= tr[i + 1][0]) { const k = (f - tr[i][0]) / (tr[i + 1][0] - tr[i][0]); x = lerp(tr[i][1], tr[i + 1][1], k); y = lerp(tr[i][2], tr[i + 1][2], k) }
        else if (f > tr[i + 1][0]) { x = tr[i + 1][1]; y = tr[i + 1][2] }
      }
      const sx = view.ox + x * view.iw * view.s
      const sy = view.oy + y * view.ih * view.s
      sp.el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`
    }

    // warm light leak
    let glow = 0
    for (const g of GLOW) glow = Math.max(glow, win(f, g.from, g.to, 24) * g.amount)
    root.style.setProperty('--leak', glow.toFixed(3))

    // darken behind the booking and the rest of the page
    const bt = book.getBoundingClientRect().top
    const dark = clamp((vh - bt) / (vh * 0.7))
    root.style.setProperty('--dark', Math.max(dark, scrim.c * 0.12).toFixed(3))

    // chapter rail + timecode
    let active = 0
    CHAPTERS.forEach((c, i) => { if (f >= c.frame - 20) active = i })
    if (active !== lastActive) {
      railItems.forEach((li, i) => li.classList.toggle('is-active', i === active))
      tc.querySelector('.timecode__name').textContent = CHAPTERS[active].name
      lastActive = active
    }
    const secs = f / manifest.fps
    tc.querySelector('.timecode__t').textContent = `00:${String(Math.floor(secs)).padStart(2, '0')}`
    tc.style.setProperty('--p', (f / (N - 1)).toFixed(4))
    tc.classList.toggle('is-hidden', dark > 0.2)
    rail.classList.toggle('is-hidden', dark > 0.3)
    nav.classList.toggle('is-solid', dark > 0.6)
  }

  window.__film = { yForFrame, frameOf: () => current, N: () => N, loaded: () => frames.filter((x) => x.ok).length }
  return { tick, chapterY: (i) => yForFrame(CHAPTERS[i].frame) }
}
