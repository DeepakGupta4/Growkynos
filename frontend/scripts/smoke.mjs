/**
 * Runtime smoke test — GENTECHNE
 * ------------------------------
 * Drives the real site in a headless browser and fails on:
 *   · any console error or page exception
 *   · any failed network request
 *   · missing landmark content per route
 *
 * Also scrolls the whole home journey so every pinned ScrollTrigger, canvas
 * loop and lazy image actually executes — a build that compiles is not the
 * same as a build that runs.
 *
 *   node scripts/smoke.mjs [baseUrl]
 */
import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const BASE = process.argv[2] ?? 'http://localhost:5173'

const CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
]
const executablePath = CANDIDATES.find((p) => existsSync(p))
if (!executablePath) {
  console.error('No Chrome/Edge binary found.')
  process.exit(1)
}

/** Console noise we deliberately tolerate (third-party font CORS chatter etc). */
const IGNORE = [/favicon/i, /Download the React DevTools/i, /webkit-text-size-adjust/i]

const ROUTES = [
  { path: '/', name: 'Home', expect: ['GENTECHNE', 'BUILD', 'The archive'], scroll: true },
  { path: '/work', name: 'Work', expect: ['SELECTED WORK', 'Meridian Health'] },
  {
    path: '/work/meridian-health',
    name: 'Project detail',
    expect: ['Meridian Health', 'OUTCOMES', 'React Native', 'NEXT'],
    scroll: true,
  },
  { path: '/work/signalyard', name: 'Project detail 2', expect: ['Signalyard', 'BUILT WITH'], scroll: true },
  { path: '/contact', name: 'Contact', expect: ["WHAT YOU'RE", 'Project type', 'Send enquiry'] },
  { path: '/does-not-exist', name: '404', expect: ['NOTHING'] },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1440,900'],
})

let failures = 0
const report = []

for (const route of ROUTES) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
  // Headless Chrome reports reduce by default, which would silently exercise
  // only the static fallbacks. Force the full-motion path.
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])

  const errors = []
  const netFails = []

  page.on('console', (msg) => {
    if (msg.type() !== 'error' && msg.type() !== 'warning') return
    const text = msg.text()
    if (IGNORE.some((re) => re.test(text))) return
    if (msg.type() === 'error') errors.push(text)
  })
  page.on('pageerror', (err) => errors.push(`PAGE EXCEPTION: ${err.message}`))
  page.on('requestfailed', (req) => {
    const url = req.url()
    if (IGNORE.some((re) => re.test(url))) return
    if (url.startsWith('data:')) return
    netFails.push(`${req.failure()?.errorText} — ${url}`)
  })
  page.on('response', (res) => {
    if (res.status() >= 400 && !IGNORE.some((re) => re.test(res.url()))) {
      netFails.push(`HTTP ${res.status()} — ${res.url()}`)
    }
  })

  await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle2', timeout: 60000 })

  // Skip the boot sequence deterministically.
  await page.evaluate(() => {
    try {
      sessionStorage.setItem('gt:booted', '1')
    } catch {
      /* ignore */
    }
  })
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(1400)

  if (route.scroll) {
    // Walk the entire journey so every pinned timeline runs.
    // Must go through Lenis — it owns the scroll position and would otherwise
    // revert a raw window.scrollTo before any pinned timeline advanced.
    const height = await page.evaluate(() => document.body.scrollHeight)
    const steps = 110
    for (let i = 0; i <= steps; i++) {
      await page.evaluate((y) => {
        if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true })
        else window.scrollTo(0, y)
      }, (height / steps) * i)
      await sleep(60)
    }
    await sleep(700)
    await page.evaluate(() => {
      if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true, force: true })
      else window.scrollTo(0, 0)
    })
    await sleep(600)
  }

  // innerText reflects CSS text-transform, so compare case-insensitively.
  const text = (await page.evaluate(() => document.body.innerText)).toLowerCase()
  const missing = route.expect.filter((t) => !text.includes(t.toLowerCase()))

  const docHeight = await page.evaluate(() => document.body.scrollHeight)
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  )

  const ok = errors.length === 0 && netFails.length === 0 && missing.length === 0 && !horizontalOverflow
  if (!ok) failures++

  report.push({
    route: `${route.name} (${route.path})`,
    ok,
    height: `${docHeight}px`,
    errors,
    netFails,
    missing,
    horizontalOverflow,
  })

  await page.close()
}

/* Mobile pass on the home journey — a different choreography path entirely. */
{
  const page = await browser.newPage()
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
  const errors = []
  page.on('pageerror', (e) => errors.push(`PAGE EXCEPTION: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORE.some((re) => re.test(m.text()))) errors.push(m.text())
  })

  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(1200)

  const height = await page.evaluate(() => document.body.scrollHeight)
  for (let i = 0; i <= 60; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), (height / 60) * i)
    await sleep(55)
  }

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  )
  const ok = errors.length === 0 && !overflow
  if (!ok) failures++
  report.push({ route: 'Home @ 390px (mobile)', ok, errors, netFails: [], missing: [], horizontalOverflow: overflow })
  await page.close()
}

/* Reduced-motion pass — content must be reachable with no animation. */
{
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  const errors = []
  page.on('pageerror', (e) => errors.push(`PAGE EXCEPTION: ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error' && !IGNORE.some((re) => re.test(m.text()))) errors.push(m.text())
  })

  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(1200)
  const text = (await page.evaluate(() => document.body.innerText)).toLowerCase()
  const needed = ['App Development', 'Meridian Health', 'The studio', 'The stack', 'Ashgrove Supply']
  const missing = needed.filter((t) => !text.includes(t.toLowerCase()))
  const ok = errors.length === 0 && missing.length === 0
  if (!ok) failures++
  report.push({ route: 'Home (prefers-reduced-motion)', ok, errors, netFails: [], missing, horizontalOverflow: false })
  await page.close()
}

await browser.close()

console.log('\n─────────── SMOKE TEST ───────────')
for (const r of report) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.route}${r.height ? `  [${r.height}]` : ''}`)
  r.errors.forEach((e) => console.log(`        console: ${e}`))
  r.netFails.forEach((e) => console.log(`        network: ${e}`))
  if (r.missing.length) console.log(`        missing text: ${r.missing.join(' | ')}`)
  if (r.horizontalOverflow) console.log('        HORIZONTAL OVERFLOW')
}
console.log(`──────────────────────────────────`)
console.log(failures === 0 ? 'All checks passed.' : `${failures} route(s) failed.`)
process.exit(failures === 0 ? 0 : 1)
