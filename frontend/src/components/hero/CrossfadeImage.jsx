import { useEffect, useRef, useState } from 'react'
import { gsap } from '../../lib/gsap'

/**
 * Two-layer crossfade.
 *
 * The hero cycles through ten slides. Rendering every slide's image and
 * toggling opacity would put twenty images in the DOM and pull all of them
 * over the wire for a single hero — so instead this keeps exactly two <img>
 * layers and ping-pongs between them: the incoming source is decoded off-screen
 * first, and only once it is ready does the fade run.
 *
 * That ordering matters. Fading to an undecoded image shows a blank frame
 * mid-transition, which reads as a flicker rather than a dissolve.
 */
export function CrossfadeImage({ src, alt = '', className, duration = 0.62, immediate = false }) {
  const [layers, setLayers] = useState(() => [src, null])
  const [front, setFront] = useState(0)
  const refs = useRef([])
  const firstRun = useRef(true)

  useEffect(() => {
    if (layers[front] === src) return undefined

    if (firstRun.current || immediate) {
      firstRun.current = false
      setLayers((prev) => {
        const next = [...prev]
        next[front] = src
        return next
      })
      return undefined
    }

    const back = front === 0 ? 1 : 0
    let cancelled = false

    // Decode before showing, so the fade never crosses through an empty frame.
    const pre = new Image()
    pre.src = src
    const reveal = () => {
      if (cancelled) return
      setLayers((prev) => {
        const next = [...prev]
        next[back] = src
        return next
      })
      requestAnimationFrame(() => {
        if (cancelled) return
        const frontEl = refs.current[front]
        const backEl = refs.current[back]
        if (backEl) gsap.to(backEl, { autoAlpha: 1, duration, ease: 'power2.inOut' })
        if (frontEl) gsap.to(frontEl, { autoAlpha: 0, duration, ease: 'power2.inOut' })
        setFront(back)
      })
    }

    if (pre.decode) pre.decode().then(reveal).catch(reveal)
    else pre.onload = reveal

    return () => {
      cancelled = true
    }
  }, [src, front, layers, duration, immediate])

  return (
    <>
      {layers.map((layerSrc, i) =>
        layerSrc ? (
          <img
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            src={layerSrc}
            alt={i === front ? alt : ''}
            aria-hidden={i === front ? undefined : true}
            decoding="async"
            draggable="false"
            className={className}
            style={{ opacity: i === front ? 1 : 0 }}
          />
        ) : null,
      )}
    </>
  )
}
