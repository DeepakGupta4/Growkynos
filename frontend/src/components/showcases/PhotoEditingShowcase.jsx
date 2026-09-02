import { useCallback, useRef } from 'react'
import { gsap, EASE } from '../../lib/gsap'
import { ShowcaseFrame } from './ShowcaseFrame'
import { PanelFrame } from './ui/Devices'
import { ProjectTag, StaticShowcase } from './ui/ShowcaseParts'
import { getService } from '../../data/services'
import { projectsByService } from '../../data/projects'
import { useProjectEntry } from '../projects/ProjectEntryContext'

const service = getService('photo')

/* Canvas coordinate space — everything below is authored against this. */
const VB = { w: 1400, h: 933 }

/** The brush stroke actually drawn on screen, and the mask that follows it. */
const BRUSH_PATH =
  'M 210 700 C 340 560, 430 470, 520 380 C 610 292, 700 250, 800 250 C 910 250, 1000 320, 1060 430 C 1120 540, 1130 640, 1090 740'

/** The selection the retoucher pulls around the subject. */
const SELECTION_PATH =
  'M 560 210 C 730 170, 900 240, 940 420 C 980 600, 900 800, 700 850 C 500 900, 380 780, 380 590 C 380 400, 430 250, 560 210 Z'

/**
 * PHOTO WORLD
 * -----------
 * The editing is real, not implied. A brush travels a genuine SVG path with
 * its rotation taken from the path tangent; the same path drives an SVG mask,
 * so the graded frame is revealed exactly where the brush has been. Then a
 * selection is pulled, the layer resolves, and a before/after wipe compares
 * the flat capture against the delivered grade.
 */
export function PhotoEditingShowcase() {
  const project = projectsByService('photo')[0]
  const { enterProject } = useProjectEntry()

  const editorRef = useRef(null)
  const brushRef = useRef(null)
  const strokeRef = useRef(null)
  const maskStrokeRef = useRef(null)
  const selectionRef = useRef(null)
  const gradedRef = useRef(null)
  const wipeRef = useRef(null)
  const handleRef = useRef(null)
  const layersRef = useRef([])
  const glowRef = useRef(null)
  const tagRef = useRef(null)
  const histRef = useRef([])

  const setLayer = (el, i) => {
    layersRef.current[i] = el
  }
  const setHist = (el, i) => {
    histRef.current[i] = el
  }

  const build = useCallback((tl, { isMobile: mobile }) => {
    const editor = editorRef.current
    const brush = brushRef.current
    const stroke = strokeRef.current
    const maskStroke = maskStrokeRef.current
    const selection = selectionRef.current
    const graded = gradedRef.current
    const wipe = wipeRef.current
    const handle = handleRef.current
    const layers = layersRef.current.filter(Boolean)
    const hist = histRef.current.filter(Boolean)
    const glow = glowRef.current
    const tag = tagRef.current
    if (!editor || !stroke) return

    const strokeLen = stroke.getTotalLength()
    const selLen = selection ? selection.getTotalLength() : 0

    /* Initial */
    gsap.set(editor, { z: -1000, rotateX: 16, opacity: 0, scale: 0.92 })
    gsap.set([stroke, maskStroke], { strokeDasharray: strokeLen, strokeDashoffset: strokeLen })
    gsap.set(brush, { autoAlpha: 0 })
    gsap.set(selection, { strokeDasharray: '14 10', strokeDashoffset: selLen, autoAlpha: 0 })
    gsap.set(graded, { autoAlpha: 0 })
    gsap.set(wipe, { autoAlpha: 0 })
    gsap.set(handle, { autoAlpha: 0 })
    gsap.set(layers, { autoAlpha: 0, x: 18 })
    gsap.set(hist, { autoAlpha: 0.25 })
    gsap.set(glow, { opacity: 0 })
    gsap.set(tag, { autoAlpha: 0, y: 12 })

    /* 01 — EDITOR ARRIVES */
    tl.to(editor, { z: 0, rotateX: 0, opacity: 1, scale: 1, duration: 2, ease: 'power3.out' })
      .to(glow, { opacity: 1, duration: 1 }, '-=1.2')
      .to(tag, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.9')
      .to(layers[layers.length - 1], { autoAlpha: 1, x: 0, duration: 0.5 }, '-=0.7')

    /* 02 — BRUSH ENTERS and takes position at the head of the path. */
    const head = stroke.getPointAtLength(0)
    gsap.set(brush, { x: head.x, y: head.y })
    tl.fromTo(
      brush,
      { autoAlpha: 0, scale: 0.5, rotate: -34, y: head.y - 220 },
      { autoAlpha: 1, scale: 1, rotate: -18, y: head.y, duration: 0.9, ease: EASE.mass },
      '-=0.4',
    )

    /* 03 — BRUSH DRAWS: position and rotation sampled from the real path. */
    const draw = { p: 0 }
    tl.to(
      draw,
      {
        p: 1,
        duration: 2.6,
        ease: 'power1.inOut',
        onUpdate: () => {
          const len = strokeLen * draw.p
          const pt = stroke.getPointAtLength(len)
          const ahead = stroke.getPointAtLength(Math.min(strokeLen, len + 2))
          const angle = (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI
          gsap.set(brush, { x: pt.x, y: pt.y, rotate: angle - 122 })
          const off = strokeLen * (1 - draw.p)
          gsap.set([stroke, maskStroke], { strokeDashoffset: off })
        },
      },
      '-=0.2',
    )
      // The graded layer appears only where the brush has been.
      .to(graded, { autoAlpha: 1, duration: 0.6 }, '-=2.4')
      .to(hist[0], { autoAlpha: 1, duration: 0.3 }, '-=2.2')
      .to(layers[2], { autoAlpha: 1, x: 0, duration: 0.5 }, '-=2')

    /* 04 — SELECTION forms around the subject. */
    tl.to(brush, { autoAlpha: 0, y: '-=180', scale: 0.7, duration: 0.7, ease: 'power2.in' }, '-=0.2')
      .to(selection, { autoAlpha: 1, duration: 0.25 }, '-=0.5')
      .to(selection, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut' }, '<')
      .to(layers[1], { autoAlpha: 1, x: 0, duration: 0.5 }, '-=1.4')
      .to(hist[1], { autoAlpha: 1, duration: 0.3 }, '-=1.2')
      // Marching ants — the selection stays alive while it exists.
      .to(selection, { strokeDashoffset: -48, duration: 1.4, ease: 'none', repeat: 1 }, '-=0.3')

    /* 05 — THE LAYER RESOLVES: the mask opens to the full frame. */
    tl.to(
      maskStroke,
      { strokeWidth: 1400, duration: 1.5, ease: 'power2.inOut' },
      '-=0.6',
    )
      .to(stroke, { autoAlpha: 0, duration: 0.6 }, '<')
      .to(selection, { autoAlpha: 0, duration: 0.5 }, '<')
      .to(layers[0], { autoAlpha: 1, x: 0, duration: 0.5 }, '-=0.9')
      .to(hist[2], { autoAlpha: 1, duration: 0.3 }, '-=0.7')

    /* 06 — BEFORE / AFTER wipe. */
    tl.to([wipe, handle], { autoAlpha: 1, duration: 0.4 }, '-=0.3')
      .fromTo(
        wipe,
        { '--wipe': '100%' },
        { '--wipe': '18%', duration: 1.5, ease: 'power2.inOut' },
        '-=0.2',
      )
      .fromTo(handle, { xPercent: 0, left: '100%' }, { left: '18%', duration: 1.5, ease: 'power2.inOut' }, '<')
      .to(wipe, { '--wipe': '82%', duration: 1.6, ease: 'power2.inOut' }, '+=0.25')
      .to(handle, { left: '82%', duration: 1.6, ease: 'power2.inOut' }, '<')
      .to([wipe, handle], { autoAlpha: 0, duration: 0.6 }, '+=0.2')

    /* 07 — FINAL IMAGE fills the frame. */
    tl.to('[data-photo-chrome]', { autoAlpha: 0, duration: 0.7, ease: 'power2.inOut' }, '-=0.4')
      .to(
        editor,
        { scale: mobile ? 1.08 : 1.62, z: mobile ? 220 : 380, duration: 1.9, ease: 'power2.in' },
        '-=0.5',
      )
      .to(glow, { opacity: 1.7, duration: 1.2 }, '<')
      .to(tag, { autoAlpha: 0, duration: 0.4 }, '<')
      .fromTo(
        '[data-photo-cta]',
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.settle },
        '-=1',
      )
  }, [])

  const before = project.images[0]
  const after = project.images[1] ?? project.images[0]

  return (
    <ShowcaseFrame
      service={service}
      id={service.sectionId}
      beats={7}
      chromeSide="right"
      build={build}
      fallback={<StaticShowcase project={project} service={service} />}
    >
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[64vmin] w-[84vmin] -translate-x-1/2 -translate-y-1/2 opacity-0"
        style={{ background: `radial-gradient(ellipse, ${service.accent}20 0%, rgba(5,5,7,0) 70%)` }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 preserve-3d">
        <div ref={editorRef} className="relative preserve-3d will-change-transform">
          <PanelFrame
            label="AURELIA — CAMPAIGN RETOUCH"
            accent={service.accent}
            className="w-[min(92vw,860px)]"
          >
            <div className="flex">
              {/* Tools */}
              <div data-photo-chrome className="hidden w-10 shrink-0 flex-col gap-1.5 border-r border-smoke/60 p-2 sm:flex">
                {['move', 'lasso', 'brush', 'heal', 'clone', 'grade', 'crop', 'type'].map((t, i) => (
                  <span
                    key={t}
                    className="grid h-6 w-6 place-items-center rounded"
                    style={{ backgroundColor: i === 2 ? `${service.accent}26` : 'transparent' }}
                    title={t}
                  >
                    <span
                      className="block h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: i === 2 ? service.accent : '#35353E' }}
                    />
                  </span>
                ))}
              </div>

              {/* Canvas */}
              <div className="relative flex-1 bg-black p-2 md:p-3">
                <div className="relative overflow-hidden rounded-sm">
                  <svg
                    viewBox={`0 0 ${VB.w} ${VB.h}`}
                    className="h-[36svh] w-full md:h-[46svh]"
                    preserveAspectRatio="xMidYMid slice"
                    role="img"
                    aria-label={`${project.title} — retouching in progress`}
                  >
                    <defs>
                      <mask id="photo-reveal" maskUnits="userSpaceOnUse">
                        <rect x="0" y="0" width={VB.w} height={VB.h} fill="black" />
                        <path
                          ref={maskStrokeRef}
                          d={BRUSH_PATH}
                          fill="none"
                          stroke="white"
                          strokeWidth="150"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </mask>
                    </defs>

                    {/* Flat capture */}
                    <image href={before} x="0" y="0" width={VB.w} height={VB.h} preserveAspectRatio="xMidYMid slice" />

                    {/* Delivered grade, revealed only where the brush has been */}
                    <g ref={gradedRef} mask="url(#photo-reveal)">
                      <image href={after} x="0" y="0" width={VB.w} height={VB.h} preserveAspectRatio="xMidYMid slice" />
                    </g>

                    {/* The visible brush stroke */}
                    <path
                      ref={strokeRef}
                      d={BRUSH_PATH}
                      fill="none"
                      stroke={service.accent}
                      strokeWidth="3"
                      strokeOpacity="0.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Selection */}
                    <path
                      ref={selectionRef}
                      d={SELECTION_PATH}
                      fill="none"
                      stroke="#E6E6EA"
                      strokeWidth="2.5"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>

                  {/* Before / after wipe */}
                  <div
                    ref={wipeRef}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-0"
                    style={{
                      // eslint-disable-next-line
                      ['--wipe']: '100%',
                      backgroundImage: `url(${before})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      clipPath: 'inset(0 calc(100% - var(--wipe)) 0 0)',
                    }}
                  />
                  <div
                    ref={handleRef}
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 z-10 w-px -translate-x-1/2 bg-bone opacity-0"
                    style={{ left: '100%' }}
                  >
                    <span className="absolute left-1/2 top-1/2 grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-bone/60 bg-void/80">
                      <span className="font-mono text-[8px] text-bone">◄►</span>
                    </span>
                    <span className="absolute left-2 top-3 font-mono text-[7.5px] uppercase tracking-[0.14em] text-bone">
                      AFTER
                    </span>
                    <span className="absolute right-2 top-3 font-mono text-[7.5px] uppercase tracking-[0.14em] text-bone">
                      BEFORE
                    </span>
                  </div>

                  {/* Brush */}
                  <svg
                    viewBox={`0 0 ${VB.w} ${VB.h}`}
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    preserveAspectRatio="xMidYMid slice"
                    aria-hidden="true"
                  >
                    <g ref={brushRef} style={{ willChange: 'transform' }}>
                      {/* Barrel */}
                      <rect x="-9" y="-176" width="18" height="150" rx="4" fill="#2A2A31" />
                      <rect x="-9" y="-176" width="7" height="150" rx="3" fill="#3C3C46" />
                      <rect x="-9" y="-40" width="18" height="16" rx="2" fill={service.accent} />
                      {/* Ferrule + tip */}
                      <path d="M -9 -24 L 9 -24 L 3 0 L -3 0 Z" fill="#9C9CA8" />
                      <circle cx="0" cy="2" r="4" fill={service.accent} opacity="0.9" />
                      <circle cx="0" cy="2" r="12" fill={service.accent} opacity="0.18" />
                    </g>
                  </svg>
                </div>

                {/* History */}
                <div data-photo-chrome className="mt-2 flex flex-wrap gap-1.5">
                  {['Brush · grade', 'Select subject', 'Composite'].map((h, i) => (
                    <span
                      key={h}
                      ref={(el) => setHist(el, i)}
                      className="rounded-full border border-smoke px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.12em] text-silver md:text-[8px]"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Layers */}
              <div data-photo-chrome className="hidden w-36 shrink-0 border-l border-smoke/60 p-2.5 lg:block">
                <span
                  className="mb-2 block font-mono text-[8px] uppercase tracking-[0.16em]"
                  style={{ color: service.accent }}
                >
                  LAYERS
                </span>
                {[
                  { name: 'Grade — Curve', src: after },
                  { name: 'Mask — Subject', src: before },
                  { name: 'Retouch — Skin', src: after },
                  { name: 'Original', src: before },
                ].map((l, i) => (
                  <div
                    key={l.name}
                    ref={(el) => setLayer(el, i)}
                    className="mb-1.5 flex items-center gap-2 rounded p-1.5"
                    style={{ backgroundColor: i === 0 ? '#232329' : 'transparent' }}
                  >
                    <img src={l.src} alt="" loading="lazy" className="h-6 w-8 rounded-sm object-cover" />
                    <span className="truncate text-[9px] text-silver">{l.name}</span>
                  </div>
                ))}

                <span className="mb-1.5 mt-4 block font-mono text-[8px] uppercase tracking-[0.16em] text-mist">
                  HISTOGRAM
                </span>
                <div className="flex h-10 items-end gap-[1.5px]">
                  {[12, 22, 34, 48, 62, 78, 88, 74, 66, 52, 40, 30, 24, 18, 12, 8].map((h, i) => (
                    <span key={i} className="flex-1 rounded-sm bg-steel" style={{ height: `${h}%` }} />
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

      <div data-photo-cta className="absolute inset-x-0 bottom-[26%] z-40 flex justify-center opacity-0 md:bottom-[16%]">
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
