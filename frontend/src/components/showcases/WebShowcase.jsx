import { useCallback, useRef } from 'react'
import { gsap, EASE } from '../../lib/gsap'
import { ShowcaseFrame } from './ShowcaseFrame'
import { BrowserFrame } from './ui/Devices'
import { ProjectTag, StaticShowcase } from './ui/ShowcaseParts'
import { getService } from '../../data/services'
import { projectsByService } from '../../data/projects'
import { useExperience } from '../../context/ExperienceContext'
import { useProjectEntry } from '../projects/ProjectEntryContext'

const service = getService('web')

/**
 * WEB WORLD
 * ---------
 * The browser arrives, unfolds, loads a real site — and then the site refuses
 * to stay inside it. Interface layers peel out of the frame into real space,
 * the frame expands past them, and finally the browser becomes the viewport
 * itself. The metaphor is the point: the website escapes the browser.
 */
export function WebShowcase() {
  const project = projectsByService('web')[0]
  const { isMobile } = useExperience()
  const { enterProject } = useProjectEntry()

  const browserRef = useRef(null)
  const chromeRef = useRef(null)
  const viewportRef = useRef(null)
  const loaderRef = useRef(null)
  const pagesRef = useRef([])
  const escapedRef = useRef([])
  const navPillRef = useRef(null)
  const glowRef = useRef(null)
  const tagRef = useRef(null)

  const setPage = (el, i) => {
    pagesRef.current[i] = el
  }
  const setEscaped = (el, i) => {
    escapedRef.current[i] = el
  }

  const build = useCallback((tl, { isMobile: mobile }) => {
    const browser = browserRef.current
    const chrome = chromeRef.current
    const viewport = viewportRef.current
    const loader = loaderRef.current
    const pages = pagesRef.current.filter(Boolean)
    const escaped = escapedRef.current.filter(Boolean)
    const navPill = navPillRef.current
    const glow = glowRef.current
    const tag = tagRef.current
    if (!browser || !pages.length) return

    const d = mobile ? 0.5 : 1

    /* Initial */
    gsap.set(browser, { z: -1500, rotateX: 24, rotateY: -18, opacity: 0, scale: 0.86 })
    gsap.set(viewport, { height: 0 })
    gsap.set(pages, { autoAlpha: 0, yPercent: 0 })
    gsap.set(loader, { scaleX: 0, autoAlpha: 1, transformOrigin: 'left center' })
    gsap.set(escaped, { autoAlpha: 0, scale: 0.8, x: 0, y: 0, z: 0 })
    gsap.set(navPill, { autoAlpha: 0, y: -14 })
    gsap.set(glow, { opacity: 0 })
    gsap.set(tag, { autoAlpha: 0, y: 12 })

    /* 01 — ARRIVAL */
    tl.to(browser, {
      z: 0,
      rotateX: 0,
      rotateY: 0,
      opacity: 1,
      scale: 1,
      duration: 2.4,
      ease: 'power3.out',
    })

    /* 02 — OPEN: chrome first, then the viewport unfolds beneath it. */
    tl.to(viewport, { height: mobile ? 232 : 424, duration: 1.05, ease: EASE.travel }, '-=0.85')
      .to(glow, { opacity: 1, duration: 0.9 }, '<')

    /* 03 — LOAD */
    tl.to(loader, { scaleX: 1, duration: 0.95, ease: 'power2.inOut' }, '-=0.5')
      .to(loader, { autoAlpha: 0, duration: 0.25 })
      .to(pages[0], { autoAlpha: 1, duration: 0.5 }, '-=0.35')
      .to(tag, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.2')

    /* 04 — THE SITE ANIMATES ITSELF */
    tl.to(navPill, { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE.settle }, '-=0.25')
      .fromTo(
        '[data-web-card]',
        { yPercent: 42, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.75, stagger: 0.1, ease: 'power3.out' },
        '-=0.35',
      )

    /* 05 — page 02 scrolls into place inside the viewport */
    tl.to(pages[0], { yPercent: -100, duration: 1.15, ease: 'power2.inOut' }, '+=0.25')
      .fromTo(
        pages[1],
        { autoAlpha: 1, yPercent: 100 },
        { yPercent: 0, duration: 1.15, ease: 'power2.inOut' },
        '<',
      )
      .to('[data-web-card]', { autoAlpha: 0, duration: 0.3 }, '<')

    /* 06 — ESCAPE: layers leave the frame. */
    const exits = mobile
      ? [
          [-126, -150, 300, -13],
          [136, -186, 240, 11],
          [-146, 168, 200, 9],
          [128, 196, 340, -8],
        ]
      : [
          [-470, -172, 420, -14],
          [500, -216, 330, 12],
          [-520, 176, 260, 10],
          [452, 232, 400, -9],
          [-238, 292, 190, 6],
        ]

    escaped.forEach((el, i) => {
      const [x, y, z, r] = exits[i % exits.length]
      tl.to(
        el,
        {
          autoAlpha: 1,
          scale: 1,
          x: x * d,
          y: y * d,
          z,
          rotateY: -r,
          rotateZ: r * 0.35,
          duration: 1.45,
          ease: EASE.mass,
        },
        i === 0 ? '+=0.15' : '-=1.2',
      )
    })

    // Nav bar physically leaves the top of the frame and hangs in depth.
    tl.to(
      navPill,
      { y: mobile ? -160 : -256, z: 300, scale: 1.1, rotateX: 12, duration: 1.4, ease: EASE.mass },
      '-=1.3',
    )

    /* 07 — page 03, and the frame begins to grow past its contents. */
    tl.to(pages[1], { yPercent: -100, duration: 1, ease: 'power2.inOut' }, '-=0.35')
      .fromTo(pages[2], { autoAlpha: 1, yPercent: 100 }, { yPercent: 0, duration: 1, ease: 'power2.inOut' }, '<')
      .to(
        browser,
        { scale: mobile ? 1.16 : 1.28, rotateY: 8, duration: 1.5, ease: 'power2.inOut' },
        '-=0.7',
      )
      .to(browser, { rotateY: 0, duration: 1, ease: EASE.settle })

    /* 08 — RECALL + APPROACH: layers snap back, the frame takes the screen. */
    tl.to(escaped, {
      x: 0,
      y: 0,
      z: 0,
      scale: 0.72,
      autoAlpha: 0,
      rotateY: 0,
      rotateZ: 0,
      duration: 1.1,
      ease: 'power3.inOut',
      stagger: { each: 0.04, from: 'edges' },
    })
      .to(navPill, { y: 0, z: 0, scale: 1, rotateX: 0, autoAlpha: 0, duration: 0.9, ease: 'power3.inOut' }, '<')
      .to(chrome, { autoAlpha: 0, height: 0, paddingTop: 0, paddingBottom: 0, duration: 0.7, ease: 'power2.inOut' }, '-=0.4')
      .to(
        browser,
        {
          scale: mobile ? 1.75 : 2.35,
          z: mobile ? 260 : 460,
          borderRadius: 0,
          duration: 2,
          ease: 'power2.in',
        },
        '-=0.5',
      )
      .to(viewport, { height: mobile ? 300 : 520, duration: 2 }, '<')
      .to(glow, { opacity: 1.8, duration: 1.4 }, '<')
      .to(tag, { autoAlpha: 0, y: -12, duration: 0.4 }, '<')
      .fromTo(
        '[data-web-cta]',
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.settle },
        '-=1',
      )
  }, [])

  const pages = project.images

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
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[86vmin] -translate-x-1/2 -translate-y-1/2 opacity-0"
        style={{
          background: `radial-gradient(ellipse, ${service.accent}22 0%, ${service.accent}0a 40%, rgba(5,5,7,0) 72%)`,
        }}
      />

      {/* Escaping interface layers */}
      {[
        { kind: 'card', title: 'Ridgeline House', meta: 'RESIDENTIAL · 2024' },
        { kind: 'image' },
        { kind: 'stat', value: '0.8s', label: 'LARGEST CONTENTFUL PAINT' },
        { kind: 'card', title: 'Foundry Quarter', meta: 'CULTURAL · 2025' },
        { kind: 'stat', value: '99', label: 'LIGHTHOUSE PERFORMANCE' },
      ]
        .slice(0, isMobile ? 4 : 5)
        .map((item, i) => (
          <div
            key={i}
            ref={(el) => setEscaped(el, i)}
            aria-hidden="true"
            className="pointer-events-none absolute z-30 opacity-0 will-change-transform"
          >
            {item.kind === 'card' && (
              <div className="surface-raised w-[152px] overflow-hidden rounded-lg md:w-[196px]">
                <img
                  src={project.images[(i % (project.images.length - 1)) + 1]}
                  alt=""
                  loading="lazy"
                  className="h-20 w-full object-cover md:h-24"
                />
                <div className="p-3">
                  <p className="font-display text-[11.5px] font-semibold text-bone md:text-[13px]">
                    {item.title}
                  </p>
                  <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-mist">{item.meta}</p>
                </div>
              </div>
            )}
            {item.kind === 'image' && (
              <div className="surface-raised overflow-hidden rounded-lg">
                <img
                  src={project.images[0]}
                  alt=""
                  loading="lazy"
                  className="h-[92px] w-[150px] object-cover md:h-[124px] md:w-[200px]"
                />
              </div>
            )}
            {item.kind === 'stat' && (
              <div className="surface flex items-baseline gap-2.5 rounded-full px-4 py-2.5">
                <span
                  className="font-display text-base font-bold tabular-nums md:text-lg"
                  style={{ color: service.accent }}
                >
                  {item.value}
                </span>
                <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist">{item.label}</span>
              </div>
            )}
          </div>
        ))}

      {/* Detached navigation bar */}
      <div
        ref={navPillRef}
        aria-hidden="true"
        className="surface-raised pointer-events-none absolute z-30 flex items-center gap-4 rounded-full px-5 py-2.5 opacity-0 will-change-transform md:gap-7 md:px-7 md:py-3"
      >
        <span className="font-display text-[10px] font-bold tracking-[0.18em] text-bone md:text-[11px]">
          OBSIDIAN
        </span>
        {['WORK', 'PRACTICE', 'CONTACT'].map((n, i) => (
          <span
            key={n}
            className="font-mono text-[8.5px] uppercase tracking-[0.14em] md:text-[9px]"
            style={{ color: i === 0 ? service.accent : '#6B6B78' }}
          >
            {n}
          </span>
        ))}
      </div>

      {/* Browser */}
      <div className="relative z-10 flex flex-col items-center gap-6 preserve-3d">
        <BrowserFrame
          ref={browserRef}
          chromeRef={chromeRef}
          viewportRef={viewportRef}
          accent={service.accent}
          url={project.url?.replace('https://', '') ?? 'obsidian.archi'}
          className="w-[min(88vw,760px)]"
        >
          {/* Load bar */}
          <div
            ref={loaderRef}
            aria-hidden="true"
            className="absolute inset-x-0 top-0 z-20 h-[2px] origin-left"
            style={{ backgroundColor: service.accent }}
          />

          {/* Page stack — a real scroll inside the viewport */}
          <div className="relative h-full w-full">
            {pages.map((src, i) => (
              <img
                key={src}
                ref={(el) => setPage(el, i)}
                src={src}
                alt={`${project.title} — section ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable="false"
                className="absolute inset-0 h-full w-full object-cover object-top will-change-transform"
              />
            ))}

            {/* Live cards drawn over the page */}
            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center gap-2.5 px-4 md:gap-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  data-web-card
                  className="w-1/3 overflow-hidden rounded-md bg-black/70 backdrop-blur-sm"
                >
                  <div className="h-8 w-full md:h-12" style={{ backgroundColor: `${service.accent}22` }} />
                  <div className="p-1.5 md:p-2">
                    <div className="h-1 w-2/3 rounded-full bg-silver/60" />
                    <div className="mt-1 h-1 w-1/3 rounded-full bg-mist/50" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </BrowserFrame>

        <div ref={tagRef} className="opacity-0">
          <ProjectTag project={project} accent={service.accent} />
        </div>
      </div>

      <div data-web-cta className="absolute inset-x-0 bottom-[16%] z-40 flex justify-center opacity-0">
        <button
          type="button"
          data-cursor="view"
          data-cursor-label="ENTER"
          onClick={(e) => enterProject(project, e.currentTarget)}
          className="group flex items-center gap-3 rounded-full border px-5 py-3 backdrop-blur-md transition-colors duration-500"
          style={{ borderColor: `${service.accent}80`, backgroundColor: 'rgba(5,5,7,0.7)' }}
        >
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: service.accent }}
          >
            Enter {project.title}
          </span>
          <span
            className="transition-transform duration-500 group-hover:translate-x-1"
            style={{ color: service.accent }}
          >
            →
          </span>
        </button>
      </div>
    </ShowcaseFrame>
  )
}
