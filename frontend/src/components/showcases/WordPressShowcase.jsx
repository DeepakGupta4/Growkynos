import { useCallback, useRef } from 'react'
import { gsap, EASE } from '../../lib/gsap'
import { ShowcaseFrame } from './ShowcaseFrame'
import { PanelFrame } from './ui/Devices'
import { ProjectTag, StaticShowcase } from './ui/ShowcaseParts'
import { getService } from '../../data/services'
import { projectsByService } from '../../data/projects'
import { useExperience } from '../../context/ExperienceContext'
import { useProjectEntry } from '../projects/ProjectEntryContext'

const service = getService('wordpress')

const BLOCKS = [
  { id: 'b1', label: 'MASTHEAD', h: 54, kind: 'head' },
  { id: 'b2', label: 'LEAD IMAGE', h: 86, kind: 'image' },
  { id: 'b3', label: 'RICH TEXT', h: 62, kind: 'text' },
  { id: 'b4', label: 'PULL QUOTE', h: 46, kind: 'quote' },
  { id: 'b5', label: 'TWO COLUMN', h: 70, kind: 'cols' },
  { id: 'b6', label: 'RELATED', h: 58, kind: 'grid' },
]

/**
 * WORDPRESS WORLD
 * ---------------
 * CMS → CONTENT → COMPONENTS → LAYOUT → WEBSITE.
 *
 * The transformation *is* the argument: editor blocks lift off the admin
 * screen, hang in space as discrete components, reorganise themselves into a
 * layout, and resolve into a finished page. Nobody has to be told what a
 * block-first build means after watching it.
 */
export function WordPressShowcase() {
  const project = projectsByService('wordpress')[0]
  const { isMobile } = useExperience()
  const { enterProject } = useProjectEntry()

  const adminRef = useRef(null)
  const sidebarRef = useRef(null)
  const inspectorRef = useRef(null)
  const blocksRef = useRef([])
  const siteRef = useRef(null)
  const stageLabelRef = useRef(null)
  const glowRef = useRef(null)
  const tagRef = useRef(null)

  const setBlock = (el, i) => {
    blocksRef.current[i] = el
  }

  const build = useCallback((tl, { isMobile: mobile }) => {
    const admin = adminRef.current
    const sidebar = sidebarRef.current
    const inspector = inspectorRef.current
    const blocks = blocksRef.current.filter(Boolean)
    const site = siteRef.current
    const label = stageLabelRef.current
    const glow = glowRef.current
    const tag = tagRef.current
    if (!admin || !blocks.length) return

    const setStage = (text) => () => {
      if (label) label.textContent = text
    }

    /* Initial */
    gsap.set(admin, { z: -1100, rotateX: 20, opacity: 0, scale: 0.92 })
    gsap.set(blocks, { autoAlpha: 0, x: 0, y: 0, z: 0, rotateY: 0, rotateZ: 0, scale: 1 })
    gsap.set(site, { autoAlpha: 0, scale: 0.9, z: -420 })
    gsap.set(glow, { opacity: 0 })
    gsap.set(tag, { autoAlpha: 0, y: 12 })

    /* 01 — CMS */
    tl.add(setStage('CMS'))
      .to(admin, { z: 0, rotateX: 0, opacity: 1, scale: 1, duration: 2.1, ease: 'power3.out' })
      .to(glow, { opacity: 1, duration: 1 }, '-=1.3')
      .to(tag, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=1')

    /* 02 — CONTENT: blocks populate the editor canvas. */
    tl.add(setStage('CONTENT'), '-=0.5')
      .to(blocks, {
        autoAlpha: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
      }, '-=0.4')
      .fromTo(
        '[data-wp-fill]',
        { scaleX: 0 },
        { scaleX: 1, duration: 0.5, stagger: 0.045, ease: 'power2.out', transformOrigin: 'left center' },
        '-=0.7',
      )

    /* 03 — COMPONENTS: blocks detach and hang in space. */
    const scatter = mobile
      ? [
          [-96, -196, 260, -11],
          [104, -110, 190, 9],
          [-118, -18, 320, 7],
          [112, 78, 150, -8],
          [-104, 172, 240, 10],
          [96, 236, 120, -6],
        ]
      : [
          [-392, -206, 340, -13],
          [396, -152, 250, 11],
          [-448, 24, 420, 8],
          [430, 66, 180, -10],
          [-346, 232, 300, 12],
          [368, 250, 150, -7],
        ]

    tl.add(setStage('COMPONENTS'))
      .to(sidebar, { autoAlpha: 0.25, x: -18, duration: 0.7 }, '<')
      .to(inspector, { autoAlpha: 0.25, x: 18, duration: 0.7 }, '<')

    blocks.forEach((b, i) => {
      const [x, y, z, r] = scatter[i % scatter.length]
      tl.to(
        b,
        {
          x: x * (mobile ? 1 : 1),
          y,
          z,
          rotateY: -r,
          rotateZ: r * 0.4,
          scale: 1.04,
          duration: 1.35,
          ease: EASE.mass,
        },
        i === 0 ? '-=0.4' : '-=1.18',
      )
    })

    // A beat of stillness — the components simply exist, floating.
    tl.to(blocks, { y: '+=10', duration: 1.1, ease: 'sine.inOut', stagger: { each: 0.05, from: 'center' } })

    /* 04 — LAYOUT: they reorganise into the shape of a page. */
    const layout = mobile
      ? [
          [0, -212, 60, 0],
          [0, -136, 60, 0],
          [0, -56, 60, 0],
          [0, 20, 60, 0],
          [0, 100, 60, 0],
          [0, 182, 60, 0],
        ]
      : [
          [0, -226, 90, 0],
          [0, -140, 90, 0],
          [0, -50, 90, 0],
          [0, 34, 90, 0],
          [0, 122, 90, 0],
          [0, 212, 90, 0],
        ]

    tl.add(setStage('LAYOUT'))
      .to(admin, { autoAlpha: 0, scale: 0.94, duration: 0.8, ease: 'power2.in' }, '<')

    blocks.forEach((b, i) => {
      const [x, y, z, r] = layout[i]
      tl.to(
        b,
        {
          x,
          y,
          z,
          rotateY: r,
          rotateZ: 0,
          scale: mobile ? 0.94 : 1.12,
          duration: 1.3,
          ease: 'power3.inOut',
        },
        i === 0 ? '-=0.5' : '-=1.16',
      )
    })

    /* 05 — WEBSITE: the stack resolves into the finished page. */
    tl.add(setStage('WEBSITE'))
      .to(site, { autoAlpha: 1, scale: 1, z: 0, duration: 1.25, ease: EASE.settle }, '-=0.35')
      .to(
        blocks,
        {
          autoAlpha: 0,
          scale: 0.9,
          z: -140,
          duration: 0.85,
          ease: 'power2.inOut',
          stagger: { each: 0.05, from: 'edges' },
        },
        '-=1.05',
      )
      .fromTo(
        '[data-wp-site-row]',
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' },
        '-=0.7',
      )

    /* 06 — APPROACH */
    tl.to(site, { scale: mobile ? 1.24 : 1.4, z: mobile ? 200 : 340, duration: 1.7, ease: 'power2.in' }, '+=0.3')
      .to(glow, { opacity: 1.7, duration: 1.2 }, '<')
      .to(tag, { autoAlpha: 0, duration: 0.4 }, '<')
      .fromTo(
        '[data-wp-cta]',
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.settle },
        '-=1',
      )
  }, [])

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
        className="pointer-events-none absolute left-1/2 top-1/2 h-[68vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 opacity-0"
        style={{ background: `radial-gradient(ellipse, ${service.accent}22 0%, rgba(5,5,7,0) 70%)` }}
      />

      {/* Stage readout — names the transformation as it happens */}
      <div className="pointer-events-none absolute left-1/2 top-[7%] z-40 -translate-x-1/2 md:top-[9%]">
        <div className="flex items-center gap-3 rounded-full border border-smoke/80 bg-void/70 px-4 py-2 backdrop-blur-md">
          <span className="h-1 w-1 rounded-full anim-pulse" style={{ backgroundColor: service.accent }} />
          <span
            ref={stageLabelRef}
            className="font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: service.accent }}
          >
            CMS
          </span>
        </div>
      </div>

      {/* Admin */}
      <div ref={adminRef} className="absolute z-10 preserve-3d will-change-transform">
        <PanelFrame label="CHRONICLE PRESS — EDITOR" accent={service.accent} className="w-[min(90vw,800px)]">
          <div className="flex h-[46svh] md:h-[52svh]">
            {/* Sidebar */}
            <div ref={sidebarRef} className="hidden w-36 shrink-0 border-r border-smoke/60 p-3 sm:block">
              {['Posts', 'Pages', 'Blocks', 'Media', 'Users'].map((n, i) => (
                <div key={n} className="mb-2 flex items-center gap-2 rounded px-2 py-1.5"
                  style={i === 2 ? { backgroundColor: `${service.accent}1f` } : undefined}>
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ backgroundColor: i === 2 ? service.accent : '#35353E' }}
                  />
                  <span className="text-[10px]" style={{ color: i === 2 ? '#E6E6EA' : '#6B6B78' }}>
                    {n}
                  </span>
                </div>
              ))}
            </div>

            {/* Canvas — blocks live here before they detach */}
            <div className="relative flex-1 overflow-visible p-3 preserve-3d md:p-4">
              <span className="mb-2 block font-mono text-[8px] uppercase tracking-[0.16em] text-mist">
                CONTENT BLOCKS
              </span>
              <div className="flex flex-col gap-2 preserve-3d">
                {BLOCKS.map((b, i) => (
                  <div
                    key={b.id}
                    ref={(el) => setBlock(el, i)}
                    className="surface relative overflow-hidden rounded preserve-3d will-change-transform"
                    style={{ height: isMobile ? b.h * 0.62 : b.h * 0.78 }}
                  >
                    <div className="flex h-full flex-col gap-1.5 p-2 md:p-2.5">
                      <span
                        className="font-mono text-[6.5px] uppercase tracking-[0.15em] md:text-[7.5px]"
                        style={{ color: service.accent }}
                      >
                        {b.label}
                      </span>
                      {b.kind === 'image' && (
                        <div className="flex-1 overflow-hidden rounded-sm">
                          <img
                            src={project.images[i % project.images.length]}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      {b.kind === 'head' && (
                        <div className="flex flex-1 items-center">
                          <div data-wp-fill className="h-2 w-2/3 rounded-full bg-silver/70" />
                        </div>
                      )}
                      {b.kind === 'text' && (
                        <div className="flex flex-1 flex-col justify-center gap-1">
                          {[90, 74, 58].map((w) => (
                            <div key={w} data-wp-fill className="h-1 rounded-full bg-steel" style={{ width: `${w}%` }} />
                          ))}
                        </div>
                      )}
                      {b.kind === 'quote' && (
                        <div className="flex flex-1 items-center gap-2">
                          <div className="h-full w-0.5 rounded-full" style={{ backgroundColor: service.accent }} />
                          <div className="flex-1 space-y-1">
                            <div data-wp-fill className="h-1 w-4/5 rounded-full bg-steel" />
                            <div data-wp-fill className="h-1 w-3/5 rounded-full bg-steel" />
                          </div>
                        </div>
                      )}
                      {b.kind === 'cols' && (
                        <div className="grid flex-1 grid-cols-2 gap-1.5">
                          {[0, 1].map((c) => (
                            <div key={c} className="rounded-sm bg-ash p-1">
                              <div data-wp-fill className="h-1 w-full rounded-full bg-steel" />
                              <div data-wp-fill className="mt-1 h-1 w-2/3 rounded-full bg-steel" />
                            </div>
                          ))}
                        </div>
                      )}
                      {b.kind === 'grid' && (
                        <div className="grid flex-1 grid-cols-3 gap-1.5">
                          {[0, 1, 2].map((c) => (
                            <div key={c} className="overflow-hidden rounded-sm">
                              <img
                                src={project.images[(i + c) % project.images.length]}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Selection handles */}
                    <span className="absolute -left-0.5 -top-0.5 h-1.5 w-1.5" style={{ backgroundColor: service.accent }} />
                    <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5" style={{ backgroundColor: service.accent }} />
                    <span className="absolute -bottom-0.5 -left-0.5 h-1.5 w-1.5" style={{ backgroundColor: service.accent }} />
                    <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5" style={{ backgroundColor: service.accent }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Inspector */}
            <div ref={inspectorRef} className="hidden w-40 shrink-0 border-l border-smoke/60 p-3 lg:block">
              <span className="mb-3 block font-mono text-[8px] uppercase tracking-[0.16em]" style={{ color: service.accent }}>
                BLOCK SETTINGS
              </span>
              {['Layout', 'Typography', 'Spacing', 'Colour'].map((g) => (
                <div key={g} className="mb-3">
                  <span className="mb-1 block text-[9px] text-silver">{g}</span>
                  <div className="h-6 rounded bg-ash" />
                </div>
              ))}
            </div>
          </div>
        </PanelFrame>
      </div>

      {/* Finished website */}
      <div ref={siteRef} className="absolute z-20 opacity-0 preserve-3d will-change-transform">
        <PanelFrame accent={service.accent} className="w-[min(88vw,700px)] overflow-hidden">
          <div className="relative">
            <img
              src={project.images[3] ?? project.images[0]}
              alt={`${project.title} — published site`}
              loading="lazy"
              decoding="async"
              className="h-[38svh] w-full object-cover object-top md:h-[46svh]"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: 'linear-gradient(180deg,rgba(5,5,7,0) 46%,rgba(5,5,7,0.92) 100%)' }}
            />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 md:p-6">
              <span data-wp-site-row className="font-mono text-[8.5px] uppercase tracking-[0.18em]" style={{ color: service.accent }}>
                PUBLISHED · NO DEVELOPER INVOLVED
              </span>
              <h3 data-wp-site-row className="font-display text-lg font-semibold text-bone md:text-2xl">
                Chronicle Press
              </h3>
              <div data-wp-site-row className="flex flex-wrap gap-2">
                {['40 posts / week', '9,400 migrated', '0 dev tickets'].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-smoke px-2.5 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-silver"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </PanelFrame>
      </div>

      <div ref={tagRef} className="absolute bottom-[26%] z-30 opacity-0">
        <ProjectTag project={project} accent={service.accent} />
      </div>

      <div data-wp-cta className="absolute inset-x-0 bottom-[16%] z-40 flex justify-center opacity-0">
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
