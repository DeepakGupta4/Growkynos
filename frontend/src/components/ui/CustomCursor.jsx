import { useEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { useExperience } from '../../context/ExperienceContext'

/**
 * CURSOR
 * ------
 * Declarative: any element opts in with
 *   data-cursor="view | drag | link | text | hidden"
 *   data-cursor-label="VIEW"
 * One delegated listener resolves the nearest annotated ancestor, so there is
 * no per-component wiring and nothing to clean up.
 *
 * DESIGN — deliberately ONE element.
 * The previous version stacked a dot, a trailing ring, elastic easing, rotation
 * and a velocity-based stretch. Each was fine alone; together they wobbled, and
 * the dot-inside-ring read as a rifle sight rather than a pointer. What makes a
 * cursor feel expensive is restraint: a single shape, one smooth follow curve,
 * and a size that answers "can I click this?".
 *
 * `mix-blend-mode: difference` does the heavy lifting — the cursor inverts
 * whatever is under it, so it stays legible over black ground, brass type and
 * product screenshots without ever needing a colour of its own.
 *
 * Disabled on touch and under reduced motion; the native cursor is never
 * removed unless a real replacement is running.
 */
/*
 * Small states are a filled dot; large states are a RING.
 *
 * A solid disc at 46px sat on top of the button label you were about to click
 * — "BEGIN A PROJECT" read as "BEGIN…OJECT" — and at 86px it covered the card
 * it was supposed to be pointing at. Once the shape is big enough to carry a
 * word, it has to be an outline so the thing underneath survives.
 *
 * `link` also came down a lot: growing to nearly the height of a button is not
 * feedback, it is occlusion. A small, decisive step reads as "clickable".
 */
const MODES = {
  default: { size: 12, ring: false, label: false },
  link: { size: 22, ring: false, label: false },
  view: { size: 84, ring: true, label: true },
  drag: { size: 68, ring: true, label: true },
  text: { size: 4, ring: false, label: false },
  hidden: { size: 0, ring: false, label: false },
}

export function CustomCursor() {
  const { hasHover, reducedMotion } = useExperience()
  const ref = useRef(null)
  const labelRef = useRef(null)
  const [mode, setMode] = useState('default')
  const [label, setLabel] = useState('')
  const enabled = hasHover && !reducedMotion

  /* Only remove the native cursor while a replacement is actually running. */
  useEffect(() => {
    document.documentElement.dataset.cursor = enabled ? 'custom' : 'native'
    return () => {
      document.documentElement.dataset.cursor = 'native'
    }
  }, [enabled])

  /* ── Follow ── */
  useEffect(() => {
    if (!enabled) return undefined
    const el = ref.current
    if (!el) return undefined

    gsap.set(el, { xPercent: -50, yPercent: -50 })

    /*
     * A single curve, ~0.22s. Fast enough that aiming never feels detached,
     * slow enough to leave a trace of lag behind quick movement. No spring:
     * an overshoot on a cursor reads as the page being unsure of itself.
     */
    const x = gsap.quickTo(el, 'x', { duration: 0.22, ease: 'power3.out' })
    const y = gsap.quickTo(el, 'y', { duration: 0.22, ease: 'power3.out' })

    let visible = false
    const onMove = (e) => {
      if (!visible) {
        visible = true
        gsap.to(el, { autoAlpha: 1, duration: 0.3 })
      }
      x(e.clientX)
      y(e.clientY)
    }

    const onLeave = () => {
      visible = false
      gsap.to(el, { autoAlpha: 0, duration: 0.2 })
    }

    // A small, quick press. The only secondary motion the cursor has.
    const onDown = () => gsap.to(el, { scale: 0.86, duration: 0.16, ease: 'power2.out' })
    const onUp = () => gsap.to(el, { scale: 1, duration: 0.32, ease: 'power2.out' })

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)

    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [enabled])

  /* ── Mode resolution ── */
  useEffect(() => {
    if (!enabled) return undefined

    const resolve = (target) => {
      if (!(target instanceof Element)) return { m: 'default', l: '' }
      const annotated = target.closest('[data-cursor]')
      if (annotated) {
        return {
          m: annotated.getAttribute('data-cursor') || 'default',
          l: annotated.getAttribute('data-cursor-label') || '',
        }
      }
      if (target.closest('a, button, [role="button"], label, summary')) return { m: 'link', l: '' }
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return { m: 'text', l: '' }
      return { m: 'default', l: '' }
    }

    const onOver = (e) => {
      const { m, l } = resolve(e.target)
      setMode((prev) => (prev === m ? prev : m))
      setLabel((prev) => (prev === l ? prev : l))
    }

    document.addEventListener('pointerover', onOver, { passive: true })
    return () => document.removeEventListener('pointerover', onOver)
  }, [enabled])

  /* ── Size ── */
  useEffect(() => {
    if (!enabled) return
    const cfg = MODES[mode] ?? MODES.default
    gsap.to(ref.current, {
      width: cfg.size,
      height: cfg.size,
      backgroundColor: cfg.ring ? 'rgba(255,255,255,0)' : '#ffffff',
      borderWidth: cfg.ring ? 1.5 : 0,
      duration: 0.42,
      ease: 'expo.out',
    })
    gsap.to(labelRef.current, {
      autoAlpha: cfg.label && label ? 1 : 0,
      duration: 0.25,
      ease: 'power2.out',
    })
  }, [mode, label, enabled])

  if (!enabled) return null

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-cursor">
      <div
        ref={ref}
        className="absolute left-0 top-0 grid place-items-center rounded-full border-white bg-white"
        style={{
          width: 14,
          height: 14,
          visibility: 'hidden',
          // Inverts whatever is beneath, so one colour works everywhere.
          mixBlendMode: 'difference',
        }}
      >
        <span
          ref={labelRef}
          className="select-none whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] text-white opacity-0"
        >
          {label}
        </span>
      </div>
    </div>
  )
}
