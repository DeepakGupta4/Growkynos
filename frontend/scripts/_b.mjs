import { mkdirSync, readFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'
const OUT = process.argv[2]
mkdirSync(OUT, { recursive: true })
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const p = await b.newPage()
await p.setViewport({ width: 1600, height: 900 })
await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
await p.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 60000 })
await p.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
await p.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
await new Promise((r) => setTimeout(r, 6000))

const meas = async (tag) => {
  const w = await p.evaluate(() => document.querySelector('h1 .sr-only')?.textContent?.trim() || '?')
  await p.screenshot({ path: `${OUT}/${tag}-${w.replace(/[^A-Z]/gi,'')}.jpg`, type: 'jpeg', quality: 82 })
  const data = 'data:image/jpeg;base64,' + readFileSync(`${OUT}/${tag}-${w.replace(/[^A-Z]/gi,'')}.jpg`).toString('base64')
  return p.evaluate((src) => new Promise((res) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = 200; c.height = 112
      const cx = c.getContext('2d'); cx.drawImage(img, 0, 0, c.width, c.height)
      const d = cx.getImageData(0, 0, c.width, c.height).data
      let lum = 0, sat = 0, left = 0, ln = 0
      const n = d.length / 4
      for (let i = 0; i < d.length; i += 4) {
        const px = (i/4) % c.width
        const r = d[i]/255, g = d[i+1]/255, bl = d[i+2]/255
        const L = 0.2126*r + 0.7152*g + 0.0722*bl
        lum += L
        const mx = Math.max(r,g,bl), mn = Math.min(r,g,bl)
        sat += mx === 0 ? 0 : (mx-mn)/mx
        if (px < c.width * 0.42) { left += L; ln++ }
      }
      res({ lum: (lum/n)*100, sat: (sat/n)*100, left: (left/ln)*100 })
    }
    img.src = src
  }), data)
}
for (let i = 0; i < 3; i++) {
  const s = await meas(`f${i}`)
  console.log(`  frame ${i}:  whole ${s.lum.toFixed(1)}%   colour ${s.sat.toFixed(1)}%   text-side ${s.left.toFixed(1)}%`)
  await new Promise((r) => setTimeout(r, 3600))
}
await b.close()
