/**
 * DIRECTION BOARD
 * ---------------
 * Turns the captures from refs.mjs into one page that can be scrolled and
 * pointed at, grouped by the only axis that matters here: what actually fills
 * the screen.
 *
 * Each capture is also MEASURED — mean luminance and mean saturation — because
 * "it feels too black and empty" is a judgement that can be checked rather than
 * argued about. Luminance says how dark the frame is; saturation says whether
 * anything but grey is on it. A frame low on both is the one that reads empty.
 *
 *   node scripts/board.mjs <refsDir> <outHtml>
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import puppeteer from 'puppeteer-core'

const REFS = process.argv[2]
const OUT = process.argv[3]

const exe = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => existsSync(p))

/*
 * Grouped by what fills the frame, not by palette. Palette is the symptom the
 * brief complained about; "nothing occupies the screen" is the cause, and the
 * captures separate cleanly along it.
 */
const GROUPS = [
  {
    key: 'light',
    title: 'The work fills the screen, on a light ground',
    thesis:
      'Nothing here asks you to admire the page. A project photograph or a running video takes the frame within the first second, and the type is there to name it.',
    items: [
      {
        id: 'instrument',
        name: 'Instrument',
        url: 'https://www.instrument.com',
        note: 'The clearest answer to both complaints at once. White ground, the studio name set enormous in black, one saturated purple band, then two pieces of real client work playing side by side. Not one pixel of decorative background.',
      },
      {
        id: 'workco',
        name: 'Work & Co',
        url: 'https://work.co',
        note: 'The most business-like of the set. A plain sentence saying what they do, a press quote naming Apple, Google and Nike as proof, then the work. No effects at all — and it still reads expensive.',
      },
      {
        id: 'pentagram',
        name: 'Pentagram',
        url: 'https://www.pentagram.com',
        note: 'A full-bleed photograph of an actual product carries the whole viewport, with the project name captioned quietly over it. The only interactive flourish is a sentence you can configure: "We design ___ for ___".',
      },
      {
        id: 'buck',
        name: 'Buck',
        url: 'https://buck.co',
        note: 'Skips the hero entirely. A three-line description at the top, then straight into work tiles. Everything below the fold on our site is above the fold on theirs.',
      },
    ],
  },
  {
    key: 'dark',
    title: 'The work fills the screen, on a dark ground',
    thesis:
      'These are darker than our site — and none of them feel empty. That is the whole point: dark was never the problem. Something has to occupy the frame.',
    items: [
      {
        id: 'metalab',
        name: 'MetaLab',
        url: 'https://www.metalab.com',
        note: 'Measured darker than ours, and reads rich. One enormous rendered object fills the frame edge to edge, and the left rail names Robinhood, Midjourney, Uber, Calvin Klein and Headspace. Proof and image, nothing else.',
      },
      {
        id: 'dogstudio',
        name: 'Dogstudio / Dept',
        url: 'https://dogstudio.co',
        note: 'A dark blue-violet scene with a full-bleed 3D creature behind a serif headline. The ground is dark but never bare — the image is the ground.',
      },
      {
        id: 'huge',
        name: 'Huge',
        url: 'https://www.hugeinc.com',
        note: 'A black page that does not read black, because a giant magenta object occupies the centre of it. One colour, used at enormous scale, does all the work.',
      },
      {
        id: 'monks',
        name: 'Monks',
        url: 'https://www.monks.com',
        note: 'A full-bleed collage of real client screens sits behind the headline. Busiest of the set, and the closest to "you can immediately tell what this company ships".',
      },
    ],
  },
  {
    key: 'empty',
    title: 'Type fills the screen, and nothing else does',
    thesis:
      'This is where Gentechne currently sits. Worth seeing that the group includes an Awwwards Agency of the Year — and that it is still the group that reads empty.',
    items: [
      {
        id: 'gentechne',
        name: 'Gentechne — ours',
        url: 'http://localhost:5173',
        ours: true,
        note: 'Black ground, one huge statement, a small mockup, and a lot of nothing between them. The right two-thirds of the frame carries a browser mock that is smaller than the headline beside it. This is the frame you said you did not like.',
      },
      {
        id: 'immersiveg',
        name: 'Immersive Garden',
        url: 'https://immersive-g.com',
        note: 'Awwwards Agency of the Year 2025 — and emptier than ours. One line of text, a small plaster sculpture, grey everywhere else. Award juries and prospective clients are not judging the same thing.',
      },
      {
        id: 'koto',
        name: 'Koto',
        url: 'https://koto.com',
        note: 'A near-black frame with the name low in the corner and a yellow logo. Their background video had not started here, which is exactly the risk of this direction: when the one thing that fills the screen is late, there is nothing behind it.',
      },
      {
        id: 'upperquad',
        name: 'Upperquad',
        url: 'https://upperquad.com',
        note: 'Off-white rather than black, and still mostly empty — a centred sentence with work starting only at the very bottom edge. Proof that lightening our palette alone would not fix this.',
      },
    ],
  },
]

/* ── measure ─────────────────────────────────────────────────────────── */

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.goto('about:blank')

const all = GROUPS.flatMap((g) => g.items)
for (const item of all) {
  const b64 = readFileSync(`${REFS}/${item.id}.jpg`).toString('base64')
  item.data = 'data:image/jpeg;base64,' + b64

  const stats = await page.evaluate(
    (src) =>
      new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          const c = document.createElement('canvas')
          // Downsampled: the averages are unchanged and this stays instant.
          c.width = 180
          c.height = 108
          const cx = c.getContext('2d')
          cx.drawImage(img, 0, 0, c.width, c.height)
          const d = cx.getImageData(0, 0, c.width, c.height).data
          let lum = 0
          let sat = 0
          const n = d.length / 4
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i] / 255
            const g = d[i + 1] / 255
            const b = d[i + 2] / 255
            // Rec. 709 luma — matches how bright the frame actually looks.
            lum += 0.2126 * r + 0.7152 * g + 0.0722 * b
            const mx = Math.max(r, g, b)
            const mn = Math.min(r, g, b)
            sat += mx === 0 ? 0 : (mx - mn) / mx
          }
          resolve({ lum: (lum / n) * 100, sat: (sat / n) * 100 })
        }
        img.src = src
      }),
    item.data,
  )
  item.lum = stats.lum
  item.sat = stats.sat
  console.log(`  ${item.name.padEnd(22)} light ${stats.lum.toFixed(1).padStart(5)}%   colour ${stats.sat.toFixed(1).padStart(5)}%`)
}

await browser.close()

/* ── render ──────────────────────────────────────────────────────────── */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const host = (u) => u.replace(/^https?:\/\//, '').replace(/\/$/, '')

const ours = all.find((i) => i.ours)
const metalab = all.find((i) => i.id === 'metalab')
const ig = all.find((i) => i.id === 'immersiveg')

const card = (item) => `
      <figure class="card${item.ours ? ' card--ours' : ''}">
        <button class="shot" type="button" data-full="${item.id}" aria-label="Enlarge ${esc(item.name)}">
          <img src="${item.data}" alt="Homepage of ${esc(item.name)}" loading="lazy" decoding="async">
        </button>
        <figcaption>
          <div class="card__head">
            <h3>${esc(item.name)}</h3>
            ${
              item.ours
                ? '<span class="tag">this is us</span>'
                : `<a class="visit" href="${item.url}" target="_blank" rel="noopener">${esc(host(item.url))} &#8599;</a>`
            }
          </div>
          <dl class="metrics">
            <div><dt>light</dt><dd>${item.lum.toFixed(0)}%</dd></div>
            <div><dt>colour</dt><dd>${item.sat.toFixed(0)}%</dd></div>
          </dl>
          <p>${esc(item.note)}</p>
        </figcaption>
      </figure>`

const section = (g) => `
    <section class="group" id="g-${g.key}">
      <header class="group__head">
        <h2>${esc(g.title)}</h2>
        <p>${esc(g.thesis)}</p>
      </header>
      <div class="grid">${g.items.map(card).join('')}</div>
    </section>`

const html = `<title>Which Direction for Gentechne</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
  :root {
    --paper:   #E9EBE8;
    --surface: #F8F9F7;
    --ink:     #171A18;
    --muted:   #5F655F;
    --rule:    #D2D6D1;
    --accent:  #1F3FBF;
    --flag:    #A63A1E;
    --shadow:  0 1px 2px rgba(23,26,24,.06), 0 8px 24px rgba(23,26,24,.07);
    --display: 'Archivo', 'Helvetica Neue', Arial, sans-serif;
    --body:    'Newsreader', Georgia, 'Times New Roman', serif;
    --mono:    'JetBrains Mono', ui-monospace, 'Cascadia Mono', Consolas, monospace;
  }
  :root:not([data-theme="light"]) { color-scheme: light; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --paper:   #101311;
      --surface: #191D1A;
      --ink:     #E6E9E5;
      --muted:   #949A93;
      --rule:    #2A302C;
      --accent:  #90A8FF;
      --flag:    #E28A68;
      --shadow:  0 1px 2px rgba(0,0,0,.4), 0 10px 30px rgba(0,0,0,.35);
      color-scheme: dark;
    }
  }
  :root[data-theme="dark"] {
    --paper:   #101311;
    --surface: #191D1A;
    --ink:     #E6E9E5;
    --muted:   #949A93;
    --rule:    #2A302C;
    --accent:  #90A8FF;
    --flag:    #E28A68;
    --shadow:  0 1px 2px rgba(0,0,0,.4), 0 10px 30px rgba(0,0,0,.35);
    color-scheme: dark;
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--body);
    font-size: 17px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 1140px; margin: 0 auto; padding: 0 24px; }

  /* ── masthead ── */
  .mast { padding: 56px 0 8px; border-bottom: 1px solid var(--rule); }
  .kicker {
    font-family: var(--mono); font-size: 11px; font-weight: 600;
    letter-spacing: .16em; text-transform: uppercase; color: var(--muted);
    margin: 0 0 18px;
  }
  .mast h1 {
    font-family: var(--display); font-weight: 700;
    font-size: clamp(2rem, 5.4vw, 3.5rem); line-height: 1.02;
    letter-spacing: -.025em; text-wrap: balance; margin: 0 0 20px; max-width: 20ch;
  }
  .mast h1 em { font-style: normal; color: var(--flag); }
  .stand { font-size: clamp(1.05rem, 1.9vw, 1.3rem); color: var(--muted); max-width: 62ch; margin: 0 0 40px; font-weight: 300; }

  /* ── the measured proof ── */
  .proof { padding: 44px 0 8px; }
  .proof > h2 {
    font-family: var(--display); font-weight: 600; font-size: 1.05rem;
    letter-spacing: -.01em; margin: 0 0 6px;
  }
  .proof > p { margin: 0 0 26px; color: var(--muted); max-width: 66ch; font-size: 1rem; }
  .chart { display: flex; flex-direction: column; gap: 11px; }
  .chart__key { display: flex; gap: 20px; font-family: var(--mono); font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
  .chart__key span { display: inline-flex; align-items: center; gap: 7px; }
  .sw { width: 16px; height: 7px; border-radius: 4px; display: inline-block; }
  .sw--lum { background: color-mix(in srgb, var(--ink) 55%, var(--paper)); }
  .sw--sat { background: var(--accent); }
  .row { display: grid; grid-template-columns: minmax(96px, 150px) 1fr 74px; gap: 16px; align-items: center; }
  .row__name { font-family: var(--display); font-weight: 600; font-size: .84rem; letter-spacing: -.005em; }
  .row--ours .row__name { color: var(--flag); }
  .row__bars { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .tk { height: 7px; border-radius: 4px; background: color-mix(in srgb, var(--rule) 45%, transparent); }
  .fl { height: 100%; border-radius: 4px; min-width: 2px; }
  .fl--lum { background: color-mix(in srgb, var(--ink) 55%, var(--paper)); }
  .fl--sat { background: var(--accent); }
  .row--ours .fl--lum, .row--ours .fl--sat { background: var(--flag); }
  .row__vals { display: flex; gap: 8px; font-family: var(--mono); font-size: .74rem; font-variant-numeric: tabular-nums; color: var(--muted); justify-content: flex-end; }
  .row__vals span { min-width: 4ch; text-align: right; }
  .proof__note { border-left: 2px solid var(--flag); padding-left: 16px; margin: 44px 0 0; max-width: 64ch; font-size: 1rem; }
  .proof__note em { font-style: italic; color: var(--ink); }

  /* ── groups ── */
  .group { padding: 52px 0 8px; border-top: 1px solid var(--rule); margin-top: 44px; }
  .group__head { max-width: 66ch; margin-bottom: 30px; }
  .group__head h2 {
    font-family: var(--display); font-weight: 700;
    font-size: clamp(1.3rem, 2.6vw, 1.75rem); line-height: 1.15;
    letter-spacing: -.02em; text-wrap: balance; margin: 0 0 10px;
  }
  .group__head p { margin: 0; color: var(--muted); font-size: 1.05rem; }
  #g-empty .group__head h2 { color: var(--flag); }

  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 34px 26px; }
  @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }

  .card { margin: 0; display: flex; flex-direction: column; gap: 14px; }
  .shot {
    display: block; width: 100%; padding: 0; border: 1px solid var(--rule);
    border-radius: 3px; overflow: hidden; background: var(--surface);
    cursor: zoom-in; box-shadow: var(--shadow); transition: transform .18s ease;
  }
  .shot img { display: block; width: 100%; aspect-ratio: 1440 / 860; object-fit: cover; }
  .shot:hover { transform: translateY(-2px); }
  .shot:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  .card--ours .shot { border: 2px solid var(--flag); }

  .card__head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .card__head h3 { font-family: var(--display); font-weight: 600; font-size: 1.02rem; letter-spacing: -.01em; margin: 0; }
  .visit, .tag { font-family: var(--mono); font-size: 11px; letter-spacing: .04em; }
  .visit { color: var(--accent); text-decoration: none; border-bottom: 1px solid transparent; }
  .visit:hover { border-bottom-color: currentColor; }
  .tag { color: var(--flag); font-weight: 600; letter-spacing: .12em; text-transform: uppercase; }

  .metrics { display: flex; gap: 18px; margin: 4px 0 0; }
  .metrics div { display: flex; align-items: baseline; gap: 6px; }
  .metrics dt { font-family: var(--mono); font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); margin: 0; }
  .metrics dd { font-family: var(--mono); font-size: .82rem; font-variant-numeric: tabular-nums; margin: 0; }
  .card figcaption p { margin: 2px 0 0; font-size: .98rem; color: var(--muted); max-width: 56ch; }

  /* ── close ── */
  .close { padding: 52px 0 90px; border-top: 1px solid var(--rule); margin-top: 52px; }
  .close h2 { font-family: var(--display); font-weight: 700; font-size: clamp(1.3rem, 2.6vw, 1.75rem); letter-spacing: -.02em; margin: 0 0 12px; }
  .close > p { color: var(--muted); max-width: 64ch; margin: 0 0 28px; }
  .picks { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 18px; }
  .pick { background: var(--surface); border: 1px solid var(--rule); border-radius: 4px; padding: 20px; }
  .pick h3 { font-family: var(--display); font-weight: 600; font-size: .95rem; margin: 0 0 8px; letter-spacing: -.005em; }
  .pick p { margin: 0; font-size: .93rem; color: var(--muted); }
  .pick__ref { font-family: var(--mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); display: block; margin-top: 12px; }

  /* ── lightbox ── */
  .lb { position: fixed; inset: 0; background: rgba(8,10,9,.93); display: none; place-items: center; z-index: 50; padding: 3vh 3vw; }
  .lb[open] { display: grid; }
  .lb img { max-width: 100%; max-height: 94vh; object-fit: contain; border-radius: 2px; }
  .lb__x {
    position: fixed; top: 16px; right: 20px; background: none; border: 0; cursor: pointer;
    font-family: var(--mono); font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #fff;
  }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
</style>

<div class="wrap">
  <header class="mast">
    <p class="kicker">Gentechne &middot; direction review &middot; 7 September 2026</p>
    <h1>The problem was never that it is black. It is that <em>nothing fills the screen</em>.</h1>
    <p class="stand">
      Twelve studio homepages, captured at 1440&#215;860 and measured. Grouped by what occupies
      the frame in the first second &mdash; because that, not the palette, is what separates the
      pages that feel alive from the one we built.
    </p>
  </header>

  <section class="proof">
    <h2>All twelve frames, measured</h2>
    <p>
      Two numbers per capture: how bright the frame is, and how much of it carries colour rather
      than grey. Sorted by colour. If darkness were the problem, this list would sort itself by
      brightness &mdash; it does not.
    </p>
    <div class="chart" role="img" aria-label="Brightness and colour measured across twelve studio homepages">
      <div class="chart__key">
        <span><i class="sw sw--lum"></i>brightness</span>
        <span><i class="sw sw--sat"></i>colour</span>
      </div>
${[...all]
  .sort((a, b) => b.sat - a.sat)
  .map(
    (i) => `      <div class="row${i.ours ? ' row--ours' : ''}">
        <div class="row__name">${esc(i.name)}</div>
        <div class="row__bars">
          <div class="tk"><div class="fl fl--lum" style="width:${i.lum.toFixed(1)}%"></div></div>
          <div class="tk"><div class="fl fl--sat" style="width:${i.sat.toFixed(1)}%"></div></div>
        </div>
        <div class="row__vals"><span>${i.lum.toFixed(0)}%</span><span>${i.sat.toFixed(0)}%</span></div>
      </div>`,
  )
  .join('\n')}
    </div>
    <p class="proof__note">
      MetaLab is the <em>darkest</em> frame in the set at ${metalab.lum.toFixed(0)}% brightness &mdash; darker than our
      ${ours.lum.toFixed(0)}% &mdash; and it carries ${metalab.sat.toFixed(0)}% colour against our ${ours.sat.toFixed(0)}%. Immersive Garden
      is the brightest at ${ig.lum.toFixed(0)}% and measures ${ig.sat.toFixed(0)}% colour, and it is the emptiest page here.
      Brightness does not sort these pages. What is on the screen does: the four frames at the bottom of
      this list are the four that feel like nothing is there, and ours sits with them.
    </p>
  </section>

${GROUPS.map(section).join('\n')}

  <section class="close">
    <h2>Pick the frame, and the rest follows</h2>
    <p>
      Every direction below is a decision about one thing: what occupies the screen when the page
      loads. Say which of these Gentechne should be, and the palette, type and motion all fall out of it.
    </p>
    <div class="picks">
      <div class="pick">
        <h3>Real screens, light ground</h3>
        <p>White page. One enormous headline. Then Vetician and TezBuy running at full width. Nothing decorative anywhere.</p>
        <span class="pick__ref">closest: Instrument, Work &amp; Co</span>
      </div>
      <div class="pick">
        <h3>Real screens, dark ground</h3>
        <p>Keep the dark palette, throw away the empty background. One large image or product screen carries every section, and client names sit beside it.</p>
        <span class="pick__ref">closest: MetaLab, Dogstudio</span>
      </div>
      <div class="pick">
        <h3>One colour at huge scale</h3>
        <p>Pick a single strong brand colour and use it enormous &mdash; not brass accents on black, but a colour that owns the frame.</p>
        <span class="pick__ref">closest: Huge, Instrument</span>
      </div>
      <div class="pick">
        <h3>Plain and credible</h3>
        <p>No effects at all. What we do, who we did it for, the work, contact. The most convincing option for winning actual clients.</p>
        <span class="pick__ref">closest: Work &amp; Co, Buck</span>
      </div>
    </div>
  </section>
</div>

<div class="lb" id="lb">
  <button class="lb__x" id="lbx" type="button">Close &#10005;</button>
  <img id="lbimg" alt="">
</div>

<script>
  (function () {
    var lb = document.getElementById('lb');
    var lbimg = document.getElementById('lbimg');
    document.querySelectorAll('.shot').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var img = btn.querySelector('img');
        lbimg.src = img.src;
        lbimg.alt = img.alt;
        lb.setAttribute('open', '');
      });
    });
    function close() { lb.removeAttribute('open'); lbimg.removeAttribute('src'); }
    document.getElementById('lbx').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  })();
</script>
`

writeFileSync(OUT, html, 'utf8')
console.log(`\n  board -> ${OUT}  (${(html.length / 1024 / 1024).toFixed(2)} MB)`)
