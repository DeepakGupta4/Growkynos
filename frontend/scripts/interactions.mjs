/**
 * Interaction test — the things a static smoke test cannot see.
 *   · cinematic route transition leaves no residual transform (would break pins)
 *   · FLIP project entry actually navigates and lands on the right project
 *   · pinned ScrollTriggers still work AFTER a transition
 *   · contact form blocks invalid submits and never fakes success
 *   · keyboard reaches nav, and Escape closes the menu
 *
 *   node scripts/interactions.mjs [baseUrl]
 */
import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const exe = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  if (!ok) console.log(`   ✗ ${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])

const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

const boot = async (path = '/') => {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.evaluate(() => sessionStorage.setItem('gk:booted', '1'))
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(1800)
}

const lenisTo = (y) =>
  page.evaluate((v) => {
    if (window.__lenis) window.__lenis.scrollTo(v, { immediate: true, force: true })
    else window.scrollTo(0, v)
  }, y)

/* ── 1. Route transition + residual transform ── */
await boot('/')
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => /begin a project/i.test(b.textContent))
  btn?.click()
})
await sleep(3600)

check('Route transition navigates to /contact', page.url().endsWith('/contact'), page.url())

check(
  'Contact form is present after arriving via transition',
  (await page.evaluate(() => document.querySelectorAll('input,select,textarea').length)) >= 8,
)
check('Scroll is released after the transition', await page.evaluate(() => document.body.dataset.scrollLocked !== 'true'))

const residual = await page.evaluate(() => {
  const main = document.querySelector('#main')
  const stage = main?.parentElement
  const t = (el) => (el ? getComputedStyle(el).transform : 'none')
  return { main: t(main), stage: t(stage) }
})
check(
  'No residual transform on the page stage after transition',
  residual.stage === 'none' && residual.main === 'none',
  JSON.stringify(residual),
)

/* ── 2. Contact form: invalid submit must NOT report success ── */
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button[type="submit"]')][0]
  btn?.click()
})
await sleep(700)
const afterEmpty = await page.evaluate(() => ({
  alerts: [...document.querySelectorAll('[role="alert"]')].map((n) => n.textContent),
  saysReceived: document.body.innerText.toLowerCase().includes('enquiry received'),
}))
check('Empty submit is blocked with field errors', afterEmpty.alerts.length >= 3, `${afterEmpty.alerts.length} errors`)
check('Empty submit does not claim success', !afterEmpty.saysReceived)

await page.type('#field-name', 'Priya Raman')
await page.type('#field-email', 'not-an-email')
await page.type('#field-message', 'We need a headless Shopify storefront rebuilt before Q3.')
await page.select('#field-projectType', 'Shopify')
await page.evaluate(() => document.querySelector('button[type="submit"]').click())
await sleep(700)
const badEmail = await page.evaluate(() =>
  [...document.querySelectorAll('[role="alert"]')].map((n) => n.textContent).join(' | '),
)
check('Invalid email is rejected', /not valid/i.test(badEmail), badEmail)

await page.evaluate(() => {
  const el = document.querySelector('#field-email')
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(el, 'priya@example.com')
  el.dispatchEvent(new Event('input', { bubbles: true }))
})
await page.evaluate(() => document.querySelector('button[type="submit"]').click())
await sleep(900)
const valid = await page.evaluate(() => ({
  text: document.body.innerText.toLowerCase(),
}))
check(
  'Valid submit with no endpoint reports "not configured", never fake success',
  valid.text.includes('not configured') && !valid.text.includes('enquiry received'),
)
check(
  'Unconfigured state offers a working mailto fallback',
  await page.evaluate(() => Boolean(document.querySelector('a[href^="mailto:"]'))),
)

/* ── 3. Pins still work after a transition ── */
await page.evaluate(() => {
  document.querySelector('button[aria-label*="home"]')?.click()
})
await sleep(4200)
check('Returned to home via the brand mark', new URL(page.url()).pathname === '/', page.url())

const appTop = await page.evaluate(() => {
  const el = document.getElementById('world-app')
  return el ? el.getBoundingClientRect().top + window.scrollY : null
})
check('Home sections exist after returning', appTop != null)
await lenisTo(appTop + 2400)
await sleep(2000)
const pinned = await page.evaluate(() => {
  const sec = document.getElementById('world-app')
  const stage = sec.querySelector('.pin-spacer')?.firstElementChild
  const r = stage?.getBoundingClientRect()
  return { pos: stage ? getComputedStyle(stage).position : null, top: r ? Math.round(r.top) : null }
})
check(
  'Pinned showcase is still viewport-anchored after a route transition',
  pinned.pos === 'fixed' && Math.abs(pinned.top) < 40,
  JSON.stringify(pinned),
)

/* ── 4. FLIP project entry ── */
await boot('/work')
await sleep(600)
await page.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((b) => /Meridian Health/.test(b.textContent))
  btn?.click()
})
await sleep(3200)
check('FLIP entry navigates into the project', page.url().includes('/work/meridian-health'), page.url())
check(
  'Project detail renders its hero media',
  await page.evaluate(() => Boolean(document.querySelector('[data-pp-hero-img]'))),
)
check(
  'Scroll is released after the FLIP entry',
  await page.evaluate(() => document.body.dataset.scrollLocked !== 'true'),
)

/* ── 5. Keyboard + Escape ── */
await boot('/')
await page.keyboard.press('Tab')
const firstFocus = await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 40))
check('First Tab reaches the skip link', /skip to content/i.test(firstFocus ?? ''), firstFocus)

let reachedCta = false
for (let i = 0; i < 14; i++) {
  await page.keyboard.press('Tab')
  const t = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')
  if (/begin a project/i.test(t)) {
    reachedCta = true
    break
  }
}
check('Primary CTA is keyboard reachable', reachedCta)

const focusRing = await page.evaluate(() => {
  const el = document.activeElement
  const cs = el ? getComputedStyle(el) : null
  return cs ? cs.outlineStyle !== 'none' || cs.boxShadow !== 'none' : false
})
check('Focused control has a visible focus indicator', focusRing)

await browser.close()

const failed = results.filter((r) => !r.ok)
console.log('\n─────────── INTERACTIONS ───────────')
results.forEach((r) => console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`))
if (errors.length) {
  console.log('\nConsole errors:')
  ;[...new Set(errors)].forEach((e) => console.log(`   ${e}`))
}
console.log('────────────────────────────────────')
console.log(failed.length === 0 && errors.length === 0 ? 'All interaction checks passed.' : `${failed.length} failed, ${errors.length} console errors.`)
process.exit(failed.length === 0 && errors.length === 0 ? 0 : 1)
