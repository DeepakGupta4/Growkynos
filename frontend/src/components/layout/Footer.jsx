import { useRef } from 'react'
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect'
import { gsap, ScrollTrigger, EASE } from '../../lib/gsap'
import { brand } from '../../data/brand'
import { navItems } from '../../data/nav'
import { services } from '../../data/services'
import { useTransition } from '../transitions/TransitionProvider'
import { scrollTo } from '../../hooks/useLenis'
import { useExperience } from '../../context/ExperienceContext'

export function Footer() {
  const ref = useRef(null)
  const { go } = useTransition()
  const { reducedMotion } = useExperience()

  useIsomorphicLayoutEffect(() => {
    const el = ref.current
    if (!el || reducedMotion) return undefined
    const ctx = gsap.context(() => {
      gsap.from('[data-footer-mark] span', {
        yPercent: 105,
        duration: 1.2,
        ease: EASE.settle,
        stagger: 0.03,
        scrollTrigger: { trigger: '[data-footer-mark]', start: 'top 92%' },
      })
    }, el)
    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [reducedMotion])

  const year = new Date().getFullYear()

  return (
    <footer ref={ref} className="relative z-10 border-t border-smoke/50 bg-void pt-16 md:pt-24">
      <div className="shell flex flex-col gap-14 md:gap-20">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <div className="flex flex-col gap-5 md:col-span-5">
            <span className="label-brass">GET IN TOUCH</span>
            <a
              href={`mailto:${brand.email}`}
              data-cursor="link"
              className="font-display text-[clamp(1.4rem,4vw,2.4rem)] font-medium leading-tight tracking-tight text-bone transition-colors duration-500 hover:text-brass"
            >
              {brand.email}
            </a>
            <p className="max-w-sm text-sm leading-relaxed text-mist">
              {brand.location}. We reply to every enquiry within one working day.
            </p>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-4 md:col-span-3">
            <span className="label">SITEMAP</span>
            <ul className="flex flex-col gap-2.5">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    data-cursor="link"
                    onClick={() =>
                      item.to
                        ? go(item.to, { label: item.label.toUpperCase() })
                        : scrollTo(`#${item.target}`, { duration: 1.6 })
                    }
                    className="text-sm text-silver transition-colors duration-300 hover:text-brass"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-4 md:col-span-4">
            <span className="label">CAPABILITIES</span>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {services.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    data-cursor="link"
                    onClick={() => scrollTo(`#${s.sectionId}`, { duration: 1.6 })}
                    className="text-left text-[13px] text-silver transition-colors duration-300 hover:text-brass"
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Oversized wordmark */}
        <div data-footer-mark aria-hidden="true" className="flex overflow-hidden">
          {Array.from(brand.wordmark).map((c, i) => (
            <span
              key={`${c}-${i}`}
              className="flex-1 text-center font-display text-[clamp(2.2rem,10.5vw,11rem)] font-extrabold leading-[0.8] tracking-[-0.04em] text-transparent"
              style={{ WebkitTextStroke: '1px rgba(155,155,168,0.32)' }}
            >
              {c}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-5 border-t border-smoke/50 py-7 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mist">
            © {year} {brand.name} — All rights reserved
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {brand.socials.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  data-cursor="link"
                  className="font-mono text-[10px] uppercase tracking-[0.14em] text-mist transition-colors duration-300 hover:text-bone"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <button
            type="button"
            data-cursor="link"
            onClick={() => scrollTo(0, { duration: 1.8 })}
            className="self-start font-mono text-[10px] uppercase tracking-[0.14em] text-mist transition-colors duration-300 hover:text-brass md:self-auto"
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  )
}
