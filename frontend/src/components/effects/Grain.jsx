import { useEffect, useRef } from 'react'
import { useExperience } from '../../context/ExperienceContext'

/**
 * Film grain. Rendered once into a small tile and repeated via CSS, then
 * stepped through a handful of pre-rendered frames — far cheaper than
 * regenerating noise every frame, and it reads as real emulsion rather than
 * a static overlay.
 */
export function Grain({ opacity = 0.045 }) {
  const ref = useRef(null)
  const { reducedMotion, quality } = useExperience()

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    const SIZE = 128
    const FRAMES = reducedMotion ? 1 : 5
    const urls = []

    for (let f = 0; f < FRAMES; f++) {
      const canvas = document.createElement('canvas')
      canvas.width = SIZE
      canvas.height = SIZE
      const ctx = canvas.getContext('2d')
      const img = ctx.createImageData(SIZE, SIZE)
      const d = img.data
      for (let i = 0; i < d.length; i += 4) {
        const v = 128 + (Math.random() - 0.5) * 255
        d[i] = v
        d[i + 1] = v
        d[i + 2] = v
        d[i + 3] = 255
      }
      ctx.putImageData(img, 0, 0)
      urls.push(canvas.toDataURL('image/png'))
    }

    el.style.backgroundImage = `url(${urls[0]})`

    if (FRAMES === 1 || quality.label === 'low') return undefined

    let i = 0
    let raf
    let last = 0
    const step = (t) => {
      // ~12fps — any faster and grain starts to shimmer instead of breathe.
      if (t - last > 83) {
        i = (i + 1) % FRAMES
        el.style.backgroundImage = `url(${urls[i]})`
        last = t
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [reducedMotion, quality.label])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-grain mix-blend-overlay"
      style={{ opacity, backgroundRepeat: 'repeat', backgroundSize: '128px 128px' }}
    />
  )
}
