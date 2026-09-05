import { useEffect, useRef } from 'react'
import { gsap, EASE } from '../../lib/gsap'
import { heroStory } from '../../data/brand'
import { getService } from '../../data/services'
import { getProject } from '../../data/projects'
import { HeroScene } from './HeroScenes'
import { useExperience } from '../../context/ExperienceContext'

/**
 * HERO VISUAL
 * -----------
 * The right half of the hero. Not a static device composition — each hero word
 * has its own living scene (see HeroScenes), so the visual demonstrates the
 * capability the word names rather than illustrating it.
 *
 * This file owns only the shell: the light bed, the pointer parallax, and the
 * caption naming what is on screen. The behaviour lives in the scene.
 */
export function HeroVisual({ slideIndex = 0 }) {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const captionRef = useRef(null)
  const { reducedMotion, booted, quality } = useExperience()

  const slide = heroStory[slideIndex] ?? heroStory[0]
  const service = getService(slide.serviceId)
  const project = getProject(slide.project)

  /* ── Entrance ── */
  useEffect(() => {
    const root = rootRef.current
    if (!root || !booted) return undefined

    if (reducedMotion) {
      gsap.set('[data-hv]', { clearProps: 'all', opacity: 1 })
      return undefined
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.5 })
      tl.from(stageRef.current, {
        z: -800,
        yPercent: 10,
        rotateY: 20,
        rotateX: 10,
        opacity: 0,
        duration: 1.7,
        ease: EASE.mass,
      }).from('[data-hv-glow]', { opacity: 0, scale: 0.7, duration: 1.6, ease: 'expo.out' }, '-=1.5')
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

  /* ── Pointer parallax. The whole stage leans toward the cursor. ── */
  useEffect(() => {
    const stage = stageRef.current
    if (!stage || reducedMotion || quality.parallax === 0) return undefined

    const rx = gsap.quickTo(stage, 'rotateY', { duration: 1.2, ease: 'power3.out' })
    const ry = gsap.quickTo(stage, 'rotateX', { duration: 1.2, ease: 'power3.out' })
    const px = gsap.quickTo(stage, 'x', { duration: 1.1, ease: 'power3.out' })
    const py = gsap.quickTo(stage, 'y', { duration: 1.1, ease: 'power3.out' })

    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      const k = quality.parallax
      rx(nx * 7 * k)
      ry(-ny * 5 * k)
      px(nx * 20 * k)
      py(ny * 12 * k)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reducedMotion, quality.parallax])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none relative hidden h-full w-full items-center justify-center preserve-3d xl:flex"
    >
      <div
        data-hv-glow
        className="absolute left-1/2 top-1/2 h-[44vmax] w-[44vmax] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            'radial-gradient(circle, rgba(198,168,124,0.17) 0%, rgba(159,180,201,0.07) 34%, rgba(5,5,7,0) 68%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-6">
        <div ref={stageRef} data-hv className="preserve-3d will-change-transform">
          <HeroScene scene={slide.scene} />
        </div>

        {/* Names what is on screen, so the swap has meaning. */}
        <div ref={captionRef} className="flex items-center gap-3">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-brass">
            {service?.title}
          </span>
          <span className="h-1 w-1 rounded-full bg-smoke" />
          <span className="font-display text-[12px] text-silver">{project?.title}</span>
        </div>
      </div>
    </div>
  )
}
