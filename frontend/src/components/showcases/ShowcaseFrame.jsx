import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, SCRUB } from '../../lib/gsap'
import { useExperience } from '../../context/ExperienceContext'
import { cn } from '../../lib/utils'

/**
 * SHOWCASE FRAME
 * --------------
 * Every service world shares this shell: a pinned stage with an editorial
 * chrome around it (index, title, capability list, live progress).
 *
 * `build(tl, ctx)` receives the scrubbed master timeline. Children own the
 * choreography; the frame owns the pin, the rhythm and the cleanup.
 *
 * Rhythm is set here, not per-section: `beats` controls how much scroll the
 * world consumes, so the site as a whole can be paced from one place.
 */
export function ShowcaseFrame({
  service,
  id,
  beats = 4,
  build,
  children,
  chromeSide = 'left',
  stageClassName,
  fallback,
}) {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const barRef = useRef(null)
  const { reducedMotion, isMobile, isTablet } = useExperience()
  const [phase, setPhase] = useState(0)
  const phaseRef = useRef(0)

  // Mobile gets a shorter, simpler journey — same story, fewer layers.
  const scale = reducedMotion ? 0 : isMobile ? 0.55 : isTablet ? 0.8 : 1
  const distance = Math.round(beats * 100 * scale)

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    if (!root || !stage || reducedMotion || !build) return undefined

    let ctx
    // Give layout/fonts a frame to settle before measuring pin distances.
    const raf = requestAnimationFrame(() => {
      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: `+=${distance}%`,
            scrub: SCRUB,
            pin: stage,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`
              const p = Math.min(beats - 1, Math.floor(self.progress * beats))
              if (p !== phaseRef.current) {
                phaseRef.current = p
                setPhase(p)
              }
            },
          },
        })

        build(tl, { root, stage, isMobile, isTablet })
      }, root)
    })

    return () => {
      cancelAnimationFrame(raf)
      ctx?.revert()
    }
  }, [build, distance, reducedMotion, isMobile, isTablet, beats])

  /* Reduced motion: the same content, no choreography. */
  if (reducedMotion && fallback) {
    return (
      <section id={id} aria-label={service.title} className="section relative border-t border-smoke/40 py-20">
        <div className="shell flex flex-col gap-10">
          <Chrome service={service} phase={0} beats={beats} static />
          {fallback}
        </div>
      </section>
    )
  }

  return (
    <section
      id={id}
      aria-label={service.title}
      ref={rootRef}
      className="section relative border-t border-smoke/40"
    >
      <div
        ref={stageRef}
        className={cn(
          'relative flex h-[100svh] w-full flex-col overflow-hidden',
          stageClassName,
        )}
      >
        {/* Ambient world tint — each world has its own light temperature */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(70vmax 55vmax at 50% 32%, ${service.accent}14 0%, rgba(5,5,7,0) 68%)`,
          }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid-field-fine opacity-40 mask-fade-edges" />

        {/* Stage */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden perspective-far">
          {children}
        </div>

        {/* Chrome */}
        <Chrome service={service} phase={phase} beats={beats} side={chromeSide} barRef={barRef} />
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────── */

function Chrome({ service, phase, beats, side = 'left', barRef, static: isStatic }) {
  return (
    <div
      className={cn(
        'relative z-20 w-full',
        isStatic ? '' : 'pointer-events-none px-gutter pb-6 md:pb-8',
      )}
    >
      <div className="mx-auto flex w-full max-w-shell flex-col gap-4">
        {!isStatic && (
          <div className="h-px w-full bg-smoke/70">
            <div
              ref={barRef}
              className="h-px w-full origin-left scale-x-0 will-change-transform"
              style={{ backgroundColor: service.accent }}
            />
          </div>
        )}

        <div
          className={cn(
            'flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10',
            side === 'right' && 'md:flex-row-reverse',
          )}
        >
          <div className="flex items-end gap-4 md:gap-6">
            <span
              className="font-display text-[clamp(2rem,7vw,4.5rem)] font-extrabold leading-[0.8] tabular-nums"
              style={{ color: service.accent, opacity: 0.9 }}
            >
              {service.index}
            </span>
            <div className="flex flex-col gap-1.5 pb-1">
              <h2 className="font-display text-[clamp(1.15rem,3.6vw,2.25rem)] font-semibold leading-none tracking-tight text-bone">
                {service.title}
              </h2>
              {/* Mobile gives its height to the demonstration, not the caption. */}
              <p className="hidden max-w-md text-[12.5px] leading-relaxed text-mist md:block md:text-[13.5px]">
                {service.summary}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2.5 md:items-end">
            <ul className="hidden flex-wrap gap-x-3 gap-y-1.5 sm:flex md:justify-end">
              {service.capabilities.map((c) => (
                <li
                  key={c}
                  className="rounded-full border border-smoke/80 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.13em] text-silver"
                >
                  {c}
                </li>
              ))}
            </ul>
            {!isStatic && (
              <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-mist">
                <span style={{ color: service.accent }}>{String(phase + 1).padStart(2, '0')}</span>
                <span>/</span>
                <span>{String(beats).padStart(2, '0')}</span>
                <span className="ml-1 hidden sm:inline">{service.verb}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
