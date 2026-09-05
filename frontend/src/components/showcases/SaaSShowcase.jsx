import { useCallback, useMemo, useRef } from 'react'
import { gsap, EASE } from '../../lib/gsap'
import { ShowcaseFrame } from './ShowcaseFrame'
import { PanelFrame } from './ui/Devices'
import { ProjectTag, StaticShowcase } from './ui/ShowcaseParts'
import { getService } from '../../data/services'
import { projectsByService } from '../../data/projects'
import { useProjectEntry } from '../projects/ProjectEntryContext'
import { seeded } from '../../lib/utils'

const service = getService('saas')

const STATS = [
  { key: 'units', label: 'ACTIVE UNITS', to: 1284, suffix: '', delta: '+12.4%' },
  { key: 'uptime', label: 'UPTIME', to: 99.97, suffix: '%', decimals: 2, delta: '+0.02%' },
  { key: 'events', label: 'EVENTS / MIN', to: 482, suffix: 'k', delta: '+8.1%' },
  { key: 'alerts', label: 'OPEN ALERTS', to: 7, suffix: '', delta: '-38%' },
]

/**
 * SAAS WORLD
 * ----------
 * A working dashboard, not a mockup of one. Charts are drawn from real path
 * geometry with stroke-dashoffset, counters run on actual tweened values,
 * rows re-sort, and a live feed appends. Then one panel takes over the frame
 * and the product comes to the viewer.
 */
export function SaaSShowcase() {
  const project = projectsByService('saas')[0]
  const { enterProject } = useProjectEntry()

  const dashRef = useRef(null)
  const statRefs = useRef({})
  const areaRef = useRef(null)
  const lineRef = useRef(null)
  const barsRef = useRef([])
  const rowsRef = useRef([])
  const feedRef = useRef([])
  const focusPanelRef = useRef(null)
  const donutRef = useRef(null)
  const glowRef = useRef(null)
  const tagRef = useRef(null)

  const setBar = (el, i) => {
    barsRef.current[i] = el
  }
  const setRow = (el, i) => {
    rowsRef.current[i] = el
  }
  const setFeed = (el, i) => {
    feedRef.current[i] = el
  }

  /* Deterministic series so the chart geometry never jumps between renders. */
  const series = useMemo(() => {
    const rand = seeded(573391)
    const pts = 26
    const values = Array.from({ length: pts }, (_, i) => {
      const trend = i / (pts - 1)
      return 0.22 + trend * 0.42 + Math.sin(i / 2.6) * 0.12 + rand() * 0.16
    })
    const W = 560
    const H = 168
    const toXY = (v, i) => [(i / (pts - 1)) * W, H - Math.min(0.98, v) * H]
    const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${toXY(v, i)[0].toFixed(1)} ${toXY(v, i)[1].toFixed(1)}`).join(' ')
    const area = `${line} L${W} ${H} L0 ${H} Z`
    return { values, line, area, W, H, bars: Array.from({ length: 18 }, () => 0.2 + rand() * 0.8) }
  }, [])

  const build = useCallback((tl, { isMobile: mobile }) => {
    const dash = dashRef.current
    const line = lineRef.current
    const area = areaRef.current
    const bars = barsRef.current.filter(Boolean)
    const rows = rowsRef.current.filter(Boolean)
    const feed = feedRef.current.filter(Boolean)
    const focus = focusPanelRef.current
    const donut = donutRef.current
    const glow = glowRef.current
    const tag = tagRef.current
    if (!dash) return

    /* Initial */
    gsap.set(dash, { z: -1150, rotateX: 22, opacity: 0.45, scale: 0.9 })
    gsap.set(glow, { opacity: 0 })
    gsap.set(tag, { autoAlpha: 0, y: 12 })
    gsap.set(focus, { autoAlpha: 0, scale: 0.94, z: -200 })
    gsap.set(bars, { scaleY: 0, transformOrigin: 'bottom center' })
    gsap.set(rows, { autoAlpha: 0, x: -18 })
    gsap.set(feed, { autoAlpha: 0, x: 24 })

    if (line) {
      const len = line.getTotalLength()
      gsap.set(line, { strokeDasharray: len, strokeDashoffset: len })
    }
    gsap.set(area, { autoAlpha: 0 })
    if (donut) gsap.set(donut, { strokeDashoffset: 691 })

    /* 01 — ARRIVAL */
    tl.to(dash, { z: 0, rotateX: 0, opacity: 1, scale: 1, duration: 2.2, ease: 'power3.out' })
      .to(glow, { opacity: 1, duration: 1 }, '-=1.3')
      .to(tag, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=1')

    /* 02 — COUNTERS: real tweened values, not swapped strings. */
    STATS.forEach((s, i) => {
      const el = statRefs.current[s.key]
      if (!el) return
      const obj = { v: 0 }
      tl.to(
        obj,
        {
          v: s.to,
          duration: 1.5,
          ease: 'power2.out',
          onUpdate: () => {
            const dec = s.decimals ?? 0
            const num = dec ? obj.v.toFixed(dec) : Math.round(obj.v).toLocaleString('en-GB')
            el.textContent = `${num}${s.suffix}`
          },
        },
        i === 0 ? '-=1.5' : '<+0.12',
      )
    })

    /* 03 — CHARTS DRAW */
    if (line) {
      tl.to(line, { strokeDashoffset: 0, duration: 2.1, ease: 'power2.inOut' }, '-=1.1')
        .to(area, { autoAlpha: 1, duration: 0.9 }, '-=1.1')
    }
    tl.to(
      bars,
      { scaleY: 1, duration: 0.65, ease: EASE.overshoot, stagger: { each: 0.035, from: 'start' } },
      '-=1.6',
    )
    if (donut) {
      tl.to(donut, { strokeDashoffset: 691 * 0.32, duration: 1.6, ease: 'power2.inOut' }, '-=1.5')
    }

    /* 04 — TABLE POPULATES, then re-sorts as new data lands. */
    tl.to(rows, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.07, ease: 'power3.out' }, '-=1.2')
      .to(feed, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.09, ease: 'power3.out' }, '-=0.6')

    // The alert row escalates and jumps to the top — the data is live.
    if (rows.length >= 3) {
      tl.to(rows[2], { backgroundColor: 'rgba(200,160,160,0.10)', duration: 0.4 }, '+=0.3')
        .to(rows[2], { y: -(rows[2].offsetHeight ?? 34) * 2, duration: 0.75, ease: 'power3.inOut' })
        .to([rows[0], rows[1]], { y: rows[2].offsetHeight ?? 34, duration: 0.75, ease: 'power3.inOut' }, '<')
        .to('[data-saas-alertcount]', { scale: 1.4, duration: 0.2, yoyo: true, repeat: 1, ease: 'power2.inOut' }, '<')
    }

    /* 05 — ONE PANEL BECOMES DOMINANT. */
    tl.to('[data-saas-recede]', { autoAlpha: 0.16, filter: 'blur(3px)', duration: 0.85, ease: 'power2.inOut' }, '+=0.4')
      .to(focus, { autoAlpha: 1, scale: 1, z: mobile ? 120 : 220, duration: 1.15, ease: EASE.settle }, '-=0.6')
      .fromTo(
        '[data-saas-focus-row]',
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power3.out' },
        '-=0.75',
      )
      .fromTo(
        '[data-saas-sparkline]',
        { strokeDashoffset: 300 },
        { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', stagger: 0.14 },
        '-=0.6',
      )

    /* 06 — APPROACH */
    tl.to(
      dash,
      { scale: mobile ? 1.1 : 1.62, z: mobile ? 240 : 420, rotateX: -3, duration: 2, ease: 'power2.in' },
      '+=0.35',
    )
      .to(glow, { opacity: 1.7, duration: 1.3 }, '<')
      .to(tag, { autoAlpha: 0, duration: 0.4 }, '<')
      .fromTo(
        '[data-saas-cta]',
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.settle },
        '-=1.1',
      )
  }, [])

  const tableRows = [
    ['UNIT-1842', 'EU-WEST', 'ONLINE', '24ms'],
    ['UNIT-2207', 'US-EAST', 'ONLINE', '38ms'],
    ['UNIT-0914', 'AP-SOUTH', 'DEGRADED', '182ms'],
    ['UNIT-3361', 'EU-NORTH', 'ONLINE', '19ms'],
    ['UNIT-1178', 'US-WEST', 'ONLINE', '46ms'],
  ]

  return (
    <ShowcaseFrame
      service={service}
      id={service.sectionId}
      beats={5}
      build={build}
      fallback={<StaticShowcase project={project} service={service} />}
    >
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[66vmin] w-[88vmin] -translate-x-1/2 -translate-y-1/2 opacity-0"
        style={{ background: `radial-gradient(ellipse, ${service.accent}22 0%, rgba(5,5,7,0) 70%)` }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 preserve-3d">
        <div ref={dashRef} className="relative preserve-3d will-change-transform">
          <PanelFrame label="SIGNALYARD — FLEET OBSERVABILITY" accent={service.accent} className="w-[min(92vw,880px)]">
            <div className="relative p-3 md:p-5">
              {/* Stat row */}
              <div data-saas-recede className="mb-3 grid grid-cols-2 gap-2 md:mb-4 md:grid-cols-4 md:gap-3">
                {STATS.map((s) => (
                  <div key={s.key} className="surface rounded-md p-2.5 md:p-3.5">
                    <span className="block font-mono text-[7px] uppercase tracking-[0.15em] text-mist md:text-[8px]">
                      {s.label}
                    </span>
                    <span
                      ref={(el) => {
                        statRefs.current[s.key] = el
                      }}
                      data-saas-alertcount={s.key === 'alerts' ? '' : undefined}
                      className="mt-1 block font-display text-lg font-bold leading-none tabular-nums md:text-2xl"
                      style={{ color: s.key === 'units' ? service.accent : '#E6E6EA' }}
                    >
                      0
                    </span>
                    <span
                      className="mt-1 block font-mono text-[7.5px] md:text-[8.5px]"
                      style={{ color: s.delta.startsWith('-') ? '#C8A0A0' : '#A8C0A0' }}
                    >
                      {s.delta}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid gap-2 md:grid-cols-3 md:gap-3">
                {/* Main chart */}
                <div data-saas-recede className="surface col-span-2 rounded-md p-2.5 md:p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-display text-[10px] font-semibold text-silver md:text-[12px]">
                      Throughput
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-[#A8C0A0] anim-pulse" />
                      <span className="font-mono text-[7px] uppercase tracking-[0.14em] text-mist md:text-[8px]">
                        REALTIME
                      </span>
                    </span>
                  </div>
                  <svg
                    viewBox={`0 0 ${series.W} ${series.H}`}
                    className="h-20 w-full md:h-28"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="saas-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={service.accent} stopOpacity="0.32" />
                        <stop offset="100%" stopColor={service.accent} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[0, 1, 2, 3].map((i) => (
                      <line
                        key={i}
                        x1="0"
                        y1={(series.H / 3) * i}
                        x2={series.W}
                        y2={(series.H / 3) * i}
                        stroke="#35353E"
                        strokeWidth="1"
                        opacity="0.4"
                      />
                    ))}
                    <path ref={areaRef} d={series.area} fill="url(#saas-area)" />
                    <path
                      ref={lineRef}
                      d={series.line}
                      fill="none"
                      stroke={service.accent}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  {/* Bars */}
                  <div className="mt-2 flex h-8 items-end gap-[3px] md:h-11">
                    {series.bars.map((v, i) => (
                      <span
                        key={i}
                        ref={(el) => setBar(el, i)}
                        className="flex-1 rounded-sm will-change-transform"
                        style={{
                          height: `${v * 100}%`,
                          backgroundColor: i > series.bars.length - 4 ? service.accent : '#35353E',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Distribution + feed */}
                <div data-saas-recede className="surface flex flex-col rounded-md p-2.5 md:p-3.5">
                  <span className="mb-2 font-display text-[10px] font-semibold text-silver md:text-[12px]">
                    Distribution
                  </span>
                  <div className="relative mx-auto h-16 w-16 md:h-20 md:w-20">
                    <svg viewBox="0 0 240 240" className="h-full w-full -rotate-90" aria-hidden="true">
                      <circle cx="120" cy="120" r="110" fill="none" stroke="#232329" strokeWidth="22" />
                      <circle
                        ref={donutRef}
                        cx="120"
                        cy="120"
                        r="110"
                        fill="none"
                        stroke={service.accent}
                        strokeWidth="22"
                        strokeDasharray="691"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 grid place-items-center font-mono text-[9px] text-bone md:text-[11px]">
                      68%
                    </span>
                  </div>
                  <ul className="mt-2 flex flex-col gap-1.5 md:mt-3">
                    {['Nominal', 'Degraded', 'Offline'].map((t, i) => (
                      <li key={t} ref={(el) => setFeed(el, i)} className="flex items-center gap-2">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: [service.accent, '#C8A0A0', '#35353E'][i] }}
                        />
                        <span className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-mist md:text-[8.5px]">
                          {t}
                        </span>
                        <span className="ml-auto font-mono text-[8px] tabular-nums text-silver md:text-[9px]">
                          {['68%', '24%', '8%'][i]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Table */}
              <div data-saas-recede className="surface mt-2 overflow-hidden rounded-md md:mt-3">
                <div className="grid grid-cols-4 gap-2 border-b border-smoke/70 px-2.5 py-1.5 md:px-3.5 md:py-2">
                  {['UNIT', 'REGION', 'STATUS', 'LATENCY'].map((h) => (
                    <span key={h} className="font-mono text-[6.5px] uppercase tracking-[0.14em] text-mist md:text-[7.5px]">
                      {h}
                    </span>
                  ))}
                </div>
                {tableRows.map((r, i) => (
                  <div
                    key={r[0]}
                    ref={(el) => setRow(el, i)}
                    className="grid grid-cols-4 items-center gap-2 border-b border-smoke/40 px-2.5 py-1.5 last:border-0 will-change-transform md:px-3.5 md:py-2"
                  >
                    <span className="font-mono text-[7.5px] text-silver md:text-[9px]">{r[0]}</span>
                    <span className="font-mono text-[7.5px] text-mist md:text-[9px]">{r[1]}</span>
                    <span
                      className="w-fit rounded-full px-1.5 py-0.5 font-mono text-[6.5px] tracking-[0.1em] md:text-[7.5px]"
                      style={{
                        color: r[2] === 'ONLINE' ? '#A8C0A0' : '#C8A0A0',
                        backgroundColor: r[2] === 'ONLINE' ? 'rgba(168,192,160,0.14)' : 'rgba(200,160,160,0.16)',
                      }}
                    >
                      {r[2]}
                    </span>
                    <span className="font-mono text-[7.5px] tabular-nums text-silver md:text-[9px]">{r[3]}</span>
                  </div>
                ))}
              </div>

              {/* Focus panel */}
              <div
                ref={focusPanelRef}
                className="absolute inset-2 z-30 flex flex-col gap-2.5 overflow-hidden rounded-lg p-3 opacity-0 preserve-3d md:inset-4 md:gap-4 md:p-6"
                style={{
                  background: 'linear-gradient(158deg,rgba(26,26,32,0.99),rgba(8,8,11,1))',
                  border: `1px solid ${service.accent}44`,
                  boxShadow: `0 50px 110px -40px rgba(0,0,0,0.96), 0 0 80px -30px ${service.accent}55`,
                }}
              >
                <div data-saas-focus-row className="flex items-center justify-between">
                  <span className="font-mono text-[8px] uppercase tracking-[0.16em]" style={{ color: service.accent }}>
                    UNIT-0914 / AP-SOUTH
                  </span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#C8A0A0]">
                    ● DEGRADED
                  </span>
                </div>
                <h3 data-saas-focus-row className="font-display text-base font-semibold text-bone md:text-2xl">
                  Latency exceeded threshold
                </h3>
                <div data-saas-focus-row className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
                  {[
                    ['LATENCY', '182ms'],
                    ['PACKET LOSS', '2.4%'],
                    ['UPTIME 24H', '97.1%'],
                    ['LAST SEEN', '3s'],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded border border-smoke/70 p-2 md:p-2.5">
                      <span className="block font-mono text-[6.5px] uppercase tracking-[0.14em] text-mist md:text-[7.5px]">
                        {k}
                      </span>
                      <span className="mt-1 block font-display text-sm font-bold tabular-nums text-bone md:text-lg">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <div data-saas-focus-row className="flex-1 rounded border border-smoke/70 p-2 md:p-3">
                  <svg viewBox="0 0 300 80" className="h-full max-h-24 w-full" preserveAspectRatio="none" aria-hidden="true">
                    <path
                      data-saas-sparkline
                      d="M0 62 L30 54 L60 58 L90 40 L120 46 L150 28 L180 34 L210 18 L240 26 L270 12 L300 20"
                      fill="none"
                      stroke={service.accent}
                      strokeWidth="2"
                      strokeDasharray="300"
                      vectorEffect="non-scaling-stroke"
                    />
                    <path
                      data-saas-sparkline
                      d="M0 72 L30 70 L60 68 L90 66 L120 68 L150 60 L180 62 L210 54 L240 58 L270 50 L300 52"
                      fill="none"
                      stroke="#8E8E9D"
                      strokeWidth="1.4"
                      strokeDasharray="300"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>
                <div data-saas-focus-row className="flex flex-wrap gap-2">
                  {project.technologies.slice(0, 4).map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-smoke px-2.5 py-1 font-mono text-[7.5px] uppercase tracking-[0.12em] text-silver md:text-[8.5px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </PanelFrame>
        </div>

        <div ref={tagRef} className="opacity-0">
          <ProjectTag project={project} accent={service.accent} />
        </div>
      </div>

      <div data-saas-cta className="absolute inset-x-0 bottom-[26%] z-40 flex justify-center opacity-0 md:bottom-[16%]">
        <button
          type="button"
          data-cursor="view"
          data-cursor-label="ENTER"
          onClick={(e) => enterProject(project, e.currentTarget)}
          className="group flex items-center gap-3 rounded-full border px-5 py-3 backdrop-blur-md transition-colors duration-500"
          style={{ borderColor: `${service.accent}80`, backgroundColor: 'rgba(5,5,7,0.7)' }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: service.accent }}>
            Enter {project.title}
          </span>
          <span className="transition-transform duration-500 group-hover:translate-x-1" style={{ color: service.accent }}>
            →
          </span>
        </button>
      </div>
    </ShowcaseFrame>
  )
}
