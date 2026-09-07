/**
 * REFERENCE BOARD
 * ---------------
 * Captures the top of a set of studio/agency sites so their visual direction
 * can be compared side by side, with our own homepage in the same grid.
 *
 * The point is not "which site is best" — it is to separate DIRECTIONS
 * (light/editorial, bold colour, dense/business, dark immersive) so a
 * direction can be chosen deliberately instead of drifting into one.
 *
 *   node scripts/refs.mjs <outDir>
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const OUT = process.argv[2] ?? './refs'
mkdirSync(OUT, { recursive: true })

const exe = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const SITES = [
  // A — light / editorial: the work is the design, the page gets out of the way
  { id: 'koto',        group: 'A', name: 'Koto',            url: 'https://koto.com' },
  { id: 'pentagram',   group: 'A', name: 'Pentagram',       url: 'https://www.pentagram.com' },
  { id: 'instrument',  group: 'A', name: 'Instrument',      url: 'https://www.instrument.com' },
  { id: 'metalab',     group: 'A', name: 'MetaLab',         url: 'https://www.metalab.com' },

  // B — bold colour: strong brand colour carries the page, not black
  { id: 'basic',       group: 'B', name: 'Basic/Dept',      url: 'https://basicagency.com' },
  { id: 'dogstudio',   group: 'B', name: 'Dogstudio',       url: 'https://dogstudio.co' },
  { id: 'buck',        group: 'B', name: 'Buck',            url: 'https://buck.co' },
  { id: 'locomotive',  group: 'B', name: 'Locomotive',      url: 'https://locomotive.ca/en' },

  // C — dense / business: services and proof visible immediately
  { id: 'huge',        group: 'C', name: 'Huge',            url: 'https://www.hugeinc.com' },
  { id: 'workco',      group: 'C', name: 'Work & Co',       url: 'https://work.co' },
  { id: 'monks',       group: 'C', name: 'Monks',           url: 'https://www.monks.com' },
  { id: 'upperquad',   group: 'C', name: 'Upperquad',       url: 'https://upperquad.com' },

  // D — dark immersive: the direction Gentechne is currently in
  { id: 'immersiveg',  group: 'D', name: 'Immersive Garden', url: 'https://immersive-g.com' },
  { id: 'activetheory',group: 'D', name: 'Active Theory',   url: 'https://activetheory.net' },
  { id: 'resn',        group: 'D', name: 'Resn',            url: 'https://resn.co.nz' },

  // ours
  { id: 'gentechne',   group: 'X', name: 'Gentechne (ours)', url: 'http://localhost:5173' },
]

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: 'new',
  args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
})

const results = []
for (const site of SITES) {
  const page = await browser.newPage()
  try {
    await page.setViewport({ width: 1440, height: 860 })
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    )
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }])
    await page.goto(site.url, { waitUntil: 'networkidle2', timeout: 45000 })

    if (site.id === 'gentechne') {
      // skip the boot sequence so the hero itself is what gets compared
      await page.evaluate(() => sessionStorage.setItem('gt:booted', '1'))
      await page.reload({ waitUntil: 'networkidle2', timeout: 45000 })
    }
    // let intro animations settle and any cookie banner appear
    await sleep(site.id === 'gentechne' ? 4500 : 3500)

    /* Measure the actual page ground colour — this is the thing being judged. */
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)

    await page.screenshot({ path: `${OUT}/${site.id}.jpg`, type: 'jpeg', quality: 72 })
    results.push({ ...site, bg, ok: true })
    console.log(`  ok    ${site.name.padEnd(20)} ${bg}`)
  } catch (err) {
    results.push({ ...site, ok: false, error: String(err.message).slice(0, 90) })
    console.log(`  FAIL  ${site.name.padEnd(20)} ${String(err.message).slice(0, 70)}`)
  } finally {
    await page.close()
  }
}

writeFileSync(`${OUT}/index.json`, JSON.stringify(results, null, 2))
console.log(`\n  ${results.filter((r) => r.ok).length}/${results.length} captured -> ${OUT}`)
await browser.close()
