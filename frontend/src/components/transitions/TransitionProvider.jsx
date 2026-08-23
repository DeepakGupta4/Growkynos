import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap, EASE } from '../../lib/gsap'
import { getLenis, lockScroll } from '../../hooks/useLenis'
import { useExperience } from '../../context/ExperienceContext'
import { useSound } from '../../context/SoundContext'

const TransitionContext = createContext(null)

const PANELS = 6

/**
 * CINEMATIC TRANSITIONS
 * ---------------------
 * Never a fade. A route change is a physical move between worlds:
 * six columns sweep up from the floor with staggered delay (so the leading
 * edge reads as a wipe, not a curtain), the outgoing page recedes in depth,
 * the label of the destination is stamped, then the columns retract downward
 * revealing the arriving page already in motion.
 */
export function TransitionProvider({ children }) {
  const navigate = useNavigate()
  const { reducedMotion } = useExperience()
  const { sfx } = useSound()
  const overlayRef = useRef(null)
  const panelsRef = useRef([])
  const labelRef = useRef(null)
  const pageRef = useRef(null)
  const busy = useRef(false)
  const [label, setLabel] = useState('')

  const setPanel = useCallback((el, i) => {
    panelsRef.current[i] = el
  }, [])

  /**
   * Navigate with the full sequence. `label` is stamped mid-transition so the
   * viewer knows which world they are entering.
   */
  const go = useCallback(
    (to, { label: nextLabel = '', replace = false } = {}) => {
      if (busy.current) return
      if (reducedMotion) {
        navigate(to, { replace })
        window.scrollTo(0, 0)
        return
      }

      busy.current = true
      setLabel(nextLabel)
      sfx('transition')
      lockScroll(true)

      const panels = panelsRef.current.filter(Boolean)
      const overlay = overlayRef.current
      const page = pageRef.current

      gsap.set(overlay, { pointerEvents: 'auto', autoAlpha: 1 })
      gsap.set(panels, { scaleY: 0, transformOrigin: 'bottom center' })

      const tl = gsap.timeline({
        onComplete: () => {
          busy.current = false
        },
      })

      // 1 — outgoing page recedes
      if (page) {
        tl.to(
          page,
          { scale: 0.94, y: -34, filter: 'blur(5px)', opacity: 0.35, duration: 0.75, ease: 'power3.inOut' },
          0,
        )
      }

      // 2 — columns sweep up
      tl.to(
        panels,
        { scaleY: 1, duration: 0.78, ease: EASE.travel, stagger: { each: 0.045, from: 'start' } },
        0.05,
      )

      // 3 — destination stamped
      tl.fromTo(
        labelRef.current,
        { autoAlpha: 0, y: 24, letterSpacing: '0.6em' },
        { autoAlpha: 1, y: 0, letterSpacing: '0.24em', duration: 0.55, ease: 'expo.out' },
        0.62,
      )

      // 4 — swap route behind the cover
      tl.add(() => {
        navigate(to, { replace })
        const lenis = getLenis()
        if (lenis) lenis.scrollTo(0, { immediate: true })
        else window.scrollTo(0, 0)
        if (page) gsap.set(page, { scale: 1, y: 0, filter: 'blur(0px)', opacity: 1 })
      }, 0.95)

      tl.to(labelRef.current, { autoAlpha: 0, y: -18, duration: 0.4, ease: 'power3.in' }, 1.24)

      // 5 — columns retract, arriving page is already settling
      tl.to(
        panels,
        {
          scaleY: 0,
          transformOrigin: 'top center',
          duration: 0.85,
          ease: EASE.travel,
          stagger: { each: 0.045, from: 'end' },
        },
        1.34,
      )

      tl.set(overlay, { pointerEvents: 'none', autoAlpha: 0 })
      tl.add(() => lockScroll(false))

      if (page) {
        tl.fromTo(
          page,
          { opacity: 0, y: 44, scale: 1.02 },
          { opacity: 1, y: 0, scale: 1, duration: 1.05, ease: EASE.settle },
          1.42,
        )
      }
    },
    [navigate, reducedMotion, sfx],
  )

  const value = useMemo(() => ({ go, pageRef }), [go])

  return (
    <TransitionContext.Provider value={value}>
      {children}

      <div
        ref={overlayRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-transition flex opacity-0"
      >
        {Array.from({ length: PANELS }).map((_, i) => (
          <div
            key={i}
            ref={(el) => setPanel(el, i)}
            className="h-full flex-1 scale-y-0 bg-carbon"
            style={{
              borderRight: i < PANELS - 1 ? '1px solid rgba(255,255,255,0.035)' : 'none',
              background:
                i % 2 === 0
                  ? 'linear-gradient(180deg,#0A0A0D 0%,#050507 100%)'
                  : 'linear-gradient(180deg,#101014 0%,#08080A 100%)',
            }}
          />
        ))}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span
            ref={labelRef}
            className="font-mono text-[11px] uppercase tracking-[0.24em] text-brass opacity-0"
          >
            {label}
          </span>
        </div>
      </div>
    </TransitionContext.Provider>
  )
}

export function useTransition() {
  const ctx = useContext(TransitionContext)
  if (!ctx) throw new Error('useTransition must be used inside <TransitionProvider>')
  return ctx
}

/**
 * The element the transition physically moves. Only the routed page belongs
 * here — persistent chrome (nav, cursor, grain) must stay outside it so it
 * doesn't recede along with the page it is navigating.
 */
export function TransitionStage({ children, className }) {
  const { pageRef } = useTransition()
  return (
    <div ref={pageRef} className={className ?? 'relative will-change-transform'}>
      {children}
    </div>
  )
}
