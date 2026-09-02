import { useEffect, useMemo, useRef, useState } from 'react'
import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { gsap, ScrollTrigger, EASE, SCRUB } from '../lib/gsap'
import { projects, categories } from '../data/projects'
import { useSEO } from '../hooks/useSEO'
import { useExperience } from '../context/ExperienceContext'
import { useProjectEntry } from '../components/projects/ProjectEntryContext'
import { cn } from '../lib/utils'

/**
 * ALL WORK
 * --------
 * The archive as a browsable index — the counterpart to the Project Universe.
 * Rows are editorial, not cards: the media reveals on hover and follows the
 * pointer, so the list behaves like a physical contact sheet.
 */
export default function WorkPage() {
  const rootRef = useRef(null)
  const previewRef = useRef(null)
  const previewImgRef = useRef(null)
  const [filter, setFilter] = useState('All')
  const [hovered, setHovered] = useState(null)
  const { reducedMotion, hasHover, isMobile } = useExperience()
  const { enterProject } = useProjectEntry()

  useSEO({
    title: 'Work — GROWKYNOS',
    description:
      'Selected projects from GROWKYNOS: apps, websites, Shopify storefronts, WordPress builds, SaaS platforms, design, photo, video and AI automation.',
    path: '/work',
  })

  const filtered = useMemo(
    () => (filter === 'All' ? projects : projects.filter((p) => p.category === filter)),
    [filter],
  )

  /* Entrance + scroll reveals */
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion) return undefined

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: EASE.settle } })
      tl.from('[data-work-eyebrow]', { autoAlpha: 0, y: 16, duration: 0.7 })
        .from('[data-work-title] > span', { yPercent: 116, opacity: 0, duration: 1.2, stagger: 0.08 }, '-=0.4')
        .from('[data-work-rule]', { scaleX: 0, duration: 1, ease: 'expo.inOut' }, '-=0.8')
        .from('[data-work-filter]', { autoAlpha: 0, y: 14, duration: 0.6, stagger: 0.04 }, '-=0.6')

      gsap.utils.toArray('[data-work-row]').forEach((row) => {
        gsap.from(row, {
          y: 40,
          autoAlpha: 0,
          duration: 0.9,
          ease: EASE.settle,
          scrollTrigger: { trigger: row, start: 'top 94%' },
        })
      })

      gsap.to('[data-work-marquee]', {
        xPercent: -50,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: SCRUB },
      })
    }, root)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [reducedMotion, filter])

  /* Pointer-following preview */
  useIsomorphicLayoutEffect(() => {
    const el = previewRef.current
    if (!el || !hasHover || reducedMotion || isMobile) return undefined

    const x = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'power3.out' })
    const y = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'power3.out' })
    const r = gsap.quickTo(el, 'rotate', { duration: 0.9, ease: 'power3.out' })
    let lastX = 0

    const onMove = (e) => {
      x(e.clientX)
      y(e.clientY)
      // Tilt away from travel direction — inertia, not decoration.
      r(gsap.utils.clamp(-9, 9, (e.clientX - lastX) * 0.7))
      lastX = e.clientX
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [hasHover, reducedMotion, isMobile])

  useIsomorphicLayoutEffect(() => {
    const el = previewRef.current
    const img = previewImgRef.current
    if (!el || !img || reducedMotion || !hasHover || isMobile) return
    if (hovered) {
      img.src = hovered.thumbnail
      gsap.to(el, { autoAlpha: 1, scale: 1, duration: 0.55, ease: EASE.settle, overwrite: 'auto' })
    } else {
      gsap.to(el, { autoAlpha: 0, scale: 0.9, duration: 0.35, ease: 'power2.in', overwrite: 'auto' })
    }
  }, [hovered, reducedMotion, hasHover, isMobile])

  return (
    <div ref={rootRef} className="relative min-h-[100svh] pb-24 pt-32 md:pt-44">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid-field opacity-30 mask-fade-edges" />

      <div className="shell relative z-10 flex flex-col gap-12 md:gap-16">
        <header className="flex flex-col gap-6">
          <span data-work-eyebrow className="label-brass">
            THE ARCHIVE
          </span>
          <h1 data-work-title className="font-display text-display-2 font-extrabold text-gradient-bone">
            <span className="line-mask">
              <span>SELECTED WORK</span>
            </span>
          </h1>
          <div data-work-rule className="rule-brass h-px w-full origin-left" />

          <div className="flex flex-wrap items-center justify-between gap-5">
            <ul className="flex flex-wrap gap-2">
              {['All', ...categories].map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    data-work-filter
                    data-cursor="link"
                    onClick={() => setFilter(c)}
                    aria-pressed={filter === c}
                    className={cn(
                      'rounded-full border px-3.5 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-colors duration-400',
                      filter === c
                        ? 'border-brass bg-brass text-void'
                        : 'border-smoke text-mist hover:border-brass/60 hover:text-bone',
                    )}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
            <span className="font-mono text-[10px] tabular-nums text-mist">
              {String(filtered.length).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
            </span>
          </div>
        </header>

        {/* Index */}
        <ul className="flex flex-col border-t border-smoke/60" onPointerLeave={() => setHovered(null)}>
          {filtered.map((p, i) => (
            <li key={p.id} data-work-row className="border-b border-smoke/60">
              <button
                type="button"
                data-cursor="view"
                data-cursor-label="VIEW"
                onPointerEnter={() => setHovered(p)}
                onFocus={() => setHovered(p)}
                onBlur={() => setHovered(null)}
                onClick={(e) => enterProject(p, e.currentTarget)}
                className="group relative flex w-full flex-col gap-3 py-6 text-left md:flex-row md:items-center md:gap-8 md:py-8"
                aria-label={`${p.title} — ${p.category}. ${p.excerpt}`}
              >
                <span className="font-mono text-[10px] text-mist tabular-nums transition-colors duration-400 group-hover:text-brass md:w-10">
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Inline media on mobile, pointer preview on desktop */}
                <span className="block w-full overflow-hidden rounded-md md:hidden">
                  <img
                    src={p.thumbnail}
                    alt=""
                    loading="lazy"
                    className="aspect-[16/9] w-full object-cover object-top"
                  />
                </span>

                <span className="font-display text-[clamp(1.4rem,4.6vw,2.6rem)] font-medium leading-none tracking-tight text-bone transition-all duration-500 ease-out-expo group-hover:translate-x-2 group-hover:text-brass md:w-[38%]">
                  {p.title}
                </span>

                <span className="max-w-md flex-1 text-[13px] leading-relaxed text-mist">{p.excerpt}</span>

                <span className="flex shrink-0 items-center gap-5">
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.13em] text-mist">
                    {p.category}
                  </span>
                  <span className="font-mono text-[9.5px] tabular-nums text-mist">{p.year}</span>
                  <span className="text-mist transition-all duration-500 group-hover:translate-x-1 group-hover:text-brass">
                    →
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <p className="py-20 text-center text-silver">Nothing in this category yet.</p>
        )}
      </div>

      {/* Marquee footer */}
      <div aria-hidden="true" className="relative mt-24 overflow-hidden border-y border-smoke/50 py-6">
        <div data-work-marquee className="flex w-[200%] gap-10 whitespace-nowrap">
          {[...projects, ...projects].map((p, i) => (
            <span
              key={`${p.id}-${i}`}
              className="font-display text-[clamp(1.5rem,4vw,3rem)] font-extrabold tracking-tight text-transparent"
              style={{ WebkitTextStroke: '1px rgba(155,155,168,0.24)' }}
            >
              {p.title}
            </span>
          ))}
        </div>
      </div>

      {/* Pointer preview */}
      {hasHover && !isMobile && (
        <div
          ref={previewRef}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-[150] -translate-x-1/2 -translate-y-1/2 opacity-0 will-change-transform"
        >
          <div className="overflow-hidden rounded-lg border border-smoke/80 shadow-2xl">
            <img
              ref={previewImgRef}
              alt=""
              className="h-[168px] w-[268px] object-cover object-top"
            />
          </div>
        </div>
      )}
    </div>
  )
}
