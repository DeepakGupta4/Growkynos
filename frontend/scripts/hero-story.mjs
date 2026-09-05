/**
 * Captures the hero at several points in the typewriter cycle, so the typed
 * word, the note line and the swapped visual can be reviewed together — and
 * measures the widest typed line against its column to prove no overflow.
 *
 *   node scripts/hero-story.mjs <outDir> [baseUrl] [width] [height]
 */
import { existsSync, mkdirSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const OUT = process.argv[2] ?? './story'
const BASE = process.argv[3] ?? 'http://localhost:5173'
const W = Number(process.argv[4] ?? 1920)
const H = Number(process.argv[5] ?? 800)
mkdirSync(OUT, { recursive: true })

const exe = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].find((p) => existsSync(p))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: W, height: H })
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 90000 })
await page.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
await page.reload({ waitUntil: 'networkidle2', timeout: 90000 })

let widest = { word: '', w: 0 }
let column = 0

// Sample across roughly two full cycles of the four-word story.
for (let i = 0; i < 10; i++) {
  await sleep(i === 0 ? 4200 : 1900)
  const info = await page.evaluate(() => {
    const line = document.querySelector('h1 .hero-size:last-of-type')
    const typed = document.querySelector('h1 [aria-live] span')
    const col = document.querySelector('[data-hero-type]')
    const note = document.querySelector('[data-hero-note]')
    const r = line?.getBoundingClientRect()
    return {
      word: typed?.textContent ?? '',
      lineW: r ? Math.round(r.width) : 0,
      colW: col ? Math.round(col.getBoundingClientRect().width) : 0,
      note: note?.textContent ?? '',
      docOverflow: document.documentElement.scrollWidth > window.innerWidth,
    }
  })
  column = info.colW
  if (info.lineW > widest.w) widest = { word: info.word, w: info.lineW }
  console.log(
    `  ${String(i).padStart(2)}  "${info.word.padEnd(11)}"  line ${String(info.lineW).padStart(4)}px` +
      `  col ${info.colW}px  ${info.docOverflow ? 'DOC OVERFLOW ✗' : ''}  ${info.note.slice(0, 34)}`,
  )
  if (info.word.endsWith('.')) {
    await page.screenshot({ path: `${OUT}/story-${info.word.replace(/\W/g, '')}.png` })
  }
}

console.log(
  `\nwidest typed line: "${widest.word}" at ${widest.w}px vs column ${column}px  ` +
    `${widest.w > column ? '✗ OVERFLOWS' : '✓ fits'}`,
)

await browser.close()
