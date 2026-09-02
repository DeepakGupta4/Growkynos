import { existsSync, mkdirSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const OUT = process.argv[2] ?? './hero'
const BASE = process.argv[3] ?? 'http://localhost:5173'
mkdirSync(OUT, { recursive: true })

const exe = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] })

for (const [w, h] of [
  [1920, 800],
  [1920, 720],
  [1440, 900],
  [1280, 720],
]) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.evaluate(() => sessionStorage.setItem('gk:booted', '1'))
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(2800)
  await page.screenshot({ path: `${OUT}/hero-${w}x${h}.png` })
  await page.close()
}

await browser.close()
console.log(`Captured to ${OUT}`)
