import { useEffect, useRef } from 'react'
import { gsap, EASE } from '../../lib/gsap'
import { PhoneFrame, BrowserFrame, PanelFrame } from '../showcases/ui/Devices'
import { getProject } from '../../data/projects'
import { useExperience } from '../../context/ExperienceContext'

/**
 * HERO SCENES
 * -----------
 * One scene per hero word. Each is a LIVING demonstration of that capability,
 * not a screenshot of it — the phone receives a notification, the browser gets
 * clicked, the AI graph moves data through itself, the dashboard counts up.
 *
 * Each scene runs its own short loop while it is the active word and is torn
 * down when it leaves, so only one loop is ever alive. That matters: four
 * simultaneous timelines in a hero would cost more than the entire rest of the
 * page.
 */

/* ── 01 · APPS ─────────────────────────────────────────────── */
function AppScene({ active }) {
  const root = useRef(null)
  const project = getProject('meridian-health')

  useEffect(() => {
    if (!active) return undefined
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.1 })

      // A notification arrives, sits, and is dismissed.
      tl.fromTo(
        '[data-app-notif]',
        { autoAlpha: 0, y: -22, scale: 0.94 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, ease: EASE.overshoot },
        0.5,
      )
        .to('[data-app-notif]', { autoAlpha: 0, y: -14, duration: 0.45, ease: 'power2.in' }, 3.1)

      // Metrics tick up as data syncs.
      tl.fromTo(
        '[data-app-metric]',
        { autoAlpha: 0, x: 18 },
        { autoAlpha: 1, x: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out' },
        1.1,
      )

      // The screen advances a page.
      tl.fromTo(
        '[data-app-row]',
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.09, ease: 'power3.out' },
        1.4,
      )

      // Slow breathing rotation — the object is held, not pinned.
      gsap.to('[data-app-device]', {
        rotateY: 5,
        rotateX: -2.5,
        duration: 5.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    }, root)
    return () => ctx.revert()
  }, [active])

  return (
    /*
     * The stage is deliberately wider than the phone. Chips are positioned
     * against THIS box, so a negative offset puts them beside the device
     * instead of on top of it — with a phone-width container they all landed
     * over the screen.
     */
    <div
      ref={root}
      className="relative flex items-center justify-center preserve-3d"
      style={{ width: 'min(30vw, 460px)' }}
    >
      <div data-app-device className="preserve-3d will-change-transform" style={{ transform: 'rotateY(-6deg)' }}>
        <PhoneFrame width={200}>
          <div className="relative h-full w-full">
            <img src={project.thumbnail} alt="" className="h-full w-full object-cover object-top" />
            <div className="absolute inset-x-0 bottom-[14%] flex flex-col gap-1.5 px-3">
              {['Vitals recorded', 'Round complete', 'Sync queued'].map((t) => (
                <div
                  key={t}
                  data-app-row
                  className="flex items-center gap-2 rounded-lg bg-black/75 px-2.5 py-1.5 backdrop-blur-sm"
                >
                  <span className="h-1 w-1 rounded-full bg-brass" />
                  <span className="font-mono text-[7px] uppercase tracking-[0.12em] text-silver">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </PhoneFrame>
      </div>

      {/* Notification, escaping the device */}
      <div
        data-app-notif
        className="surface-raised absolute right-0 top-[8%] z-20 flex w-[200px] translate-x-[26%] items-start gap-2.5 rounded-2xl p-3"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brass text-[10px] font-bold text-void">
          M
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-[11.5px] font-semibold text-bone">Medication due</p>
          <p className="mt-0.5 truncate font-mono text-[8px] text-mist">Ward 4 · Bed 12 · 14:00</p>
        </div>
      </div>

      {/* Live metrics */}
      <div className="absolute left-0 top-[42%] z-20 flex -translate-x-[22%] flex-col gap-2">
        {[
          ['CRASH-FREE', '99.94%'],
          ['COLD START', '410 ms'],
        ].map(([k, v]) => (
          <div key={k} data-app-metric className="surface flex items-center gap-2.5 rounded-full px-3.5 py-2">
            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist">{k}</span>
            <span className="font-mono text-[10px] tabular-nums text-brass">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── 02 · WEBSITES ─────────────────────────────────────────── */
function WebScene({ active }) {
  const root = useRef(null)
  const project = getProject('obsidian-architects')

  useEffect(() => {
    if (!active) return undefined
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.9 })

      // A cursor travels to the CTA, presses it, and the page responds.
      tl.set('[data-web-cursor]', { x: 30, y: 24, autoAlpha: 0 })
        .to('[data-web-cursor]', { autoAlpha: 1, duration: 0.3 }, 0.4)
        .to('[data-web-cursor]', { x: 78, y: 150, duration: 1.15, ease: 'power2.inOut' }, 0.5)
        .to('[data-web-btn]', { scale: 1.05, backgroundColor: '#E2CBA4', duration: 0.3 }, 1.45)
        .to('[data-web-cursor]', { scale: 0.8, duration: 0.12, yoyo: true, repeat: 1 }, 1.62)
        .to('[data-web-btn]', { scale: 1, backgroundColor: '#C6A87C', duration: 0.3 }, 1.9)
        // The page scrolls in response to the click.
        .to('[data-web-page]', { yPercent: -34, duration: 1.3, ease: 'power2.inOut' }, 2.1)
        .to('[data-web-cursor]', { autoAlpha: 0, duration: 0.3 }, 2.4)
        .to('[data-web-page]', { yPercent: 0, duration: 1.1, ease: 'power2.inOut' }, 4.4)

      gsap.to('[data-web-device]', {
        rotateY: -4,
        duration: 6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    }, root)
    return () => ctx.revert()
  }, [active])

  return (
    <div ref={root} className="relative flex items-center justify-center preserve-3d">
      <div
        data-web-device
        className="preserve-3d will-change-transform"
        style={{ width: 'min(32vw, 520px)', transform: 'rotateY(-8deg) rotateX(3deg)' }}
      >
        <BrowserFrame url="obsidian.archi" accent="#9FB4C9" className="w-full">
          <div className="relative h-[26vh] overflow-hidden">
            <div data-web-page className="will-change-transform">
              <img
                src={project.thumbnail}
                alt=""
                className="h-[26vh] w-full object-cover object-left-top"
              />
              <img
                src={project.images[1] ?? project.thumbnail}
                alt=""
                className="h-[26vh] w-full object-cover object-left-top"
              />
            </div>

            {/* The button the cursor presses */}
            <span
              data-web-btn
              className="absolute left-[8%] top-[62%] rounded-full px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-void"
              style={{ backgroundColor: '#C6A87C' }}
            >
              View work
            </span>

            <span data-web-cursor className="absolute left-0 top-0 z-30 will-change-transform">
              <svg width="15" height="20" viewBox="0 0 15 20" fill="none">
                <path
                  d="M1 1 L1 16 L5 12.5 L7.6 18.6 L10.4 17.4 L7.9 11.6 L13 11.2 Z"
                  fill="#E6E6EA"
                  stroke="#050507"
                  strokeWidth="1"
                />
              </svg>
            </span>
          </div>
        </BrowserFrame>
      </div>
    </div>
  )
}

/* ── 03 · AI SYSTEMS ───────────────────────────────────────── */
const AI_NODES = [
  { id: 'in', x: 40, y: 70, label: 'INPUT' },
  { id: 'ret', x: 175, y: 120, label: 'RETRIEVE' },
  { id: 'reason', x: 320, y: 62, label: 'REASON' },
  { id: 'out', x: 320, y: 182, label: 'OUTPUT' },
]
const AI_EDGES = [
  ['in', 'ret'],
  ['ret', 'reason'],
  ['ret', 'out'],
]

function AIScene({ active }) {
  const root = useRef(null)
  const edgeRefs = useRef([])
  const packet = useRef(null)

  useEffect(() => {
    if (!active) return undefined
    const ctx = gsap.context(() => {
      const edges = edgeRefs.current.filter(Boolean)
      edges.forEach((e) => {
        const len = e.getTotalLength()
        gsap.set(e, { strokeDasharray: len, strokeDashoffset: len })
      })

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8 })
      tl.to(edges, { strokeDashoffset: 0, duration: 0.7, stagger: 0.18, ease: 'power2.inOut' })
        .fromTo(
          '[data-ai-node]',
          { scale: 0.7, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.55, stagger: 0.14, ease: EASE.overshoot },
          0.2,
        )

      // A request travels the real path geometry through the system.
      const route = [edges[0], edges[1]]
      route.forEach((path, i) => {
        if (!path) return
        const len = path.getTotalLength()
        const t = { p: 0 }
        tl.to(
          t,
          {
            p: 1,
            duration: 0.75,
            ease: 'power1.inOut',
            onUpdate: () => {
              const pt = path.getPointAtLength(len * t.p)
              gsap.set(packet.current, { x: pt.x, y: pt.y, autoAlpha: 1 })
            },
          },
          1.1 + i * 0.75,
        )
      })

      tl.to(packet.current, { autoAlpha: 0, scale: 2, duration: 0.4 }, 2.6)
        .fromTo(
          '[data-ai-out]',
          { scale: 1 },
          { scale: 1.18, duration: 0.28, yoyo: true, repeat: 1, ease: 'power2.out' },
          2.55,
        )
        .fromTo(
          '[data-ai-answer]',
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out' },
          2.8,
        )
        .to('[data-ai-answer]', { autoAlpha: 0, duration: 0.4 }, 5.2)
    }, root)
    return () => ctx.revert()
  }, [active])

  const byId = Object.fromEntries(AI_NODES.map((n) => [n.id, n]))

  return (
    <div ref={root} className="relative flex items-center justify-center">
      <PanelFrame label="ORBIT — SUPPORT AUTOMATION" accent="#C6A87C" style={{ width: 'min(30vw, 460px)' }}>
        <div className="p-4">
          <svg viewBox="0 0 400 240" className="h-auto w-full" aria-hidden="true">
            {AI_EDGES.map(([a, b], i) => {
              const n1 = byId[a]
              const n2 = byId[b]
              const mx = (n1.x + n2.x) / 2
              return (
                <path
                  key={`${a}-${b}`}
                  ref={(el) => {
                    edgeRefs.current[i] = el
                  }}
                  d={`M ${n1.x + 34} ${n1.y} C ${mx} ${n1.y}, ${mx} ${n2.y}, ${n2.x - 34} ${n2.y}`}
                  fill="none"
                  stroke="#C6A87C"
                  strokeWidth="1.6"
                  opacity="0.7"
                />
              )
            })}

            {AI_NODES.map((n) => (
              <g key={n.id} data-ai-node {...(n.id === 'out' ? { 'data-ai-out': '' } : {})}>
                <rect x={n.x - 34} y={n.y - 20} width="68" height="40" rx="8" fill="#17171C" />
                <rect
                  x={n.x - 34}
                  y={n.y - 20}
                  width="68"
                  height="40"
                  rx="8"
                  fill="none"
                  stroke="#C6A87C"
                  strokeOpacity="0.45"
                />
                <text
                  x={n.x}
                  y={n.y + 4}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="8"
                  letterSpacing="1"
                  fill="#9C9CA8"
                >
                  {n.label}
                </text>
              </g>
            ))}

            <g ref={packet} style={{ opacity: 0 }}>
              <circle r="12" fill="#C6A87C" opacity="0.18" />
              <circle r="4" fill="#C6A87C" />
            </g>
          </svg>

          <div
            data-ai-answer
            className="mt-2 flex items-center gap-2 rounded-md border border-smoke/70 px-3 py-2"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#A8C0A0]" />
            <span className="font-mono text-[8.5px] uppercase tracking-[0.13em] text-mist">
              RESOLVED · 1.8s · CONFIDENCE 0.96
            </span>
          </div>
        </div>
      </PanelFrame>
    </div>
  )
}

/* ── 04 · SAAS ─────────────────────────────────────────────── */
function SaaSScene({ active }) {
  const root = useRef(null)
  const countRef = useRef(null)

  useEffect(() => {
    if (!active) return undefined
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.4 })

      const obj = { v: 0 }
      tl.to(obj, {
        v: 1284,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: () => {
          if (countRef.current) countRef.current.textContent = Math.round(obj.v).toLocaleString('en-GB')
        },
      })

      tl.fromTo(
        '[data-saas-bar]',
        { scaleY: 0 },
        { scaleY: 1, duration: 0.6, stagger: 0.04, ease: EASE.overshoot, transformOrigin: 'bottom' },
        0.3,
      )

      tl.fromTo(
        '[data-saas-row]',
        { autoAlpha: 0, x: -14 },
        { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.1, ease: 'power3.out' },
        1.1,
      )

      // A live event lands at the top of the feed.
      tl.fromTo(
        '[data-saas-live]',
        { autoAlpha: 0, y: -16, scale: 0.95 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: EASE.overshoot },
        2.2,
      ).to('[data-saas-live]', { autoAlpha: 0, duration: 0.4 }, 4.6)

      gsap.to('[data-saas-pulse]', {
        opacity: 0.25,
        duration: 1.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })
    }, root)
    return () => ctx.revert()
  }, [active])

  const bars = [42, 58, 36, 71, 50, 84, 62, 92, 47, 78, 66, 88]

  return (
    <div ref={root} className="relative flex items-center justify-center">
      <PanelFrame label="SIGNALYARD — OVERVIEW" accent="#C6A87C" style={{ width: 'min(31vw, 480px)' }}>
        <div className="p-4">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <span className="block font-mono text-[8px] uppercase tracking-[0.15em] text-mist">
                ACTIVE UNITS
              </span>
              <span
                ref={countRef}
                className="block font-display text-3xl font-bold leading-none tabular-nums text-brass"
              >
                0
              </span>
            </div>
            <span className="flex items-center gap-1.5">
              <span data-saas-pulse className="h-1.5 w-1.5 rounded-full bg-[#A8C0A0]" />
              <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist">LIVE</span>
            </span>
          </div>

          <div className="mb-3 flex h-16 items-end gap-1">
            {bars.map((h, i) => (
              <span
                key={i}
                data-saas-bar
                className="flex-1 rounded-sm will-change-transform"
                style={{ height: `${h}%`, backgroundColor: i > bars.length - 4 ? '#C6A87C' : '#35353E' }}
              />
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            {[
              ['UNIT-1842', 'EU-WEST', '24ms'],
              ['UNIT-2207', 'US-EAST', '38ms'],
              ['UNIT-3361', 'EU-NORTH', '19ms'],
            ].map((r) => (
              <div
                key={r[0]}
                data-saas-row
                className="flex items-center justify-between border-b border-smoke/40 pb-1.5 last:border-0"
              >
                <span className="font-mono text-[8.5px] text-silver">{r[0]}</span>
                <span className="font-mono text-[8.5px] text-mist">{r[1]}</span>
                <span className="font-mono text-[8.5px] tabular-nums text-silver">{r[2]}</span>
              </div>
            ))}
          </div>
        </div>
      </PanelFrame>

      <div
        data-saas-live
        className="surface-raised absolute -right-[12%] top-[14%] flex items-center gap-2.5 rounded-full px-4 py-2.5"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#A8C0A0]" />
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-silver">
          NEW UNIT ONLINE
        </span>
      </div>
    </div>
  )
}

/* ── Switcher ──────────────────────────────────────────────── */
const SCENES = { app: AppScene, web: WebScene, ai: AIScene, saas: SaaSScene }

export function HeroScene({ scene }) {
  const { reducedMotion } = useExperience()
  const wrapRef = useRef(null)
  const prev = useRef(scene)

  /* Cross-fade between scenes. */
  useEffect(() => {
    if (prev.current === scene) return
    prev.current = scene
    if (reducedMotion || !wrapRef.current) return
    gsap.fromTo(
      wrapRef.current,
      { autoAlpha: 0, scale: 0.965, filter: 'blur(6px)' },
      { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 0.75, ease: EASE.settle },
    )
  }, [scene, reducedMotion])

  const Scene = SCENES[scene] ?? SCENES.app

  return (
    <div ref={wrapRef} className="relative preserve-3d">
      <Scene active />
    </div>
  )
}
