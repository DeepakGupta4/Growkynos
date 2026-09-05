/**
 * Reports every element wider than the viewport, at a given width.
 *   node scripts/overflow.mjs 390
 */
import { existsSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const WIDTH = Number(process.argv[2] ?? 390)
const BASE = process.argv[3] ?? 'http://localhost:5173'

const exe = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p))

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: WIDTH, height: 844, isMobile: WIDTH < 768, hasTouch: WIDTH < 768 })
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])

await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
await page.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
await page.reload({ waitUntil: 'networkidle2', timeout: 60000 })
await new Promise((r) => setTimeout(r, 1500))

const scan = async (label) => {
  const out = await page.evaluate((vw) => {
    const bad = []
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return
      if (r.right > vw + 1 || r.left < -1) {
        // Skip anything inside a clipping ancestor — it cannot cause page scroll.
        let p = el.parentElement
        let clipped = false
        while (p && p !== document.body) {
          const o = getComputedStyle(p)
          if (o.overflowX === 'hidden' || o.overflow === 'hidden' || o.overflowX === 'clip') {
            clipped = true
            break
          }
          p = p.parentElement
        }
        if (clipped) return
        bad.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 110),
          left: Math.round(r.left),
          right: Math.round(r.right),
          id: el.id || el.dataset?.plateId || '',
        })
      }
    })
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bad: bad.slice(0, 25),
    }
  }, WIDTH)

  console.log(`\n── ${label} · overflow ${out.overflow}px ──`)
  out.bad.forEach((b) => console.log(`   <${b.tag}${b.id ? ` #${b.id}` : ''}> [${b.left} → ${b.right}]  ${b.cls}`))
  if (!out.bad.length) console.log('   (no unclipped offenders)')
}

await scan('top of page')

const height = await page.evaluate(() => document.body.scrollHeight)
for (const frac of [0.12, 0.3, 0.5, 0.68, 0.82, 0.94]) {
  await page.evaluate((y) => window.scrollTo(0, y), height * frac)
  await new Promise((r) => setTimeout(r, 700))
  await scan(`scroll ${Math.round(frac * 100)}%`)
}

await browser.close()
