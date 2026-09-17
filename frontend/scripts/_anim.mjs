/* Scrolls the grid into view a frame at a time and records each card's
   transform/opacity, so "is it animating" is answered by the numbers. */
import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await b.newPage()
await p.setViewport({ width: 1600, height: 900 })
await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await p.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await p.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
await p.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

const gridTop = await p.evaluate(() => { const g = document.querySelector('[data-service-grid]'); return Math.round(g.getBoundingClientRect().top + window.scrollY) })
console.log('  grid document top:', gridTop)

/* park just above the trigger, then cross it */
await p.evaluate((v) => window.__lenis?.scrollTo(v, { immediate: true, force: true }), Math.max(0, gridTop - 1000))
await new Promise((r) => setTimeout(r, 1200))
console.log('  before crossing:', await p.evaluate(() => {
  const el = document.querySelector('[data-plate-id=app]')
  const cs = getComputedStyle(el)
  return `opacity=${cs.opacity} transform=${cs.transform}`
}))

await p.evaluate((v) => window.__lenis?.scrollTo(v, { immediate: true, force: true }), gridTop - 400)
for (let i = 0; i < 10; i++) {
  const s = await p.evaluate(() => {
    const el = document.querySelector('[data-plate-id=app]')
    const cs = getComputedStyle(el)
    return { o: parseFloat(cs.opacity).toFixed(2), t: cs.transform.slice(0, 44) }
  })
  console.log(`  t=${(i * 0.12).toFixed(2)}s  opacity=${s.o}  ${s.t}`)
  await new Promise((r) => setTimeout(r, 120))
}
await b.close()
