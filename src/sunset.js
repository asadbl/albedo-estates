// Tonight's sunset at the villa (NOAA sunrise equation), shown in the view chapter.
const LAT = 39.5455
const LON = 2.387
const TZ = 'Europe/Madrid'
const rad = Math.PI / 180

function sunsetFor(y, m, d) {
  const jdNoon = Date.UTC(y, m - 1, d, 12) / 86400000 + 2440587.5
  const n = Math.round(jdNoon - 2451545 + 0.0008)
  const J = n - LON / 360
  const M = (357.5291 + 0.98560028 * J) % 360
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad)
  const L = (M + C + 180 + 102.9372) % 360
  const transit = 2451545 + J + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad)
  const dec = Math.asin(Math.sin(L * rad) * Math.sin(23.4397 * rad))
  const cosW = (Math.sin(-0.833 * rad) - Math.sin(LAT * rad) * Math.sin(dec)) / (Math.cos(LAT * rad) * Math.cos(dec))
  const set = transit + Math.acos(cosW) / rad / 360
  return new Date((set - 2440587.5) * 86400000)
}

function localYMD(date) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
  return p.split('-').map(Number)
}

const fmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' })

export function initSunset() {
  const timeEl = document.querySelector('[data-sunset-time]')
  const leftEl = document.querySelector('[data-sunset-left]')
  if (!timeEl) return
  const update = () => {
    const now = new Date()
    let set = sunsetFor(...localYMD(now))
    let tomorrow = false
    if (set < now) {
      set = sunsetFor(...localYMD(new Date(now.getTime() + 86400000)))
      tomorrow = true
    }
    timeEl.textContent = fmt.format(set).toLowerCase()
    const mins = Math.round((set - now) / 60000)
    if (tomorrow) {
      timeEl.previousSibling.textContent = 'Tonight’s sun has already gone down in Port d’Andratx. Tomorrow it sets at '
      leftEl.textContent = `Local time there is ${fmt.format(now).toLowerCase()}.`
    } else {
      const h = Math.floor(mins / 60)
      const m = mins % 60
      leftEl.textContent = h ? `That’s ${h} h ${m} min from now, local time.` : `That’s ${m} minutes from now. Time to be on the terrace.`
    }
  }
  update()
  setInterval(update, 60000)
}
