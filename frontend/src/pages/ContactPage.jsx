import { useEffect, useRef } from 'react'
import { gsap, EASE } from '../lib/gsap'
import { ContactForm } from '../components/contact/ContactForm'
import { brand } from '../data/brand'
import { services } from '../data/services'
import { useSEO } from '../hooks/useSEO'
import { useExperience } from '../context/ExperienceContext'

/**
 * BEGIN A PROJECT
 * ---------------
 * The command centre at the end of the journey. Deliberately quieter than the
 * worlds that precede it — by this point the visitor has been persuaded; what
 * they need now is a form that is fast, legible and obviously serious.
 */
export default function ContactPage() {
  const rootRef = useRef(null)
  const { reducedMotion } = useExperience()

  useSEO({
    title: 'Begin a project — GROWKYNOS',
    description:
      'Tell us what you are building. GROWKYNOS takes on a limited number of projects a year — apps, websites, storefronts, SaaS platforms, design, motion and automation.',
    path: '/contact',
  })

  useEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion) return undefined

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: EASE.settle } })
      tl.from('[data-contact-eyebrow]', { autoAlpha: 0, y: 18, duration: 0.8 })
        .from(
          '[data-contact-line] > span',
          { yPercent: 118, rotateX: -50, opacity: 0, duration: 1.35, stagger: 0.11 },
          '-=0.5',
        )
        .from('[data-contact-rule]', { scaleX: 0, duration: 1.1, ease: 'expo.inOut' }, '-=0.9')
        .from('[data-contact-meta] > *', { autoAlpha: 0, y: 22, duration: 0.8, stagger: 0.08 }, '-=0.8')
        .from('[data-contact-form]', { autoAlpha: 0, y: 34, duration: 1 }, '-=0.7')
        .from('[data-contact-aside] > *', { autoAlpha: 0, x: 22, duration: 0.8, stagger: 0.08 }, '-=0.8')
    }, root)

    return () => ctx.revert()
  }, [reducedMotion])

  return (
    <div ref={rootRef} className="relative min-h-[100svh] pb-24 pt-32 md:pb-32 md:pt-44">
      {/* Command-centre atmosphere */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid-field opacity-40 mask-fade-edges" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[70svh]"
        style={{
          background:
            'radial-gradient(64vmax 46vmax at 50% 0%, rgba(198,168,124,0.11) 0%, rgba(5,5,7,0) 66%)',
        }}
      />

      <div className="shell relative z-10 flex flex-col gap-14 md:gap-20">
        <header className="flex flex-col gap-7 perspective-near">
          <span data-contact-eyebrow className="label-brass">
            BEGIN A PROJECT
          </span>
          <h1 className="preserve-3d font-display text-display-2 font-extrabold">
            {['TELL US', "WHAT YOU'RE", 'BUILDING.'].map((line, i) => (
              <span key={line} data-contact-line className="line-mask preserve-3d">
                <span className={i === 2 ? 'block text-gradient-brass' : 'block text-gradient-bone'}>
                  {line}
                </span>
              </span>
            ))}
          </h1>
          <div data-contact-rule className="rule-brass h-px w-full origin-left" />
          <div data-contact-meta className="grid gap-6 md:grid-cols-12">
            <p className="max-w-xl text-[15px] leading-relaxed text-silver md:col-span-7">
              A brief is welcome but not required — a paragraph about the problem is enough to start. We
              read every enquiry ourselves and reply within one working day.
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-4 md:col-span-5 md:justify-end">
              {[
                ['DIRECT', brand.email, `mailto:${brand.email}`],
                ['LOCATION', brand.location, null],
              ].map(([k, v, href]) => (
                <div key={k} className="flex flex-col gap-1.5">
                  <span className="label">{k}</span>
                  {href ? (
                    <a
                      href={href}
                      data-cursor="link"
                      className="font-display text-[15px] text-bone transition-colors duration-400 hover:text-brass"
                    >
                      {v}
                    </a>
                  ) : (
                    <span className="font-display text-[15px] text-bone">{v}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-14 md:grid-cols-12 md:gap-10">
          <div data-contact-form className="md:col-span-7">
            <ContactForm />
          </div>

          <aside data-contact-aside className="flex flex-col gap-10 md:col-span-4 md:col-start-9">
            <div className="flex flex-col gap-4">
              <span className="label">WHAT WE TAKE ON</span>
              <ul className="flex flex-col gap-0 border-t border-smoke/60">
                {services.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-baseline gap-3 border-b border-smoke/50 py-2.5"
                  >
                    <span className="font-mono text-[9px] text-mist tabular-nums">{s.index}</span>
                    <span className="text-[13.5px] text-silver">{s.title}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface flex flex-col gap-3 rounded-lg p-5">
              <span className="label-brass">HOW WE START</span>
              <ol className="flex flex-col gap-2.5">
                {[
                  'You send a paragraph about the problem.',
                  'We reply within one working day with questions.',
                  'A 45-minute call, no deck, no pitch.',
                  'A written proposal with a fixed scope and price.',
                ].map((t, i) => (
                  <li key={t} className="flex gap-3">
                    <span className="font-mono text-[9px] text-brass tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[13px] leading-relaxed text-silver">{t}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-col gap-3">
              <span className="label">ELSEWHERE</span>
              <ul className="flex flex-col gap-2">
                {brand.socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      data-cursor="link"
                      className="group flex items-center justify-between border-b border-smoke/50 py-2 text-[13.5px] text-silver transition-colors duration-400 hover:text-brass"
                    >
                      {s.label}
                      <span className="text-mist transition-transform duration-400 group-hover:translate-x-0.5 group-hover:text-brass">
                        ↗
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
