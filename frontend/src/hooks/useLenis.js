import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '../lib/gsap'

let lenisInstance = null

/** Access the live Lenis instance from anywhere (nav, transitions, boot). */
export const getLenis = () => lenisInstance

export function scrollTo(target, options = {}) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, { duration: 1.6, ...options })
    return
  }
  // Reduced-motion / unsupported fallback
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (el instanceof Element) el.scrollIntoView({ behavior: 'auto', block: 'start' })
  else if (typeof target === 'number') window.scrollTo(0, target)
}

export function lockScroll(locked) {
  document.body.dataset.scrollLocked = String(locked)
  if (!lenisInstance) return
  if (locked) lenisInstance.stop()
  else lenisInstance.start()
}

/**
 * Boot smooth scrolling and wire it into GSAP's ticker + ScrollTrigger.
 * Disabled entirely under reduced-motion so native scroll stays authoritative.
 */
export function useLenisScroll({ enabled = true } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    if (!enabled) {
      lenisInstance = null
      ScrollTrigger.refresh()
      return undefined
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      // Native momentum on touch feels better than emulated smoothing.
      syncTouch: false,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
    })

    lenisInstance = lenis
    ref.current = lenis

    // Debug/tooling handle. Lenis owns the scroll position, so anything driving
    // the page programmatically (smoke tests, screenshot capture, e2e) must go
    // through it — a raw window.scrollTo is reverted on the next Lenis frame.
    window.__lenis = lenis

    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(500, 33)

    // NOTE: no scrollerProxy here. Lenis drives window scroll natively, so
    // ScrollTrigger's default scroller is already correct — proxying it breaks
    // pin measurement on the pinned showcase sections.
    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisInstance = null
      ref.current = null
      delete window.__lenis
    }
  }, [enabled])

  return ref
}
