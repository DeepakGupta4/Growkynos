/**
 * THE PAGE'S LIVE ACCENT
 * ----------------------
 * One value, read by everything that has to agree on colour: the field behind
 * the page, the nav's sliding indicator, the scroll progress line, the buttons.
 *
 * Deliberately a module-level store with subscribers rather than React state.
 * The accent changes on scroll — potentially every few hundred milliseconds
 * through a long page — and routing that through context would re-render the
 * entire tree each time, including four pinned showcase timelines. Subscribers
 * here are a WebGL uniform and a CSS variable; neither needs React to know.
 */

const FALLBACK = { key: '#C6A87C', deep: '#2A2318' }

let current = FALLBACK
const subscribers = new Set()

export function getAccent() {
  return current
}

export function setAccent(next) {
  if (!next || (next.key === current.key && next.deep === current.deep)) return
  current = next
  if (typeof document !== 'undefined') {
    /* Mirrored to CSS so plain styles can follow it without subscribing. */
    document.documentElement.style.setProperty('--accent', next.key)
  }
  for (const fn of subscribers) fn(next)
}

export function resetAccent() {
  setAccent(FALLBACK)
}

export function onAccent(fn) {
  subscribers.add(fn)
  return () => subscribers.delete(fn)
}

/**
 * Per-section colour.
 *
 * The four service worlds reuse the hero's own palette so that arriving at a
 * world feels like the hero beat that introduced it. The rest are chosen to
 * keep neighbours apart — two adjacent sections in the same hue read as one
 * long section that never ended.
 */
export const SECTION_ACCENT = {
  services: { key: '#C6A87C', deep: '#3A2E1B' },
  'world-app': { key: '#FF7A4D', deep: '#5A2210' },
  'world-web': { key: '#4F86FF', deep: '#152B60' },
  'world-saas': { key: '#FF4D8D', deep: '#5C1038' },
  'world-ai': { key: '#9B72FF', deep: '#2D1663' },
  'more-services': { key: '#7FB0A0', deep: '#12332B' },
  projects: { key: '#E0A94D', deep: '#463012' },
  studio: { key: '#8FA9C4', deep: '#1B2B3C' },
  technology: { key: '#9B72FF', deep: '#2D1663' },
  contact: { key: '#FF7A4D', deep: '#5A2210' },
}
