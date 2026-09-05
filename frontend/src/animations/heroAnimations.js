import { gsap, ScrollTrigger, EASE, SCRUB } from '../lib/gsap'

/**
 * HERO ENTRANCE
 * -------------
 * The statement arrives from depth: each line starts pushed back in Z, rotated
 * on X and masked. Letters carry a small per-character stagger so the line
 * separates slightly before settling — the "light passing through type" is a
 * gradient sweep timed to land as each line reaches rest.
 */
export function buildHeroIntro(scope, { reducedMotion = false, delay = 0 } = {}) {
  if (reducedMotion) {
    gsap.set(
      [
        '[data-hero-char]',
        '[data-hero-eyebrow]',
        '[data-hero-meta]',
        '[data-hero-actions]',
        '[data-hero-scroll]',
        '[data-hv]',
      ],
      { clearProps: 'all', autoAlpha: 1, y: 0, opacity: 1 },
    )
    return gsap.timeline()
  }

  const tl = gsap.timeline({ delay, defaults: { ease: EASE.settle } })

  tl.from('[data-hero-eyebrow] > span', {
    yPercent: 120,
    duration: 0.9,
    stagger: 0.08,
  })

  tl.from(
    '[data-hero-rule]',
    { scaleX: 0, transformOrigin: 'left center', duration: 1.1, ease: 'expo.inOut' },
    '-=0.6',
  )

  // Lines arrive from depth, one after another, each slightly faster.
  gsap.utils.toArray('[data-hero-line]').forEach((line, i) => {
    const chars = line.querySelectorAll('[data-hero-char]')
    tl.from(
      chars,
      {
        yPercent: 118,
        rotateX: -62,
        z: -220,
        opacity: 0,
        duration: 1.35 - i * 0.08,
        stagger: { each: 0.032, from: 'start' },
      },
      i === 0 ? '-=0.75' : `-=${1.05 - i * 0.05}`,
    )
    // Light pass — a specular sweep that resolves as the line settles.
    const sweep = line.querySelector('[data-hero-sweep]')
    if (sweep) {
      tl.fromTo(
        sweep,
        { xPercent: -120, opacity: 0 },
        { xPercent: 130, opacity: 1, duration: 1.15, ease: 'power2.inOut' },
        `-=${0.85 - i * 0.06}`,
      ).to(sweep, { opacity: 0, duration: 0.3 }, '-=0.3')
    }
  })

  tl.from('[data-hero-meta] > *', { y: 26, autoAlpha: 0, duration: 0.9, stagger: 0.07 }, '-=0.9')
  tl.from('[data-hero-actions]', { y: 28, autoAlpha: 0, duration: 0.9 }, '-=0.75')
  // NOTE: the visual cluster is NOT animated here. It owns its own entrance in
  // HeroVisual. Two gsap.from() tweens on one element race to capture the end
  // state, which is what previously let a chip bake in a stale position.
  tl.from('[data-hero-scroll]', { autoAlpha: 0, y: 18, duration: 0.8 }, '-=0.6')

  return tl
}

/**
 * HERO → FIRST WORLD
 * ------------------
 * Scroll drives the statement back into depth while the interface panel that
 * replaces it rises and takes focus. The two are choreographed on one timeline
 * so the handover is continuous rather than two separate reveals.
 */
export function buildHeroScrollHandoff(scope, { reducedMotion = false, onProgress } = {}) {
  if (reducedMotion) return null

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: scope,
      start: 'top top',
      end: '+=120%',
      scrub: SCRUB,
      pin: true,
      anticipatePin: 1,
      onUpdate: (self) => onProgress?.(self.progress),
    },
  })

  tl.to('[data-hero-type]', { yPercent: -18, z: -640, rotateX: 26, opacity: 0, ease: 'power2.in' }, 0)
    .to('[data-hero-eyebrow], [data-hero-meta], [data-hero-actions]', { autoAlpha: 0, y: -40 }, 0)
    .to('[data-hero-scroll]', { autoAlpha: 0, duration: 0.2 }, 0)
    .to('[data-hv]', { z: 420, opacity: 0, stagger: 0.04, ease: 'power2.in' }, 0)
    .fromTo(
      '[data-hero-interface]',
      { yPercent: 34, z: -520, opacity: 0, rotateX: 18 },
      { yPercent: 0, z: 0, opacity: 1, rotateX: 0, ease: 'power2.out' },
      0.28,
    )
    .fromTo(
      '[data-hero-interface-row]',
      { yPercent: 60, opacity: 0 },
      { yPercent: 0, opacity: 1, stagger: 0.06, ease: 'power2.out' },
      0.44,
    )

  return tl
}

export { ScrollTrigger }
