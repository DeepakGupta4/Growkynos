import { useCallback, useRef } from 'react'
import { gsap, EASE } from '../../lib/gsap'
import { ShowcaseFrame } from './ShowcaseFrame'
import { PhoneFrame } from './ui/Devices'
import { ProjectTag, StaticShowcase } from './ui/ShowcaseParts'
import { getService } from '../../data/services'
import { projectsByService } from '../../data/projects'
import { useExperience } from '../../context/ExperienceContext'
import { useProjectEntry } from '../projects/ProjectEntryContext'

const service = getService('app')

/**
 * APP WORLD
 * ---------
 * The full physical story: the device arrives from depth, wakes, pages through
 * real screens, sheds UI fragments into the space around it, gathers them back,
 * then advances into the viewer and hands off to the project route.
 *
 * Every object carries weight — entries overshoot slightly and settle, exits
 * accelerate. Nothing moves linearly.
 */
export function AppShowcase() {
  const project = projectsByService('app')[0]
  const { isMobile } = useExperience()
  const { enterProject } = useProjectEntry()

  const phoneRef = useRef(null)
  const screensRef = useRef([])
  const cardRef = useRef(null)
  const notifRef = useRef(null)
  const fragmentsRef = useRef([])
  const glowRef = useRef(null)
  const wakeRef = useRef(null)
  const captionRef = useRef(null)

  const setScreen = (el, i) => {
    screensRef.current[i] = el
  }
  const setFragment = (el, i) => {
    fragmentsRef.current[i] = el
  }

  const build = useCallback(
    (tl, { isMobile: mobile }) => {
      const phone = phoneRef.current
      const screens = screensRef.current.filter(Boolean)
      const card = cardRef.current
      const notif = notifRef.current
      const frags = fragmentsRef.current.filter(Boolean)
      const glow = glowRef.current
      const wake = wakeRef.current
      const caption = captionRef.current
      if (!phone || !screens.length) return

      const depth = mobile ? 0.55 : 1

      /* Initial state */
      gsap.set(phone, { z: -1400, rotateY: -34, rotateX: 16, opacity: 0, scale: 0.9 })
      gsap.set(screens, { autoAlpha: 0, z: 0, scale: 1, xPercent: 0 })
      gsap.set(screens[0], { autoAlpha: 0 })
      gsap.set(wake, { autoAlpha: 1, scaleY: 1 })
      gsap.set([card, notif], { autoAlpha: 0, scale: 0.86, z: 0, x: 0, y: 0 })
      gsap.set(frags, { autoAlpha: 0, scale: 0.7 })
      gsap.set(glow, { opacity: 0 })
      gsap.set(caption, { autoAlpha: 0, y: 14 })

      /* 01 — ARRIVAL: the device travels in from depth and settles. */
      tl.to(phone, {
        z: 0,
        opacity: 1,
        scale: 1,
        rotateY: 0,
        rotateX: 0,
        duration: 2.6,
        ease: 'power3.out',
      })
        // Overshoot on the rotation only — the body keeps turning a touch past rest.
        .to(phone, { rotateY: 7, duration: 0.6, ease: 'power2.inOut' }, '-=0.9')
        .to(phone, { rotateY: 0, duration: 1.1, ease: EASE.overshoot }, '-=0.2')

      /* 02 — WAKE: the panel powers on. */
      tl.to(wake, { scaleY: 0.02, duration: 0.34, ease: 'power4.in' }, '-=0.8')
        .to(glow, { opacity: 1, duration: 0.5 }, '<')
        .set(screens[0], { autoAlpha: 1 })
        .to(wake, { autoAlpha: 0, duration: 0.28 })
        .to(caption, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.2')

      /* 03 — UI COMES ALIVE inside the screen. */
      tl.fromTo(
        '[data-app-row]',
        { y: 26, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.09, ease: 'power3.out' },
        '-=0.3',
      )

      /* 04 — ESCAPE: a card leaves the screen and enters real space. */
      tl.to(card, {
        autoAlpha: 1,
        scale: 1,
        x: mobile ? -96 : -300 * depth,
        y: mobile ? -140 : -128,
        z: 320,
        rotateY: 17,
        rotateX: -8,
        duration: 1.5,
        ease: EASE.mass,
      })
        .to(notif, {
          autoAlpha: 1,
          scale: 1,
          x: mobile ? 104 : 320 * depth,
          y: mobile ? -186 : -212,
          z: 230,
          rotateY: -15,
          rotateX: 7,
          duration: 1.4,
          ease: EASE.mass,
        }, '-=1.15')
        .to([card, notif], { y: '+=12', duration: 1.2, ease: 'sine.inOut' }, '-=0.4')

      /* 05 — PAGING: screens exchange places in depth, not by sliding.
         The live rows belong to screen 01, so they leave with it. */
      tl.to('[data-app-row]', { autoAlpha: 0, y: -14, duration: 0.45, ease: 'power2.in' })

      for (let i = 1; i < screens.length; i++) {
        tl.to(
          screens[i - 1],
          { z: -260, scale: 0.9, autoAlpha: 0, xPercent: -14, duration: 0.85, ease: 'power2.in' },
          i === 1 ? '-=0.2' : '-=0.35',
        ).fromTo(
          screens[i],
          { z: 300, scale: 1.1, autoAlpha: 0, xPercent: 12 },
          { z: 0, scale: 1, autoAlpha: 1, xPercent: 0, duration: 1.05, ease: EASE.settle },
          '-=0.55',
        )
        // A quarter-turn of the body between screens keeps it physical.
        if (i === 2) {
          tl.to(phone, { rotateY: -16, duration: 1.1, ease: 'power2.inOut' }, '-=0.9').to(
            phone,
            { rotateY: 0, duration: 1.2, ease: EASE.overshoot },
            '+=0.1',
          )
        }
      }

      /* 06 — DISPERSAL: fragments orbit the device. */
      const orbit = mobile
        ? [
            [-118, -168, 180, -12],
            [126, -96, 240, 14],
            [-134, 122, 140, 8],
            [118, 176, 200, -10],
          ]
        : [
            [-360, -190, 380, -18],
            [368, -128, 300, 16],
            [-402, 138, 240, 10],
            [352, 208, 340, -14],
            [-186, 264, 180, 7],
          ]

      frags.forEach((f, i) => {
        const [x, y, z, r] = orbit[i % orbit.length]
        tl.to(
          f,
          {
            autoAlpha: 1,
            scale: 1,
            x: x * depth,
            y: y * depth,
            z,
            rotateZ: r,
            rotateY: -r,
            duration: 1.35,
            ease: EASE.mass,
          },
          i === 0 ? '-=0.4' : '-=1.15',
        )
      })

      tl.to(phone, { rotateY: 26, rotateX: -6, duration: 1.6, ease: 'power2.inOut' }, '-=1.6')
        .to(phone, { rotateY: 0, rotateX: 0, duration: 1.5, ease: EASE.settle })

      /* 07 — RECALL: everything returns to the device. */
      tl.to([...frags, card, notif], {
        x: 0,
        y: 0,
        z: 0,
        rotateZ: 0,
        rotateY: 0,
        rotateX: 0,
        scale: 0.6,
        autoAlpha: 0,
        duration: 1.25,
        ease: 'power3.inOut',
        stagger: { each: 0.05, from: 'edges' },
      })

      /* 08 — APPROACH: the device advances and fills the frame. */
      tl.to(
        phone,
        {
          z: mobile ? 420 : 700,
          scale: mobile ? 1.16 : 1.85,
          y: mobile ? -10 : -24,
          duration: 2.1,
          ease: 'power2.in',
        },
        '-=0.4',
      )
        .to(glow, { opacity: 1.6, duration: 1.4 }, '-=1.8')
        .to(caption, { autoAlpha: 0, y: -12, duration: 0.5 }, '-=1.6')
        .fromTo(
          '[data-app-cta]',
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.settle },
          '-=1.1',
        )
    },
    [],
  )

  const screens = project.images

  return (
    <ShowcaseFrame
      service={service}
      id={service.sectionId}
      beats={7}
      build={build}
      fallback={<StaticShowcase project={project} service={service} aspect="phone" />}
    >
      {/* Device glow bed */}
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[62vmin] w-[62vmin] -translate-x-1/2 -translate-y-1/2 opacity-0"
        style={{
          background: `radial-gradient(circle, ${service.accent}26 0%, ${service.accent}0d 38%, rgba(5,5,7,0) 70%)`,
        }}
      />

      {/* Escaped card */}
      <div
        ref={cardRef}
        aria-hidden="true"
        className="surface-raised pointer-events-none absolute z-30 w-[168px] rounded-xl p-3.5 opacity-0 will-change-transform md:w-[212px] md:p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-mist">TODAY</span>
          <span className="h-1 w-1 rounded-full" style={{ backgroundColor: service.accent }} />
        </div>
        <div className="flex items-end gap-2">
          <span className="font-display text-3xl font-bold leading-none tabular-nums text-bone md:text-4xl">
            82
          </span>
          <span className="pb-1 font-mono text-[9px] text-mist">bpm</span>
        </div>
        <div className="mt-3 flex h-8 items-end gap-[3px]">
          {[38, 62, 44, 78, 56, 90, 48, 70, 36, 84, 52, 66].map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-sm"
              style={{ height: `${h}%`, backgroundColor: i > 8 ? service.accent : '#35353E' }}
            />
          ))}
        </div>
        <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.13em] text-mist">
          SYNCED · 2 MIN AGO
        </p>
      </div>

      {/* Escaped notification */}
      <div
        ref={notifRef}
        aria-hidden="true"
        className="surface-raised pointer-events-none absolute z-30 flex w-[188px] items-start gap-3 rounded-2xl p-3 opacity-0 will-change-transform md:w-[248px] md:p-3.5"
      >
        <span
          className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-void md:h-8 md:w-8"
          style={{ backgroundColor: service.accent }}
        >
          M
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-[11px] font-semibold text-bone md:text-[12.5px]">
            Medication due
          </p>
          <p className="mt-0.5 truncate font-mono text-[8.5px] text-mist md:text-[9px]">
            Ward 4 · Bed 12 · 14:00
          </p>
          <div className="mt-2 flex gap-1.5">
            <span className="rounded-full bg-smoke px-2 py-0.5 font-mono text-[8px] text-silver">LATER</span>
            <span
              className="rounded-full px-2 py-0.5 font-mono text-[8px] text-void"
              style={{ backgroundColor: service.accent }}
            >
              DONE
            </span>
          </div>
        </div>
      </div>

      {/* Orbiting fragments */}
      {[
        { label: 'OFFLINE SYNC', value: 'CONFLICT-FREE' },
        { label: 'BUNDLE', value: '4.2 MB' },
        { label: 'COLD START', value: '410 ms' },
        { label: 'PLATFORM', value: 'iOS · ANDROID' },
        { label: 'CRASH-FREE', value: '99.94%' },
      ]
        .slice(0, isMobile ? 4 : 5)
        .map((f, i) => (
          <div
            key={f.label}
            ref={(el) => setFragment(el, i)}
            aria-hidden="true"
            className="surface pointer-events-none absolute z-20 flex items-center gap-2.5 rounded-full px-3 py-2 opacity-0 will-change-transform md:px-3.5 md:py-2.5"
          >
            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-mist">{f.label}</span>
            <span className="font-mono text-[9px] tabular-nums" style={{ color: service.accent }}>
              {f.value}
            </span>
          </div>
        ))}

      {/* Device */}
      <div className="relative z-10 flex flex-col items-center gap-6 preserve-3d">
        <PhoneFrame ref={phoneRef} width={isMobile ? 206 : 272}>
          {/* Screen stack */}
          <div className="relative h-full w-full preserve-3d">
            {screens.map((src, i) => (
              <img
                key={src}
                ref={(el) => setScreen(el, i)}
                src={src}
                alt={`${project.title} — screen ${i + 1} of ${screens.length}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable="false"
                className="absolute inset-0 h-full w-full object-cover object-top will-change-transform"
              />
            ))}

            {/* Live UI rows layered over the first screen */}
            <div className="pointer-events-none absolute inset-x-0 bottom-[16%] flex flex-col gap-1.5 px-3">
              {['Vitals recorded', 'Round complete', 'Sync queued'].map((t) => (
                <div
                  key={t}
                  data-app-row
                  className="flex items-center gap-2 rounded-lg bg-black/70 px-2.5 py-1.5 backdrop-blur-sm"
                >
                  <span className="h-1 w-1 rounded-full" style={{ backgroundColor: service.accent }} />
                  <span className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-silver">{t}</span>
                </div>
              ))}
            </div>

            {/* Power-on wipe */}
            <div
              ref={wakeRef}
              aria-hidden="true"
              className="absolute inset-0 origin-center bg-black"
              style={{ willChange: 'transform' }}
            />
          </div>
        </PhoneFrame>

        <div ref={captionRef} className="opacity-0">
          <ProjectTag project={project} accent={service.accent} />
        </div>
      </div>

      {/* Hand-off */}
      <div data-app-cta className="absolute inset-x-0 bottom-[26%] z-40 flex justify-center opacity-0 md:bottom-[16%]">
        <button
          type="button"
          data-cursor="view"
          data-cursor-label="ENTER"
          onClick={(e) => enterProject(project, e.currentTarget)}
          className="group flex items-center gap-3 rounded-full border border-brass/50 bg-void/70 px-5 py-3 backdrop-blur-md transition-colors duration-500 hover:border-brass"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass">
            Enter {project.title}
          </span>
          <span className="text-brass transition-transform duration-500 group-hover:translate-x-1">→</span>
        </button>
      </div>
    </ShowcaseFrame>
  )
}
