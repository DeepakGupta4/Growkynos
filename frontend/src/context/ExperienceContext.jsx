import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { deviceTier } from '../lib/utils'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useHasHover, useIsMobile, useIsTablet } from '../hooks/useMediaQuery'
import { lockScroll } from '../hooks/useLenis'

const ExperienceContext = createContext(null)

const BOOT_KEY = 'gk:booted'

export function ExperienceProvider({ children }) {
  const reducedMotion = useReducedMotion()
  const hasHover = useHasHover()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  // Returning visitors in the same session skip the boot sequence entirely.
  const [booted, setBooted] = useState(() => {
    if (typeof window === 'undefined') return true
    try {
      return sessionStorage.getItem(BOOT_KEY) === '1'
    } catch {
      return false
    }
  })

  const [tier, setTier] = useState('high')
  const skipRef = useRef(false)

  useEffect(() => {
    setTier(deviceTier())
  }, [])

  useEffect(() => {
    lockScroll(!booted)
    if (booted) {
      try {
        sessionStorage.setItem(BOOT_KEY, '1')
      } catch {
        /* storage blocked — boot simply replays next visit */
      }
    }
  }, [booted])

  const completeBoot = useCallback(() => setBooted(true), [])
  const skipBoot = useCallback(() => {
    skipRef.current = true
    setBooted(true)
  }, [])

  /**
   * Quality budget. Every expensive subsystem reads from here rather than
   * sniffing the device itself, so there is one place to tune performance.
   */
  const quality = useMemo(() => {
    if (reducedMotion) {
      return { particles: 0, use3D: false, blur: false, parallax: 0, dpr: [1, 1.5], label: 'reduced' }
    }
    switch (tier) {
      case 'high':
        return { particles: 2600, use3D: true, blur: true, parallax: 1, dpr: [1, 2], label: 'high' }
      case 'medium':
        return { particles: 1100, use3D: true, blur: true, parallax: 0.6, dpr: [1, 1.6], label: 'medium' }
      default:
        return { particles: 420, use3D: false, blur: false, parallax: 0.3, dpr: [1, 1.25], label: 'low' }
    }
  }, [tier, reducedMotion])

  const value = useMemo(
    () => ({
      booted,
      completeBoot,
      skipBoot,
      wasSkipped: skipRef.current,
      reducedMotion,
      hasHover,
      isMobile,
      isTablet,
      isDesktop: !isMobile && !isTablet,
      tier,
      quality,
    }),
    [booted, completeBoot, skipBoot, reducedMotion, hasHover, isMobile, isTablet, tier, quality],
  )

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>
}

export function useExperience() {
  const ctx = useContext(ExperienceContext)
  if (!ctx) throw new Error('useExperience must be used inside <ExperienceProvider>')
  return ctx
}
