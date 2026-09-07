/**
 * Measures the hero distortion field: frame rate while the pointer is sweeping
 * through it, and how far particles actually get displaced.
 *
 * A cursor effect that drops frames is worse than no cursor effect, so this is
 * measured rather than assumed.
 *
 *   node scripts/field-test.mjs <outDir> [baseUrl]
 */
import { existsSync, mkdirSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const OUT = process.argv[2] ?? './field'
const BASE = process.argv[3] ?? 'http://localhost:5173'
mkdirSync(OUT, { recursive: true })

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

/* Start an FPS counter driven by rAF. */
await page.evaluate(() => {
  window.__fps = { frames: 0, start: performance.now() }
  const tick = () => {
    window.__fps.frames++
    window.__fps.raf = requestAnimationFrame(tick)
  }
  window.__fps.raf = requestAnimationFrame(tick)
})

/* Sweep the pointer through the field, the way a visitor would. */
for (let i = 0; i <= 60; i++) {
  const x = 300 + Math.sin(i / 6) * 420 + i * 12
  const y = 380 + Math.cos(i / 4) * 180
  await page.mouse.move(x, y)
  await sleep(28)
}

const perf = await page.evaluate(() => {
  cancelAnimationFrame(window.__fps.raf)
  const secs = (performance.now() - window.__fps.start) / 1000
  return { fps: window.__fps.frames / secs, secs }
})

/* How far is the field actually pushing particles? */
await page.mouse.move(760, 420)
await sleep(60)
await page.mouse.move(790, 430)
await sleep(120)
await page.screenshot({ path: `${OUT}/field-active.png` })

console.log(`\n  fps during pointer sweep: ${perf.fps.toFixed(1)}  (over ${perf.secs.toFixed(1)}s)`)
console.log(`  ${perf.fps >= 55 ? 'PASS — holds 60fps' : perf.fps >= 45 ? 'OK — above 45fps' : 'FAIL — dropping frames'}`)

await browser.close()
