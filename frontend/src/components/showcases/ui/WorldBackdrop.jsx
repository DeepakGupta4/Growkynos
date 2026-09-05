import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, SCRUB } from '../../../lib/gsap'
import { useExperience } from '../../../context/ExperienceContext'
import { useInView } from '../../../hooks/useInView'

/**
 * WORLD BACKDROP
 * --------------
 * Renders a service's artwork as the environment its showcase lives inside —
 * not as a decorative <img>, but as a depth plate: scaled past the frame,
 * parallaxed against scroll and pointer, tinted to the world's accent and
 * masked so it falls off at the edges rather than ending in a hard rectangle.
 *
 * GRACEFUL ABSENCE IS THE POINT
 * The artwork is optional. Until a file actually loads, this renders nothing
 * at all — no broken-image icon, no reserved space, no layout shift — so a
 * world without art looks exactly as it did before. Drop the file in and it
 * appears; delete it and the world reverts. No code change either way.
 *
 * EXTENSION PROBING
 * The brief specifies .png but allows other formats, so rather than hard-code
 * one we probe a candidate list and use the first that decodes. AVIF/WebP win
 * when present, which is also the performance-correct order.
 *
 * `svg` sits LAST deliberately: the generated stand-in artwork ships as SVG, so
 * a real raster you drop in later is probed first and silently wins — no need
 * to delete the placeholder.
 */
const EXT_CANDIDATES = ['avif', 'webp', 'png', 'jpg', 'jpeg', 'svg']

/** Resolve `base` (extension-less) to the first extension that actually loads. */
function useResolvedImage(base) {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    if (!base) {
      setSrc(null)
      return undefined
    }

    let cancelled = false
    let i = 0

    const tryNext = () => {
      if (cancelled) return
      if (i >= EXT_CANDIDATES.length) {
        // Nothing found. This is an expected state, not an error.
        setSrc(null)
        return
      }
      const candidate = `${base}.${EXT_CANDIDATES[i++]}`
      const img = new Image()
      img.onload = () => {
        if (!cancelled) setSrc(candidate)
      }
      img.onerror = tryNext
      img.src = candidate
    }

    tryNext()
    return () => {
      cancelled = true
    }
  }, [base])

  return src
}

export function WorldBackdrop({ service, intensity = 1 }) {
  const media = service.media
  const base = media?.image ?? null
  const src = useResolvedImage(base)
  const { reducedMotion, quality, isMobile } = useExperience()
  const [inViewRef, inView] = useInView({ rootMargin: '10%' })

  const wrapRef = useRef(null)
  const plateRef = useRef(null)
  const videoRef = useRef(null)
  const [videoReady, setVideoReady] = useState(false)

  const hasVideo = Boolean(media?.video) && quality.label !== 'low' && !reducedMotion

  /* ── Reveal once resolved. ─────────────────────────────────── */
  useEffect(() => {
    const plate = plateRef.current
    if (!plate || !src) return undefined
    gsap.fromTo(
      plate,
      { autoAlpha: 0, scale: 1.14 },
      { autoAlpha: 1, scale: 1.06, duration: 1.6, ease: 'expo.out' },
    )
    return undefined
  }, [src])

  /* ── Scroll parallax: the environment moves slower than the subject. ── */
  useEffect(() => {
    const wrap = wrapRef.current
    const plate = plateRef.current
    if (!wrap || !plate || !src || reducedMotion) return undefined

    const ctx = gsap.context(() => {
      gsap.fromTo(
        plate,
        { yPercent: -6 * intensity },
        {
          yPercent: 6 * intensity,
          ease: 'none',
          scrollTrigger: {
            trigger: wrap,
            start: 'top bottom',
            end: 'bottom top',
            scrub: SCRUB,
          },
        },
      )
    }, wrap)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [src, reducedMotion, intensity])

  /* ── Pointer parallax — small, and desktop only. ───────────── */
  useEffect(() => {
    const plate = plateRef.current
    if (!plate || !src || reducedMotion || isMobile || quality.parallax === 0) return undefined

    const x = gsap.quickTo(plate, 'x', { duration: 1.4, ease: 'power3.out' })
    const y = gsap.quickTo(plate, 'y', { duration: 1.4, ease: 'power3.out' })

    const onMove = (e) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      x(nx * 22 * intensity * quality.parallax)
      y(ny * 14 * intensity * quality.parallax)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [src, reducedMotion, isMobile, quality.parallax, intensity])

  /* ── Video: only plays while the world is actually on screen. ── */
  useEffect(() => {
    const el = videoRef.current
    if (!el || !hasVideo) return undefined

    if (inView) {
      const p = el.play()
      if (p?.catch) p.catch(() => {})
    } else if (!el.paused) {
      el.pause()
    }

    return () => {
      // Release the decoder on unmount rather than leaving it resident.
      if (!el.paused) el.pause()
    }
  }, [inView, hasVideo])

  // Nothing to show, and nothing rendered. The world is unchanged.
  if (!src) return <span ref={inViewRef} aria-hidden="true" className="hidden" />

  return (
    <div
      ref={(node) => {
        wrapRef.current = node
        inViewRef.current = node
      }}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        ref={plateRef}
        className="absolute inset-[-8%] opacity-0 will-change-transform"
        style={{
          // Falls off at the edges so it reads as environment, not a photo.
          maskImage: 'radial-gradient(ellipse 82% 78% at 50% 46%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 82% 78% at 50% 46%, black 30%, transparent 100%)',
        }}
      >
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          draggable="false"
          className="h-full w-full object-cover"
          style={{ opacity: videoReady ? 0 : 1, transition: 'opacity 0.8s ease' }}
        />

        {hasVideo && (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            poster={media.poster ?? src}
            muted
            loop
            playsInline
            preload="none"
            onCanPlay={() => setVideoReady(true)}
            style={{ opacity: videoReady ? 1 : 0, transition: 'opacity 0.8s ease' }}
          >
            {media.videoWebm && <source src={media.videoWebm} type="video/webm" />}
            <source src={media.video} type="video/mp4" />
          </video>
        )}
      </div>

      {/* Grade the artwork into the world: darken, then tint to the accent. */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(5,5,7,0.62)' }}
      />
      {/*
        Clear the middle. Every showcase puts its live subject — the phone, the
        browser, the editor — dead centre, so the backdrop is pushed down hard
        there and allowed to breathe at the edges. Without this the artwork
        reads as clutter behind the subject rather than as the space around it.
      */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 46% 52% at 50% 46%, rgba(5,5,7,0.82) 0%, rgba(5,5,7,0.5) 58%, rgba(5,5,7,0) 100%)',
        }}
      />
      <div
        className="absolute inset-0 mix-blend-color"
        style={{ backgroundColor: service.accent, opacity: 0.22 }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(70vmax 55vmax at 50% 40%, ${service.accent}1f 0%, rgba(5,5,7,0) 70%)`,
        }}
      />
    </div>
  )
}
