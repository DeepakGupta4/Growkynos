import { useEffect, useRef, useState } from 'react'

/**
 * IntersectionObserver wrapper used to gate expensive work: 3D canvases,
 * video playback, canvas render loops and heavy timelines.
 */
export function useInView({ rootMargin = '200px', threshold = 0, once = false } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return undefined
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting && once) io.disconnect()
      },
      { rootMargin, threshold },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin, threshold, once])

  return [ref, inView]
}
