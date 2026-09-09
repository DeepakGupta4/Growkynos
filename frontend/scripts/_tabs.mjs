/* One check per nav tab: the cover plays AND the page lands on the section.
   Targets the desktop capsule buttons — their labels are duplicated by the
   roll effect ("SERVICES\nSERVICES"), so an anchored regex silently matches
   the hidden overlay menu instead. Match on the first line only. */
import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await b.newPage()
const errs = []
p.on('pageerror', (e) => errs.push(String(e.message).slice(0, 110)))
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 110)) })
await p.setViewport({ width: 1600, height: 900 })
await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await p.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await p.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
await p.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5500))

for (const label of ['studio', 'services', 'projects', 'technology']) {
  await p.evaluate(() => window.__lenis?.scrollTo(0, { immediate: true, force: true }))
  await new Promise((r) => setTimeout(r, 800))

  const ok = await p.evaluate((t) => {
    const el = [...document.querySelectorAll('nav.shell button')]
      .find((b) => (b.innerText || '').split('\n')[0].trim().toLowerCase() === t)
    if (!el) return false
    el.click(); return true
  }, label)
  if (!ok) { console.log(`  ${label.padEnd(11)} BUTTON NOT FOUND`); continue }

  let peak = 0
  for (let i = 0; i < 20; i++) {
    const n = await p.evaluate(() => [...document.querySelectorAll('.z-transition > div')]
      .filter((d) => /flex-1/.test(d.className) && d.getBoundingClientRect().height > window.innerHeight * 0.5).length)
    if (n > peak) peak = n
    await new Promise((r) => setTimeout(r, 100))
  }
  await new Promise((r) => setTimeout(r, 2600))
  const top = await p.evaluate((id) => {
    const el = document.getElementById(id)
    return el ? Math.round(el.getBoundingClientRect().top) : null
  }, label)
  const y = await p.evaluate(() => Math.round(window.scrollY))
  const pass = peak >= 5 && top !== null && Math.abs(top) < 320
  console.log(`  ${label.padEnd(11)} cover:${peak}/6   scrollY:${String(y).padStart(6)}   section top:${String(top).padStart(5)}px   ${pass ? 'PASS' : 'FAIL'}`)
}
console.log('\n  console errors:', errs.length ? errs.join(' | ') : 'none')
await b.close()
