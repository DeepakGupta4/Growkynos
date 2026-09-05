import { useEffect, useRef, useState } from 'react'

const rand = ([min, max]) => min + Math.random() * (max - min)

/**
 * TYPEWRITER
 * ----------
 * Types a word, holds, deletes it, moves to the next.
 *
 * The detail that separates this from a cheap CSS typewriter is CADENCE: real
 * typing is uneven, and deleting is roughly twice as fast as typing. A fixed
 * interval reads as a machine ticking; jittered intervals read as a hand. Both
 * ranges below are deliberately wide for that reason.
 *
 * Also: the loop does not run while the tab is hidden. A background timer
 * churning React state for a hero nobody is looking at is pure waste, and on
 * return it would resume mid-word at the wrong cadence.
 *
 * Under `enabled: false` (reduced motion) it renders the first word complete
 * and never animates — the statement still reads correctly.
 */
export function useTypewriter(
  words,
  {
    enabled = true,
    typeMs = [48, 104],
    deleteMs = [22, 42],
    holdMs = 2200,
    postDeleteMs = 420,
    startDelayMs = 900,
  } = {},
) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState(enabled ? '' : (words[0] ?? ''))
  const [phase, setPhase] = useState(enabled ? 'waiting' : 'done')
  const [wake, setWake] = useState(0)
  const timer = useRef(null)

  /* Kick off after the statement's own entrance has landed. */
  useEffect(() => {
    if (!enabled) return undefined
    const t = setTimeout(() => setPhase('typing'), startDelayMs)
    return () => clearTimeout(t)
  }, [enabled, startDelayMs])

  /* Pause entirely while the tab is backgrounded. */
  useEffect(() => {
    const onVisibility = () => setWake((w) => w + 1)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    if (!enabled || phase === 'waiting' || phase === 'done') return undefined
    if (typeof document !== 'undefined' && document.hidden) return undefined

    const word = words[index] ?? ''
    const clear = () => clearTimeout(timer.current)

    if (phase === 'typing') {
      if (text.length < word.length) {
        timer.current = setTimeout(() => setText(word.slice(0, text.length + 1)), rand(typeMs))
      } else {
        timer.current = setTimeout(() => setPhase('holding'), holdMs)
      }
    } else if (phase === 'holding') {
      setPhase('deleting')
    } else if (phase === 'deleting') {
      if (text.length > 0) {
        timer.current = setTimeout(() => setText(word.slice(0, text.length - 1)), rand(deleteMs))
      } else {
        timer.current = setTimeout(() => {
          setIndex((i) => (i + 1) % words.length)
          setPhase('typing')
        }, postDeleteMs)
      }
    }

    return clear
  }, [text, phase, index, enabled, wake, words, typeMs, deleteMs, holdMs, postDeleteMs])

  return {
    text,
    index,
    /* The caret holds solid while characters are moving and blinks at rest —
       the same behaviour as a real terminal cursor. */
    isMoving: phase === 'typing' || phase === 'deleting',
    isComplete: phase === 'holding' || phase === 'done',
  }
}
