import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, EASE } from '../../lib/gsap'
import { heroStory } from '../../data/brand'
import { getService } from '../../data/services'
import { getProject } from '../../data/projects'
import { HeroScene } from './HeroScenes'
import { HeroLaptop } from './HeroLaptop'
import { useExperience } from '../../context/ExperienceContext'

/**
 * HERO VISUAL
 * -----------
 * The product half of the hero: one laptop, always the same size in the same
 * place, with whatever the active service is playing on its screen.
 *
 * WHY ONE PIECE OF HARDWARE.
 * The four scenes are not the same shape — a tall phone, a wide dashboard, a
 * node graph — so cut to cut the visual jumped and the panel never settled.
 * Rather than hand-tuning four scales (which breaks the moment a scene is
 * edited), each scene is MEASURED at its natural size and scaled into the
 * laptop's fixed 16:10 screen. Every cut lands in the same rectangle.
 *
 * The colour wash that used to live here is gone — it covered only this half
 * and met the star canvas at a hard vertical line, which is why the hero
 * rendered as two different backgrounds. Colour is HeroBackdrop's job now, and
 * it spans the whole section.
 */

/**
 * Per-service colour, saturated on purpose. Measured across twelve studio
 * homepages: the pages that read full were the saturated ones, not the bright
 * ones. MetaLab sits at 5% brightness and 62% colour; this hero was at 12% and
 * 12%. The palette's own accents (#C6A87C, #9FB4C9, #A8C0A0) are all near-grey,
 * which is exactly why the frame read as empty.
 *
 * SaaS was #12D49C — a mint green that read closer to a status indicator than a
 * brand, and sat too near the "success" green used for live pills inside the
 * scenes. Magenta is the only hue left that is genuinely distinct from the
 * other three (orange / blue / violet) rather than a neighbour of one of them.
 */
export const HERO_LOOK = {
  app: { key: '#FF7A4D', glow: '#FFD0B8', deep: '#5A2210' },
  web: { key: '#4F86FF', glow: '#BCD2FF', deep: '#152B60' },
  ai: { key: '#9B72FF', glow: '#DAC6FF', deep: '#2D1663' },
  saas: { key: '#FF4D8D', glow: '#FFBDD6', deep: '#5C1038' },
}

/**
 * Screen recordings, one per service.
 *
 * Drop a file at `public/hero/<name>.webm` (or .mp4) and put its path here —
 * that is the whole change. The laptop screen is already a fixed 16:10 box, so
 * nothing else moves. Until then each screen plays its built scene, which is
 * animated in the same way; a fabricated "screen recording" would look worse
 * than a real interface, so there is no placeholder footage.
 *
 * Recommended: 16:10, ~12s loop, no audio, under ~1.5MB each.
 */
const SCENE_VIDEO = {
  app: null,
  web: null,
  ai: null,
  saas: null,
}

export function HeroVisual({ slideIndex = 0 }) {
  const rootRef = useRef(null)
  const frameRef = useRef(null)
  const innerRef = useRef(null)
  const stageRef = useRef(null)
  const captionRef = useRef(null)
  const [fit, setFit] = useState({ s: 1, dx: 0, dy: 0 })
  const [brokenVideo, setBrokenVideo] = useState({})
  const { reducedMotion, booted, quality } = useExperience()

  const slide = heroStory[slideIndex] ?? heroStory[0]
  const service = getService(slide.serviceId)
  const project = getProject(slide.project)
  const look = HERO_LOOK[slide.scene] ?? HERO_LOOK.app

  /* A missing or unplayable file falls back to the built scene rather than
     leaving a black screen in the middle of the hero. */
  const videoSrc = brokenVideo[slide.scene] ? null : SCENE_VIDEO[slide.scene]

  /*
   * Measure the scene at its natural size, then scale it into the screen.
   * The transform has to be cleared before measuring or each pass would
   * compound the previous scale.
   */
  const measure = useCallback(() => {
    const frame = frameRef.current
    const inner = innerRef.current
    if (!frame || !inner) return

    const prev = inner.style.transform
    inner.style.transform = 'none'

    /*
     * The UNION of the scene and everything inside it, not the scene's own box.
     *
     * The scenes deliberately hang elements outside their bounds — the SaaS
     * "NEW UNIT ONLINE" pill sits at -right-12%, the app scene's stat chips
     * likewise. offsetWidth does not count an absolutely positioned child that
     * overflows, so fitting to it put those pills past the bezel, where the
     * screen's overflow:hidden sliced them mid-word.
     *
     * Measuring the union also means the fit stays correct if a scene is edited
     * later, which hand-tuned per-scene scales would not.
     */
    const base = inner.getBoundingClientRect()
    let minX = base.left
    let minY = base.top
    let maxX = base.right
    let maxY = base.bottom
    for (const el of inner.querySelectorAll('*')) {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      if (r.left < minX) minX = r.left
      if (r.top < minY) minY = r.top
      if (r.right > maxX) maxX = r.right
      if (r.bottom > maxY) maxY = r.bottom
    }

    /* How far the union's centre sits from the element's own centre. The scene
       is then shifted by that much so what gets centred in the screen is
       everything, rather than the box the overflow hangs off. */
    const dx = (base.left + base.right) / 2 - (minX + maxX) / 2
    const dy = (base.top + base.bottom) / 2 - (minY + maxY) / 2

    inner.style.transform = prev

    const cw = maxX - minX
    const ch = maxY - minY
    const fw = frame.clientWidth
    const fh = frame.clientHeight
    if (!cw || !ch || !fw || !fh) return

    // 0.92 keeps a margin so nothing touches the bezel.
    setFit({ s: Math.min(fw / cw, fh / ch) * 0.92, dx, dy })
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
   * Pointer parallax, kept small. The laptop is a solid object sitting in the
   * frame — a machine that swings 20px with the cursor reads as loose.
   */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || reducedMotion || quality.parallax === 0) return undefined

    const px = gsap.quickTo(stage, 'x', { duration: 1.1, ease: 'power3.out' })
    const py = gsap.quickTo(stage, 'y', { duration: 1.1, ease: 'power3.out' })

    const onMove = (e) => {
      const k = quality.parallax
      px(((e.clientX / window.innerWidth) * 2 - 1) * 8 * k)
      py(((e.clientY / window.innerHeight) * 2 - 1) * 5 * k)
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
        statement sits on top of it, so the laptop landed under the copy and the
        buttons. The backdrop still carries the frame there.
      */}
      <div className="absolute inset-0 hidden items-center justify-center sm:flex">
        <div ref={stageRef} data-hv className="w-[86%] max-w-[720px] will-change-transform">
          <HeroLaptop tint={look.key} video={videoSrc}>
            <div ref={frameRef} className="relative h-full w-full">
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  ref={innerRef}
                  className="preserve-3d"
                  style={{
                    /* scale() then translate(): the shift is expressed in the
                       scene's own units and carried by the scale, which keeps it
                       correct at every breakpoint. */
                    transform: `scale(${fit.s}) translate(${fit.dx}px, ${fit.dy}px)`,
                    transformOrigin: 'center center',
                  }}
                >
                  <HeroScene scene={slide.scene} />
                </div>
              </div>
            </div>
          </HeroLaptop>
          {/* A file that 404s or will not decode reverts to the built scene. */}
          {videoSrc ? (
            <video
              src={videoSrc}
              className="hidden"
              onError={() => setBrokenVideo((b) => ({ ...b, [slide.scene]: true }))}
            />
          ) : null}
        </div>
      </div>

      {/*
        No scrim here. It used to start at this panel's left edge — fully opaque
        black at x=0 of a panel that itself began mid-screen — so it cut a hard
        vertical line down the hero. The scrim belongs to the hero, where it can
        span the full width; see Hero.jsx.
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
