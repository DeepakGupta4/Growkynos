import { useCallback, useMemo, useRef } from 'react'
import { gsap, EASE } from '../../lib/gsap'
import { ShowcaseFrame } from './ShowcaseFrame'
import { ProjectTag, StaticShowcase } from './ui/ShowcaseParts'
import { getService } from '../../data/services'
import { projectsByService } from '../../data/projects'
import { useProjectEntry } from '../projects/ProjectEntryContext'

const service = getService('ai')

/* Authored graph — a real support-automation topology, not a decorative mesh. */
const VB = { w: 1200, h: 560 }

const NODES = [
  { id: 'ticket', x: 90, y: 150, w: 190, h: 84, stage: 'INPUT', label: 'Ticket received', sub: 'Zendesk webhook' },
  { id: 'docs', x: 90, y: 320, w: 190, h: 84, stage: 'INPUT', label: 'Docs + history', sub: '18k documents' },
  { id: 'retrieve', x: 380, y: 232, w: 200, h: 96, stage: 'RETRIEVE', label: 'Vector search', sub: 'pgvector · top-k 8' },
  { id: 'reason', x: 680, y: 128, w: 210, h: 100, stage: 'REASON', label: 'Draft response', sub: 'Claude · tool use' },
  { id: 'evaluate', x: 680, y: 316, w: 210, h: 96, stage: 'EVALUATE', label: 'Accuracy gate', sub: 'eval harness · 96.2%' },
  { id: 'resolve', x: 980, y: 148, w: 168, h: 84, stage: 'OUTPUT', label: 'Auto-resolve', sub: '34% of queue' },
  { id: 'escalate', x: 980, y: 330, w: 168, h: 84, stage: 'OUTPUT', label: 'Escalate', sub: 'with full context' },
]

const EDGES = [
  ['ticket', 'retrieve'],
  ['docs', 'retrieve'],
  ['retrieve', 'reason'],
  ['reason', 'evaluate'],
  ['evaluate', 'resolve'],
  ['evaluate', 'escalate'],
]

const byId = Object.fromEntries(NODES.map((n) => [n.id, n]))

const STAGE_COLOR = {
  INPUT: '#9FB4C9',
  RETRIEVE: '#E6E6EA',
  REASON: '#C6A87C',
  EVALUATE: '#C6A87C',
  OUTPUT: '#A8C0A0',
}

/**
 * AI WORLD
 * --------
 * INPUT → PROCESS → AI → OUTPUT, shown as the workflow it actually is.
 *
 * Edges are drawn with stroke-dashoffset, then a packet travels each edge along
 * its real geometry, so information visibly moves through the system. No brains,
 * no neon meshes — a pipeline you could hand to an engineer.
 */
export function AIShowcase() {
  const project = projectsByService('ai')[0]
  const { enterProject } = useProjectEntry()

  const graphRef = useRef(null)
  const edgeRefs = useRef([])
  const nodeRefs = useRef({})
  const packetRef = useRef(null)
  const metricsRef = useRef([])
  const consoleRef = useRef([])
  const glowRef = useRef(null)
  const tagRef = useRef(null)
  const statRefs = useRef({})

  const setEdge = (el, i) => {
    edgeRefs.current[i] = el
  }
  const setMetric = (el, i) => {
    metricsRef.current[i] = el
  }
  const setConsole = (el, i) => {
    consoleRef.current[i] = el
  }

  /* Edge geometry — smooth bezier between node ports. */
  const edgePaths = useMemo(
    () =>
      EDGES.map(([a, b]) => {
        const n1 = byId[a]
        const n2 = byId[b]
        const x1 = n1.x + n1.w
        const y1 = n1.y + n1.h / 2
        const x2 = n2.x
        const y2 = n2.y + n2.h / 2
        const mx = (x1 + x2) / 2
        return { d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`, from: a, to: b }
      }),
    [],
  )

  const build = useCallback((tl, { isMobile: mobile }) => {
    const graph = graphRef.current
    const edges = edgeRefs.current.filter(Boolean)
    const packet = packetRef.current
    const metrics = metricsRef.current.filter(Boolean)
    const lines = consoleRef.current.filter(Boolean)
    const glow = glowRef.current
    const tag = tagRef.current
    if (!graph) return

    const nodes = NODES.map((n) => nodeRefs.current[n.id]).filter(Boolean)

    /* Initial */
    gsap.set(graph, { z: -900, rotateX: 16, opacity: 0, scale: 0.94 })
    gsap.set(nodes, { autoAlpha: 0, y: 22, scale: 0.94 })
    edges.forEach((e) => {
      const len = e.getTotalLength()
      gsap.set(e, { strokeDasharray: len, strokeDashoffset: len })
    })
    gsap.set(packet, { autoAlpha: 0 })
    gsap.set(metrics, { autoAlpha: 0, y: 18 })
    gsap.set(lines, { autoAlpha: 0, x: -14 })
    gsap.set(glow, { opacity: 0 })
    gsap.set(tag, { autoAlpha: 0, y: 12 })

    /* 01 — SYSTEM ARRIVES */
    tl.to(graph, { z: 0, rotateX: 0, opacity: 1, scale: 1, duration: 1.9, ease: 'power3.out' })
      .to(glow, { opacity: 1, duration: 1 }, '-=1.2')
      .to(tag, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.9')

    /* 02 — INPUTS come online first, then the rest of the graph. */
    tl.to(nodes.slice(0, 2), { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.14, ease: EASE.settle }, '-=0.8')

    /* 03 — EDGES DRAW as each downstream node connects. */
    const order = [
      { edge: [0, 1], node: 2 },
      { edge: [2], node: 3 },
      { edge: [3], node: 4 },
      { edge: [4, 5], node: [5, 6] },
    ]

    order.forEach((step, i) => {
      step.edge.forEach((ei, j) => {
        tl.to(
          edges[ei],
          { strokeDashoffset: 0, duration: 0.85, ease: 'power2.inOut' },
          j === 0 ? (i === 0 ? '-=0.3' : '-=0.35') : '<+0.1',
        )
      })
      const targets = Array.isArray(step.node) ? step.node.map((n) => nodes[n]) : [nodes[step.node]]
      tl.to(targets, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: EASE.settle }, '-=0.45')
    })

    /* 04 — A REQUEST FLOWS THROUGH: the packet rides each edge's real path. */
    const route = [0, 2, 3, 4]

    tl.to(packet, { autoAlpha: 1, duration: 0.2 }, '+=0.2')
    route.forEach((ei, i) => {
      const path = edges[ei]
      const len = path.getTotalLength()
      const trav = { p: 0 }
      tl.to(trav, {
        p: 1,
        duration: 0.85,
        ease: i === route.length - 1 ? 'power2.out' : 'power1.inOut',
        onUpdate: () => {
          const pt = path.getPointAtLength(len * trav.p)
          gsap.set(packet, { x: pt.x, y: pt.y })
        },
      })
      // The receiving node pulses as the packet lands.
      const toNode = nodeRefs.current[edgePaths[ei].to]
      if (toNode) {
        tl.to(toNode, { scale: 1.045, duration: 0.2, ease: 'power2.out' }, '-=0.12').to(toNode, {
          scale: 1,
          duration: 0.5,
          ease: 'elastic.out(1,0.55)',
        })
      }
      if (lines[i]) {
        tl.to(lines[i], { autoAlpha: 1, x: 0, duration: 0.35, ease: 'power3.out' }, '-=0.55')
      }
    })

    /* 05 — OUTPUT: the branch resolves and the metrics land. */
    tl.to(edges[4], { stroke: '#A8C0A0', strokeWidth: 2.6, duration: 0.5 }, '-=0.3')
      .to(packet, { autoAlpha: 0, scale: 1.8, duration: 0.5, ease: 'power2.out' }, '-=0.2')
      .to(nodeRefs.current.resolve, { scale: 1.08, duration: 0.3, ease: 'power2.out' }, '-=0.4')
      .to(nodeRefs.current.resolve, { scale: 1, duration: 0.6, ease: 'elastic.out(1,0.5)' })
      .to(nodeRefs.current.escalate, { autoAlpha: 0.34, duration: 0.6 }, '<')

    /* 06 — COUNTERS */
    tl.to(metrics, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1, ease: EASE.settle }, '-=0.5')
    ;[
      { key: 'resolved', to: 34, suffix: '%' },
      { key: 'latency', to: 1.8, suffix: 's', decimals: 1 },
      { key: 'accuracy', to: 96.2, suffix: '%', decimals: 1 },
      { key: 'saved', to: 31, suffix: ' hrs' },
    ].forEach((m, i) => {
      const el = statRefs.current[m.key]
      if (!el) return
      const obj = { v: 0 }
      tl.to(
        obj,
        {
          v: m.to,
          duration: 1.3,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = `${m.decimals ? obj.v.toFixed(m.decimals) : Math.round(obj.v)}${m.suffix}`
          },
        },
        i === 0 ? '-=0.9' : '<+0.1',
      )
    })

    /* 07 — APPROACH */
    tl.to(
      graph,
      { scale: mobile ? 1.04 : 1.34, z: mobile ? 180 : 300, duration: 1.8, ease: 'power2.in' },
      '+=0.4',
    )
      .to(glow, { opacity: 1.7, duration: 1.2 }, '<')
      .to(tag, { autoAlpha: 0, duration: 0.4 }, '<')
      .fromTo(
        '[data-ai-cta]',
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.settle },
        '-=1',
      )
  }, [edgePaths])

  return (
    <ShowcaseFrame
      service={service}
      id={service.sectionId}
      beats={5}
      chromeSide="right"
      build={build}
      fallback={<StaticShowcase project={project} service={service} />}
    >
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[60vmin] w-[88vmin] -translate-x-1/2 -translate-y-1/2 opacity-0"
        style={{ background: `radial-gradient(ellipse, ${service.accent}1e 0%, rgba(5,5,7,0) 70%)` }}
      />

      <div className="relative z-10 flex w-full flex-col items-center gap-5 preserve-3d">
        <div
          ref={graphRef}
          className="relative w-[min(94vw,1000px)] preserve-3d will-change-transform"
        >
          {/* Stage rail */}
          <div className="mb-3 flex items-center justify-between px-1">
            {['INPUT', 'RETRIEVE', 'REASON / EVALUATE', 'OUTPUT'].map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                <span
                  className="h-1 w-1 rounded-full"
                  style={{ backgroundColor: i === 2 ? service.accent : '#35353E' }}
                />
                <span className="font-mono text-[7.5px] uppercase tracking-[0.16em] text-mist md:text-[9px]">
                  {s}
                </span>
              </span>
            ))}
          </div>

          <div className="relative">
            <svg
              viewBox={`0 0 ${VB.w} ${VB.h}`}
              className="h-auto w-full"
              role="img"
              aria-label="Support automation workflow: ticket and documents flow into vector search, then response drafting, an accuracy gate, and finally auto-resolve or escalation."
            >
              {/* Edges */}
              {edgePaths.map((e, i) => (
                <path
                  key={`${e.from}-${e.to}`}
                  ref={(el) => setEdge(el, i)}
                  d={e.d}
                  fill="none"
                  stroke="#35353E"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {/* Nodes */}
              {NODES.map((n) => (
                <g
                  key={n.id}
                  ref={(el) => {
                    nodeRefs.current[n.id] = el
                  }}
                  style={{ transformOrigin: `${n.x + n.w / 2}px ${n.y + n.h / 2}px`, willChange: 'transform' }}
                >
                  <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="10" fill="#17171C" />
                  <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="10" fill="#232329" fillOpacity="0.5" />
                  <rect
                    x={n.x}
                    y={n.y}
                    width={n.w}
                    height={n.h}
                    rx="10"
                    fill="none"
                    stroke={STAGE_COLOR[n.stage]}
                    strokeOpacity="0.36"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                  <rect x={n.x} y={n.y + 10} width="3" height={n.h - 20} rx="1.5" fill={STAGE_COLOR[n.stage]} />
                  <text
                    x={n.x + 18}
                    y={n.y + 26}
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="10"
                    letterSpacing="1.4"
                    fill={STAGE_COLOR[n.stage]}
                  >
                    {n.stage}
                  </text>
                  <text
                    x={n.x + 18}
                    y={n.y + 50}
                    fontFamily="Inter Tight, Inter, sans-serif"
                    fontSize="16"
                    fontWeight="600"
                    fill="#E6E6EA"
                  >
                    {n.label}
                  </text>
                  <text
                    x={n.x + 18}
                    y={n.y + 70}
                    fontFamily="JetBrains Mono, monospace"
                    fontSize="10"
                    fill="#6B6B78"
                  >
                    {n.sub}
                  </text>
                </g>
              ))}

              {/* Travelling packet */}
              <g ref={packetRef} style={{ willChange: 'transform' }}>
                <circle cx="0" cy="0" r="16" fill={service.accent} opacity="0.16" />
                <circle cx="0" cy="0" r="8" fill={service.accent} opacity="0.34" />
                <circle cx="0" cy="0" r="4" fill={service.accent} />
              </g>
            </svg>

            {/* Run console */}
            <div className="pointer-events-none absolute bottom-1 left-1 hidden flex-col gap-1 md:flex">
              {['› ticket #48213 received', '› retrieved 8 passages (42ms)', '› drafted response · 214 tokens', '› eval passed · confidence 0.96'].map(
                (t, i) => (
                  <span
                    key={t}
                    ref={(el) => setConsole(el, i)}
                    className="font-mono text-[8.5px] tracking-[0.04em] text-mist opacity-0"
                  >
                    {t}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
            {[
              { key: 'resolved', label: 'TICKETS AUTO-RESOLVED' },
              { key: 'latency', label: 'MEDIAN LATENCY' },
              { key: 'accuracy', label: 'EVAL ACCURACY' },
              { key: 'saved', label: 'SAVED PER WEEK' },
            ].map((m, i) => (
              <div key={m.key} ref={(el) => setMetric(el, i)} className="surface rounded-md p-2.5 opacity-0 md:p-3.5">
                <span
                  ref={(el) => {
                    statRefs.current[m.key] = el
                  }}
                  className="block font-display text-xl font-bold leading-none tabular-nums md:text-3xl"
                  style={{ color: i === 0 ? service.accent : '#E6E6EA' }}
                >
                  0
                </span>
                <span className="mt-1.5 block font-mono text-[7px] uppercase tracking-[0.14em] text-mist md:text-[8px]">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div ref={tagRef} className="opacity-0">
          <ProjectTag project={project} accent={service.accent} />
        </div>
      </div>

      <div data-ai-cta className="absolute inset-x-0 bottom-[26%] z-40 flex justify-center opacity-0 md:bottom-[14%]">
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
