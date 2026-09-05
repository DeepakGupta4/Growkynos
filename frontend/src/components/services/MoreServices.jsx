import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap, ScrollTrigger, EASE, SCRUB } from '../../lib/gsap'
import { capabilities, ORBITS, getCapability } from '../../data/capabilities'
import { useExperience } from '../../context/ExperienceContext'
import { useSound } from '../../context/SoundContext'
import { useTransition } from '../transitions/TransitionProvider'
import { WorldBackdrop } from '../showcases/ui/WorldBackdrop'
import { cn } from '../../lib/utils'

/* Styled as a world, so it belongs to the same family as the other ten. */
const SERVICE = {
  id: 'more',
  title: 'More Services',
  accent: '#C6A87C',
  media: { image: '/assets/services/more-services', video: null, poster: null },
}

/**
 * MORE SERVICES — ORBITAL SYSTEM
 * ------------------------------
 * Deliberately NOT another node-and-edge graph: the Technology section already
 * owns that mechanism, and repeating it would make two sections feel like one
 * component used twice.
 *
 * Here the capabilities sit on three concentric orbits and the whole system
 * rotates under scroll — the rotation is driven, not idle, so it has a reason
 * to exist. Hovering or focusing a node lifts it out of its orbit toward the
 * viewer and pushes the rest back; selecting one holds that state and opens its
 * detail.
 *
 * Keyboard: every node is a real button in DOM order, orbit by orbit, and the
 * detail panel is an aria-live region. Under reduced motion the whole thing
 * degrades to a plain definition list — no orbits, no transforms.
 */
export function MoreServices() {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const fieldRef = useRef(null)
  const nodeRefs = useRef({})
  const [hovered, setHovered] = useState(null)
  const [locked, setLocked] = useState(null)
  const { reducedMotion, isMobile, isTablet } = useExperience()
  const { sfx } = useSound()
  const { go } = useTransition()

  const active = locked ?? hovered
  const activeCap = active ? getCapability(active) : null

  /**
   * Resolve each node to a pixel offset from the stage centre.
   *
   * Radii are derived from the OUTERMOST ring, not the innermost — scaling up
   * from the inner ring put the outer nodes ~820px from centre, which overflowed
   * the viewport horizontally. Sizing down from a known-safe outer bound keeps
   * the widest node plus its label inside the frame at every breakpoint.
   */
  const radii = useMemo(() => {
    const outerRx = isMobile ? 122 : isTablet ? 250 : 420
    const outerRy = isMobile ? 116 : isTablet ? 165 : 230
    const outermost = ORBITS[ORBITS.length - 1]
    return { outerRx, outerRy, outermost }
  }, [isMobile, isTablet])

  const ringSize = useCallback(
    (orbit) => {
      const k = ORBITS[orbit] / radii.outermost
      return { rx: radii.outerRx * k, ry: radii.outerRy * k }
    },
    [radii],
  )

  const layout = useMemo(
    () =>
      capabilities.map((c) => {
        const rad = (c.angle * Math.PI) / 180
        const { rx, ry } = ringSize(c.orbit)
        return {
          ...c,
          x: Math.cos(rad) * rx,
          y: Math.sin(rad) * ry,
          // Outer orbits sit further back, so the system has real depth.
          z: -c.orbit * (isMobile ? 90 : 150),
          baseScale: 1 - c.orbit * 0.09,
        }
      }),
    [ringSize, isMobile],
  )

  /* ── Placement, entrance, and scroll-driven rotation ── */
  useEffect(() => {
    const root = rootRef.current
    const field = fieldRef.current
    if (!root || !field || reducedMotion) return undefined

    const ctx = gsap.context(() => {
      layout.forEach((c) => {
        const el = nodeRefs.current[c.id]
        if (!el) return
        gsap.set(el, {
          xPercent: -50,
          yPercent: -50,
          x: c.x,
          y: c.y,
          z: c.z,
          scale: c.baseScale,
        })
      })

      gsap.from(Object.values(nodeRefs.current).filter(Boolean), {
        scale: 0.2,
        opacity: 0,
        duration: 1.2,
        ease: EASE.overshoot,
        stagger: { each: 0.06, from: 'center' },
        scrollTrigger: { trigger: root, start: 'top 70%' },
      })

      gsap.from('[data-more-head] > *', {
        y: 30,
        autoAlpha: 0,
        duration: 1,
        ease: EASE.settle,
        stagger: 0.08,
        scrollTrigger: { trigger: '[data-more-head]', start: 'top 86%' },
      })

      gsap.from('[data-more-ring]', {
        scale: 0.7,
        autoAlpha: 0,
        duration: 1.5,
        ease: EASE.settle,
        stagger: 0.1,
        scrollTrigger: { trigger: root, start: 'top 72%' },
      })

      // The system turns as you pass it. Scroll drives it — it never idles.
      gsap.fromTo(
        field,
        { rotateZ: isMobile ? -6 : -14, rotateX: isMobile ? 4 : 10 },
        {
          rotateZ: isMobile ? 6 : 14,
          rotateX: isMobile ? -3 : -7,
          ease: 'none',
          scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: SCRUB },
        },
      )

      // Counter-rotate the labels so they never end up upside down.
      gsap.fromTo(
        '[data-more-label]',
        { rotateZ: isMobile ? 6 : 14 },
        {
          rotateZ: isMobile ? -6 : -14,
          ease: 'none',
          scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: SCRUB },
        },
      )
    }, root)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [layout, reducedMotion, isMobile])

  /* ── Focus reaction across the system ── */
  useEffect(() => {
    if (reducedMotion) return
    layout.forEach((c) => {
      const el = nodeRefs.current[c.id]
      if (!el) return
      const isActive = active === c.id
      gsap.to(el, {
        z: active ? (isActive ? c.z + 420 : c.z - 160) : c.z,
        scale: active ? (isActive ? c.baseScale * 1.24 : c.baseScale * 0.92) : c.baseScale,
        opacity: active ? (isActive ? 1 : 0.28) : 1,
        duration: 0.85,
        ease: EASE.settle,
        overwrite: 'auto',
      })
    })
  }, [active, layout, reducedMotion])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setLocked(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const select = useCallback(
    (id) => {
      sfx('click')
      setLocked((prev) => (prev === id ? null : id))
    },
    [sfx],
  )

  /* ── Reduced motion: a plain, complete list. ── */
  if (reducedMotion) {
    return (
      <section
        id="more-services"
        aria-label="More services"
        className="section border-t border-smoke/40 py-24"
      >
        <div className="shell flex flex-col gap-10">
          <Heading />
          <dl className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((c) => (
              <div key={c.id} className="flex flex-col gap-2 border-t border-smoke/60 pt-5">
                <dt className="font-display text-lg font-semibold text-bone">{c.title}</dt>
                <dd className="text-[13.5px] leading-relaxed text-mist">{c.summary}</dd>
                <dd className="flex flex-wrap gap-2 pt-1">
                  {c.deliverables.map((d) => (
                    <span
                      key={d}
                      className="rounded-full border border-smoke px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-silver"
                    >
                      {d}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    )
  }

  return (
    <section
      id="more-services"
      ref={rootRef}
      aria-label="More services"
      className="section relative border-t border-smoke/40 py-24 md:py-32"
    >
      <WorldBackdrop service={SERVICE} intensity={0.7} />

      <div className="shell relative z-20">
        <Heading />
      </div>

      {/* Orbital system */}
      <div
        ref={stageRef}
        /* overflow-hidden is the containment guarantee: nodes translate in 3D,
           and a rotated outer orbit must never widen the document. */
        className="relative mt-10 h-[74svh] w-full overflow-hidden md:mt-14 md:h-[80svh]"
        style={{ perspective: isMobile ? '1100px' : '1700px' }}
      >
        <div ref={fieldRef} className="absolute inset-0 preserve-3d will-change-transform">
          {/* Orbit rings */}
          {ORBITS.map((o, i) => {
            const { rx, ry } = ringSize(i)
            return (
              <div
                key={o}
                data-more-ring
                aria-hidden="true"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border"
                style={{
                  width: rx * 2,
                  height: ry * 2,
                  borderColor: `${SERVICE.accent}${i === 0 ? '3a' : i === 1 ? '26' : '18'}`,
                  transform: `translate(-50%,-50%) translateZ(${-i * (isMobile ? 90 : 150)}px)`,
                }}
              />
            )
          })}

          {/* Hub */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <span
              className="block h-2 w-2 rounded-full"
              style={{ backgroundColor: SERVICE.accent, boxShadow: `0 0 24px ${SERVICE.accent}` }}
            />
          </div>

          {/* Nodes */}
          {layout.map((c) => {
            const isActive = active === c.id
            return (
              <button
                key={c.id}
                type="button"
                data-cursor="link"
                ref={(el) => {
                  nodeRefs.current[c.id] = el
                }}
                aria-pressed={locked === c.id}
                aria-describedby={isActive ? 'more-detail' : undefined}
                onPointerEnter={() => {
                  setHovered(c.id)
                  sfx('hover', { volume: 0.3 })
                }}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(c.id)}
                onBlur={() => setHovered(null)}
                onClick={() => select(c.id)}
                className="absolute left-1/2 top-1/2 preserve-3d will-change-transform"
              >
                <span
                  data-more-label
                  className={cn(
                    'flex items-center gap-2.5 whitespace-nowrap rounded-full border px-3.5 py-2.5 transition-colors duration-500 md:px-4',
                    isActive ? 'bg-void/92' : 'bg-void/62',
                  )}
                  style={{
                    // Nodes sit over a tinted backdrop, so they need more
                    // border and shadow contrast than the flat-background
                    // constellation in the Technology section.
                    borderColor: isActive ? `${SERVICE.accent}cc` : 'rgba(107,107,120,0.7)',
                    boxShadow: isActive
                      ? `0 0 48px -10px ${SERVICE.accent}cc, 0 24px 50px -26px rgba(0,0,0,0.95)`
                      : '0 18px 40px -24px rgba(0,0,0,0.9)',
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: isActive ? SERVICE.accent : '#8E8E9D',
                      boxShadow: isActive ? `0 0 12px ${SERVICE.accent}` : 'none',
                    }}
                  />
                  <span
                    className={cn(
                      'font-mono uppercase tracking-[0.12em] transition-colors duration-500',
                      isMobile ? 'text-[9px]' : 'text-[10.5px]',
                    )}
                    style={{ color: isActive ? '#E6E6EA' : '#C3C3CD' }}
                  >
                    {isMobile ? c.short : c.title}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {/* Edge falloff */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 84% 82% at 50% 50%, rgba(5,5,7,0) 54%, rgba(5,5,7,0.92) 100%)',
          }}
        />

        {/* Detail */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-gutter pb-2">
          <div
            id="more-detail"
            aria-live="polite"
            className={cn(
              'mx-auto flex w-full max-w-shell flex-col gap-3 rounded-lg border p-4 transition-all duration-500 ease-out-expo md:flex-row md:items-center md:gap-8 md:p-5',
              activeCap
                ? 'translate-y-0 border-smoke/80 bg-void/80 opacity-100 backdrop-blur-xl'
                : 'translate-y-3 border-transparent bg-transparent opacity-0',
            )}
          >
            {activeCap ? (
              <>
                <span className="font-display text-lg font-semibold text-bone md:w-60">
                  {activeCap.title}
                </span>
                <p className="flex-1 text-[13.5px] leading-relaxed text-silver">{activeCap.summary}</p>
                <ul className="flex flex-wrap gap-2">
                  {activeCap.deliverables.map((d) => (
                    <li
                      key={d}
                      className="rounded-full border border-smoke px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-mist"
                    >
                      {d}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <span className="sr-only">Select a capability to read about it.</span>
            )}
          </div>
        </div>
      </div>

      <div className="shell relative z-20 mt-4 flex flex-wrap items-center justify-between gap-4">
        <span className="label">
          {locked ? 'CLICK AGAIN OR PRESS ESC TO RELEASE' : 'HOVER TO FOCUS · CLICK TO HOLD'}
        </span>
        <button
          type="button"
          data-cursor="link"
          onClick={() => go('/contact', { label: 'BEGIN A PROJECT' })}
          className="group flex items-center gap-2 rounded-full border border-smoke px-4 py-2.5 transition-colors duration-500 hover:border-brass/70"
        >
          <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-silver transition-colors group-hover:text-brass">
            Need something else? Ask us
          </span>
          <span className="text-mist transition-all duration-500 group-hover:translate-x-0.5 group-hover:text-brass">
            →
          </span>
        </button>
      </div>
    </section>
  )
}

function Heading() {
  return (
    <div data-more-head className="flex flex-col gap-5">
      <span className="label-brass">MORE SERVICES</span>
      <h2 className="max-w-3xl font-display text-display-3 font-extrabold text-gradient-bone">
        AND EVERYTHING
        <br />
        AROUND THE WORK.
      </h2>
      <p className="max-w-xl text-[15px] leading-relaxed text-silver">
        The ten worlds above are what we build. These are the capabilities that keep them standing —
        available on their own, or folded into a project.
      </p>
    </div>
  )
}
