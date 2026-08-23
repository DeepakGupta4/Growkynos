import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap, EASE } from '../../lib/gsap'
import { brand } from '../../data/brand'
import { useExperience } from '../../context/ExperienceContext'
import { useSound } from '../../context/SoundContext'
import { pad2 } from '../../lib/utils'

const MODULES = [
  { id: '01', label: 'DESIGN', detail: 'Type system · grid · material' },
  { id: '02', label: 'CODE', detail: 'Runtime · routes · data' },
  { id: '03', label: 'MOTION', detail: 'Timelines · scroll · physics' },
  { id: '04', label: 'TECHNOLOGY', detail: 'Renderer · shaders · assets' },
]

/**
 * BOOT
 * ----
 * A system initialising, not a spinner. Progress is driven by real asset
 * decode work where possible, then eased to 100% — it never stalls waiting on
 * a slow network, and it never fakes a wait when everything is already cached.
 * Skippable at any time; skipped entirely under reduced motion.
 */
export function BootSequence() {
  const { completeBoot, skipBoot, reducedMotion } = useExperience()
  const { sfx } = useSound()
  const rootRef = useRef(null)
  const barRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(-1)
  const doneRef = useRef(false)

  /* ── Reduced motion: no theatre, straight in. ─────────────── */
  useEffect(() => {
    if (reducedMotion) completeBoot()
  }, [reducedMotion, completeBoot])

  /* ── Real progress: preload the hero-critical assets. ─────── */
  useEffect(() => {
    if (reducedMotion) return undefined
    let cancelled = false

    const critical = [
      '/projects/app/meridian-health/01.svg',
      '/projects/web/obsidian-architects/01.svg',
      '/projects/saas/signalyard/01.svg',
      '/studio/01.svg',
    ]

    let loaded = 0
    const bump = () => {
      loaded += 1
      if (!cancelled) setProgress((p) => Math.max(p, Math.min(0.72, (loaded / critical.length) * 0.72)))
    }

    critical.forEach((src) => {
      const img = new Image()
      img.onload = bump
      img.onerror = bump
      img.src = src
    })

    // Fonts matter more than images here — the wordmark must not reflow.
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) setProgress((p) => Math.max(p, 0.62))
      })
    }

    return () => {
      cancelled = true
    }
  }, [reducedMotion])

  /* ── Drive the readout to 100% on a controlled curve. ─────── */
  useEffect(() => {
    if (reducedMotion) return undefined
    const state = { v: 0 }
    const tween = gsap.to(state, {
      v: 1,
      duration: 2.5,
      ease: 'power2.inOut',
      onUpdate: () => setProgress((p) => Math.max(p, state.v)),
    })
    return () => tween.kill()
  }, [reducedMotion])

  /* ── Module readout follows progress. ─────────────────────── */
  useEffect(() => {
    const next = Math.min(MODULES.length - 1, Math.floor(progress * MODULES.length))
    setActive((prev) => {
      if (next > prev) sfx('boot', { rate: 1 + next * 0.06 })
      return Math.max(prev, next)
    })
  }, [progress, sfx])

  /* ── Exit: the boot panel opens and hands off to the hero. ─ */
  const exit = useCallback(
    (immediate = false) => {
      if (doneRef.current) return
      doneRef.current = true
      const root = rootRef.current
      if (!root || immediate) {
        completeBoot()
        return
      }
      sfx('transition')
      const tl = gsap.timeline({ onComplete: completeBoot })
      tl.to('[data-boot-fade]', { autoAlpha: 0, y: -14, duration: 0.5, stagger: 0.04, ease: 'power3.in' })
        .to(
          '[data-boot-mark]',
          { scale: 0.94, autoAlpha: 0, filter: 'blur(6px)', duration: 0.7, ease: 'power3.inOut' },
          '-=0.25',
        )
        .to(
          root,
          {
            clipPath: 'inset(0% 0% 100% 0%)',
            duration: 1.05,
            ease: EASE.travel,
          },
          '-=0.35',
        )
    },
    [completeBoot, sfx],
  )

  useEffect(() => {
    if (progress >= 0.999) {
      const t = gsap.delayedCall(0.42, () => exit())
      return () => t.kill()
    }
    return undefined
  }, [progress, exit])

  /* ── Entrance + skip affordances. ─────────────────────────── */
  useEffect(() => {
    if (reducedMotion) return undefined
    const ctx = gsap.context(() => {
      gsap.from('[data-boot-mark] span', {
        yPercent: 108,
        duration: 1.15,
        ease: EASE.settle,
        stagger: 0.035,
      })
      gsap.from('[data-boot-row]', {
        autoAlpha: 0,
        x: -18,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.09,
        delay: 0.4,
      })
      gsap.from('[data-boot-meta]', { autoAlpha: 0, duration: 0.9, delay: 0.9 })
    }, rootRef)

    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        skipBoot()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      ctx.revert()
      window.removeEventListener('keydown', onKey)
    }
  }, [reducedMotion, skipBoot])

  /* Progress bar width is written directly — no re-render per frame. */
  useEffect(() => {
    if (barRef.current) {
      gsap.to(barRef.current, { scaleX: progress, duration: 0.5, ease: 'power2.out', transformOrigin: 'left center' })
    }
  }, [progress])

  if (reducedMotion) return null

  const pct = Math.round(progress * 100)

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      aria-label={`Loading GROWKYNOS, ${pct} percent`}
      className="fixed inset-0 z-boot flex flex-col justify-between bg-void px-gutter py-8 md:py-12"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
    >
      {/* Technical grid backdrop */}
      <div className="pointer-events-none absolute inset-0 grid-field opacity-[0.5]" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(70vmax 55vmax at 50% 42%, rgba(198,168,124,0.09) 0%, rgba(5,5,7,0) 65%)',
        }}
      />

      {/* Top row */}
      <div className="relative flex items-start justify-between" data-boot-fade>
        <span className="label-brass">SYSTEM INITIALIZING</span>
        <button
          type="button"
          onClick={skipBoot}
          className="label transition-colors duration-300 hover:text-bone focus-visible:text-bone"
        >
          SKIP <span aria-hidden="true">→</span>
        </button>
      </div>

      {/* Centre: wordmark + module readout */}
      <div className="relative mx-auto flex w-full max-w-shell flex-col gap-10 md:gap-16">
        <h1
          data-boot-mark
          aria-label={brand.name}
          className="flex overflow-hidden font-display text-[13vw] font-extrabold leading-[0.86] tracking-[-0.045em] text-bone md:text-[9vw]"
        >
          {Array.from(brand.wordmark).map((c, i) => (
            <span key={`${c}-${i}`} className="inline-block will-change-transform">
              {c}
            </span>
          ))}
        </h1>

        <ul className="flex flex-col gap-0 border-t border-smoke/60">
          {MODULES.map((m, i) => {
            const isActive = i === active
            const isDone = i < active
            return (
              <li
                key={m.id}
                data-boot-row
                className="group flex items-center gap-4 border-b border-smoke/60 py-3 md:gap-8 md:py-4"
              >
                <span
                  className="font-mono text-label tabular-nums transition-colors duration-500"
                  style={{ color: isActive || isDone ? '#C6A87C' : '#6B6B78' }}
                >
                  {m.id}
                </span>
                <span
                  className="font-display text-[clamp(1.1rem,3.4vw,2rem)] font-medium tracking-tight transition-all duration-700"
                  style={{
                    color: isDone ? '#9C9CA8' : isActive ? '#E6E6EA' : '#35353E',
                    transform: `translateX(${isActive ? 6 : 0}px)`,
                  }}
                >
                  {m.label}
                </span>
                <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.14em] text-mist md:block">
                  {isDone ? 'READY' : isActive ? m.detail : '—'}
                </span>
                <span
                  className="h-1.5 w-1.5 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: isDone ? '#A8C0A0' : isActive ? '#C6A87C' : '#35353E',
                    boxShadow: isActive ? '0 0 12px rgba(198,168,124,0.8)' : 'none',
                  }}
                />
              </li>
            )
          })}
        </ul>
      </div>

      {/* Bottom: progress */}
      <div className="relative flex flex-col gap-3" data-boot-fade>
        <div className="flex items-baseline justify-between">
          <span data-boot-meta className="label">
            {brand.descriptor.toUpperCase()}
          </span>
          <span className="font-display text-[clamp(2.5rem,9vw,6rem)] font-bold leading-none tracking-tighter tabular-nums text-bone">
            {pad2(pct)}
            <span className="text-brass">%</span>
          </span>
        </div>
        <div className="h-px w-full bg-smoke">
          <div ref={barRef} className="h-px w-full origin-left scale-x-0 bg-brass" />
        </div>
      </div>
    </div>
  )
}
