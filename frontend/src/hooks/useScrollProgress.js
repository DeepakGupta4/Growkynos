import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../lib/gsap'

/**
 * Document-level scroll progress (0 → 1), throttled to the GSAP ticker.
 * Used by the nav rail and the section indicator.
 */
export function useDocumentProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => setProgress(self.progress),
    })
    return () => st.kill()
  }, [])

  return progress
}

/**
 * Progress of a single element through the viewport, without React re-renders.
 * `onProgress` is called on the scroll tick — mutate refs/styles inside it.
 */
export function useElementProgress(onProgress, { start = 'top bottom', end = 'bottom top' } = {}) {
  const ref = useRef(null)
  const cb = useRef(onProgress)
  cb.current = onProgress

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const st = ScrollTrigger.create({
      trigger: el,
      start,
      end,
      onUpdate: (self) => cb.current?.(self.progress, self),
    })
    return () => st.kill()
  }, [start, end])

  return ref
}

/**
 * Reports which named section currently owns the viewport centre.
 * Drives the nav's active state and the chapter readout.
 */
export function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0] ?? null)
  const key = ids.join('|')

  useEffect(() => {
    const triggers = ids
      .map((id) => {
        const el = document.getElementById(id)
        if (!el) return null
        return ScrollTrigger.create({
          trigger: el,
          start: 'top center',
          end: 'bottom center',
          onToggle: (self) => {
            if (self.isActive) setActive(id)
          },
        })
      })
      .filter(Boolean)

    ScrollTrigger.refresh()
    return () => triggers.forEach((t) => t.kill())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return active
}

/**
 * Smoothed, normalised pointer position (-1 → 1 on both axes).
 * Shared by the hero field, showcase parallax and the atmosphere layer.
 */
export function usePointerField({ smoothing = 0.86, enabled = true } = {}) {
  const value = useRef({ x: 0, y: 0, rawX: 0, rawY: 0 })

  useEffect(() => {
    if (!enabled) return undefined

    const onMove = (e) => {
      value.current.rawX = (e.clientX / window.innerWidth) * 2 - 1
      value.current.rawY = (e.clientY / window.innerHeight) * 2 - 1
    }

    const tick = () => {
      const v = value.current
      v.x += (v.rawX - v.x) * (1 - smoothing)
      v.y += (v.rawY - v.y) * (1 - smoothing)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    gsap.ticker.add(tick)

    return () => {
      window.removeEventListener('pointermove', onMove)
      gsap.ticker.remove(tick)
    }
  }, [smoothing, enabled])

  return value
}
