import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { useExperience } from '../../context/ExperienceContext'

/**
 * The single light source of the site. A soft volumetric wash that follows the
 * pointer with heavy damping — it gives every section the same lighting
 * direction, which is what makes flat panels read as material.
 */
export function Atmosphere() {
  const ref = useRef(null)
  const { reducedMotion, hasHover, quality } = useExperience()

  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion || !hasHover || quality.parallax === 0) return undefined

    const target = { x: 50, y: 38 }
    const current = { x: 50, y: 38 }

    const onMove = (e) => {
      target.x = (e.clientX / window.innerWidth) * 100
      target.y = (e.clientY / window.innerHeight) * 100
    }

    const tick = () => {
      current.x += (target.x - current.x) * 0.028
      current.y += (target.y - current.y) * 0.028
      el.style.setProperty('--atmos-x', `${current.x.toFixed(2)}%`)
      el.style.setProperty('--atmos-y', `${current.y.toFixed(2)}%`)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    gsap.ticker.add(tick)
    return () => {
      window.removeEventListener('pointermove', onMove)
      gsap.ticker.remove(tick)
    }
  }, [reducedMotion, hasHover, quality.parallax])

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Key light */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120vmax 90vmax at var(--atmos-x, 50%) var(--atmos-y, 38%), rgba(198,168,124,0.075) 0%, rgba(198,168,124,0.028) 26%, rgba(5,5,7,0) 62%)',
        }}
      />
      {/* Cool fill from below — keeps the blacks from going flat */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(90vmax 70vmax at 18% 108%, rgba(143,169,196,0.06) 0%, rgba(5,5,7,0) 58%)',
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 100% 88% at 50% 46%, rgba(5,5,7,0) 42%, rgba(5,5,7,0.72) 100%)',
        }}
      />
    </div>
  )
}
