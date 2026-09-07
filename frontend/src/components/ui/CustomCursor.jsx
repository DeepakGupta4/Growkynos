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
/*
 * The resting dot was 8px of pure white in difference blend — bright enough to
 * read as another floating object on a dark page rather than a pointer. It is
 * now smaller and dimmer at rest, and only grows where there is something to
 * act on. A cursor should support the interaction, not join the composition.
 */
/*
 * `view` and `drag` used to be a solid 68px disc of brass. At that size a
 * filled shape stops reading as a cursor and becomes a paint blob sitting on
 * top of the thing you are trying to look at — and it covered the card it was
 * meant to be labelling. They are now a thin brass ring over near-black glass:
 * the label is legible, the artwork underneath still shows through, and the
 * shape reads as a lens rather than a sticker.
 */
const MODES = {
  default: { size: 5, ring: 26, mix: 'difference', alpha: 0.62, fill: null },
  link: { size: 6, ring: 40, mix: 'difference', alpha: 0.85, fill: null },
  view: { size: 76, ring: 0, mix: 'normal', alpha: 1, fill: 'glass' },
  drag: { size: 62, ring: 0, mix: 'normal', alpha: 1, fill: 'glass' },
  text: { size: 3, ring: 0, mix: 'difference', alpha: 0.7, fill: null },
  hidden: { size: 0, ring: 0, mix: 'difference', alpha: 0, fill: null },
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

    /*
     * Two speeds, and the gap between them is the whole effect: the dot tracks
     * almost instantly so aiming never feels laggy, while the ring trails on a
     * softer curve and springs to rest. A single-speed cursor reads as a
     * graphic stuck to the pointer; the offset between the two reads as weight.
     */
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power3.out' })
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power3.out' })
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.62, ease: 'elastic.out(1, 0.75)' })
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.62, ease: 'elastic.out(1, 0.75)' })
    /* Velocity stretches the ring along its travel — inertia you can see. */
    const ringRot = gsap.quickTo(ring, 'rotate', { duration: 0.5, ease: 'power3.out' })
    const ringScaleX = gsap.quickTo(ring, 'scaleX', { duration: 0.45, ease: 'power3.out' })
    const ringScaleY = gsap.quickTo(ring, 'scaleY', { duration: 0.45, ease: 'power3.out' })
    let lastX = 0
    let lastY = 0

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

      /*
       * Magnetic snap: near an interactive target the ring leaves the pointer
       * and settles on the element's centre. It is what makes a cursor feel
       * like it is co-operating with the interface rather than sliding over it.
       */
      const target = e.target instanceof Element ? e.target.closest('[data-cursor-magnetic]') : null
      if (target) {
        const r = target.getBoundingClientRect()
        ringX(r.left + r.width / 2)
        ringY(r.top + r.height / 2)
        ringRot(0)
        ringScaleX(1)
        ringScaleY(1)
      } else {
        ringX(e.clientX)
        ringY(e.clientY)

        const dx = e.clientX - lastX
        const dy = e.clientY - lastY
        const speed = Math.min(Math.hypot(dx, dy), 90)
        if (speed > 2) {
          ringRot((Math.atan2(dy, dx) * 180) / Math.PI)
          ringScaleX(1 + speed / 190)
          ringScaleY(1 - speed / 440)
        } else {
          ringScaleX(1)
          ringScaleY(1)
        }
      }

      lastX = e.clientX
      lastY = e.clientY
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
    const glass = cfg.fill === 'glass'
    gsap.to(dotRef.current, {
      width: cfg.size,
      height: cfg.size,
      opacity: cfg.alpha,
      backgroundColor: glass ? 'rgba(8,8,11,0.72)' : '#ffffff',
      borderColor: glass ? 'rgba(198,168,124,0.85)' : 'rgba(198,168,124,0)',
      borderWidth: glass ? 1 : 0,
      backdropFilter: glass ? 'blur(3px)' : 'blur(0px)',
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
        className="absolute left-0 top-0 rounded-full border border-bone/30 opacity-0"
        style={{ width: 0, height: 0, visibility: 'hidden' }}
      />
      <div
        ref={dotRef}
        className="absolute left-0 top-0 grid place-items-center rounded-full border border-transparent bg-white"
        style={{ width: 8, height: 8, visibility: 'hidden', mixBlendMode: 'difference' }}
      >
        <span
          ref={labelRef}
          className="select-none whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.22em] text-brass opacity-0"
        >
          {label}
        </span>
      </div>
    </div>
  )
}
