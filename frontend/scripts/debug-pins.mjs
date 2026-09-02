import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const exe = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
page.on('console', (m) => m.type() === 'error' && console.log('CONSOLE', m.text()))

await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
await page.evaluate(() => sessionStorage.setItem('gk:booted', '1'))
await page.reload({ waitUntil: 'networkidle2', timeout: 60000 })
await sleep(2500)

console.log('\n── sections ──')
const sections = await page.evaluate(() =>
  [...document.querySelectorAll('section[id]')].map((s) => ({
    id: s.id,
    top: Math.round(s.getBoundingClientRect().top + window.scrollY),
    h: Math.round(s.getBoundingClientRect().height),
  })),
)
sections.forEach((s) => console.log(`   ${s.id.padEnd(18)} top=${String(s.top).padStart(7)}  h=${s.h}`))

console.log('\n── has lenis?', await page.evaluate(() => Boolean(window.__lenis)))

const target = sections.find((s) => s.id === 'world-app')
const y = target.top + target.h * 0.34
console.log(`\n── scrolling to ${Math.round(y)} (world-app 34%) ──`)

await page.evaluate((v) => {
  if (window.__lenis) window.__lenis.scrollTo(v, { immediate: true, force: true })
  else window.scrollTo(0, v)
}, y)
await sleep(2200)

const deep = await page.evaluate(() => {
  const sec = document.querySelector('#world-app')
  const spacer = sec.querySelector('.pin-spacer')
  const stage = spacer?.firstElementChild ?? sec.firstElementChild
  const cs = stage ? getComputedStyle(stage) : null
  const r = stage?.getBoundingClientRect()
  const h2 = sec.querySelector('h2')
  const hr = h2?.getBoundingClientRect()
  const phone = sec.querySelector('[style*="width: 272px"]')
  const pr = phone?.getBoundingClientRect()
  const img = sec.querySelector('img')
  const ir = img?.getBoundingClientRect()
  const ics = img ? getComputedStyle(img) : null
  return {
    spacerH: spacer ? Math.round(spacer.getBoundingClientRect().height) : null,
    stageClass: stage?.className?.slice(0, 70),
    stagePos: cs?.position,
    stageRect: r && { t: Math.round(r.top), l: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) },
    stageTransform: cs?.transform?.slice(0, 60),
    h2Text: h2?.textContent,
    h2Rect: hr && { t: Math.round(hr.top), l: Math.round(hr.left) },
    phoneRect: pr && { t: Math.round(pr.top), l: Math.round(pr.left), w: Math.round(pr.width), h: Math.round(pr.height) },
    imgRect: ir && { t: Math.round(ir.top), l: Math.round(ir.left), w: Math.round(ir.width), h: Math.round(ir.height) },
    imgVis: ics?.visibility,
    imgOpacity: ics?.opacity,
    innerW: window.innerWidth,
    innerH: window.innerHeight,
  }
})
console.log('\n── deep ──')
console.log(deep)

const state = await page.evaluate(() => {
  const st = window.ScrollTrigger?.getAll?.() ?? []
  const stage = document.querySelector('#world-app')
  const pinned = stage?.querySelector('.pin-spacer') ? 'yes' : 'no'
  const phone = document.querySelector('#world-app [style*="width: 272px"], #world-app [style*="width:272px"]')
  const cs = phone ? getComputedStyle(phone) : null
  const anyVisible = [...document.querySelectorAll('#world-app img')].filter((i) => {
    const r = i.getBoundingClientRect()
    return r.width > 0 && r.top < window.innerHeight && r.bottom > 0 && getComputedStyle(i).visibility !== 'hidden'
  }).length
  return {
    scrollY: Math.round(window.scrollY),
    lenisScroll: Math.round(window.__lenis?.scroll ?? -1),
    triggers: st.length,
    hasPinSpacer: pinned,
    phoneFound: Boolean(phone),
    phoneOpacity: cs?.opacity,
    phoneTransform: cs?.transform?.slice(0, 90),
    visibleImagesInApp: anyVisible,
    bodyText: document.body.innerText.slice(0, 160).replace(/\n/g, ' | '),
  }
})
console.log(state)

await page.screenshot({ path: 'debug-app.png' })
console.log('\nwrote debug-app.png')
await browser.close()
