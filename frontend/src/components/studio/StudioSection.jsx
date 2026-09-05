import { useRef } from 'react'
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect'
import { gsap, ScrollTrigger, EASE, SCRUB } from '../../lib/gsap'
import { studio } from '../../data/studio'
import { useExperience } from '../../context/ExperienceContext'

/**
 * STUDIO
 * ------
 * A layered editorial composition, not employee cards.
 *
 * Five plates sit at authored depths in one shared volume. Scroll parallaxes
 * them against each other at rates set by their `depth`, so the group opens
 * and closes like a set of physical prints on a table. The statement splits
 * apart on entry and the two halves resolve at different speeds.
 */
export function StudioSection() {
  const rootRef = useRef(null)
  const { reducedMotion, isMobile } = useExperience()

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion) return undefined

    const ctx = gsap.context(() => {
      /* Statement — two lines, second lags so they separate then align. */
      gsap.from('[data-studio-line] > span', {
        yPercent: 116,
        rotateX: -42,
        opacity: 0,
        duration: 1.5,
        ease: EASE.settle,
        stagger: 0.14,
        scrollTrigger: { trigger: '[data-studio-statement]', start: 'top 84%' },
      })

      gsap.from('[data-studio-rule]', {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1.3,
        ease: 'expo.inOut',
        scrollTrigger: { trigger: '[data-studio-statement]', start: 'top 80%' },
      })

      gsap.from('[data-studio-intro]', {
        y: 34,
        autoAlpha: 0,
        duration: 1.1,
        ease: EASE.settle,
        stagger: 0.12,
        scrollTrigger: { trigger: '[data-studio-intro]', start: 'top 88%' },
      })

      /* Plates — enter from depth, then parallax by their own depth value. */
      gsap.utils.toArray('[data-studio-plate]').forEach((plate, i) => {
        const depth = Number(plate.dataset.depth ?? 1)

        gsap.from(plate, {
          y: 90 * depth,
          z: -420 * depth,
          rotateY: (i % 2 === 0 ? -1 : 1) * 12,
          opacity: 0,
          scale: 0.9,
          duration: 1.6,
          ease: EASE.settle,
          scrollTrigger: { trigger: plate, start: 'top 92%' },
        })

        gsap.to(plate, {
          yPercent: -14 * depth * (isMobile ? 0.4 : 1),
          ease: 'none',
          scrollTrigger: {
            trigger: '[data-studio-composition]',
            start: 'top bottom',
            end: 'bottom top',
            scrub: SCRUB,
          },
        })

        // Inner image counter-moves — the plate is a window, not a sticker.
        const img = plate.querySelector('img')
        if (img) {
          gsap.fromTo(
            img,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: 'none',
              scrollTrigger: {
                trigger: plate,
                start: 'top bottom',
                end: 'bottom top',
                scrub: SCRUB,
              },
            },
          )
        }
      })

      /* Stats count up. */
      gsap.utils.toArray('[data-studio-stat]').forEach((el) => {
        const raw = el.dataset.value ?? ''
        const num = Number.parseFloat(raw.replace(/[^0-9.]/g, ''))
        if (!Number.isFinite(num)) return
        const prefix = raw.match(/^[^0-9]*/)?.[0] ?? ''
        const suffix = raw.match(/[^0-9.]*$/)?.[0] ?? ''
        const obj = { v: 0 }
        gsap.to(obj, {
          v: num,
          duration: 1.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 92%' },
          onUpdate: () => {
            el.textContent = `${prefix}${Math.round(obj.v)}${suffix}`
          },
        })
      })

      /* Principles + process rows. */
      gsap.from('[data-studio-row]', {
        y: 40,
        autoAlpha: 0,
        duration: 1,
        ease: EASE.settle,
        stagger: 0.1,
        scrollTrigger: { trigger: '[data-studio-principles]', start: 'top 86%' },
      })

      gsap.from('[data-studio-step]', {
        y: 30,
        autoAlpha: 0,
        duration: 0.9,
        ease: EASE.settle,
        stagger: 0.09,
        scrollTrigger: { trigger: '[data-studio-process]', start: 'top 88%' },
      })
    }, root)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [reducedMotion, isMobile])

  /* Authored composition — deliberately irregular, never a grid. */
  const PLACEMENT = [
    'col-span-7 md:col-span-5 md:col-start-1 aspect-[3/4]',
    'col-span-5 md:col-span-4 md:col-start-7 md:mt-24 aspect-[4/3]',
    'col-span-5 col-start-8 md:col-span-3 md:col-start-10 md:-mt-16 aspect-square',
    'col-span-6 md:col-span-4 md:col-start-2 md:-mt-10 aspect-[3/4]',
    'col-span-6 col-start-7 md:col-span-5 md:col-start-7 md:mt-8 aspect-[4/3]',
  ]

  return (
    <section
      id="studio"
      ref={rootRef}
      aria-label="Studio"
      className="section relative border-t border-smoke/40 py-24 md:py-36"
    >
      <div className="shell flex flex-col gap-16 md:gap-28">
        {/* Statement */}
        <header data-studio-statement className="flex flex-col gap-7 perspective-near">
          <span className="label-brass">THE STUDIO</span>
          <h2 className="preserve-3d font-display text-display-2 font-extrabold">
            {studio.statement.map((line, i) => (
              <span key={line} data-studio-line className="line-mask preserve-3d">
                <span
                  className={i === 1 ? 'block text-gradient-brass' : 'block text-gradient-bone'}
                >
                  {line}
                </span>
              </span>
            ))}
          </h2>
          <div data-studio-rule className="rule-brass h-px w-full origin-left" />
          <div className="grid gap-8 md:grid-cols-12 md:gap-10">
            <p
              data-studio-intro
              className="text-[clamp(1rem,1.9vw,1.35rem)] leading-relaxed text-bone md:col-span-6"
            >
              {studio.intro}
            </p>
            <div data-studio-intro className="flex flex-col gap-4 md:col-span-5 md:col-start-8">
              {studio.paragraphs.map((p) => (
                <p key={p} className="text-[14px] leading-relaxed text-mist">
                  {p}
                </p>
              ))}
            </div>
          </div>
        </header>

        {/* Layered composition */}
        <div
          data-studio-composition
          className="grid grid-cols-12 gap-3 preserve-3d md:gap-6"
          style={{ perspective: '1600px' }}
        >
          {studio.images.map((img, i) => (
            <figure
              key={img.src}
              data-studio-plate
              data-depth={img.depth}
              className={`relative overflow-hidden rounded-lg preserve-3d will-change-transform ${PLACEMENT[i]}`}
              style={{
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 50px 110px -46px rgba(0,0,0,0.95)',
                zIndex: Math.round(img.depth * 10),
              }}
            >
              {/*
                Duotone grade. Photography here comes from mixed sources with
                mixed colour, and dropping it in raw makes the section look like
                a stock-photo grid. Stripping colour and re-tinting to the brand
                accent is what makes a varied set read as one commissioned shoot
                — the same thing a studio does to a real gallery.
              */}
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                decoding="async"
                className="h-[112%] w-full object-cover grayscale will-change-transform"
                style={{ filter: 'grayscale(1) contrast(1.15) brightness(0.62)' }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 mix-blend-color"
                style={{ backgroundColor: '#C6A87C', opacity: 0.3 }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ background: 'linear-gradient(180deg, rgba(5,5,7,0.25) 0%, rgba(5,5,7,0.82) 100%)' }}
              />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3 md:p-4">
                <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-silver md:text-[9px]">
                  FIG. {String(i + 1).padStart(2, '0')}
                </span>
                <span className="h-1 w-1 rounded-full bg-brass" />
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Stats */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 border-y border-smoke/60 py-10 md:grid-cols-4 md:gap-8">
          {studio.stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-2">
              <dd
                data-studio-stat
                data-value={s.value}
                className="font-display text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-none tabular-nums text-gradient-bone"
              >
                {s.value}
              </dd>
              <dt className="label">{s.label}</dt>
            </div>
          ))}
        </dl>

        {/* Principles */}
        <div data-studio-principles className="grid gap-10 md:grid-cols-12">
          <span className="label md:col-span-3">HOW WE WORK</span>
          <ul className="flex flex-col md:col-span-9">
            {studio.principles.map((p) => (
              <li
                key={p.index}
                data-studio-row
                className="group flex flex-col gap-3 border-t border-smoke/60 py-7 last:border-b md:flex-row md:gap-10"
              >
                <span className="font-mono text-[10px] text-brass tabular-nums md:w-12">{p.index}</span>
                <h3 className="font-display text-[clamp(1.25rem,3vw,1.9rem)] font-medium leading-tight tracking-tight text-bone transition-transform duration-500 ease-out-expo group-hover:translate-x-1 md:w-72">
                  {p.title}
                </h3>
                <p className="max-w-xl text-[14px] leading-relaxed text-mist md:flex-1">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Process */}
        <div data-studio-process className="flex flex-col gap-7">
          <span className="label">THE PROCESS</span>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {studio.process.map((s) => (
              <li
                key={s.index}
                data-studio-step
                className="surface flex flex-col gap-3 rounded-lg p-5"
              >
                <span className="font-mono text-[10px] text-brass tabular-nums">{s.index}</span>
                <h3 className="font-display text-lg font-semibold text-bone">{s.title}</h3>
                <p className="text-[13px] leading-relaxed text-mist">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
