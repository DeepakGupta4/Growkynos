import { useEffect, useRef } from 'react'
import { gsap } from '../../lib/gsap'
import { seeded } from '../../lib/utils'
import { useExperience } from '../../context/ExperienceContext'

/**
 * HERO ENVIRONMENT
 * ----------------
 * A canvas depth-field: particles distributed across four depth planes,
 * drifting slowly on their own axis and parallaxing against the pointer.
 * Near particles are larger, brighter and move further; far ones are almost
 * static. That difference is what produces the sense of volume — not blur.
 *
 * Canvas rather than WebGL here because the scene is 2.5D and this costs a
 * fraction of the memory, which leaves the GPU budget for the showcase worlds.
 */
export function HeroField({ scrollProgress }) {
  const canvasRef = useRef(null)
  const { quality, reducedMotion, hasHover } = useExperience()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || quality.particles === 0) return undefined

    const ctx = canvas.getContext('2d', { alpha: true })
    const rand = seeded(20240719)
    let w = 0
    let h = 0
    let dpr = 1

    const COUNT = quality.particles
    const particles = new Array(COUNT).fill(0).map(() => {
      const z = rand()
      return {
        x: rand(),
        y: rand(),
        z,
        // Far particles barely move; near ones drift with real speed.
        vx: (rand() - 0.5) * 0.00016 * (0.25 + z),
        vy: -(0.00006 + rand() * 0.00022) * (0.25 + z),
        r: 0.35 + z * 1.5,
        a: 0.1 + z * 0.5,
        hue: rand() > 0.86 ? 'brass' : 'bone',
        tw: rand() * Math.PI * 2,
        tws: 0.4 + rand() * 1.2,
        /*
         * Displacement carried by the distortion field, in pixels, plus the
         * velocity that carries it back. Kept per-particle rather than derived
         * each frame so the field has memory: push through it quickly and the
         * wake stays open for a moment behind the pointer.
         */
        dx: 0,
        dy: 0,
        dvx: 0,
        dvy: 0,
      }
    })

    /*
     * Was 9. The floating squares, circles and triangles were the loudest of
     * the hero's decorative layers and competed with the statement for
     * attention — three is enough to give the field scale without becoming a
     * second thing to look at.
     */
    const fragments = new Array(quality.label === 'low' ? 2 : 3).fill(0).map(() => ({
      x: rand(),
      y: rand(),
      z: 0.4 + rand() * 0.6,
      size: 14 + rand() * 46,
      rot: rand() * Math.PI,
      vr: (rand() - 0.5) * 0.0022,
      vy: -(0.00004 + rand() * 0.00009),
      kind: Math.floor(rand() * 3),
    }))

    const pointer = { tx: 0, ty: 0, x: 0, y: 0 }
    /* Pointer in canvas pixels — the distortion field works in real distance. */
    const cursor = { x: -9999, y: -9999, active: false }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, quality.dpr[1])
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const onPointer = (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1

      const rect = canvas.getBoundingClientRect()
      cursor.x = e.clientX - rect.left
      cursor.y = e.clientY - rect.top
      cursor.active = true
    }

    /*
     * Field radius and strength. Radius is in canvas pixels and squared once
     * here so the per-particle test is a comparison rather than a sqrt — that
     * check runs COUNT times a frame (up to 2600), and it is the only part of
     * this loop that has to be cheap.
     */
    const FIELD_R = quality.label === 'low' ? 130 : 210
    const FIELD_R2 = FIELD_R * FIELD_R
    const FIELD_STRENGTH = quality.label === 'low' ? 0.9 : 1.7

    let t = 0
    const render = () => {
      t += 0.016
      pointer.x += (pointer.tx - pointer.x) * 0.045
      pointer.y += (pointer.ty - pointer.y) * 0.045

      const sp = scrollProgress?.current ?? 0
      ctx.clearRect(0, 0, w, h)

      // Depth planes drift apart as the visitor scrolls — the field opens up.
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        if (p.y < -0.05) p.y = 1.05
        if (p.x < -0.05) p.x = 1.05
        if (p.x > 1.05) p.x = -0.05

        const depth = 0.3 + p.z
        const px = (p.x - 0.5 + pointer.x * 0.05 * depth) * w + w * 0.5
        const py = (p.y - 0.5 + pointer.y * 0.035 * depth) * h + h * 0.5 - sp * 320 * depth

        if (py < -20 || py > h + 20) continue

        /*
         * DISTORTION FIELD
         * ----------------
         * Repulsion falling off with distance, integrated as velocity and
         * returned by a spring. Three details do the work:
         *
         *  - the force is scaled by DEPTH, so near particles are shoved hard
         *    and far ones barely stir. A uniform push looks like a flat mask
         *    sliding over the image; a depth-scaled one looks like volume.
         *  - it is stored as velocity, not applied directly, so the field has
         *    momentum and leaves a wake behind a fast pointer.
         *  - the spring is under-damped, so particles overshoot slightly on the
         *    way home instead of sliding back like a menu closing.
         */
        let glow = 0
        if (cursor.active) {
          const ddx = px + p.dx - cursor.x
          const ddy = py + p.dy - cursor.y
          const dist2 = ddx * ddx + ddy * ddy
          if (dist2 < FIELD_R2) {
            const dist = Math.sqrt(dist2) || 1
            const falloff = 1 - dist / FIELD_R
            const force = falloff * falloff * FIELD_STRENGTH * depth
            p.dvx += (ddx / dist) * force
            p.dvy += (ddy / dist) * force
            glow = falloff * falloff
          }
        }
        // Spring home + damping.
        p.dvx += -p.dx * 0.045
        p.dvy += -p.dy * 0.045
        p.dvx *= 0.86
        p.dvy *= 0.86
        p.dx += p.dvx
        p.dy += p.dvy

        const twinkle = 0.72 + Math.sin(t * p.tws + p.tw) * 0.28
        // Proximity lifts brightness and size — the field reads as lit, not
        // merely displaced.
        const alpha = Math.min(1, p.a * twinkle * (1 - sp * 0.75) * (1 + glow * 2.6))
        if (alpha <= 0.004) continue

        ctx.beginPath()
        ctx.arc(px + p.dx, py + p.dy, p.r * (1 + sp * 0.4) * (1 + glow * 1.5), 0, Math.PI * 2)
        ctx.fillStyle =
          p.hue === 'brass'
            ? `rgba(198,168,124,${alpha.toFixed(3)})`
            : `rgba(230,230,234,${(alpha * 0.72).toFixed(3)})`
        ctx.fill()
      }

      // Geometric fragments
      ctx.lineWidth = 1
      for (let i = 0; i < fragments.length; i++) {
        const g = fragments[i]
        g.rot += g.vr
        g.y += g.vy
        if (g.y < -0.15) g.y = 1.15

        const depth = 0.3 + g.z
        const gx = (g.x - 0.5 + pointer.x * 0.075 * depth) * w + w * 0.5
        const gy = (g.y - 0.5 + pointer.y * 0.05 * depth) * h + h * 0.5 - sp * 460 * depth
        const s = g.size * (0.6 + g.z * 0.7)
        const alpha = (0.1 + g.z * 0.13) * (1 - sp * 0.9)
        if (alpha <= 0.004 || gy < -120 || gy > h + 120) continue

        ctx.save()
        ctx.translate(gx, gy)
        ctx.rotate(g.rot + sp * 0.6)
        ctx.strokeStyle = `rgba(198,168,124,${alpha.toFixed(3)})`
        if (g.kind === 0) {
          ctx.strokeRect(-s / 2, -s / 2, s, s)
        } else if (g.kind === 1) {
          ctx.beginPath()
          ctx.arc(0, 0, s / 2, 0, Math.PI * 2)
          ctx.stroke()
        } else {
          ctx.beginPath()
          ctx.moveTo(0, -s / 2)
          ctx.lineTo(s / 2, s / 2)
          ctx.lineTo(-s / 2, s / 2)
          ctx.closePath()
          ctx.stroke()
        }
        ctx.restore()
      }
    }

    resize()
    window.addEventListener('resize', resize)
    if (hasHover) window.addEventListener('pointermove', onPointer, { passive: true })

    if (reducedMotion) {
      render()
    } else {
      gsap.ticker.add(render)
    }

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      gsap.ticker.remove(render)
    }
  }, [quality, reducedMotion, hasHover, scrollProgress])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}
