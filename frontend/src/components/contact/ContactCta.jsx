import { useRef } from 'react'
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect'
import { gsap, ScrollTrigger, EASE, SCRUB } from '../../lib/gsap'
import { Button } from '../ui/Button'
import { brand } from '../../data/brand'
import { useTransition } from '../transitions/TransitionProvider'
import { useExperience } from '../../context/ExperienceContext'

/**
 * THE FINAL DOOR
 * --------------
 * The last beat of the home journey. Its only job is to hand the visitor to
 * the command centre — so it is deliberately spare, with one oversized target
 * and a horizon line that rises as you approach it.
 */
export function ContactCta() {
  const rootRef = useRef(null)
  const { go } = useTransition()
  const { reducedMotion } = useExperience()

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion) return undefined

    const ctx = gsap.context(() => {
      gsap.from('[data-cta-line] > span', {
        yPercent: 118,
        rotateX: -52,
        opacity: 0,
        duration: 1.4,
        ease: EASE.settle,
        stagger: 0.12,
        scrollTrigger: { trigger: root, start: 'top 74%' },
      })

      gsap.from('[data-cta-meta] > *', {
        y: 26,
        autoAlpha: 0,
        duration: 0.9,
        ease: EASE.settle,
        stagger: 0.08,
        scrollTrigger: { trigger: root, start: 'top 62%' },
      })

      // Horizon rises as the section is approached.
      gsap.fromTo(
        '[data-cta-horizon]',
        { yPercent: 60, opacity: 0.25 },
        {
          yPercent: 0,
          opacity: 1,
          ease: 'none',
          scrollTrigger: { trigger: root, start: 'top bottom', end: 'center center', scrub: SCRUB },
        },
      )
    }, root)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [reducedMotion])

  return (
    <section
      id="contact"
      ref={rootRef}
      aria-label="Begin a project"
      className="section relative overflow-hidden border-t border-smoke/40 py-28 md:py-40"
    >
      {/* Horizon */}
      <div
        data-cta-horizon
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] will-change-transform"
        style={{
          background:
            'radial-gradient(74vmax 40vmax at 50% 118%, rgba(198,168,124,0.20) 0%, rgba(198,168,124,0.05) 40%, rgba(5,5,7,0) 72%)',
        }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid-field opacity-30 mask-fade-edges" />

      <div className="shell relative z-10 flex flex-col items-center gap-10 text-center perspective-near">
        <span data-cta-meta className="label-brass">
          NEXT
        </span>

        <h2 className="preserve-3d font-display text-display-1 font-extrabold">
          {['BEGIN A', 'PROJECT.'].map((line, i) => (
            <span key={line} data-cta-line className="line-mask preserve-3d">
              <span className={i === 1 ? 'block text-gradient-brass' : 'block text-gradient-bone'}>
                {line}
              </span>
            </span>
          ))}
        </h2>

        <div data-cta-meta className="rule-brass h-px w-full max-w-2xl" />

        <p data-cta-meta className="max-w-xl text-[15px] leading-relaxed text-silver">
          We take on a limited number of projects a year so we can stay this involved in each one. If you
          have something worth building, tell us about it.
        </p>

        <div data-cta-meta className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" onClick={() => go('/contact', { label: 'BEGIN A PROJECT' })}>
            Tell us what you&rsquo;re building
            <span aria-hidden="true">→</span>
          </Button>
          <Button as="a" href={`mailto:${brand.email}`} variant="ghost" size="lg">
            {brand.email}
          </Button>
        </div>

        <dl data-cta-meta className="flex flex-wrap justify-center gap-x-12 gap-y-5 pt-4">
          {[
            ['< 1 day', 'Reply time'],
            ['Fixed', 'Scope & price'],
            ['Weekly', 'Working builds'],
          ].map(([v, k]) => (
            <div key={k} className="flex flex-col items-center gap-1.5">
              <dd className="font-display text-xl font-semibold text-bone">{v}</dd>
              <dt className="label">{k}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
