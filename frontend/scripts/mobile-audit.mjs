/**
 * MOBILE AUDIT
 * ------------
 * The page as a phone actually gets it. Captures every section and reports the
 * things that break on small screens and are invisible on a desktop monitor:
 *
 *   · horizontal overflow (the single most common phone bug)
 *   · content sitting under the fixed nav
 *   · text below a readable size
 *   · tap targets under the 44px guideline
 *   · sections that render with nothing in them
 *
 *   node scripts/mobile-audit.mjs <outDir> [baseUrl]
 */
import { existsSync, mkdirSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const OUT = process.argv[2] ?? './mobile'
const BASE = process.argv[3] ?? 'http://localhost:5173'
mkdirSync(OUT, { recursive: true })

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
const errs = []
p.on('pageerror', (e) => errs.push(String(e.message).slice(0, 110)))
p.on('console', (m) => {
  if (m.type() === 'error') errs.push(m.text().slice(0, 110))
})

/* iPhone 14-ish: the most common phone shape, with a real DPR. */
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
await p.setUserAgent(
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
)
await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await p.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 })
await p.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
await p.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 5500))

const navH = await p.evaluate(() =>
  Math.round(document.querySelector('header')?.getBoundingClientRect().height || 0),
)
const pageH = await p.evaluate(() => document.body.scrollHeight)
console.log(`\n──────── MOBILE AUDIT · 390×844 ────────`)
console.log(`  nav ${navH}px · page ${pageH}px (${(pageH / 844).toFixed(1)} screens)\n`)

const SECTIONS = [
  'hero', 'services', 'world-app', 'world-web', 'world-saas',
  'world-ai', 'more-services', 'projects', 'studio', 'technology', 'contact',
]

let problems = 0

for (const id of SECTIONS) {
  const box = await p.evaluate((i) => {
    const el = document.getElementById(i)
    if (!el) return null
    return { top: Math.round(el.getBoundingClientRect().top + window.scrollY), h: el.offsetHeight }
  }, id)
  if (!box) {
    console.log(`  ${id.padEnd(14)} MISSING`)
    continue
  }

  const found = { overflow: 0, underNav: [], tiny: [], smallTap: [], empty: true }

  for (let f = 0; f <= 4; f++) {
    const y = box.top + Math.max(0, box.h - 844) * (f / 4)
    await p.evaluate((v) => window.__lenis?.scrollTo(v, { immediate: true, force: true }), y)
    await new Promise((r) => setTimeout(r, 420))

    const s = await p.evaluate(
      ({ nh, sid }) => {
        const out = { overflow: 0, underNav: [], tiny: [], smallTap: [], visible: 0 }
        out.overflow = Math.max(0, document.documentElement.scrollWidth - window.innerWidth)

        const sec = document.getElementById(sid)
        for (const el of sec.querySelectorAll('*')) {
          const cs = getComputedStyle(el)
          if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.12) continue
          const r = el.getBoundingClientRect()
          if (r.bottom < 0 || r.top > window.innerHeight) continue
          const txt = (el.textContent || '').trim()

          if (txt && !el.children.length && r.height > 3) {
            out.visible++
            const fs = parseFloat(cs.fontSize)
            if (fs < 9.5) out.tiny.push(`${txt.slice(0, 16)}@${fs.toFixed(1)}px`)
            if (r.top < nh && r.bottom > 6) out.underNav.push(txt.slice(0, 18))
          }
          if ((el.tagName === 'BUTTON' || el.tagName === 'A') && r.width > 2) {
            if (r.height < 40 && txt) out.smallTap.push(`${txt.slice(0, 14)} ${Math.round(r.height)}px`)
          }
        }
        return out
      },
      { nh: navH, sid: id },
    )

    found.overflow = Math.max(found.overflow, s.overflow)
    if (s.visible > 2) found.empty = false
    for (const k of ['underNav', 'tiny', 'smallTap']) {
      for (const v of s[k]) if (!found[k].includes(v)) found[k].push(v)
    }

    if (f === 1) {
      await p.screenshot({ path: `${OUT}/${id}.jpg`, type: 'jpeg', quality: 80 })
    }
  }

  const issues = []
  if (found.overflow > 1) issues.push(`overflow ${found.overflow}px`)
  if (found.empty) issues.push('renders empty')
  if (found.underNav.length) issues.push(`under nav: ${found.underNav.slice(0, 2).join(', ')}`)
  if (found.tiny.length) issues.push(`tiny text: ${found.tiny.slice(0, 2).join(', ')}`)
  if (found.smallTap.length) issues.push(`small taps: ${found.smallTap.slice(0, 2).join(', ')}`)

  if (issues.length) problems++
  console.log(`  ${id.padEnd(14)} ${issues.length ? issues.join(' | ') : 'ok'}`)
}

console.log(`\n  console errors: ${errs.length ? errs.slice(0, 2).join(' | ') : 'none'}`)
console.log(`  ${problems === 0 ? 'PASS — nothing flagged on mobile' : `${problems} section(s) with issues`}\n`)
await b.close()
