import { useCallback, useRef } from 'react'
import { gsap, EASE } from '../../lib/gsap'
import { ShowcaseFrame } from './ShowcaseFrame'
import { ProjectTag, StaticShowcase } from './ui/ShowcaseParts'
import { getService } from '../../data/services'
import { projectsByService, getProject } from '../../data/projects'
import { useProjectEntry } from '../projects/ProjectEntryContext'

const service = getService('design')
const graphics = getService('graphics')

/**
 * DESIGN WORLD
 * ------------
 * The poster builds itself in the order a designer actually works:
 * background, grid, typography, image, graphic element, then the system —
 * the same composition redrawn across every format it has to survive.
 *
 * This world carries both 06 (UI/UX Design) and 09 (Banner / Poster Design),
 * because they are one discipline demonstrated once.
 */
export function DesignShowcase() {
  const project = projectsByService('design')[0] ?? getProject('vertex-identity')
  const { enterProject } = useProjectEntry()

  const canvasRef = useRef(null)
  const gridRef = useRef([])
  const bgRef = useRef(null)
  const imageRef = useRef(null)
  const typeRefs = useRef([])
  const shapeRefs = useRef([])
  const ruleRef = useRef(null)
  const metaRef = useRef(null)
  const formatsRef = useRef([])
  const stageLabelRef = useRef(null)
  const cursorRef = useRef(null)
  const glowRef = useRef(null)
  const tagRef = useRef(null)

  const setGrid = (el, i) => {
    gridRef.current[i] = el
  }
  const setType = (el, i) => {
    typeRefs.current[i] = el
  }
  const setShape = (el, i) => {
    shapeRefs.current[i] = el
  }
  const setFormat = (el, i) => {
    formatsRef.current[i] = el
  }

  const build = useCallback((tl, { isMobile: mobile }) => {
    const canvas = canvasRef.current
    const grid = gridRef.current.filter(Boolean)
    const bg = bgRef.current
    const image = imageRef.current
    const types = typeRefs.current.filter(Boolean)
    const shapes = shapeRefs.current.filter(Boolean)
    const rule = ruleRef.current
    const meta = metaRef.current
    const formats = formatsRef.current.filter(Boolean)
    const label = stageLabelRef.current
    const cursor = cursorRef.current
    const glow = glowRef.current
    const tag = tagRef.current
    if (!canvas) return

    const stage = (t) => () => {
      if (label) label.textContent = t
    }

    /* Initial */
    gsap.set(canvas, { z: -900, rotateX: 14, opacity: 0, scale: 0.94 })
    gsap.set(bg, { autoAlpha: 0, scaleY: 0, transformOrigin: 'top center' })
    gsap.set(grid, { autoAlpha: 0, scaleY: 0, transformOrigin: 'top center' })
    gsap.set(image, { autoAlpha: 0, clipPath: 'inset(0% 100% 0% 0%)', scale: 1.1 })
    gsap.set(types, { yPercent: 108 })
    gsap.set(shapes, { autoAlpha: 0, scale: 0.4, rotate: -22 })
    gsap.set(rule, { scaleX: 0, transformOrigin: 'left center' })
    gsap.set(meta, { autoAlpha: 0, y: 12 })
    gsap.set(formats, { autoAlpha: 0, scale: 0.7, y: 26 })
    gsap.set(cursor, { autoAlpha: 0 })
    gsap.set(glow, { opacity: 0 })
    gsap.set(tag, { autoAlpha: 0, y: 12 })

    /* 01 — CANVAS */
    tl.add(stage('CANVAS'))
      .to(canvas, { z: 0, rotateX: 0, opacity: 1, scale: 1, duration: 1.9, ease: 'power3.out' })
      .to(glow, { opacity: 1, duration: 1 }, '-=1.2')
      .to(tag, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.9')

    /* 02 — GRID: the structure is decided before anything is placed. */
    tl.add(stage('GRID'))
      .to(cursor, { autoAlpha: 1, duration: 0.3 }, '<')
      .to(cursor, { x: mobile ? 60 : 140, y: mobile ? 40 : 90, duration: 0.7, ease: 'power2.inOut' }, '<')
      .to(grid, { autoAlpha: 1, scaleY: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out' }, '-=0.4')

    /* 03 — BACKGROUND */
    tl.add(stage('BACKGROUND'))
      .to(cursor, { x: mobile ? -40 : -110, y: mobile ? 90 : 190, duration: 0.6, ease: 'power2.inOut' }, '<')
      .to(bg, { autoAlpha: 1, scaleY: 1, duration: 0.85, ease: EASE.travel }, '-=0.35')

    /* 04 — TYPOGRAPHY: set line by line, the way it is actually keyed. */
    tl.add(stage('TYPOGRAPHY'))
      .to(cursor, { x: mobile ? 20 : 40, y: mobile ? -60 : -120, duration: 0.6, ease: 'power2.inOut' }, '<')
    types.forEach((t, i) => {
      tl.to(t, { yPercent: 0, duration: 0.85, ease: EASE.settle }, i === 0 ? '-=0.4' : '-=0.62')
    })
    tl.to(rule, { scaleX: 1, duration: 0.8, ease: 'expo.inOut' }, '-=0.5')

    /* 05 — IMAGE: dropped in and wiped open. */
    tl.add(stage('IMAGE'))
      .to(cursor, { x: mobile ? -70 : -180, y: mobile ? -20 : -30, duration: 0.6, ease: 'power2.inOut' }, '<')
      .to(image, { autoAlpha: 1, duration: 0.2 }, '-=0.3')
      .to(image, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.15, ease: EASE.travel }, '<')

    /* 06 — GRAPHIC ELEMENTS */
    tl.add(stage('GRAPHIC'))
      .to(cursor, { x: mobile ? 70 : 170, y: mobile ? 70 : 140, duration: 0.6, ease: 'power2.inOut' }, '<')
      .to(
        shapes,
        { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.75, stagger: 0.11, ease: EASE.overshoot },
        '-=0.4',
      )
      .to(meta, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.4')
      .to(cursor, { autoAlpha: 0, duration: 0.4 }, '-=0.2')

    /* 07 — FINAL DESIGN holds, then the system fans out across formats. */
    tl.add(stage('FINAL DESIGN'))
      .to(canvas, { scale: 1.04, duration: 0.9, ease: 'power2.inOut' })
      .to({}, { duration: 0.4 })
      .add(stage('THE SYSTEM'))
      .to(canvas, { scale: mobile ? 0.66 : 0.58, x: mobile ? 0 : -190, y: mobile ? -70 : 0, duration: 1.2, ease: 'power3.inOut' })
      .to(
        formats,
        { autoAlpha: 1, scale: 1, y: 0, duration: 0.8, stagger: 0.07, ease: EASE.overshoot },
        '-=0.75',
      )
      .fromTo(
        '[data-design-caption]',
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.7, ease: EASE.settle },
        '-=0.5',
      )
      .to(glow, { opacity: 1.6, duration: 1 }, '<')
      .to(tag, { autoAlpha: 0, duration: 0.4 }, '<')
      .fromTo(
        '[data-design-cta]',
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.settle },
        '-=0.6',
      )
  }, [])

  /* The system, expressed across formats. */
  const formats = [
    { w: 116, h: 116, label: '1:1' },
    { w: 74, h: 130, label: '9:16' },
    { w: 168, h: 62, label: '970×250' },
    { w: 100, h: 128, label: 'A2' },
    { w: 148, h: 84, label: '16:9' },
  ]

  return (
    <ShowcaseFrame
      service={service}
      id={service.sectionId}
      beats={7}
      build={build}
      fallback={<StaticShowcase project={project} service={service} />}
    >
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[62vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 opacity-0"
        style={{ background: `radial-gradient(ellipse, ${service.accent}20 0%, rgba(5,5,7,0) 70%)` }}
      />

      {/* Stage readout */}
      <div className="pointer-events-none absolute left-1/2 top-[7%] z-40 -translate-x-1/2 md:top-[9%]">
        <div className="flex items-center gap-3 rounded-full border border-smoke/80 bg-void/70 px-4 py-2 backdrop-blur-md">
          <span className="h-1 w-1 rounded-full anim-pulse" style={{ backgroundColor: service.accent }} />
          <span
            ref={stageLabelRef}
            className="font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: service.accent }}
          >
            CANVAS
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist">
            06 + 09 · {graphics.title}
          </span>
        </div>
      </div>

      {/* Poster canvas */}
      <div className="relative z-10 flex flex-col items-center gap-6 preserve-3d">
        <div
          ref={canvasRef}
          className="relative overflow-hidden will-change-transform"
          style={{
            width: 'min(74vw, 380px)',
            aspectRatio: '3 / 4',
            backgroundColor: '#0A0A0D',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 60px 130px -46px rgba(0,0,0,0.96)',
          }}
        >
          {/* Grid guides */}
          {[18, 38, 58, 78].map((x, i) => (
            <span
              key={x}
              ref={(el) => setGrid(el, i)}
              aria-hidden="true"
              className="absolute inset-y-0 w-px bg-brass/25"
              style={{ left: `${x}%` }}
            />
          ))}

          {/* Background field */}
          <div
            ref={bgRef}
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background: `linear-gradient(165deg, ${service.accent}1c 0%, rgba(10,10,13,0) 52%), radial-gradient(ellipse 90% 60% at 76% 14%, ${service.accent}22 0%, rgba(10,10,13,0) 62%)`,
            }}
          />

          {/* Image */}
          <div ref={imageRef} className="absolute left-[10%] top-[8%] h-[38%] w-[52%] overflow-hidden">
            <img
              src={project.images[0]}
              alt={`${project.title} — campaign artwork`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0" style={{ backgroundColor: `${service.accent}22` }} />
          </div>

          {/* Graphic elements */}
          <span
            ref={(el) => setShape(el, 0)}
            aria-hidden="true"
            className="absolute right-[8%] top-[12%] h-16 w-16 rounded-full border-2 md:h-20 md:w-20"
            style={{ borderColor: service.accent }}
          />
          <span
            ref={(el) => setShape(el, 1)}
            aria-hidden="true"
            className="absolute right-[16%] top-[30%] h-8 w-8 md:h-11 md:w-11"
            style={{ backgroundColor: service.accent }}
          />
          <span
            ref={(el) => setShape(el, 2)}
            aria-hidden="true"
            className="absolute bottom-[14%] right-[10%] h-px w-16 md:w-24"
            style={{ backgroundColor: service.accent }}
          />

          {/* Typography */}
          <div className="absolute inset-x-[8%] bottom-[16%]">
            {['VER', 'TEX'].map((t, i) => (
              <span key={t} className="line-mask block">
                <span
                  ref={(el) => setType(el, i)}
                  className="block font-display text-[clamp(2.6rem,13vw,4.6rem)] font-extrabold leading-[0.82] tracking-[-0.05em]"
                  style={{ color: i === 1 ? service.accent : '#E6E6EA' }}
                >
                  {t}
                </span>
              </span>
            ))}
            <span
              ref={ruleRef}
              aria-hidden="true"
              className="mt-3 block h-px w-full origin-left"
              style={{ backgroundColor: '#232329' }}
            />
            <div ref={metaRef} className="mt-2.5 flex items-baseline justify-between opacity-0">
              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-mist md:text-[9px]">
                ROBOTICS / IDENTITY
              </span>
              <span className="font-mono text-[8px] tabular-nums text-mist md:text-[9px]">2024</span>
            </div>
          </div>

          {/* Designer's cursor */}
          <span
            ref={cursorRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 z-20 opacity-0 will-change-transform"
          >
            <svg width="15" height="20" viewBox="0 0 15 20" fill="none">
              <path d="M1 1 L1 16 L5 12.5 L7.6 18.6 L10.4 17.4 L7.9 11.6 L13 11.2 Z" fill="#E6E6EA" stroke="#050507" strokeWidth="1" />
            </svg>
          </span>
        </div>

        <div ref={tagRef} className="opacity-0">
          <ProjectTag project={project} accent={service.accent} />
        </div>
      </div>

      {/* The system across formats */}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <div className="flex w-full max-w-shell items-center justify-end gap-3 px-gutter md:gap-4">
          <div className="flex max-w-[46%] flex-wrap items-end justify-end gap-2.5 md:gap-3.5">
            {formats.map((f, i) => (
              <div
                key={f.label}
                ref={(el) => setFormat(el, i)}
                aria-hidden="true"
                className="relative overflow-hidden opacity-0 will-change-transform"
                style={{
                  width: f.w,
                  height: f.h,
                  backgroundColor: '#0A0A0D',
                  border: '1px solid rgba(255,255,255,0.09)',
                  boxShadow: '0 30px 60px -30px rgba(0,0,0,0.9)',
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(160deg, ${service.accent}1c 0%, rgba(10,10,13,0) 60%)`,
                  }}
                />
                <span
                  className="absolute left-2 top-2 font-display font-extrabold leading-none tracking-tight"
                  style={{
                    fontSize: Math.max(11, Math.min(f.w, f.h) * 0.24),
                    color: i % 2 === 0 ? '#E6E6EA' : service.accent,
                  }}
                >
                  VER
                </span>
                <span
                  className="absolute bottom-2 right-2 h-3 w-3 rounded-full border"
                  style={{ borderColor: service.accent }}
                />
                <span className="absolute bottom-1.5 left-2 font-mono text-[6px] uppercase tracking-[0.1em] text-mist">
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        data-design-caption
        className="pointer-events-none absolute inset-x-0 bottom-[24%] z-30 flex justify-center opacity-0"
      >
        <p className="max-w-sm text-center text-[12.5px] leading-relaxed text-silver">
          One set of composition rules, sixty formats. The team generates new work that still looks like
          the brand — without us.
        </p>
      </div>

      <div data-design-cta className="absolute inset-x-0 bottom-[16%] z-40 flex justify-center opacity-0">
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
