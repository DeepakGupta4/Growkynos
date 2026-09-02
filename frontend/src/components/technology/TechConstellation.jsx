import { useCallback, useMemo, useRef, useState } from 'react'
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect'
import { gsap, ScrollTrigger, EASE, SCRUB } from '../../lib/gsap'
import { technologies, techGroups, getTech } from '../../data/technologies'
import { useExperience } from '../../context/ExperienceContext'
import { useSound } from '../../context/SoundContext'
import { cn } from '../../lib/utils'

/**
 * TECHNOLOGY CONSTELLATION
 * ------------------------
 * Not a logo grid. Nodes sit at authored positions in a depth field, joined by
 * the connections that actually exist between them in our work.
 *
 * Hover (or focus) lifts a node forward, brightens only its real edges, and
 * pushes everything unrelated back and out of focus — so the structure of the
 * stack becomes readable rather than decorative. Click locks that focus and
 * opens the node's detail.
 *
 * Fully keyboard operable: every node is a real button in DOM order, and the
 * detail panel is announced via aria-live.
 */
export function TechConstellation() {
  const rootRef = useRef(null)
  const fieldRef = useRef(null)
  const svgRef = useRef(null)
  const nodeRefs = useRef({})
  const [hovered, setHovered] = useState(null)
  const [locked, setLocked] = useState(null)
  const { reducedMotion, isMobile, isTablet } = useExperience()
  const { sfx } = useSound()

  const active = locked ?? hovered
  const activeTech = active ? getTech(active) : null

  /* Edge list — deduplicated, since links are declared from both ends. */
  const edges = useMemo(() => {
    const seen = new Set()
    const out = []
    technologies.forEach((t) => {
      t.links.forEach((l) => {
        const key = [t.id, l].sort().join('|')
        if (seen.has(key)) return
        seen.add(key)
        const other = getTech(l)
        if (other) out.push({ a: t, b: other, key })
      })
    })
    return out
  }, [])

  /** Normalised (-1..1) → percentage position inside the field. */
  const pos = useCallback(
    (t) => ({
      left: `${50 + t.x * (isMobile ? 30 : 38)}%`,
      top: `${50 + t.y * (isMobile ? 32 : 42)}%`,
    }),
    [isMobile],
  )

  const svgPos = useCallback(
    (t) => ({
      x: 50 + t.x * (isMobile ? 30 : 38),
      y: 50 + t.y * (isMobile ? 32 : 42),
    }),
    [isMobile],
  )

  /* ── Entrance + scroll parallax ── */
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current
    const field = fieldRef.current
    if (!root || !field || reducedMotion) return undefined

    const ctx = gsap.context(() => {
      const nodes = gsap.utils.toArray('[data-tech-node]')

      nodes.forEach((el) => {
        const depth = Number(el.dataset.depth ?? 0.5)
        gsap.set(el, { z: (depth - 0.5) * 520 })
      })

      gsap.from(nodes, {
        scale: 0.2,
        opacity: 0,
        duration: 1.3,
        ease: EASE.overshoot,
        stagger: { each: 0.055, from: 'center' },
        scrollTrigger: { trigger: root, start: 'top 68%' },
      })

      /*
       * Edge length is read from the element's own data attribute rather than
       * getTotalLength(): that call throws InvalidStateError on any SVG
       * geometry that is not currently rendered (during an error-boundary
       * re-render, inside a hidden ancestor, etc.), which would take out the
       * whole section. The value is exact — these are straight lines.
       */
      const edgeLen = (i, el) => Number(el.dataset.len) || 200

      gsap.fromTo(
        '[data-tech-edge]',
        { strokeDashoffset: edgeLen, strokeDasharray: edgeLen },
        {
          strokeDashoffset: 0,
          duration: 1.6,
          ease: 'power2.inOut',
          stagger: 0.035,
          scrollTrigger: { trigger: root, start: 'top 66%' },
        },
      )

      gsap.from('[data-tech-head] > *', {
        y: 30,
        autoAlpha: 0,
        duration: 1,
        ease: EASE.settle,
        stagger: 0.09,
        scrollTrigger: { trigger: '[data-tech-head]', start: 'top 86%' },
      })

      // The field rotates through the viewport — a slow camera drift.
      gsap.fromTo(
        field,
        { rotateY: isMobile ? 4 : 9, rotateX: isMobile ? -2 : -4 },
        {
          rotateY: isMobile ? -4 : -9,
          rotateX: isMobile ? 2 : 4,
          ease: 'none',
          scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: SCRUB },
        },
      )

      // Idle life — each node breathes on its own clock.
      nodes.forEach((el, i) => {
        gsap.to(el, {
          y: `+=${6 + (i % 4) * 2.5}`,
          duration: 3.6 + (i % 5) * 0.7,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: i * 0.14,
        })
      })
    }, root)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [reducedMotion, isMobile])

  /* ── Pointer parallax ── */
  useIsomorphicLayoutEffect(() => {
    const field = fieldRef.current
    const root = rootRef.current
    if (!field || !root || reducedMotion || isMobile) return undefined

    const rx = gsap.quickTo(field, 'rotateY', { duration: 1.2, ease: 'power3.out' })
    const ry = gsap.quickTo(field, 'rotateX', { duration: 1.2, ease: 'power3.out' })
    let inside = false

    const onMove = (e) => {
      if (!inside) return
      const r = root.getBoundingClientRect()
      rx(((e.clientX - r.left) / r.width - 0.5) * 16)
      ry(-((e.clientY - r.top) / r.height - 0.5) * 11)
    }
    const enter = () => {
      inside = true
    }
    const leave = () => {
      inside = false
      rx(0)
      ry(0)
    }

    root.addEventListener('pointerenter', enter)
    root.addEventListener('pointerleave', leave)
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      root.removeEventListener('pointerenter', enter)
      root.removeEventListener('pointerleave', leave)
      window.removeEventListener('pointermove', onMove)
    }
  }, [reducedMotion, isMobile])

  /* ── Focus reaction across the whole constellation ── */
  useIsomorphicLayoutEffect(() => {
    if (reducedMotion) return
    technologies.forEach((t) => {
      const el = nodeRefs.current[t.id]
      if (!el) return
      const base = (t.z - 0.5) * 520
      const isActive = active === t.id
      const isNeighbour = active ? getTech(active)?.links.includes(t.id) : false

      gsap.to(el, {
        z: active ? (isActive ? base + 340 : isNeighbour ? base + 90 : base - 190) : base,
        scale: active ? (isActive ? 1.16 : isNeighbour ? 1.03 : 0.9) : 1,
        opacity: active ? (isActive ? 1 : isNeighbour ? 0.92 : 0.26) : 1,
        filter: active && !isActive && !isNeighbour ? 'blur(2.5px)' : 'blur(0px)',
        duration: 0.85,
        ease: EASE.settle,
        overwrite: 'auto',
      })
    })
  }, [active, reducedMotion])

  const isEdgeLive = useCallback(
    (e) => Boolean(active && (e.a.id === active || e.b.id === active)),
    [active],
  )

  const handleSelect = useCallback(
    (id) => {
      sfx('click')
      setLocked((prev) => (prev === id ? null : id))
    },
    [sfx],
  )

  useIsomorphicLayoutEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setLocked(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <section
      id="technology"
      ref={rootRef}
      aria-label="Technology"
      className="section relative border-t border-smoke/40 py-24 md:py-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(66vmax 52vmax at 50% 48%, rgba(198,168,124,0.07) 0%, rgba(5,5,7,0) 68%)',
        }}
      />

      <div className="shell relative z-10">
        <header data-tech-head className="flex flex-col gap-5">
          <span className="label-brass">THE STACK</span>
          <h2 className="max-w-3xl font-display text-display-3 font-extrabold text-gradient-bone">
            TOOLS WE HAVE
            <br />
            EARNED OPINIONS ABOUT.
          </h2>
          <p className="max-w-xl text-[15px] leading-relaxed text-silver">
            Not a list of logos. These are connected the way they are connected in our work — hover a node
            to see what it actually touches.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {Object.entries(techGroups).map(([key, g]) => (
              <li key={key} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: g.color }} />
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist">{g.label}</span>
              </li>
            ))}
          </ul>
        </header>
      </div>

      {/* Constellation */}
      {/*
        overflow-hidden is load-bearing: the field is rotated on Y, so its
        projected bounding box is wider than the container and would otherwise
        push the document sideways. The falloff gradient hides the clip.
      */}
      <div
        className="relative mt-10 h-[76svh] w-full overflow-hidden md:mt-16 md:h-[82svh]"
        style={{ perspective: isMobile ? '1200px' : '1800px' }}
      >
        <div ref={fieldRef} className="absolute inset-0 preserve-3d will-change-transform">
          {/* Connections */}
          <svg
            ref={svgRef}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
          >
            {edges.map((e) => {
              const p1 = svgPos(e.a)
              const p2 = svgPos(e.b)
              const live = isEdgeLive(e)
              // Length in viewBox units — used by the draw-on animation.
              const len = Math.hypot(p2.x - p1.x, p2.y - p1.y)
              return (
                <line
                  key={e.key}
                  data-tech-edge
                  data-len={len.toFixed(2)}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={live ? techGroups[e.a.group].color : '#5A5A68'}
                  strokeWidth={live ? 1.4 : 0.9}
                  strokeOpacity={active ? (live ? 0.9 : 0.1) : 0.6}
                  vectorEffect="non-scaling-stroke"
                  style={{ transition: 'stroke 0.5s, stroke-opacity 0.5s, stroke-width 0.5s' }}
                />
              )
            })}
          </svg>

          {/* Nodes */}
          {technologies.map((t) => {
            const isActive = active === t.id
            const isNeighbour = active ? getTech(active)?.links.includes(t.id) : false
            const color = techGroups[t.group].color
            return (
              <button
                key={t.id}
                type="button"
                data-tech-node
                data-depth={t.z}
                data-cursor="link"
                ref={(el) => {
                  nodeRefs.current[t.id] = el
                }}
                aria-pressed={locked === t.id}
                aria-describedby={isActive ? 'tech-detail' : undefined}
                onPointerEnter={() => {
                  setHovered(t.id)
                  sfx('hover', { volume: 0.3 })
                }}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(t.id)}
                onBlur={() => setHovered(null)}
                onClick={() => handleSelect(t.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 preserve-3d will-change-transform"
                style={pos(t)}
              >
                <span
                  className={cn(
                    'relative flex items-center gap-2.5 rounded-full border px-3 py-2 transition-colors duration-500 md:px-4 md:py-2.5',
                    isActive ? 'bg-void/90' : 'bg-void/60',
                  )}
                  style={{
                    borderColor: isActive || isNeighbour ? `${color}99` : 'rgba(53,53,62,0.9)',
                    boxShadow: isActive ? `0 0 46px -10px ${color}aa, 0 24px 50px -26px rgba(0,0,0,0.95)` : undefined,
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: isActive || isNeighbour ? color : '#35353E',
                      boxShadow: isActive ? `0 0 12px ${color}` : 'none',
                    }}
                  />
                  <span
                    className={cn(
                      'whitespace-nowrap font-mono uppercase tracking-[0.12em] transition-colors duration-500',
                      isMobile ? 'text-[9px]' : 'text-[10.5px]',
                    )}
                    style={{ color: isActive ? '#E6E6EA' : isNeighbour ? '#9C9CA8' : '#6B6B78' }}
                  >
                    {t.name}
                  </span>
                  {locked === t.id && (
                    <span className="ml-0.5 font-mono text-[8px]" style={{ color }}>
                      ●
                    </span>
                  )}
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
              'radial-gradient(ellipse 84% 82% at 50% 50%, rgba(5,5,7,0) 52%, rgba(5,5,7,0.9) 100%)',
          }}
        />

        {/* Detail panel */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-gutter pb-2">
          <div
            id="tech-detail"
            aria-live="polite"
            className={cn(
              'mx-auto flex w-full max-w-shell flex-col gap-3 rounded-lg border p-4 transition-all duration-500 ease-out-expo md:flex-row md:items-center md:gap-8 md:p-5',
              activeTech
                ? 'translate-y-0 border-smoke/80 bg-void/80 opacity-100 backdrop-blur-xl'
                : 'translate-y-3 border-transparent bg-transparent opacity-0',
            )}
          >
            {activeTech ? (
              <>
                <div className="flex items-center gap-3 md:w-56">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: techGroups[activeTech.group].color }}
                  />
                  <span className="font-display text-lg font-semibold text-bone">{activeTech.name}</span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist">
                    {techGroups[activeTech.group].label}
                  </span>
                </div>
                <p className="flex-1 text-[13.5px] leading-relaxed text-silver">{activeTech.note}</p>
                <div className="flex items-center gap-5">
                  <span className="flex flex-col">
                    <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist">SINCE</span>
                    <span className="font-display text-base font-semibold tabular-nums text-bone">
                      {activeTech.since}
                    </span>
                  </span>
                  <span className="flex flex-col">
                    <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist">
                      CONNECTS
                    </span>
                    <span className="font-display text-base font-semibold tabular-nums text-bone">
                      {activeTech.links.length}
                    </span>
                  </span>
                </div>
              </>
            ) : (
              <span className="sr-only">Select a technology to read about it.</span>
            )}
          </div>
        </div>
      </div>

      <div className="shell relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="label">
          {locked ? 'CLICK AGAIN OR PRESS ESC TO RELEASE' : 'HOVER TO TRACE · CLICK TO LOCK'}
        </span>
        <span className="label-brass">{technologies.length} NODES · {edges.length} CONNECTIONS</span>
      </div>
    </section>
  )
}
