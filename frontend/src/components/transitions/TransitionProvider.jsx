import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap, ScrollTrigger, EASE } from '../../lib/gsap'
import { getLenis, lockScroll, scrollTo } from '../../hooks/useLenis'
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
   * The sequence itself, with the destination swap left to the caller.
   *
   * Both kinds of navigation on this site now run it: a route change, and a
   * jump to a section of the page you are already on. Previously only the
   * former had it, so "Contact" arrived cinematically while "Studio",
   * "Services", "Projects" and "Technology" just scrolled — four of the five
   * nav items behaved like a different website from the fifth.
   *
   * `onSwap` fires at 0.95s, the moment the columns have the viewport fully
   * covered. Whatever it does — navigate, or seek — is invisible.
   */
  const run = useCallback(
    (nextLabel, onSwap) => {
      if (busy.current) return

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
          // Belt and braces: whatever happened mid-flight, the stage must end
          // with no inline transform. A residual one — even the identity
          // matrix — makes it a containing block for position:fixed and breaks
          // every pinned ScrollTrigger on the arriving page.
          if (page) gsap.set(page, { clearProps: 'transform,opacity,filter' })
          ScrollTrigger.refresh()
        },
      })

      /*
       * 1 — outgoing page recedes.
       *
       * No blur here any more. A `filter: blur()` on the page root forces the
       * whole document to raster into one layer for the duration, which is the
       * most expensive thing this timeline could ask for — and it was visible
       * for the ~0.5s before the columns finished covering, which read as the
       * page going out of focus rather than moving away. Scale and opacity say
       * "receding" on their own.
       */
      if (page) {
        tl.to(page, { scale: 0.94, y: -34, opacity: 0.35, duration: 0.75, ease: 'power3.inOut' }, 0)
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

      // 4 — swap the destination behind the cover
      tl.add(() => {
        onSwap()
        // clearProps, not set-to-identity: an inline `transform: matrix(1,0,0,1,0,0)`
        // still makes this a containing block for position:fixed, which would
        // break every pinned ScrollTrigger on the arriving page.
        if (page) gsap.set(page, { clearProps: 'transform,filter,opacity' })
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
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.05,
            ease: EASE.settle,
            // Leave no transform behind — see the note above.
            onComplete: () => {
              gsap.set(page, { clearProps: 'transform,opacity,filter' })
              ScrollTrigger.refresh()
            },
          },
          1.42,
        )
      }
    },
    [sfx],
  )

  /** Navigate to another route with the full sequence. */
  const go = useCallback(
    (to, { label: nextLabel = '', replace = false } = {}) => {
      if (reducedMotion) {
        navigate(to, { replace })
        window.scrollTo(0, 0)
        return
      }
      run(nextLabel, () => {
        navigate(to, { replace })
        const lenis = getLenis()
        if (lenis) lenis.scrollTo(0, { immediate: true, force: true })
        else window.scrollTo(0, 0)
      })
    },
    [navigate, reducedMotion, run],
  )

  /**
   * Jump to a section of the current page with the same sequence.
   *
   * THE LOCK HAS TO COME OFF BEFORE THE SEEK. `lockScroll(true)` puts
   * `overflow: hidden; height: 100vh` on the body, so while it is on the
   * document is clipped to one viewport and has nowhere to scroll to — the
   * cover played perfectly and the page never moved, scrollY pinned at 0
   * through the whole sequence. Releasing it here is safe: the columns still
   * have the viewport covered for another ~1.3s, so nothing about the seek is
   * visible, and the timeline's own `lockScroll(false)` later is then a no-op.
   *
   * `force: true` is still needed on top of that — the lock also stops Lenis,
   * and a stopped Lenis ignores scrollTo without it.
   */
  const travel = useCallback(
    (target, { label: nextLabel = '', offset = -20 } = {}) => {
      if (reducedMotion) {
        scrollTo(target, { duration: 1.2, offset })
        return
      }
      run(nextLabel, () => {
        lockScroll(false)
        // Force the body's height back before seeking, so the scroll lands
        // against the full document rather than the clipped one.
        void document.body.offsetHeight

        const lenis = getLenis()
        if (lenis) {
          lenis.scrollTo(target, { immediate: true, force: true, offset })
        } else {
          const el = typeof target === 'string' ? document.querySelector(target) : target
          if (el instanceof Element) el.scrollIntoView({ behavior: 'auto', block: 'start' })
        }
      })
    },
    [reducedMotion, run],
  )

  const value = useMemo(() => ({ go, travel, pageRef }), [go, travel])

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
    /*
     * IMPORTANT: no persistent `will-change: transform` / `transform` here.
     * Either one makes this element a containing block for `position: fixed`
     * descendants, which silently breaks every pinned ScrollTrigger inside —
     * the pinned stage gets positioned against the document instead of the
     * viewport and scrolls off screen. GSAP applies will-change itself for the
     * duration of the transition tween, which is all we need.
     */
    <div ref={pageRef} className={className ?? 'relative'}>
      {children}
    </div>
  )
}
