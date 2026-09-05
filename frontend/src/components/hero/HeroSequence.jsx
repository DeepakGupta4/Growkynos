import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { heroStory } from '../../data/brand'
import { useExperience } from '../../context/ExperienceContext'
import { cn } from '../../lib/utils'

/**
 * HERO SEQUENCE INDICATOR
 * -----------------------
 * `01 / 04 — APPS`, with a bar that fills across each beat.
 *
 * Deliberately NOT the nav's `01 / 16 ENTRY` readout, which tracks scroll
 * position across the whole page and is genuinely useful for that. Overloading
 * it with the hero's four-beat loop would break the one job it does well, so
 * the hero carries its own indicator and the nav keeps counting chapters.
 *
 * The bar is honest about timing: it is driven by the same hold duration the
 * word cycle uses, so it reaches full exactly as the next cut begins.
 */
export function HeroSequence({ index, holdMs = 2600, className }) {
  const barRef = useRef(null)
  const { reducedMotion } = useExperience()

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return undefined
    if (reducedMotion) {
      gsap.set(bar, { scaleX: 1 })
      return undefined
    }

    // Word transition (~1s) plus hold — the bar spans the whole beat.
    const tween = gsap.fromTo(
      bar,
      { scaleX: 0 },
      { scaleX: 1, duration: (holdMs + 1000) / 1000, ease: 'none', transformOrigin: 'left center' },
    )
    return () => tween.kill()
  }, [index, holdMs, reducedMotion])

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[11px] tabular-nums text-brass">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-mist">
          / {String(heroStory.length).padStart(2, '0')}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-silver">
          {heroStory[index]?.label}
        </span>
      </div>

      {/* Ticks: one per beat, the active one filling. */}
      <div className="flex items-center gap-1.5">
        {heroStory.map((s, i) => (
          <span
            key={s.word}
            className="h-px w-10 overflow-hidden bg-smoke"
            aria-hidden="true"
          >
            {i === index ? (
              <span ref={barRef} className="block h-px w-full origin-left scale-x-0 bg-brass" />
            ) : (
              <span
                className="block h-px w-full origin-left bg-brass"
                style={{ transform: i < index ? 'scaleX(1)' : 'scaleX(0)', opacity: i < index ? 0.4 : 0 }}
              />
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
