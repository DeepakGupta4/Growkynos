import { useEffect } from 'react'
import { useTypewriter } from '../../hooks/useTypewriter'
import { heroStory } from '../../data/brand'
import { useExperience } from '../../context/ExperienceContext'

const WORDS = heroStory.map((s) => s.word)

/**
 * The statement's final line.
 *
 * Isolated into its own component ON PURPOSE: the typewriter sets state once
 * per character, and the hero around it is expensive (canvas field, 3D cluster,
 * scroll triggers). Keeping the per-character churn in here means the rest of
 * the hero re-renders only when the WORD changes — roughly once every four
 * seconds — instead of ~20 times a second.
 */
export function Typewriter({ onIndexChange }) {
  const { reducedMotion } = useExperience()
  const { text, index, isMoving } = useTypewriter(WORDS, { enabled: !reducedMotion })

  useEffect(() => {
    onIndexChange?.(index)
  }, [index, onIndexChange])

  return (
    <span
      /*
       * hero-size: picks up the parent h1's xl step-down alongside the fixed
       * lines, so all three lines stay the same size at every breakpoint.
       *
       * Solid colour, NOT the gradient-clipped treatment the fixed lines use.
       * `background-clip: text` forces Chrome to re-rasterise a masked layer on
       * every change; at ~15 changes a second inside a preserve-3d context it
       * ghosts the previous word over the new one. A flat fill cannot smear.
       */
      className="hero-size relative flex items-baseline font-display text-display-1 font-extrabold text-brass"
      style={{ textShadow: '0 0 60px rgba(198,168,124,0.28)' }}
      /* aria-live so a screen reader announces each word rather than reading a
         stream of half-typed fragments. */
      aria-live="polite"
      aria-atomic="true"
    >
      <span>{text}</span>
      <span className="sr-only">{reducedMotion ? '' : ' — and more'}</span>
      <span
        aria-hidden="true"
        className="ml-[0.06em] inline-block shrink-0 rounded-[1px] bg-brass"
        style={{
          width: '0.055em',
          height: '0.74em',
          // Solid while characters move, blinking at rest.
          animation: isMoving ? 'none' : 'gt-caret 1.05s steps(1) infinite',
          opacity: isMoving ? 1 : undefined,
          boxShadow: '0 0 18px rgba(198,168,124,0.7)',
        }}
      />
    </span>
  )
}
