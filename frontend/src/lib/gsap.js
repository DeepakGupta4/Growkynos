import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * House motion defaults.
 * Everything settles; nothing snaps. Overshoot is reserved for physical objects.
 */
gsap.defaults({ ease: 'power3.out', duration: 0.9 })

/** Named eases so motion language stays consistent across the site. */
export const EASE = {
  /** Cinematic settle — the default for reveals. */
  settle: 'expo.out',
  /** Weighted entry for physical objects (phones, browsers, cards). */
  mass: 'power4.out',
  /** Two-sided move — used by transitions that leave and arrive. */
  travel: 'expo.inOut',
  /** Slight overshoot, then settle. Physical objects only. */
  overshoot: 'back.out(1.4)',
  /** Mechanical, for UI chrome. */
  swift: 'power2.out',
}

/** ScrollTrigger scrub value — a touch of lag reads as inertia. */
export const SCRUB = 1.1

/**
 * Kill every ScrollTrigger + tween created inside `fn`.
 * Use with gsap.context() in effects so remounts never leak.
 */
export function createScope(fn, scopeRef) {
  const ctx = gsap.context(fn, scopeRef)
  return () => ctx.revert()
}

export { gsap, ScrollTrigger }
