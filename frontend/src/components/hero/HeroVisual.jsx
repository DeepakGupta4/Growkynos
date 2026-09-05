import { useEffect, useRef } from 'react'
import { gsap, EASE } from '../../lib/gsap'
import { PhoneFrame, BrowserFrame } from '../showcases/ui/Devices'
import { getProject } from '../../data/projects'
import { useExperience } from '../../context/ExperienceContext'

/**
 * HERO VISUAL
 * -----------
 * The right half of the hero was dead space — a wall of black beside the
 * statement, which read as unfinished rather than confident. This fills it with
 * the thing the statement is actually claiming: real products, in depth.
 *
 * A browser sits furthest back, a phone crosses in front of it, and telemetry
 * chips anchor to the cluster. Everything arrives from depth on one timeline
 * and then holds — nothing loops.
 *
 * The chips are children of this cluster, deliberately. They used to be
 * absolutely positioned against the whole section in percentages, which is
 * fragile: any change to hero height moved them independently of anything they
 * related to. Anchored here they cannot drift away from what they annotate.
 */
const CHIPS = [
  { id: 'c1', label: 'build', value: 'PASSING', tone: '#A8C0A0', top: '-4%', left: '-12%' },
  { id: 'c2', label: 'frame', value: '16.6 ms', tone: '#C6A87C', top: '38%', left: '-19%' },
  { id: 'c3', label: 'lighthouse', value: '98 / 100', tone: '#C6A87C', bottom: '4%', right: '-8%' },
]

export function HeroVisual() {
  const rootRef = useRef(null)
  const browserRef = useRef(null)
  const phoneRef = useRef(null)
  const { reducedMotion, booted, quality } = useExperience()

  const web = getProject('obsidian-architects')
  const app = getProject('meridian-health')

  /* ── Entrance: the cluster arrives from depth with the statement. ── */
  useEffect(() => {
    const root = rootRef.current
    if (!root || !booted) return undefined

    if (reducedMotion) {
      gsap.set('[data-hv]', { clearProps: 'all', opacity: 1 })
      return undefined
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.55 })

      tl.from(browserRef.current, {
        z: -900,
        yPercent: 12,
        rotateY: 26,
        rotateX: 14,
        opacity: 0,
        duration: 1.8,
        ease: EASE.mass,
      })
        .from(
          phoneRef.current,
          { z: -620, yPercent: 22, rotateY: 30, opacity: 0, duration: 1.6, ease: EASE.mass },
          '-=1.35',
        )
        .from(
          '[data-hv-chip]',
          { scale: 0.6, opacity: 0, duration: 1, stagger: 0.11, ease: EASE.overshoot },
          '-=0.95',
        )
        .from(
          '[data-hv-glow]',
          { opacity: 0, scale: 0.7, duration: 1.6, ease: 'expo.out' },
          '-=1.7',
        )
    }, root)

    return () => ctx.revert()
  }, [booted, reducedMotion])

  /* ── Pointer parallax: layers separate by depth, not by amount. ── */
  useEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion || quality.parallax === 0) return undefined

    const layers = [
      { el: browserRef.current, depth: 0.5 },
      { el: phoneRef.current, depth: 1 },
    ].filter((l) => l.el)

    const setters = layers.map(({ el, depth }) => ({
      depth,
      x: gsap.quickTo(el, 'x', { duration: 1.1, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration: 1.1, ease: 'power3.out' }),
      ry: gsap.quickTo(el, 'rotateY', { duration: 1.3, ease: 'power3.out' }),
    }))

    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      const k = quality.parallax
      setters.forEach((s) => {
        s.x(nx * 26 * s.depth * k)
        s.y(ny * 16 * s.depth * k)
        s.ry(nx * 7 * s.depth * k)
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reducedMotion, quality.parallax])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none relative hidden h-full w-full items-center justify-center preserve-3d lg:flex"
    >
      {/* Light bed behind the cluster */}
      <div
        data-hv-glow
        className="absolute left-1/2 top-1/2 h-[46vmax] w-[46vmax] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(circle, rgba(198,168,124,0.16) 0%, rgba(159,180,201,0.07) 34%, rgba(5,5,7,0) 68%)',
        }}
      />

      <div className="relative preserve-3d" style={{ width: 'min(38vw, 620px)' }}>
        {/* Browser — furthest back */}
        <div
          ref={browserRef}
          data-hv
          className="preserve-3d will-change-transform"
          style={{ transform: 'translateZ(-120px)' }}
        >
          <BrowserFrame
            url="obsidian.archi"
            accent="#9FB4C9"
            className="w-full"
            style={{ transform: 'rotateY(-9deg) rotateX(4deg)' }}
          >
            <img
              src={web.thumbnail}
              alt=""
              loading="eager"
              decoding="async"
              className="h-[26vh] w-full object-cover object-top"
            />
          </BrowserFrame>
        </div>

        {/* Phone — crosses in front, lower left */}
        <div
          ref={phoneRef}
          data-hv
          className="absolute -bottom-[22%] -left-[10%] preserve-3d will-change-transform"
          style={{ transform: 'translateZ(110px)' }}
        >
          <PhoneFrame width={168}>
            <img
              src={app.thumbnail}
              alt=""
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover object-top"
            />
          </PhoneFrame>
        </div>

        {/* Telemetry chips, anchored to the cluster */}
        {CHIPS.map((c) => (
          <div
            key={c.id}
            data-hv-chip
            data-hv
            className="surface absolute z-20 flex items-center gap-2.5 whitespace-nowrap rounded-full px-3.5 py-2 will-change-transform"
            style={{ top: c.top, left: c.left, right: c.right, bottom: c.bottom }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: c.tone, boxShadow: `0 0 10px ${c.tone}99` }}
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-mist">{c.label}</span>
            <span className="font-mono text-[10px] tabular-nums" style={{ color: c.tone }}>
              {c.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
