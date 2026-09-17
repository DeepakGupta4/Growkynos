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
        '[data-hero-meta]',
        '[data-hero-actions]',
        '[data-hv]',
      ],
      { clearProps: 'all', autoAlpha: 1, y: 0, opacity: 1 },
    )
    return gsap.timeline()
  }

  const tl = gsap.timeline({ delay, defaults: { ease: EASE.settle } })

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

  tl.from('[data-hero-note]', { y: 18, autoAlpha: 0, duration: 0.7 }, '-=1.0')
  tl.from('[data-hero-meta] > *', { y: 26, autoAlpha: 0, duration: 0.9, stagger: 0.07 }, '-=0.9')
  tl.from('[data-hero-actions]', { y: 28, autoAlpha: 0, duration: 0.9 }, '-=0.75')
  // NOTE: the visual cluster is NOT animated here. It owns its own entrance in
  // HeroVisual. Two gsap.from() tweens on one element race to capture the end
  // state, which is what previously let a chip bake in a stale position.

  return tl
}


export { ScrollTrigger }
