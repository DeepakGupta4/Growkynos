import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap, ScrollTrigger, EASE, SCRUB } from '../../lib/gsap'
import { ProjectCard } from './ProjectCard'
import { projects } from '../../data/projects'
import { useExperience } from '../../context/ExperienceContext'
import { useProjectEntry } from './ProjectEntryContext'
import { useTransition } from '../transitions/TransitionProvider'
import { useSound } from '../../context/SoundContext'
import { seeded } from '../../lib/utils'

/**
 * PROJECT UNIVERSE
 * ----------------
 * The centre of gravity for the whole site.
 *
 * Projects begin scattered through a deep volume — some behind the camera
 * plane, some off to the sides, some barely visible. Scroll pulls them through
 * the space on individually authored trajectories, so they cross each other's
 * paths rather than moving as a block. They accelerate, decelerate, and finally
 * converge into a single stack at the centre: the archive.
 *
 * The type resolves out of that stack — DESIGN. CODE. MOTION. / UNDER ONE ROOF.
 *
 * Every plate stays clickable throughout, and hands off to the FLIP entry.
 */
export function ProjectUniverse() {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const fieldRef = useRef(null)
  const cardRefs = useRef([])
  const barRef = useRef(null)
  const counterRef = useRef(null)
  const { reducedMotion, isMobile, isTablet } = useExperience()
  const { enterProject } = useProjectEntry()
  const { go } = useTransition()
  const { sfx } = useSound()
  const [phase, setPhase] = useState(0)

  const setCard = (el, i) => {
    cardRefs.current[i] = el
  }

  /**
   * Authored trajectories. Each project gets a start (scattered), a mid
   * (crossing) and an end (stacked) — seeded so the composition is identical
   * on every load, and balanced so nothing clumps.
   */
  const paths = useMemo(() => {
    const rand = seeded(31071994)
    const n = projects.length
    return projects.map((p, i) => {
      const ring = i % 3 // three depth shells
      const angle = (i / n) * Math.PI * 2 + rand() * 0.6
      const radius = 260 + ring * 190 + rand() * 130

      const start = {
        x: Math.cos(angle) * radius * (isMobile ? 0.52 : 1),
        y: Math.sin(angle) * radius * (isMobile ? 0.46 : 0.72),
        z: -1900 + ring * 520 + rand() * 620,
        rotX: (rand() - 0.5) * 26,
        rotY: (rand() - 0.5) * 46,
        rotZ: (rand() - 0.5) * 18,
        scale: 0.7 + rand() * 0.55,
        blur: ring === 2 ? 4 : ring === 1 ? 2 : 0,
        opacity: 0.32 + rand() * 0.55,
      }

      // Mid point sits on the opposite side — this is what makes paths cross.
      const mid = {
        x: -start.x * (0.42 + rand() * 0.5),
        y: start.y * -0.55 + (rand() - 0.5) * 190,
        z: -420 + rand() * 900,
        rotX: (rand() - 0.5) * 18,
        rotY: (rand() - 0.5) * 34,
        rotZ: (rand() - 0.5) * 12,
        scale: 0.86 + rand() * 0.4,
        blur: 0,
        opacity: 1,
      }

      // Final stack — a real archive pile, fanned by index.
      const fan = (i - (n - 1) / 2) / n
      const end = {
        x: fan * (isMobile ? 66 : 128) + (rand() - 0.5) * 20,
        y: fan * (isMobile ? 30 : 52) + (rand() - 0.5) * 16,
        z: -i * (isMobile ? 12 : 20),
        rotX: 0,
        rotY: fan * 12,
        rotZ: fan * 16 + (rand() - 0.5) * 5,
        scale: isMobile ? 0.62 : 0.78,
        blur: 0,
        opacity: 1,
      }

      return { project: p, start, mid, end, delay: rand() * 0.35, speed: 0.85 + rand() * 0.4 }
    })
  }, [isMobile])

  const handleSelect = useCallback(
    (project, el) => {
      sfx('enter')
      enterProject(project, el)
    },
    [enterProject, sfx],
  )

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const field = fieldRef.current
    if (!root || !stage || !field || reducedMotion) return undefined

    let ctx
    const raf = requestAnimationFrame(() => {
      ctx = gsap.context(() => {
        const cards = cardRefs.current.filter(Boolean)
        if (!cards.length) return

        // Place every plate at its scattered origin.
        cards.forEach((el, i) => {
          const { start } = paths[i]
          gsap.set(el, {
            xPercent: -50,
            yPercent: -50,
            x: start.x,
            y: start.y,
            z: start.z,
            rotateX: start.rotX,
            rotateY: start.rotY,
            rotateZ: start.rotZ,
            scale: start.scale,
            opacity: start.opacity,
            filter: start.blur ? `blur(${start.blur}px)` : 'none',
          })
        })

        const distance = isMobile ? 420 : isTablet ? 620 : 760

        const master = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: `+=${distance}%`,
            scrub: SCRUB,
            pin: stage,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`
              if (counterRef.current) {
                const visible = Math.min(projects.length, Math.ceil(self.progress * 1.35 * projects.length))
                counterRef.current.textContent = String(visible).padStart(2, '0')
              }
              const p = self.progress
              const next = p < 0.34 ? 0 : p < 0.62 ? 1 : p < 0.82 ? 2 : 3
              setPhase((prev) => (prev === next ? prev : next))
            },
          },
        })

        /* ── ACT I — DRIFT: the field opens and plates begin to travel. ── */
        cards.forEach((el, i) => {
          const { mid, delay, speed } = paths[i]
          master.to(
            el,
            {
              x: mid.x,
              y: mid.y,
              z: mid.z,
              rotateX: mid.rotX,
              rotateY: mid.rotY,
              rotateZ: mid.rotZ,
              scale: mid.scale,
              opacity: mid.opacity,
              filter: 'blur(0px)',
              duration: 4.2 * speed,
              ease: 'power1.inOut',
            },
            delay,
          )
        })

        // The whole field rotates slightly — a camera move, not a card move.
        master.fromTo(
          field,
          { rotateY: isMobile ? 6 : 14, rotateX: isMobile ? -3 : -7 },
          { rotateY: isMobile ? -5 : -11, rotateX: isMobile ? 2 : 5, duration: 4.6, ease: 'none' },
          0,
        )

        /* ── ACT II — CONVERGENCE: acceleration, then a hard settle. ── */
        const conv = 4.4
        cards.forEach((el, i) => {
          const { end, speed } = paths[i]
          master.to(
            el,
            {
              x: end.x,
              y: end.y,
              z: end.z,
              rotateX: end.rotX,
              rotateY: end.rotY,
              rotateZ: end.rotZ,
              scale: end.scale,
              opacity: 1,
              duration: 3.4,
              // in-out: they gather speed, cross, then brake into the stack
              ease: 'power3.inOut',
            },
            conv + (1 - speed) * 0.5,
          )
        })

        master.to(field, { rotateY: 0, rotateX: 0, duration: 3.4, ease: 'power3.inOut' }, conv)

        /* ── ACT III — THE ARCHIVE holds, then the statement resolves. ── */
        const stmt = conv + 3.6

        master.fromTo(
          '[data-universe-veil]',
          { opacity: 0 },
          { opacity: 1, duration: 1.2, ease: 'power2.inOut' },
          stmt,
        )

        master.fromTo(
          '[data-statement-a] [data-word]',
          { yPercent: 118, rotateX: -58, opacity: 0 },
          {
            yPercent: 0,
            rotateX: 0,
            opacity: 1,
            duration: 1.5,
            ease: EASE.settle,
            stagger: 0.22,
          },
          stmt + 0.3,
        )

        master.to('[data-statement-a]', { opacity: 0, yPercent: -26, duration: 1.1, ease: 'power2.in' }, stmt + 3.4)

        master.fromTo(
          '[data-statement-b] [data-word]',
          { yPercent: 118, opacity: 0, filter: 'blur(10px)' },
          {
            yPercent: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 1.6,
            ease: EASE.settle,
            stagger: 0.16,
          },
          stmt + 3.9,
        )

        // The stack presses back and dims so the statement owns the frame.
        master.to(
          cards,
          { z: '-=220', scale: '-=0.06', opacity: 0.42, duration: 1.6, ease: 'power2.inOut' },
          stmt + 3.9,
        )

        // …then returns, so the archive is browsable at the end.
        master.to(
          cards,
          { z: '+=220', scale: '+=0.06', opacity: 1, duration: 1.5, ease: 'power2.inOut' },
          stmt + 6.4,
        )
        master.to('[data-statement-b]', { opacity: 0, yPercent: -20, duration: 1.1, ease: 'power2.in' }, stmt + 6.4)
        master.to('[data-universe-veil]', { opacity: 0, duration: 1.1 }, stmt + 6.4)
        master.fromTo(
          '[data-universe-outro]',
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: 1.1, ease: EASE.settle },
          stmt + 6.9,
        )
      }, root)
    })

    return () => {
      cancelAnimationFrame(raf)
      ctx?.revert()
      ScrollTrigger.refresh()
    }
  }, [paths, reducedMotion, isMobile, isTablet])

  /* ── Reduced motion: the archive as a plain, complete index. ── */
  if (reducedMotion) {
    return (
      <section id="projects" aria-label="Projects" className="section border-t border-smoke/40 py-24">
        <div className="shell flex flex-col gap-10">
          <header className="flex flex-col gap-4">
            <span className="label-brass">THE ARCHIVE</span>
            <h2 className="font-display text-display-2 font-extrabold text-gradient-bone">
              DESIGN. CODE. MOTION.
              <br />
              UNDER ONE ROOF.
            </h2>
          </header>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={(e) => handleSelect(p, e.currentTarget)}
                  className="group w-full overflow-hidden rounded-lg border border-smoke/70 text-left"
                >
                  <img
                    src={p.thumbnail}
                    alt=""
                    loading="lazy"
                    className="aspect-[16/10] w-full object-cover object-top"
                  />
                  <span className="flex flex-col gap-1 p-4">
                    <span className="font-display text-base font-semibold text-bone">{p.title}</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist">
                      {p.category} · {p.year}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    )
  }

  const PHASES = ['SCATTERED', 'CROSSING', 'CONVERGING', 'THE ARCHIVE']

  return (
    <section
      id="projects"
      ref={rootRef}
      aria-label="Projects"
      className="section relative border-t border-smoke/40"
    >
      <div ref={stageRef} className="relative flex h-[100svh] w-full flex-col overflow-hidden">
        {/* Deep-space wash */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(80vmax 62vmax at 50% 46%, rgba(198,168,124,0.09) 0%, rgba(5,5,7,0) 66%)',
          }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid-field opacity-30 mask-fade-edges" />

        {/* The volume */}
        <div
          className="relative flex flex-1 items-center justify-center overflow-hidden"
          style={{ perspective: isMobile ? '1200px' : '2000px' }}
        >
          <div ref={fieldRef} className="absolute inset-0 preserve-3d will-change-transform">
            {paths.map(({ project }, i) => (
              <ProjectCard
                key={project.id}
                ref={(el) => setCard(el, i)}
                project={project}
                index={i}
                compact={isMobile}
                priority={i < 3}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {/* Veil — darkens the stack so the statement reads */}
          <div
            data-universe-veil
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20 opacity-0"
            style={{
              background:
                'radial-gradient(ellipse 76% 66% at 50% 50%, rgba(5,5,7,0.86) 0%, rgba(5,5,7,0.6) 62%, rgba(5,5,7,0.35) 100%)',
            }}
          />

          {/* The identity moment */}
          <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center px-gutter">
            <h2 className="sr-only">Design, code and motion under one roof.</h2>

            <div data-statement-a aria-hidden="true" className="flex flex-col items-center preserve-3d">
              {['DESIGN.', 'CODE.', 'MOTION.'].map((w) => (
                <span key={w} className="line-mask preserve-3d">
                  <span
                    data-word
                    className="block font-display text-[clamp(2.6rem,11vw,8.5rem)] font-extrabold leading-[0.88] tracking-[-0.045em] text-gradient-bone will-change-transform"
                  >
                    {w}
                  </span>
                </span>
              ))}
            </div>

            <div
              data-statement-b
              aria-hidden="true"
              className="absolute flex flex-col items-center text-center preserve-3d"
            >
              {['UNDER ONE', 'ROOF.'].map((w, i) => (
                <span key={w} className="line-mask preserve-3d">
                  <span
                    data-word
                    className="block font-display text-[clamp(2.4rem,10vw,7.5rem)] font-extrabold leading-[0.9] tracking-[-0.045em] will-change-transform"
                    style={{ color: i === 1 ? '#C6A87C' : '#E6E6EA' }}
                  >
                    {w}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Chrome */}
        <div className="relative z-40 w-full px-gutter pb-6 md:pb-8">
          <div className="mx-auto flex w-full max-w-shell flex-col gap-4">
            <div className="h-px w-full bg-smoke/70">
              <div ref={barRef} className="h-px w-full origin-left scale-x-0 bg-brass will-change-transform" />
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-end gap-4 md:gap-6">
                <span className="font-display text-[clamp(2rem,7vw,4.5rem)] font-extrabold leading-[0.8] tabular-nums text-brass">
                  <span ref={counterRef}>00</span>
                </span>
                <div className="flex flex-col gap-1 pb-1">
                  <h2 className="font-display text-[clamp(1.15rem,3.6vw,2.25rem)] font-semibold leading-none tracking-tight text-bone">
                    The archive
                  </h2>
                  <p className="max-w-sm text-[12.5px] leading-relaxed text-mist">
                    Every project we have shipped, converging. Click any plate to enter it.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-mist">
                  <span className="text-brass">{String(phase + 1).padStart(2, '0')}</span> / 04 ·{' '}
                  {PHASES[phase]}
                </span>
                <button
                  type="button"
                  data-cursor="link"
                  onClick={() => go('/work', { label: 'ALL WORK' })}
                  className="group flex items-center gap-2 rounded-full border border-smoke px-4 py-2.5 transition-colors duration-500 hover:border-brass/70"
                >
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-silver transition-colors group-hover:text-brass">
                    All work
                  </span>
                  <span className="text-mist transition-all duration-500 group-hover:translate-x-0.5 group-hover:text-brass">
                    →
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Outro cue */}
        <div
          data-universe-outro
          className="pointer-events-none absolute inset-x-0 bottom-[22%] z-40 flex justify-center opacity-0"
        >
          <span className="rounded-full border border-smoke/80 bg-void/70 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.2em] text-silver backdrop-blur-md">
            {projects.length} projects · click to enter
          </span>
        </div>
      </div>
    </section>
  )
}
