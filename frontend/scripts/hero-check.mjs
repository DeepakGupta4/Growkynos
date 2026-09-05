/**
 * Measures the hero at a range of viewports and reports whether its content
 * actually fits — and where the floating fragments land.
 *   node scripts/hero-check.mjs [baseUrl]
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

const SIZES = [
  [1920, 720],
  [1920, 800],
  [1920, 900],
  // Real Chrome on a 1080p screen with a bookmarks bar lands here — the band
  // that was missing when the hero overflowed for the user at 858px.
  [1917, 858],
  [1917, 820],
  [1600, 880],
  [1600, 740],
  [1440, 900],
  [1280, 720],
  [1024, 640],
  [768, 900],
  [390, 844],
]

for (const [w, h] of SIZES) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h, isMobile: w < 768, hasTouch: w < 768 })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
  await page.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 })
  await sleep(2600)

  const r = await page.evaluate(() => {
    const q = (s) => document.querySelector(s)
    const box = (el) => {
      if (!el) return null
      const b = el.getBoundingClientRect()
      return { t: Math.round(b.top), b: Math.round(b.bottom), l: Math.round(b.left), r: Math.round(b.right) }
    }
    // Hidden fragments (display:none below lg) report an all-zero rect — skip
    // them rather than reporting a phantom off-screen element.
    const frags = [...document.querySelectorAll('[data-hero-frag]')]
      .filter((el) => el.getClientRects().length > 0)
      .map((el) => {
        const b = el.getBoundingClientRect()
        return {
          label: el.innerText.split('\n')[0],
          t: Math.round(b.top),
          l: Math.round(b.left),
          r: Math.round(b.right),
        }
      })
    const nav = box(document.querySelector('header'))
    return {
      vh: window.innerHeight,
      vw: window.innerWidth,
      navBottom: nav?.b ?? 0,
      h1: box(q('#hero h1')),
      actions: box(q('[data-hero-actions]')),
      meta: box(q('[data-hero-meta]')),
      scrollCue: box(q('[data-hero-scroll]')),
      frags,
    }
  })

  const overflowsBottom = r.actions && r.actions.b > r.vh
  const collidesNav = r.h1 && r.h1.t < r.navBottom
  const badFrags = r.frags.filter((f) => f.l < 0 || f.r > r.vw || f.t < r.navBottom)

  console.log(
    `\n${w}×${h}  ${overflowsBottom || collidesNav || badFrags.length ? '✗' : '✓'}` +
      `\n   h1        ${JSON.stringify(r.h1)}` +
      `\n   meta      ${JSON.stringify(r.meta)}` +
      `\n   actions   ${JSON.stringify(r.actions)}   ${overflowsBottom ? '<-- BELOW THE FOLD' : ''}` +
      `\n   scrollCue ${JSON.stringify(r.scrollCue)}` +
      (collidesNav ? `\n   HEADLINE UNDER NAV (nav bottom ${r.navBottom})` : '') +
      (badFrags.length ? `\n   OFF-SCREEN FRAGMENTS: ${JSON.stringify(badFrags)}` : ''),
  )

  await page.close()
}

await browser.close()
