/**
 * CONTRAST AUDIT
 * --------------
 * Walks the page and measures every piece of visible text against the colour
 * actually painted behind it, reporting anything below WCAG AA.
 *
 * "The site is too dark" is a real complaint but an unactionable one until it
 * is a list of specific elements with specific ratios — which is what this
 * produces. Effective colour accounts for opacity, so text at 45% opacity is
 * judged on what a reader really sees, not on its declared colour.
 *
 *   node scripts/contrast-audit.mjs [baseUrl]
 */
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
await page.setViewport({ width: 1600, height: 900 })
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 90000 })
await page.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
await page.reload({ waitUntil: 'networkidle2', timeout: 90000 })
await sleep(4000)

const docHeight = await page.evaluate(() => document.documentElement.scrollHeight)
const findings = new Map()

for (let y = 0; y < docHeight - 900; y += 700) {
  await page.evaluate((v) => {
    if (window.__lenis) window.__lenis.scrollTo(v, { immediate: true })
    else window.scrollTo(0, v)
  }, y)
  await sleep(320)

  const batch = await page.evaluate(() => {
    const parse = (c) => {
      const m = c.match(/[\d.]+/g)
      if (!m) return null
      return { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] }
    }
    const lum = ({ r, g, b }) => {
      const f = (v) => {
        v /= 255
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
      }
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const ratio = (a, b) => {
      const l1 = lum(a)
      const l2 = lum(b)
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    }
    const over = (fg, bg) => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    })

    /** Walk up for the first non-transparent painted background. */
    const bgOf = (el) => {
      let node = el
      let depth = 0
      while (node && depth < 20) {
        const c = parse(getComputedStyle(node).backgroundColor)
        if (c && c.a > 0.6) return c
        node = node.parentElement
        depth++
      }
      return { r: 5, g: 5, b: 7, a: 1 } // page ground
    }

    /** Cumulative opacity from ancestors. */
    const effectiveAlpha = (el) => {
      let a = 1
      let node = el
      let depth = 0
      while (node && depth < 20) {
        a *= Number(getComputedStyle(node).opacity)
        node = node.parentElement
        depth++
      }
      return a
    }

    const out = []
    document.querySelectorAll('p,span,a,li,h1,h2,h3,h4,dt,dd,button,label').forEach((el) => {
      const text = [...el.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim())
        .join(' ')
        .trim()
      if (text.length < 2) return

      const r = el.getBoundingClientRect()
      if (r.width < 8 || r.height < 6) return
      if (r.bottom < 0 || r.top > window.innerHeight) return

      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden') return
      const alpha = effectiveAlpha(el)
      // Only judge text sitting at its designed opacity. Anything mid-fade is
      // transiently faint by design, and counting it buried the genuine colour
      // failures under hundreds of animation frames.
      if (alpha < 0.85) return
      // Gradient-filled text reports transparent; not measurable this way.
      if (cs.webkitTextFillColor === 'transparent' || cs.color === 'rgba(0, 0, 0, 0)') return

      const fg = parse(cs.color)
      if (!fg) return
      const bg = bgOf(el)
      const painted = over({ ...fg, a: fg.a * alpha }, bg)
      const cr = ratio(painted, bg)

      const size = parseFloat(cs.fontSize)
      const bold = Number(cs.fontWeight) >= 700
      const large = size >= 24 || (size >= 18.66 && bold)
      const need = large ? 3 : 4.5
      if (cr >= need) return

      out.push({
        text: text.slice(0, 34),
        cls: (el.className || '').toString().slice(0, 42),
        size: Math.round(size),
        color: cs.color,
        alpha: Number(alpha.toFixed(2)),
        ratio: Number(cr.toFixed(2)),
        need,
      })
    })
    return out
  })

  for (const f of batch) {
    const key = `${f.cls}|${f.size}|${f.ratio}`
    if (!findings.has(key)) findings.set(key, { ...f, count: 0 })
    findings.get(key).count++
  }
}

const list = [...findings.values()].sort((a, b) => a.ratio - b.ratio)
console.log(`\n──────── BELOW WCAG AA (${list.length} distinct) ────────\n`)
for (const f of list.slice(0, 26)) {
  console.log(
    `  ${String(f.ratio).padStart(5)} : ${String(f.need).padEnd(4)} ${String(f.size + 'px').padEnd(6)} ` +
      `a=${String(f.alpha).padEnd(5)} ${f.text.padEnd(36)} .${f.cls}`,
  )
}
console.log(`\nworst: ${list[0]?.ratio ?? 'n/a'}  |  total distinct failures: ${list.length}`)
await browser.close()
