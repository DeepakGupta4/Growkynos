# GROWKYNOS

A digital product studio site built as a continuous scroll experience: ten
service "worlds" that each *demonstrate* the discipline rather than describe it,
a spatial project archive, and a cinematic route system.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build
npm run verify     # smoke + interaction tests (needs a server running)
```

---

## The journey

`src/pages/Home.jsx` is the spine. Sections render in scroll order:

```
BOOT → HERO → SERVICE UNIVERSE
     → APP → WEB → SHOPIFY → WORDPRESS → SAAS → DESIGN → PHOTO → VIDEO → AI
     → PROJECT UNIVERSE ("DESIGN. CODE. MOTION." / "UNDER ONE ROOF.")
     → STUDIO → TECHNOLOGY → BEGIN A PROJECT
```

Routes: `/`, `/work`, `/work/:id`, `/contact`, plus a 404.

---

## Adding a project — data only

Add one object to `src/data/projects.js`. Nothing else changes: it appears in
the Project Universe, in `/work`, gets a `/work/:id` detail route, is added to
the sitemap, and (if its `serviceId` matches) can drive a service world.

```js
{
  id: 'acme-platform',            // becomes /work/acme-platform
  title: 'Acme Platform',
  category: 'SaaS / Product',
  serviceId: 'saas',              // links to data/services.js
  showcaseType: 'dashboard',      // which device frame renders the media
  excerpt: 'One line for cards and the index.',
  description: 'One paragraph for the detail route.',
  thumbnail: '/projects/saas/acme/01.svg',   // the FLIP transition animates FROM this
  images: ['/projects/saas/acme/01.svg', '…'],
  video: null,                    // or { src, webm, poster }
  url: 'https://acme.com',        // or null
  technologies: ['Next.js', 'PostgreSQL'],
  year: 2025,
  client: 'Acme',
  featured: true,
  scope: ['Product design', 'Full-stack build'],
  results: [{ value: '99.9%', label: 'Uptime' }],
}
```

`showcaseType`: `phone · browser · store · cms · dashboard · canvas · timeline ·
poster · flow`.

**Adding a service world** — add an entry to `src/data/services.js` and one
component in `src/components/showcases/` using `<ShowcaseFrame>`.

---

## Assets

Every image path in the data resolves to a generated on-brand SVG mockup:

```bash
npm run assets     # regenerates public/ (also robots.txt + sitemap.xml)
```

**To use real work:** drop a real file over the generated one, keeping the same
filename. No code change. Photographs, screenshots and `.webp` all work — the
components only read paths from the data file.

Real video: set `video: { src, webm, poster }` on a project. The video world
plays it (muted, inline, `preload="none"`, playback gated by
IntersectionObserver) and the detail route gets a real player. With no footage
supplied, the video world performs the cut from the project stills instead.

---

## Contact form

`VITE_CONTACT_ENDPOINT` (see `.env.example`) is the integration point. It POSTs
`multipart/form-data` — all fields plus an optional `attachment`.

**It never fakes a send.** With no endpoint configured it says so explicitly and
offers a `mailto:` pre-filled with everything the visitor typed. A failed POST
reports the real error and keeps the form populated.

---

## Sound

`src/context/SoundContext.jsx` is a complete audio bus that is silent by
default. Call sites already emit named cues (`sfx('hover')`, `'click'`,
`'transition'`, `'enter'`, `'reveal'`, `'boot'`). To enable: drop files into
`public/sound/` and list them in `SOUND_MAP`. Nothing else changes. The nav
toggle and the visitor's stored preference are already wired.

---

## Architecture notes worth knowing

**GSAP + React.** All GSAP setup runs in `useIsomorphicLayoutEffect`, never
`useEffect`. ScrollTrigger's `pin` relocates DOM nodes into a `pin-spacer`; if
teardown is deferred, React removes those nodes first and throws
`NotFoundError: removeChild`, which kills the route change.

**Never leave an inline transform on an ancestor of a pinned section.** A
`transform` or `will-change: transform` — *even the identity matrix* — makes an
element a containing block for `position: fixed`, so every pinned stage inside
it is positioned against the document instead of the viewport and scrolls off
screen. Transition code uses `clearProps`, never set-to-identity.

**Lenis owns the scroll position.** Programmatic scrolling must go through it
(`scrollTo()` in `hooks/useLenis.js`, or `window.__lenis` for tooling). A raw
`window.scrollTo` is reverted on Lenis's next frame.

**GSAP percentage transforms are relative to the element**, not its container —
which is why the spread values in `ServiceUniverse` look enormous.

**Quality budget.** `ExperienceContext` exposes one `quality` object (particle
counts, DPR caps, parallax strength) derived from device tier and motion
preference. Expensive subsystems read from it rather than sniffing the device.

---

## Accessibility & motion

- `prefers-reduced-motion` replaces every world with a complete static
  equivalent — no content is animation-only. Boot is skipped entirely.
- Skip link, semantic landmarks, real `<button>`s throughout, visible focus
  rings, labelled form fields with `role="alert"` errors, `aria-live` regions.
- The custom cursor is disabled on touch and under reduced motion; the native
  cursor is only hidden while a replacement is actually rendering.

---

## Verification

```bash
npm run smoke          # routes, console errors, network failures, overflow,
                       # mobile + reduced-motion passes
npm run interactions   # transitions, FLIP entry, form validation, keyboard
npm run shots ./shots  # screenshots of every beat of the journey
```

`smoke` and `interactions` fail on **any** console error, failed request, or
horizontal overflow. Both drive scroll through Lenis so pinned timelines really
execute.

---

## Deploying

Client-side routing needs a SPA rewrite. `vercel.json` and `public/_redirects`
(Netlify) are included. For nginx: `try_files $uri /index.html;`

Update the canonical host in `index.html`, `src/hooks/useSEO.js` and
`scripts/generate-assets.mjs` (`SITE`) before going live.

---

## Stack

React · Vite · Tailwind CSS · GSAP + ScrollTrigger · Lenis · React Router.

Deliberately **not** installed: Three.js/R3F and Framer Motion. The spatial
scenes are CSS 3D and the hero field is Canvas 2D — both cheaper here than
WebGL, which keeps the frame budget for the pinned timelines. Nothing is in
`package.json` that the site does not use.
