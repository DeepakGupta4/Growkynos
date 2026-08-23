import { useEffect, useRef } from 'react'
import { gsap } from '../lib/gsap'
import { useHasHover } from './useMediaQuery'
import { useReducedMotion } from './useReducedMotion'

/**
 * Magnetic hover: the element leans toward the pointer with spring settling.
 * Returns a ref for the hit-area and an optional ref for an inner element that
 * travels further (label leads, container follows) — this parallax is what
 * makes the interaction feel physical rather than a plain translate.
 */
export function useMagnetic({ strength = 0.34, innerStrength = 0.6, radius = 1.35 } = {}) {
  const ref = useRef(null)
  const innerRef = useRef(null)
  const hasHover = useHasHover()
  const reduced = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || !hasHover || reduced) return undefined

    const setX = gsap.quickTo(el, 'x', { duration: 0.7, ease: 'elastic.out(1, 0.55)' })
    const setY = gsap.quickTo(el, 'y', { duration: 0.7, ease: 'elastic.out(1, 0.55)' })
    const inner = innerRef.current
    const setIX = inner ? gsap.quickTo(inner, 'x', { duration: 0.85, ease: 'elastic.out(1, 0.5)' }) : null
    const setIY = inner ? gsap.quickTo(inner, 'y', { duration: 0.85, ease: 'elastic.out(1, 0.5)' }) : null

    let rect = el.getBoundingClientRect()
    const measure = () => {
      rect = el.getBoundingClientRect()
    }

    const onMove = (e) => {
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const reach = (Math.max(rect.width, rect.height) / 2) * radius
      const dist = Math.hypot(dx, dy)
      const falloff = Math.max(0, 1 - dist / (reach * 2))

      setX(dx * strength * falloff)
      setY(dy * strength * falloff)
      if (setIX) setIX(dx * strength * innerStrength * falloff)
      if (setIY) setIY(dy * strength * innerStrength * falloff)
    }

    const onEnter = () => {
      measure()
      window.addEventListener('pointermove', onMove)
    }

    const onLeave = () => {
      window.removeEventListener('pointermove', onMove)
      setX(0)
      setY(0)
      if (setIX) setIX(0)
      if (setIY) setIY(0)
    }

    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })

    return () => {
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
      gsap.set([el, inner].filter(Boolean), { x: 0, y: 0 })
    }
  }, [hasHover, reduced, strength, innerStrength, radius])

  return { ref, innerRef }
}
