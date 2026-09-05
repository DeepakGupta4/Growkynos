import { useEffect, useRef } from 'react'
import { gsap, EASE } from '../../lib/gsap'
import { PhoneFrame, BrowserFrame } from '../showcases/ui/Devices'
import { getProject } from '../../data/projects'
import { getService } from '../../data/services'
import { heroStory } from '../../data/brand'
import { CrossfadeImage } from './CrossfadeImage'
import { useExperience } from '../../context/ExperienceContext'

/**
 * HERO VISUAL
 * -----------
 * The right half of the hero, and the other half of the story: as the
 * typewriter cycles through what we build, this cluster swaps to the real
 * project that proves each word. Type "STORES." and an actual storefront is
 * on screen. That is the claim and the evidence in the same frame.
 *
 * ALIGNMENT
 * Everything is positioned against the browser plate, which is the anchor —
 * not against the section in loose percentages. The phone's bottom edge sits on
 * the browser's bottom edge (offset by a fixed overhang), and the three chips
 * are pinned to the browser's own corners. That is why the cluster reads as one
 * assembled object rather than parts that happen to be near each other.
 *
 * All slides are rendered and cross-faded rather than swapping `src`, so a
 * switch never shows a half-decoded image.
 */
/*
 * The phone owns the cluster's bottom-RIGHT, so the chips take the top edge and
 * the left flank. Sites are laid out left-to-right: the browser's headline
 * lives in its top-left, and anything overlapping there clips real words and
 * reads as a broken screenshot rather than a layered composition.
 */
const CHIP_SLOTS = [
  { id: 'build', label: 'build', value: 'PASSING', tone: '#A8C0A0', pos: 'top-0 left-[22%] -translate-y-[170%]' },
  { id: 'frame', label: 'frame', value: '16.6 ms', tone: '#C6A87C', pos: 'top-1/2 left-0 -translate-x-[22%] -translate-y-1/2' },
  // Left flank, low. The phone covers the entire right flank from top to bottom,
  // so nothing can be anchored there.
  { id: 'score', label: 'lighthouse', value: '98 / 100', tone: '#C6A87C', pos: 'bottom-[8%] left-0 -translate-x-[26%]' },
]

export function HeroVisual({ slideIndex = 0 }) {
  const rootRef = useRef(null)
  const browserRef = useRef(null)
  const phoneRef = useRef(null)
  const urlRef = useRef(null)
  const tagRef = useRef(null)
  const { reducedMotion, booted, quality } = useExperience()

  const slides = heroStory.map((s) => ({
    ...s,
    browserProject: getProject(s.browser),
    phoneProject: getProject(s.phone),
    service: getService(s.serviceId),
  }))

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
      tl.from(browserRef.current, {
        z: -900,
        yPercent: 10,
        rotateY: 24,
        rotateX: 12,
        opacity: 0,
        duration: 1.8,
        ease: EASE.mass,
      })
        .from(
          phoneRef.current,
          { z: -620, yPercent: 20, rotateY: 28, opacity: 0, duration: 1.6, ease: EASE.mass },
          '-=1.35',
        )
        .from(
          '[data-hv-chip]',
          { scale: 0.6, opacity: 0, duration: 1, stagger: 0.11, ease: EASE.overshoot },
          '-=0.95',
        )
        .from('[data-hv-glow]', { opacity: 0, scale: 0.7, duration: 1.6, ease: 'expo.out' }, '-=1.7')
    }, root)

    return () => ctx.revert()
  }, [booted, reducedMotion])

  /* ── Slide change: the devices react. Media crossfade is owned by
       CrossfadeImage, which waits for the incoming frame to decode. ── */
  useEffect(() => {
    if (!booted || reducedMotion) return

    // A small settle on each swap so the object acknowledges the change.
    gsap.fromTo(
      browserRef.current,
      { rotateY: -13 },
      { rotateY: -9, duration: 1.1, ease: 'elastic.out(1, 0.7)' },
    )
    gsap.fromTo(
      phoneRef.current,
      { y: -10 },
      { y: 0, duration: 1.2, ease: 'elastic.out(1, 0.6)' },
    )
    gsap.fromTo(
      [urlRef.current, tagRef.current],
      { autoAlpha: 0, y: 6 },
      { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.06 },
    )
  }, [slideIndex, booted, reducedMotion])

  /* ── Pointer parallax: layers separate by depth. ── */
  useEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion || quality.parallax === 0) return undefined

    const layers = [
      { el: browserRef.current, depth: 0.5 },
      { el: phoneRef.current, depth: 1 },
    ].filter((l) => l.el)

    const setters = layers.map(({ el, depth }) => ({
      depth,
      x: gsap.quickTo(el, 'x', { duration: 1.1, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'y', { duration: 1.1, ease: 'power3.out' }),
    }))

    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      const k = quality.parallax
      setters.forEach((s) => {
        s.x(nx * 24 * s.depth * k)
        s.y(ny * 15 * s.depth * k)
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reducedMotion, quality.parallax])

  const current = slides[slideIndex] ?? slides[0]

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

      {/* The browser is the anchor everything else aligns to. */}
      <div className="relative preserve-3d" style={{ width: 'min(34vw, 560px)' }}>
        <div
          ref={browserRef}
          data-hv
          /* Explicit z-index: BrowserFrame's overflow-hidden flattens its own
             subtree, and Chrome was painting it over the phone despite the
             phone's greater translateZ. */
          className="relative z-0 preserve-3d will-change-transform"
          style={{ transform: 'translateZ(-110px) rotateY(-9deg) rotateX(4deg)' }}
        >
          <BrowserFrame
            url={current.browserProject.url?.replace('https://', '') ?? 'gentechne.com'}
            accent="#9FB4C9"
            className="w-full"
          >
            <div className="relative h-[25vh] w-full">
              <CrossfadeImage
                src={current.browserProject.thumbnail}
                className="absolute inset-0 h-full w-full object-cover object-left-top"
              />
            </div>
          </BrowserFrame>
        </div>

        {/* Phone: hangs off the browser's bottom-right corner, clear of the
            site headline in the browser's top-left. */}
        <div
          ref={phoneRef}
          data-hv
          className="absolute bottom-0 right-0 z-10 preserve-3d will-change-transform"
          style={{ transform: 'translateZ(110px) translate(34%, 28%)' }}
        >
          <PhoneFrame width={152}>
            <div className="relative h-full w-full">
              <CrossfadeImage
                src={current.phoneProject.thumbnail}
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            </div>
          </PhoneFrame>
        </div>

        {/* Chips pinned to the browser's own corners. */}
        {CHIP_SLOTS.map((c) => (
          <div
            key={c.id}
            data-hv-chip
            data-hv
            className={`surface absolute z-20 flex items-center gap-2.5 whitespace-nowrap rounded-full px-3.5 py-2 will-change-transform ${c.pos}`}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: c.tone, boxShadow: `0 0 10px ${c.tone}99` }}
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-mist">{c.label}</span>
            <span className="font-mono text-[10px] tabular-nums" style={{ color: c.tone }}>
              {c.value}
            </span>
          </div>
        ))}

        {/* Caption — names the project on screen, so the swap has meaning. */}
        <div
          ref={tagRef}
          data-hv
          className="absolute inset-x-0 -bottom-[4.25rem] flex items-center justify-center gap-3"
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-brass">
            {current.service?.title}
          </span>
          <span className="h-1 w-1 rounded-full bg-smoke" />
          <span ref={urlRef} className="font-display text-[12px] text-silver">
            {current.browserProject.title}
          </span>
        </div>
      </div>
    </div>
  )
}
