import { useEffect, useState } from 'react'

/**
 * Subscribe to a media query. Returns `false` during the first paint on the
 * server / before hydration so layout never flashes the wrong branch.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export const useIsMobile = () => useMediaQuery('(max-width: 767px)')
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 1179px)')
export const useIsDesktop = () => useMediaQuery('(min-width: 1180px)')
export const useHasHover = () => useMediaQuery('(hover: hover) and (pointer: fine)')
