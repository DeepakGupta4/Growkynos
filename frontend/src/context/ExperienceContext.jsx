import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { deviceTier } from '../lib/utils'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useHasHover, useIsMobile, useIsTablet } from '../hooks/useMediaQuery'
import { lockScroll } from '../hooks/useLenis'

const ExperienceContext = createContext(null)

const BOOT_KEY = 'gt:booted'

const MOTION_KEY = 'gt:motion'

export function ExperienceProvider({ children }) {
  const systemReduced = useReducedMotion()

  /*
   * MOTION PREFERENCE — 'auto' | 'full' | 'reduced'
   *
   * 'auto' follows the OS, which is the correct default. But an OS-level
   * "reduce animations" setting is common (and often enabled for reasons that
   * have nothing to do with this site), and it silently turned the whole
   * experience off with no way back. An explicit override means a visitor who
   * wants the full thing can have it, and one who needs it calm still gets the
   * right default.
   */
  const [motionPref, setMotionPref] = useState(() => {
    if (typeof window === 'undefined') return 'auto'
    try {
      return localStorage.getItem(MOTION_KEY) ?? 'auto'
    } catch {
      return 'auto'
    }
  })

  const reducedMotion = motionPref === 'auto' ? systemReduced : motionPref === 'reduced'

  const setMotion = useCallback((pref) => {
    setMotionPref(pref)
    try {
      if (pref === 'auto') localStorage.removeItem(MOTION_KEY)
      else localStorage.setItem(MOTION_KEY, pref)
    } catch {
      /* storage blocked — preference simply lasts this session */
    }
  }, [])

  const toggleMotion = useCallback(() => {
    setMotion(reducedMotion ? 'full' : 'reduced')
  }, [reducedMotion, setMotion])

  /* Keep the CSS flag in sync with the resolved preference, not just the OS. */
  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion)
  }, [reducedMotion])
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
      motionPref,
      setMotion,
      toggleMotion,
      hasHover,
      isMobile,
      isTablet,
      isDesktop: !isMobile && !isTablet,
      tier,
      quality,
    }),
    [booted, completeBoot, skipBoot, reducedMotion, motionPref, setMotion, toggleMotion, hasHover, isMobile, isTablet, tier, quality],
  )

  return <ExperienceContext.Provider value={value}>{children}</ExperienceContext.Provider>
}

export function useExperience() {
  const ctx = useContext(ExperienceContext)
  if (!ctx) throw new Error('useExperience must be used inside <ExperienceProvider>')
  return ctx
}
