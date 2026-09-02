import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap, ScrollTrigger, EASE, SCRUB } from '../../lib/gsap'
import { services } from '../../data/services'
import { useExperience } from '../../context/ExperienceContext'
import { scrollTo } from '../../hooks/useLenis'
import { useSound } from '../../context/SoundContext'
import { seeded, cn } from '../../lib/utils'

/**
 * SERVICE UNIVERSE
 * ----------------
 * The ten worlds arranged spatially rather than in a grid. Each service is a
 * plate at its own depth, scattered on an authored orbit; scrolling pulls the
 * camera through the cloud so plates pass the viewer at different rates.
 *
 * Hovering a plate brings it forward and pushes its neighbours back — the
 * cloud reacts as a system, which is what stops it reading as a card grid.
 */
export function ServiceUniverse() {
  const rootRef = useRef(null)
  const cloudRef = useRef(null)
  const stageRef = useRef(null)
  const [hovered, setHovered] = useState(null)
  const { reducedMotion, isMobile, isTablet } = useExperience()
  const { sfx } = useSound()

  /* Authored-but-seeded scatter: stable across renders, never overlapping badly. */
  const layout = useMemo(() => {
    const rand = seeded(884422)
    return services.map((s, i) => {
      const cols = 5
      const col = i % cols
      const row = Math.floor(i / cols)
      /*
       * NOTE: GSAP resolves a percentage `x` against the ELEMENT's own width,
       * not the container — so these numbers are large on purpose. A plate is
       * ~236px wide, so ±233% ≈ ±550px of travel, which is the spread that
       * actually fills the stage.
       */
      const spreadX = isMobile ? 210 : 466
      const spreadY = isMobile ? 120 : 170
      const x = (col / (cols - 1) - 0.5) * spreadX + (rand() - 0.5) * (isMobile ? 26 : 58)
      const y = (row - 0.5) * spreadY + (rand() - 0.5) * (isMobile ? 34 : 76)
      const z = -600 + rand() * 700
      return {
        ...s,
        x,
        y,
        z,
        rot: (rand() - 0.5) * 14,
        rotY: (rand() - 0.5) * 22,
        drift: 3.4 + rand() * 3.6,
        scale: 0.82 + rand() * 0.3,
      }
    })
  }, [])

  useEffect(() => {
    const root = rootRef.current
    const cloud = cloudRef.current
    if (!root || !cloud || reducedMotion) return undefined

    const ctx = gsap.context(() => {
      const plates = gsap.utils.toArray('[data-plate]')

      // Place plates in depth
      plates.forEach((el) => {
        const d = JSON.parse(el.dataset.plate)
        gsap.set(el, {
          xPercent: -50,
          yPercent: -50,
          x: `${d.x}%`,
          y: `${d.y}%`,
          z: d.z,
          rotate: d.rot,
          rotateY: d.rotY,
          scale: d.scale,
        })
        // Idle drift — small, slow, never synchronised.
        gsap.to(el, {
          y: `+=${8 + Math.random() * 10}`,
          duration: d.drift,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: Math.random() * 2,
        })
      })

      // Entrance
      gsap.from(plates, {
        z: (i, el) => JSON.parse(el.dataset.plate).z - 900,
        opacity: 0,
        duration: 1.6,
        ease: EASE.settle,
        stagger: { each: 0.055, from: 'random' },
        scrollTrigger: { trigger: root, start: 'top 72%' },
      })

      // Camera travel — a measured push through the cloud, not a fly-through.
      // Starts pulled back so the whole field reads, and ends just short of the
      // nearest plates so they never fill and crop the frame.
      gsap.fromTo(
        cloud,
        { z: isMobile ? -140 : -220 },
        {
          z: isMobile ? 340 : 500,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top bottom',
            end: 'bottom top',
            scrub: SCRUB,
          },
        },
      )

      gsap.to(cloud, {
        rotateX: isMobile ? 2 : 6,
        rotateY: isMobile ? -2 : -7,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: SCRUB },
      })

      // Heading
      gsap.from('[data-universe-line] > span', {
        yPercent: 112,
        duration: 1.2,
        ease: EASE.settle,
        stagger: 0.07,
        scrollTrigger: { trigger: '[data-universe-heading]', start: 'top 82%' },
      })
      gsap.from('[data-universe-sub]', {
        autoAlpha: 0,
        y: 22,
        duration: 1,
        scrollTrigger: { trigger: '[data-universe-heading]', start: 'top 78%' },
      })
    }, root)

    return () => ctx.revert()
  }, [reducedMotion, isMobile])

  /* Pointer parallax on the whole cloud — the viewer leans into the space. */
  useEffect(() => {
    const stage = stageRef.current
    const cloud = cloudRef.current
    if (!stage || !cloud || reducedMotion || isMobile) return undefined

    const rx = gsap.quickTo(cloud, 'rotateY', { duration: 1.1, ease: 'power3.out' })
    const ry = gsap.quickTo(cloud, 'rotateX', { duration: 1.1, ease: 'power3.out' })
    let inside = false

    const onMove = (e) => {
      if (!inside) return
      const r = stage.getBoundingClientRect()
      const nx = (e.clientX - r.left) / r.width - 0.5
      const ny = (e.clientY - r.top) / r.height - 0.5
      rx(nx * 13)
      ry(-ny * 9)
    }
    const onEnter = () => {
      inside = true
    }
    const onLeave = () => {
      inside = false
      rx(0)
      ry(0)
    }

    stage.addEventListener('pointerenter', onEnter)
    stage.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      stage.removeEventListener('pointerenter', onEnter)
      stage.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointermove', onMove)
    }
  }, [reducedMotion, isMobile])

  /* Hover reaction across the whole cloud. */
  useEffect(() => {
    if (reducedMotion || isMobile) return
    const plates = gsap.utils.toArray('[data-plate]')
    plates.forEach((el) => {
      const d = JSON.parse(el.dataset.plate)
      const isTarget = el.dataset.plateId === hovered
      gsap.to(el, {
        z: hovered ? (isTarget ? d.z + 340 : d.z - 130) : d.z,
        scale: hovered ? (isTarget ? d.scale * 1.12 : d.scale * 0.94) : d.scale,
        opacity: hovered ? (isTarget ? 1 : 0.34) : 1,
        filter: hovered && !isTarget ? 'blur(2.5px)' : 'blur(0px)',
        duration: 0.9,
        ease: EASE.settle,
        overwrite: 'auto',
      })
    })
  }, [hovered, reducedMotion, isMobile])

  /* Reduced motion: a legible index, no cloud. */
  if (reducedMotion) {
    return (
      <section id="services" aria-label="Services" className="section border-t border-smoke/40 py-24">
        <div className="shell flex flex-col gap-10">
          <Heading />
          <ul className="flex flex-col border-t border-smoke/60">
            {services.map((s) => (
              <li key={s.id} className="border-b border-smoke/60">
                <button
                  type="button"
                  onClick={() => scrollTo(`#${s.sectionId}`)}
                  className="flex w-full flex-col gap-2 py-5 text-left md:flex-row md:items-center md:gap-8"
                >
                  <span className="font-mono text-[11px] text-brass tabular-nums">{s.index}</span>
                  <span className="font-display text-2xl font-medium text-bone">{s.title}</span>
                  <span className="max-w-xl text-sm text-mist md:ml-auto">{s.summary}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    )
  }

  return (
    <section
      id="services"
      ref={rootRef}
      aria-label="Services"
      className="section relative border-t border-smoke/40 py-24 md:py-32"
    >
      <div className="shell relative z-20">
        <Heading />
      </div>

      {/* Spatial cloud */}
      <div
        ref={stageRef}
        className="relative mt-14 h-[68svh] w-full overflow-hidden md:mt-20 md:h-[78svh]"
        style={{ perspective: isMobile ? '1100px' : '1700px' }}
      >
        <div ref={cloudRef} className="absolute inset-0 preserve-3d will-change-transform">
          {layout.map((s) => (
            <ServicePlate
              key={s.id}
              service={s}
              hovered={hovered === s.id}
              dimmed={hovered !== null && hovered !== s.id}
              onEnter={() => {
                setHovered(s.id)
                sfx('hover', { volume: 0.35 })
              }}
              onLeave={() => setHovered(null)}
              onSelect={() => {
                sfx('click')
                scrollTo(`#${s.sectionId}`, { duration: 1.9 })
              }}
              compact={isMobile || isTablet}
            />
          ))}
        </div>

        {/* Edge falloff so plates dissolve into the void rather than clipping */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 82% 78% at 50% 50%, rgba(5,5,7,0) 44%, rgba(5,5,7,0.92) 100%)',
          }}
        />
      </div>

      <div className="shell relative z-20 -mt-4 flex flex-wrap items-center justify-between gap-4">
        <span className="label">HOVER TO FOCUS · CLICK TO ENTER A WORLD</span>
        <span className="label-brass">{services.length} DISCIPLINES</span>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────── */

function Heading() {
  const lines = ['TEN WORLDS.', 'ONE STUDIO.']
  return (
    <div data-universe-heading className="flex flex-col gap-6">
      <span data-universe-sub className="label-brass">
        THE DIGITAL UNIVERSE
      </span>
      <h2 className="font-display text-display-2 font-extrabold text-gradient-bone">
        {lines.map((l) => (
          <span key={l} data-universe-line className="line-mask">
            <span>{l}</span>
          </span>
        ))}
      </h2>
      <p data-universe-sub className="max-w-xl text-[15px] leading-relaxed text-silver">
        Each discipline is its own environment below — a working demonstration rather than a description.
        Move through them, or jump straight to the one you need.
      </p>
    </div>
  )
}

function ServicePlate({ service, hovered, dimmed, onEnter, onLeave, onSelect, compact }) {
  const data = JSON.stringify({
    x: service.x,
    y: service.y,
    z: service.z,
    rot: service.rot,
    rotY: service.rotY,
    scale: service.scale,
    drift: service.drift,
  })

  return (
    <button
      type="button"
      data-plate={data}
      data-plate-id={service.id}
      data-cursor="view"
      data-cursor-label="ENTER"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={onSelect}
      aria-label={`${service.title} — ${service.summary}`}
      className="absolute left-1/2 top-1/2 preserve-3d text-left will-change-transform"
      style={{ width: compact ? 178 : 236 }}
    >
      <div
        className={cn(
          'surface relative overflow-hidden rounded-xl p-4 transition-colors duration-500 md:p-5',
          hovered && 'border-brass/50',
        )}
        style={{
          boxShadow: hovered
            ? `0 40px 90px -34px rgba(0,0,0,0.95), 0 0 0 1px ${service.accent}66, 0 0 60px -18px ${service.accent}55`
            : undefined,
        }}
      >
        {/* Index + status */}
        <div className="mb-4 flex items-center justify-between">
          <span
            className="font-mono text-[10px] font-medium tabular-nums"
            style={{ color: service.accent }}
          >
            {service.index}
          </span>
          <span
            className="h-1 w-1 rounded-full transition-all duration-500"
            style={{
              backgroundColor: hovered ? service.accent : '#35353E',
              boxShadow: hovered ? `0 0 10px ${service.accent}` : 'none',
            }}
          />
        </div>

        <h3
          className={cn(
            'font-display font-semibold leading-tight tracking-tight transition-colors duration-500',
            compact ? 'text-[13.5px]' : 'text-[16px]',
            'text-bone',
          )}
        >
          {service.title}
        </h3>

        <p
          className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors duration-500"
          style={{ color: hovered ? service.accent : '#6B6B78' }}
        >
          {service.verb}
        </p>

        {/* Metric — the plate carries evidence, not just a name */}
        <div className="mt-4 flex items-baseline gap-1.5 border-t border-smoke/60 pt-3">
          <span className="font-display text-lg font-bold tabular-nums text-bone">
            {service.metric.value}
          </span>
          <span className="font-mono text-[9px] text-mist">{service.metric.unit}</span>
          <span className="ml-auto font-mono text-[8px] uppercase tracking-[0.12em] text-mist">
            {service.metric.caption}
          </span>
        </div>

        {/* Accent wash on hover */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: hovered ? 1 : 0,
            background: `linear-gradient(160deg, ${service.accent}1f 0%, transparent 62%)`,
          }}
        />
      </div>
      <span className="sr-only">{dimmed ? '' : ''}</span>
    </button>
  )
}
