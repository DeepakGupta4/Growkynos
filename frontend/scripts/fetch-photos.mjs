/**
 * Fetches real photographs for the sections where a photograph actually
 * belongs — the studio composition and the photo-editing project.
 *
 * SOURCE: Lorem Picsum, which serves Unsplash photography under the Unsplash
 * License (free for commercial use, no attribution required). Deliberately not
 * scraped image results: those are other people's copyrighted work, and a
 * client-facing agency site is exactly the wrong place to carry that risk.
 * These are safe to keep in production, so nothing has to be swapped later.
 *
 * Seeds are fixed, so re-running gives the same photographs.
 *
 *   node scripts/fetch-photos.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = resolve(__dirname, '..', 'public')

const JOBS = [
  // Studio — workspace / people / making things
  { out: 'studio/01.jpg', seed: 'gentechne-studio-floor', w: 1200, h: 1500 },
  { out: 'studio/02.jpg', seed: 'gentechne-wall-crit', w: 1400, h: 900 },
  { out: 'studio/03.jpg', seed: 'gentechne-motion-review', w: 1100, h: 1100 },
  { out: 'studio/04.jpg', seed: 'gentechne-engineering', w: 1200, h: 1500 },
  { out: 'studio/05.jpg', seed: 'gentechne-proofs', w: 1400, h: 900 },
  // Photo-editing project — the one project that is genuinely photography
  { out: 'projects/creative/aurelia-campaign/01.jpg', seed: 'aurelia-flat', w: 1400, h: 933 },
  { out: 'projects/creative/aurelia-campaign/02.jpg', seed: 'aurelia-graded', w: 1400, h: 933 },
]

const get = (url, redirects = 0) =>
  new Promise((resolvePromise, reject) => {
    if (redirects > 5) return reject(new Error('too many redirects'))
    import('node:https').then(({ default: https }) => {
      https
        .get(url, { headers: { 'User-Agent': 'gentechne-asset-fetch' } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume()
            return resolvePromise(get(res.headers.location, redirects + 1))
          }
          if (res.statusCode !== 200) {
            res.resume()
            return reject(new Error(`HTTP ${res.statusCode}`))
          }
          const chunks = []
          res.on('data', (c) => chunks.push(c))
          res.on('end', () => resolvePromise(Buffer.concat(chunks)))
        })
        .on('error', reject)
    })
  })

let ok = 0
for (const job of JOBS) {
  const url = `https://picsum.photos/seed/${encodeURIComponent(job.seed)}/${job.w}/${job.h}`
  const full = resolve(PUBLIC, job.out)
  try {
    const buf = await get(url)
    if (buf.length < 2000) throw new Error(`suspiciously small (${buf.length}b)`)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, buf)
    console.log(`  ${job.out}  ${(buf.length / 1024).toFixed(0)} KB`)
    ok++
  } catch (err) {
    console.log(`  ${job.out}  FAILED — ${err.message}`)
  }
}

console.log(`\n${ok}/${JOBS.length} photographs fetched.`)
if (ok < JOBS.length) {
  console.log('Any that failed keep their existing generated artwork — nothing breaks.')
}
