import Lenis from 'lenis'
import './style.css'
import { initFilm } from './film.js'
import { initSunset } from './sunset.js'
import { initHomes, initCursor, initCalc, initContact } from './homes.js'

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const lenis = reduce ? null : new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 })
window.__lenis = lenis

function scrollToY(y) {
  if (lenis) lenis.scrollTo(y, { duration: 1.6 })
  else window.scrollTo({ top: y })
}

const film = initFilm({ scrollToY })

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]')
  if (!a) return
  const id = a.getAttribute('href').slice(1)
  const el = id === 'top' ? document.body : document.getElementById(id)
  if (!el) return
  e.preventDefault()
  const off = innerWidth <= 760 ? 70 : 90
  scrollToY(id === 'top' ? 0 : id === 'walk' ? film.chapterY(1) : el.getBoundingClientRect().top + window.scrollY - off)
})

// the statement lights up word by word as it crosses the screen
const words = document.querySelector('[data-words]')
let swords = []
if (words) {
  const walk = (node) => {
    for (const n of [...node.childNodes]) {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment()
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return
          if (/^\s+$/.test(t)) frag.append(t)
          else { const s = document.createElement('span'); s.className = 'sw'; s.textContent = t; frag.append(s) }
        })
        n.replaceWith(frag)
      } else walk(n)
    }
  }
  walk(words)
  swords = [...words.querySelectorAll('.sw')]
}
function lightWords() {
  if (!swords.length) return
  const r = words.getBoundingClientRect()
  const k = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)))
  const n = Math.round(k * swords.length)
  swords.forEach((s, i) => s.classList.toggle('is-lit', i < n))
}

function frame(t) {
  lenis?.raf(t)
  film.tick(t)
  lightWords()
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)

initSunset()
// service card photos: resolve against the page so they work under any base path
document.querySelectorAll('[data-bg]').forEach((el) => el.style.setProperty('--bg', `url("${new URL(el.dataset.bg, location.href)}")`))
initHomes()
initCursor()
initCalc()
initContact()

// the 3D model loads only when its section comes near
const mv = document.querySelector('[data-model]')
if (mv) {
  const near = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting)) { import('@google/model-viewer'); near.disconnect() }
  }, { rootMargin: '600px 0px' })
  near.observe(mv)
  document.querySelectorAll('[data-orbit]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('[data-orbit]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)))
    mv.autoRotate = false
    mv.cameraOrbit = b.dataset.orbit
    mv.cameraTarget = 'auto auto auto'
  }))
}

// after the walk: sections rise in, images unmask, numbers count up
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue
    e.target.classList.add('is-in')
    e.target.querySelectorAll?.('[data-count]').forEach(countUp)
    io.unobserve(e.target)
  }
}, { rootMargin: '0px 0px -10% 0px' })
document.querySelectorAll('.rise, .reveal-img').forEach((el, i) => {
  if (el.classList.contains('rise')) el.style.transitionDelay = `${(i % 3) * 0.08}s`
  io.observe(el)
})

function countUp(el) {
  const end = +el.dataset.count
  const rest = el.dataset.suffix || ''
  if (reduce) return
  const t0 = performance.now()
  const step = (t) => {
    const k = Math.min(1, (t - t0) / 1600)
    el.textContent = Math.round(end * (1 - (1 - k) ** 3)).toLocaleString('en-US') + rest
    if (k < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}
