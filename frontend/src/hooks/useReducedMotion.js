import { useEffect } from 'react'
import { useMediaQuery } from './useMediaQuery'

/**
 * Single source of truth for motion preference.
 * Also stamps <html data-reduced-motion> so CSS can respond without JS props.
 */
export function useReducedMotion() {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reduced)
  }, [reduced])

  return reduced
}
