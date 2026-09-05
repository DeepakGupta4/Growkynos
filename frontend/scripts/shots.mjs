/**
 * Capture key moments of the journey for visual review.
 *   node scripts/shots.mjs [outDir] [baseUrl]
 */
import { existsSync, mkdirSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const OUT = process.argv[2] ?? './shots'
const BASE = process.argv[3] ?? 'http://localhost:5173'
mkdirSync(OUT, { recursive: true })

const exe = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Scroll through Lenis (it owns the position) and let scrub settle. */
const scrollTo = async (page, y, settle = 1400) => {
  await page.evaluate((target) => {
    if (window.__lenis) window.__lenis.scrollTo(target, { immediate: true, force: true })
    else window.scrollTo(0, target)
  }, y)
  await sleep(settle)
}

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
})

/* ── Boot sequence (fresh session) ── */
{
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await sleep(1100)
  await page.screenshot({ path: `${OUT}/00-boot.png` })
  await page.close()
}

/* ── Desktop journey ── */
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
await page.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
await page.reload({ waitUntil: 'networkidle2', timeout: 60000 })
await sleep(2200)
await page.screenshot({ path: `${OUT}/01-hero.png` })

const sectionTop = async (id) =>
  page.evaluate((sid) => {
    const el = document.getElementById(sid)
    return el ? el.getBoundingClientRect().top + window.scrollY : null
  }, id)

/** Scroll to `progress` (0-1) through a pinned section's own scroll range. */
async function shootSection(id, name, progress = 0.5) {
  const top = await sectionTop(id)
  if (top == null) return
  const next = await page.evaluate((sid) => {
    const el = document.getElementById(sid)
    const sib = el?.nextElementSibling
    return sib ? sib.getBoundingClientRect().top + window.scrollY : null
  }, id)
  const end = next ?? top + 900
  await scrollTo(page, top + (end - top) * progress)
  await page.screenshot({ path: `${OUT}/${name}.png` })
}

await shootSection('services', '02-services', 0.42)
await shootSection('world-app', '03-app', 0.34)
await shootSection('world-app', '04-app-late', 0.7)
await shootSection('world-web', '05-web', 0.55)
await shootSection('world-shopify', '06-shopify', 0.5)
await shootSection('world-wordpress', '07-wordpress', 0.45)
await shootSection('world-saas', '08-saas', 0.4)
await shootSection('world-design', '09-design', 0.6)
await shootSection('world-photo', '10-photo', 0.45)
await shootSection('world-video', '11-video', 0.4)
await shootSection('world-ai', '12-ai', 0.5)
await shootSection('projects', '13-universe-drift', 0.28)
await shootSection('projects', '14-universe-converge', 0.62)
await shootSection('projects', '15-universe-statement', 0.8)
await shootSection('studio', '16-studio', 0.2)
await shootSection('technology', '17-technology', 0.4)
await shootSection('contact', '18-cta', 0.4)

await scrollTo(page, await page.evaluate(() => document.body.scrollHeight), 1200)
await page.screenshot({ path: `${OUT}/19-footer.png` })
await page.close()

/* ── Routes ── */
for (const [path, name] of [
  ['/work', '20-work'],
  ['/work/meridian-health', '21-project'],
  ['/contact', '22-contact'],
]) {
  const p = await browser.newPage()
  await p.setViewport({ width: 1440, height: 900 })
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
  await p.goto(`${BASE}${path}`, { waitUntil: 'networkidle2', timeout: 60000 })
  await p.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
  await p.reload({ waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(1800)
  await p.screenshot({ path: `${OUT}/${name}.png` })
  await p.close()
}

/* ── Mobile ── */
{
  const m = await browser.newPage()
  await m.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
  await m.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
  await m.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
  await m.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
  await m.reload({ waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(2000)
  await m.screenshot({ path: `${OUT}/30-mobile-hero.png` })

  const h = await m.evaluate(() => document.body.scrollHeight)
  for (const [frac, name] of [
    [0.08, '31-mobile-services'],
    [0.2, '32-mobile-app'],
    [0.55, '33-mobile-saas'],
    [0.78, '34-mobile-universe'],
    [0.93, '35-mobile-studio'],
  ]) {
    await scrollTo(m, h * frac, 1300)
    await m.screenshot({ path: `${OUT}/${name}.png` })
  }
  await m.close()
}

await browser.close()
console.log(`Captured to ${OUT}`)
