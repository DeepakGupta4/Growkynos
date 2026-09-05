import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { useExperience } from '../../context/ExperienceContext'

/**
 * CINEMATIC WORD CYCLE
 * --------------------
 * Replaces the character-by-character typewriter deliberately.
 *
 * A typewriter that types and then backspaces reads as a template — it is the
 * single most reused hero effect on the web, and the erase step in particular
 * makes it feel automated. This instead treats the word as an object: the old
 * one breaks apart and is displaced sideways under blur, letter by letter, and
 * the new one assembles from the opposite direction. Same information, but it
 * reads as a cut in a film rather than a text field being edited.
 *
 * `onCommit` fires at the moment the NEW word is actually put on screen, not
 * when the transition starts — so the product scene on the right swaps in the
 * same frame as the word, and the two never disagree.
 */
export function WordCycle({ words, onCommit, holdMs = 2600, className, style }) {
  const [index, setIndex] = useState(0)
  const [display, setDisplay] = useState(words[0]?.word ?? '')
  const [phase, setPhase] = useState('enter')
  const letters = useRef([])
  const timer = useRef(null)
  const { reducedMotion } = useExperience()

  const setLetter = useCallback((el, i) => {
    letters.current[i] = el
  }, [])

  /* Reduced motion: no cycling at all. The first word stands. */
  useEffect(() => {
    if (!reducedMotion) return
    setDisplay(words[0]?.word ?? '')
    onCommit?.(0)
  }, [reducedMotion, words, onCommit])

  /* ── OUT: the current word breaks apart and is carried off. ── */
  useEffect(() => {
    if (reducedMotion || phase !== 'out') return undefined
    const els = letters.current.filter(Boolean)
    if (!els.length) return undefined

    const tl = gsap.timeline({
      onComplete: () => {
        const next = (index + 1) % words.length
        setIndex(next)
        setDisplay(words[next].word)
        setPhase('enter')
        onCommit?.(next)
      },
    })

    tl.to(els, {
      xPercent: -46,
      yPercent: -12,
      rotateX: 34,
      filter: 'blur(9px)',
      autoAlpha: 0,
      duration: 0.42,
      ease: 'power2.in',
      stagger: { each: 0.024, from: 'start' },
    })

    return () => tl.kill()
  }, [phase, index, words, reducedMotion, onCommit])

  /* ── IN: the new word assembles from the opposite side, then holds. ── */
  useEffect(() => {
    if (reducedMotion || phase !== 'enter') return undefined
    const els = letters.current.filter(Boolean)
    if (!els.length) return undefined

    const tl = gsap.timeline()
    tl.fromTo(
      els,
      { xPercent: 54, yPercent: 16, rotateX: -42, filter: 'blur(11px)', autoAlpha: 0 },
      {
        xPercent: 0,
        yPercent: 0,
        rotateX: 0,
        filter: 'blur(0px)',
        autoAlpha: 1,
        duration: 0.72,
        ease: 'expo.out',
        stagger: { each: 0.032, from: 'start' },
      },
    )

    // Hold, then start the next cut. Paused while the tab is backgrounded.
    const total = 0.72 + els.length * 0.032
    timer.current = setTimeout(
      () => {
        if (document.hidden) return
        setPhase('out')
      },
      holdMs + total * 1000,
    )

    return () => {
      tl.kill()
      clearTimeout(timer.current)
    }
  }, [phase, display, holdMs, reducedMotion])

  /* Resume cleanly if the tab was hidden when a cut was due. */
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && phase === 'enter' && !reducedMotion) {
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setPhase('out'), 900)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [phase, reducedMotion])

  letters.current = []

  return (
    <span
      className={className}
      style={{ ...style, perspective: '900px' }}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="sr-only">{display}</span>
      <span aria-hidden="true" className="flex whitespace-nowrap preserve-3d">
        {Array.from(display).map((ch, i) => (
          <span
            key={`${display}-${i}`}
            ref={(el) => setLetter(el, i)}
            className="inline-block will-change-transform"
            style={{ transformOrigin: '50% 100%' }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </span>
    </span>
  )
}
