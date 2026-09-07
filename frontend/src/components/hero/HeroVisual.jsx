import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, EASE } from '../../lib/gsap'
import { heroStory } from '../../data/brand'
import { getService } from '../../data/services'
import { getProject } from '../../data/projects'
import { HeroScene } from './HeroScenes'
import { useExperience } from '../../context/ExperienceContext'

/**
 * HERO VISUAL
 * -----------
 * The product half of the hero: one FIXED FRAME that every scene is fitted
 * into, plus the caption naming what is in it.
 *
 * WHY A FIXED FRAME.
 * The four scenes are hand-built compositions and they are not the same size —
 * the phone scene is tall and narrow, the SaaS dashboard is wide and short. Cut
 * to cut, the visual jumped and the panel's balance changed under it. Rather
 * than hand-tuning four scales (which breaks again the moment a scene is
 * edited), the frame is a fixed 16:10 box and each scene is MEASURED at its
 * natural size and scaled to fit it. Every cut now lands in exactly the same
 * rectangle, whatever is inside.
 *
 * This is also the seam that makes video a one-line swap later: the frame is
 * already a fixed-aspect box, so a <video> can take the place of <HeroScene>
 * without anything else moving.
 *
 * The colour wash that used to live here is gone — it covered only this half
 * and met the star canvas at a hard vertical line, which is why the hero
 * rendered as two different backgrounds. Colour is now HeroBackdrop's job, and
 * it spans the whole section.
 */

/**
 * Per-service colour, saturated on purpose. Measured across twelve studio
 * homepages: the pages that read full were the saturated ones, not the bright
 * ones. MetaLab sits at 5% brightness and 62% colour; this hero was at 12% and
 * 12%. The palette's own accents (#C6A87C, #9FB4C9, #A8C0A0) are all near-grey,
 * which is exactly why the frame read as empty.
 */
export const HERO_LOOK = {
  app: { key: '#FF7A4D', glow: '#FFD0B8', deep: '#5A2210' },
  web: { key: '#4F86FF', glow: '#BCD2FF', deep: '#152B60' },
  ai: { key: '#9B72FF', glow: '#DAC6FF', deep: '#2D1663' },
  saas: { key: '#12D49C', glow: '#A5F2DA', deep: '#0B4636' },
}

export function HeroVisual({ slideIndex = 0 }) {
  const rootRef = useRef(null)
  const frameRef = useRef(null)
  const innerRef = useRef(null)
  const stageRef = useRef(null)
  const captionRef = useRef(null)
  const [fit, setFit] = useState(1)
  const { reducedMotion, booted, quality } = useExperience()

  const slide = heroStory[slideIndex] ?? heroStory[0]
  const service = getService(slide.serviceId)
  const project = getProject(slide.project)
  const look = HERO_LOOK[slide.scene] ?? HERO_LOOK.app

  /*
   * Measure the scene at its natural size, then scale it into the frame.
   * The transform has to be cleared before measuring or each pass would
   * compound the previous scale.
   */
  const measure = useCallback(() => {
    const frame = frameRef.current
    const inner = innerRef.current
    if (!frame || !inner) return

    const prev = inner.style.transform
    inner.style.transform = 'none'
    const cw = inner.offsetWidth
    const ch = inner.offsetHeight
    inner.style.transform = prev

    const fw = frame.clientWidth
    const fh = frame.clientHeight
    if (!cw || !ch || !fw || !fh) return

    // 0.94 keeps a margin so nothing touches the frame edge.
    setFit(Math.min(fw / cw, fh / ch) * 0.94)
  }, [])

  useLayoutEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (frameRef.current) ro.observe(frameRef.current)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  /* Scenes differ in size, so re-fit on every cut. */
  useLayoutEffect(() => {
    measure()
  }, [slideIndex, measure])

  /* ── Entrance ── */
  useEffect(() => {
    const root = rootRef.current
    if (!root || !booted) return undefined

    if (reducedMotion) {
      gsap.set('[data-hv]', { clearProps: 'all', opacity: 1 })
      return undefined
    }

    const ctx = gsap.context(() => {
      gsap
        .timeline({ delay: 0.45 })
        .from(root, { opacity: 0, duration: 1.1, ease: 'power2.out' })
        .from(stageRef.current, { yPercent: 6, opacity: 0, duration: 1.4, ease: EASE.mass }, '-=0.85')
    }, root)

    return () => ctx.revert()
  }, [booted, reducedMotion])

  /* ── Caption re-announces on each cut. ── */
  useEffect(() => {
    if (!booted || reducedMotion || !captionRef.current) return
    gsap.fromTo(
      captionRef.current.children,
      { autoAlpha: 0, y: 8 },
      { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.06, overwrite: 'auto' },
    )
  }, [slideIndex, booted, reducedMotion])

  /*
   * Pointer parallax, kept small. The panel is a wall now, not a floating
   * object, and a wall that swings 20px with the cursor reads as loose.
   */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || reducedMotion || quality.parallax === 0) return undefined

    const px = gsap.quickTo(stage, 'x', { duration: 1.1, ease: 'power3.out' })
    const py = gsap.quickTo(stage, 'y', { duration: 1.1, ease: 'power3.out' })

    const onMove = (e) => {
      const k = quality.parallax
      px(((e.clientX / window.innerWidth) * 2 - 1) * 9 * k)
      py(((e.clientY / window.innerHeight) * 2 - 1) * 6 * k)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reducedMotion, quality.parallax])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 z-10 w-full overflow-hidden lg:w-[55%] xl:w-[53%]"
    >
      {/*
        Hidden below sm: on a phone this half spans the full width and the
        statement sits on top of it, so the composition landed under the copy
        and the buttons. The backdrop still carries the frame there.
      */}
      <div className="absolute inset-0 hidden items-center justify-center sm:flex">
        <div ref={stageRef} data-hv className="w-[88%] max-w-[780px] will-change-transform">
          {/* The fixed box every scene is fitted into. */}
          <div ref={frameRef} className="relative w-full" style={{ aspectRatio: '16 / 10' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                ref={innerRef}
                className="preserve-3d"
                style={{ transform: `scale(${fit})`, transformOrigin: 'center center' }}
              >
                <HeroScene scene={slide.scene} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*
        No scrim here any more. It used to start at this panel's left edge —
        fully opaque black at x=0 of a panel that itself began mid-screen — so
        it cut a hard vertical line down the hero exactly where the panel
        started. The scrim belongs to the hero, where it can span the full
        width and fade with nothing to butt against; see Hero.jsx.
      */}

      {/* Names what is on screen, anchored to the panel instead of floating. */}
      <div
        ref={captionRef}
        className="absolute bottom-7 right-6 flex items-center gap-3 md:right-10 lg:bottom-10"
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: look.glow }}>
          {service?.title}
        </span>
        <span className="h-1 w-1 rounded-full bg-smoke" />
        <span className="font-display text-[12px] text-silver">{project?.title}</span>
      </div>
    </div>
  )
}
