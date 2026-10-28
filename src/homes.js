// Listings filter, the "View" cursor over cards, the mortgage estimate and the enquiry form.
const eur = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export function initHomes() {
  const form = document.querySelector('.search')
  const grid = document.querySelector('[data-grid]')
  if (!form || !grid) return
  const cards = [...grid.querySelectorAll('.card')]
  const chips = [...document.querySelectorAll('.chip')]
  const out = document.querySelector('[data-count-out]')
  const empty = grid.querySelector('[data-empty]')

  const apply = () => {
    const area = form.elements.area.value
    const type = form.elements.type.value
    const [lo, hi] = (form.elements.price.value || '0-999').split('-').map(Number)
    const beds = +form.elements.beds.value
    const tags = chips.filter((c) => c.getAttribute('aria-pressed') === 'true').map((c) => c.dataset.tag)
    let n = 0
    for (const c of cards) {
      const d = c.dataset
      const own = d.tags.split(' ')
      const ok = (!area || d.area === area) && (!type || d.type === type) && +d.price >= lo && +d.price < hi &&
        +d.beds >= beds && tags.every((t) => own.includes(t))
      c.classList.toggle('is-hidden', !ok)
      if (ok) { n++; c.querySelector('.reveal-img')?.classList.add('is-in') }
    }
    out.textContent = `${n} home${n === 1 ? '' : 's'}`
    empty.hidden = n > 0
  }
  form.addEventListener('change', apply)
  form.addEventListener('submit', (e) => { e.preventDefault(); apply(); window.__lenis?.scrollTo(grid, { offset: -120, duration: 1.2 }) })
  chips.forEach((c) => c.addEventListener('click', () => {
    c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'))
    apply()
  }))
}

export function initCursor() {
  const cur = document.querySelector('.cursor')
  if (!cur || !matchMedia('(hover: hover) and (pointer: fine)').matches) return
  addEventListener('pointermove', (e) => {
    cur.style.setProperty('--x', `${e.clientX}px`)
    cur.style.setProperty('--y', `${e.clientY}px`)
    cur.classList.toggle('is-on', !!e.target.closest?.('.card'))
  }, { passive: true })
}

export function initCalc() {
  const form = document.querySelector('[data-calc]')
  if (!form) return
  const PRICE = 14500000
  const $ = (k) => form.querySelector(`[data-out="${k}"]`)
  const update = () => {
    const dep = +form.elements.dep.value
    const rate = +form.elements.rate.value
    const years = +form.elements.years.value
    $('dep').textContent = `${dep}% · ${eur.format(PRICE * dep / 100)}`
    $('rate').textContent = `${rate.toFixed(1)}%`
    $('years').textContent = `${years} years`
    const loan = PRICE * (1 - dep / 100)
    const r = rate / 100 / 12
    const n = years * 12
    $('monthly').textContent = eur.format(loan * r / (1 - (1 + r) ** -n))
  }
  form.addEventListener('input', update)
  update()
}

export function initContact() {
  const form = document.querySelector('[data-contact]')
  if (!form) return
  const err = form.querySelector('[data-err]')
  const done = form.querySelector('[data-done]')
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const { name, email } = form.elements
    err.hidden = true
    if (!name.value.trim()) { err.hidden = false; err.textContent = 'Add your name so we know who to reply to.'; name.focus(); return }
    if (!email.value || !email.checkValidity()) { err.hidden = false; err.textContent = 'That email address looks incomplete.'; email.focus(); return }
    const intent = form.elements.intent.value
    const what = { buy: 'a shortlist of homes', sell: 'a call about selling', rent: 'rental options', valuation: 'a free valuation' }[intent]
    done.hidden = false
    done.textContent = `Thank you, ${name.value.trim().split(' ')[0]}. An adviser will write to ${email.value} within one working day about ${what}.`
    form.querySelector('button[type="submit"]').disabled = true
  })
}
