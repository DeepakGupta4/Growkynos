/**
 * NAV CLEARANCE
 * -------------
 * Walks every section through its full scroll range and reports any VISIBLE
 * leaf text whose top sits inside the fixed navbar's band — content the nav is
 * covering.
 *
 * Sampling only a section's start is not enough: the pinned worlds hold the
 * viewport while their content moves through it, so the overlap appears part
 * way into the pin and nowhere else.
 *
 *   node scripts/nav-clearance.mjs [baseUrl]
 */
import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const exe = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p))

const b = await puppeteer.launch({
  executablePath: exe,
  headless: 'new',
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
})
const p = await b.newPage()
await p.setViewport({ width: 1600, height: 900 })
await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await p.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
await p.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
await p.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5000))

const navH = await p.evaluate(() =>
  Math.round(document.querySelector('header')?.getBoundingClientRect().height || 0),
)

const probe = (nh) => {
  const out = []
  for (const el of document.querySelectorAll('section, section *')) {
    if (el.closest('header')) continue
    const cs = getComputedStyle(el)
    if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.12) continue
    const txt = (el.textContent || '').trim()
    if (!txt || el.children.length > 0) continue
    const r = el.getBoundingClientRect()
    if (r.height < 4 || r.width < 4) continue
    if (r.top < nh && r.bottom > 6) out.push(`"${txt.slice(0, 22)}"@${Math.round(r.top)}`)
  }
  return out.slice(0, 2)
}

const SECTIONS = [
  'services', 'world-app', 'world-web', 'world-saas', 'world-ai',
  'more-services', 'projects', 'studio', 'technology', 'contact',
]

console.log(`\n──────── NAV CLEARANCE (nav is ${navH}px tall) ────────\n`)
let bad = 0
for (const id of SECTIONS) {
  const box = await p.evaluate((i) => {
    const el = document.getElementById(i)
    if (!el) return null
    return { top: Math.round(el.getBoundingClientRect().top + window.scrollY), h: el.offsetHeight }
  }, id)
  if (!box) { console.log(`  ${id.padEnd(14)} MISSING`); continue }

  const hits = []
  let passing = 0
  for (let f = 0; f <= 10; f++) {
    const y = box.top + Math.max(0, box.h - 900) * (f / 10)
    await p.evaluate((v) => { if (window.__lenis) window.__lenis.scrollTo(v, { immediate: true, force: true }); else window.scrollTo(0, v) }, y)
    await new Promise((r) => setTimeout(r, 400))
    const found = await p.evaluate(probe, navH)
    if (found.length && f === 0) hits.push(`landing ${found.join(' ')}`)
    else if (found.length) passing++
  }

  if (hits.length) {
    bad++
    console.log(`  ${id.padEnd(14)} UNDER NAV ON LANDING`)
    hits.slice(0, 3).forEach((h) => console.log(`                   ${h}`))
  } else {
    console.log(`  ${id.padEnd(14)} clear`)
  }
}
console.log(`\n  ${bad === 0 ? 'PASS — nothing sits under the nav' : `${bad} section(s) still covered`}\n`)
await b.close()
