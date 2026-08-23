import { useEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'
import { useExperience } from '../../context/ExperienceContext'

/**
 * CURSOR
 * ------
 * Declarative: any element can opt in with
 *   data-cursor="view | drag | link | text | hidden"
 *   data-cursor-label="VIEW"
 * A single delegated listener resolves the nearest annotated ancestor, so
 * there is no per-component wiring and nothing to clean up.
 *
 * Disabled entirely on touch and under reduced motion — the native cursor is
 * never removed unless a real replacement is running.
 */
const MODES = {
  default: { size: 8, ring: 0, mix: 'difference' },
  link: { size: 8, ring: 34, mix: 'difference' },
  view: { size: 74, ring: 0, mix: 'normal' },
  drag: { size: 56, ring: 0, mix: 'normal' },
  text: { size: 3, ring: 0, mix: 'difference' },
  hidden: { size: 0, ring: 0, mix: 'difference' },
}

export function CustomCursor() {
  const { hasHover, reducedMotion } = useExperience()
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const labelRef = useRef(null)
  const [mode, setMode] = useState('default')
  const [label, setLabel] = useState('')
  const enabled = hasHover && !reducedMotion

  /* Toggle the global cursor:none rule only while we're actually rendering. */
  useEffect(() => {
    document.documentElement.dataset.cursor = enabled ? 'custom' : 'native'
    return () => {
      document.documentElement.dataset.cursor = 'native'
    }
  }, [enabled])

  /* Pointer tracking — dot is immediate, ring lags for weight. */
  useEffect(() => {
    if (!enabled) return undefined
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return undefined

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 })

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power3.out' })
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power3.out' })
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3.out' })
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3.out' })

    let visible = false
    const show = () => {
      if (visible) return
      visible = true
      gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 })
    }

    const onMove = (e) => {
      show()
      dotX(e.clientX)
      dotY(e.clientY)
      ringX(e.clientX)
      ringY(e.clientY)
    }

    const onLeave = () => {
      visible = false
      gsap.to([dot, ring], { autoAlpha: 0, duration: 0.2 })
    }

    const onDown = () => gsap.to(dot, { scale: 0.62, duration: 0.18, ease: 'power2.out' })
    const onUp = () => gsap.to(dot, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.6)' })

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

  /* Mode resolution via delegation. */
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

  /* Animate between modes with weight rather than a snap. */
  useEffect(() => {
    if (!enabled) return
    const cfg = MODES[mode] ?? MODES.default
    gsap.to(dotRef.current, {
      width: cfg.size,
      height: cfg.size,
      backgroundColor: cfg.mix === 'difference' ? '#ffffff' : 'rgba(198,168,124,0.94)',
      mixBlendMode: cfg.mix,
      duration: 0.5,
      ease: 'expo.out',
    })
    gsap.to(ringRef.current, {
      width: cfg.ring,
      height: cfg.ring,
      opacity: cfg.ring ? 1 : 0,
      duration: 0.5,
      ease: 'expo.out',
    })
    gsap.to(labelRef.current, {
      autoAlpha: label ? 1 : 0,
      y: label ? 0 : 6,
      duration: 0.34,
      ease: 'power3.out',
    })
  }, [mode, label, enabled])

  if (!enabled) return null

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-cursor">
      <div
        ref={ringRef}
        className="absolute left-0 top-0 rounded-full border border-bone/40 opacity-0"
        style={{ width: 0, height: 0, visibility: 'hidden' }}
      />
      <div
        ref={dotRef}
        className="absolute left-0 top-0 grid place-items-center rounded-full bg-white"
        style={{ width: 8, height: 8, visibility: 'hidden', mixBlendMode: 'difference' }}
      >
        <span
          ref={labelRef}
          className="select-none whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.2em] text-void opacity-0"
        >
          {label}
        </span>
      </div>
    </div>
  )
}
