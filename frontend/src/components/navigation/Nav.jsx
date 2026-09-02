import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap, ScrollTrigger, EASE } from '../../lib/gsap'
import { brand, chapters } from '../../data/brand'
import { navItems, primaryCta } from '../../data/nav'
import { MagneticLink } from './MagneticLink'
import { Button } from '../ui/Button'
import { useTransition } from '../transitions/TransitionProvider'
import { scrollTo, lockScroll } from '../../hooks/useLenis'
import { useExperience } from '../../context/ExperienceContext'
import { useSound } from '../../context/SoundContext'
import { cn } from '../../lib/utils'

export function Nav() {
  const { go } = useTransition()
  const { pathname } = useLocation()
  const { booted, isMobile, reducedMotion } = useExperience()
  const { enabled: soundOn, toggle: toggleSound } = useSound()
  const navRef = useRef(null)
  const [condensed, setCondensed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [chapter, setChapter] = useState(chapters[0])
  const isHome = pathname === '/'

  /* ── Scroll state: condense, and hide while travelling down. ── */
  useEffect(() => {
    if (!booted) return undefined
    const nav = navRef.current
    if (!nav) return undefined

    let hidden = false
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const y = self.scroll()
        setCondensed(y > 80)
        const goingDown = self.direction === 1
        const shouldHide = goingDown && y > 560 && !menuOpen
        if (shouldHide !== hidden) {
          hidden = shouldHide
          gsap.to(nav, {
            yPercent: shouldHide ? -130 : 0,
            duration: 0.65,
            ease: EASE.settle,
            overwrite: true,
          })
        }
      },
    })
    return () => st.kill()
  }, [booted, menuOpen])

  /* ── Chapter readout, home route only. ───────────────────── */
  useEffect(() => {
    if (!isHome || !booted) return undefined
    const triggers = chapters
      .map((c) => {
        const el = document.getElementById(c.id)
        if (!el) return null
        return ScrollTrigger.create({
          trigger: el,
          start: 'top 55%',
          end: 'bottom 55%',
          onToggle: (self) => self.isActive && setChapter(c),
        })
      })
      .filter(Boolean)
    return () => triggers.forEach((t) => t.kill())
  }, [isHome, booted])

  /* ── Entrance after boot. ────────────────────────────────── */
  useEffect(() => {
    if (!booted || reducedMotion) return undefined
    const ctx = gsap.context(() => {
      gsap.from('[data-nav-item]', {
        autoAlpha: 0,
        y: -16,
        duration: 0.9,
        ease: EASE.settle,
        stagger: 0.06,
        delay: 0.35,
      })
    }, navRef)
    return () => ctx.revert()
  }, [booted, reducedMotion])

  useEffect(() => {
    lockScroll(menuOpen)
    return () => lockScroll(false)
  }, [menuOpen])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* ── Navigation: in-page targets scroll, routes transition. ── */
  const handleNav = useCallback(
    (item) => {
      setMenuOpen(false)
      if (item.to) {
        go(item.to, { label: item.label.toUpperCase() })
        return
      }
      const target = `#${item.target}`
      if (!isHome) {
        go('/', { label: item.label.toUpperCase() })
        // Wait for the arriving route to mount before seeking.
        setTimeout(() => scrollTo(target, { duration: 1.4, offset: -20 }), 1500)
        return
      }
      scrollTo(target, { duration: 1.7, offset: -20 })
    },
    [go, isHome],
  )

  const goHome = useCallback(() => {
    setMenuOpen(false)
    if (isHome) scrollTo(0, { duration: 1.5 })
    else go('/', { label: 'GROWKYNOS' })
  }, [go, isHome])

  if (!booted) return null

  return (
    <>
      <header
        ref={navRef}
        className={cn(
          'fixed inset-x-0 top-0 z-nav will-change-transform transition-[padding,background-color,backdrop-filter,border-color] duration-700 ease-out-expo',
          condensed
            ? 'border-b border-smoke/50 bg-void/70 py-3 backdrop-blur-xl md:py-4'
            : 'border-b border-transparent bg-transparent py-5 md:py-7',
        )}
      >
        <nav aria-label="Primary" className="shell flex items-center justify-between gap-6">
          {/* Brand */}
          <button
            type="button"
            data-nav-item
            data-cursor="link"
            onClick={goHome}
            className="group flex items-baseline gap-3 text-left"
            aria-label={`${brand.name} — home`}
          >
            <span className="font-display text-[15px] font-bold tracking-[0.16em] text-bone transition-colors duration-500 group-hover:text-brass md:text-[17px]">
              {brand.wordmark}
            </span>
            {/* Only shown where there is genuinely room — below 2xl the five
                nav items, the chapter readout and the CTA already fill the bar,
                and this descriptor is what pushes them into wrapping. */}
            <span
              className={cn(
                'hidden whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.2em] text-mist transition-opacity duration-500 2xl:block',
                condensed ? 'opacity-0' : 'opacity-100',
              )}
            >
              {brand.descriptor}
            </span>
          </button>

          {/* Desktop links */}
          <div className="hidden items-center gap-8 lg:flex" data-nav-item>
            {navItems.map((item) => (
              <MagneticLink
                key={item.id}
                index={item.index}
                active={item.to ? pathname === item.to : isHome && chapter.id === item.target}
                onClick={() => handleNav(item)}
              >
                {item.label}
              </MagneticLink>
            ))}
          </div>

          <div className="flex items-center gap-3 md:gap-5" data-nav-item>
            {/* Chapter readout */}
            {isHome && (
              <div className="hidden items-center gap-2.5 whitespace-nowrap border-r border-smoke pr-5 2xl:flex">
                <span className="h-1 w-1 rounded-full bg-brass anim-pulse" />
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-mist tabular-nums">
                  {String(chapters.indexOf(chapter) + 1).padStart(2, '0')} / {chapters.length}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-silver">
                  {chapter.short}
                </span>
              </div>
            )}

            {/* Sound toggle — architecture is in place, off by default */}
            <button
              type="button"
              onClick={toggleSound}
              data-cursor="link"
              aria-pressed={soundOn}
              aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
              title={soundOn ? 'Sound on' : 'Sound off'}
              className="hidden h-8 items-center gap-[3px] px-1 md:flex"
            >
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="w-[2px] rounded-full bg-mist transition-all duration-500"
                  style={{
                    height: soundOn ? `${5 + ((i * 7) % 11)}px` : '3px',
                    backgroundColor: soundOn ? '#C6A87C' : '#6B6B78',
                  }}
                />
              ))}
            </button>

            <Button
              as="button"
              size={isMobile ? 'sm' : 'md'}
              variant="ghost"
              className="hidden sm:inline-flex"
              onClick={() => go(primaryCta.to, { label: 'BEGIN A PROJECT' })}
            >
              {primaryCta.label}
            </Button>

            {/* Menu trigger */}
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              data-cursor="link"
              aria-expanded={menuOpen}
              aria-controls="nav-overlay"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="relative flex h-10 w-10 flex-col items-center justify-center gap-[5px] lg:hidden"
            >
              <span
                className="h-px w-5 bg-bone transition-transform duration-500 ease-out-expo"
                style={{ transform: menuOpen ? 'translateY(3px) rotate(45deg)' : 'none' }}
              />
              <span
                className="h-px w-5 bg-bone transition-transform duration-500 ease-out-expo"
                style={{ transform: menuOpen ? 'translateY(-3px) rotate(-45deg)' : 'none' }}
              />
            </button>
          </div>
        </nav>
      </header>

      <NavOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={handleNav}
        activeId={isHome ? chapter.id : null}
        pathname={pathname}
      />
    </>
  )
}

/* ─────────────────────────────────────────────────────────── */

function NavOverlay({ open, onClose, onNavigate, activeId, pathname }) {
  const rootRef = useRef(null)
  const { reducedMotion } = useExperience()

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    if (reducedMotion) {
      gsap.set(root, { autoAlpha: open ? 1 : 0, clipPath: 'none' })
      return undefined
    }

    const tl = gsap.timeline()
    if (open) {
      gsap.set(root, { pointerEvents: 'auto' })
      tl.set(root, { autoAlpha: 1 })
        .fromTo(
          root,
          { clipPath: 'inset(0% 0% 100% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: EASE.travel },
        )
        .fromTo(
          '[data-overlay-item]',
          { yPercent: 110, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: EASE.settle, stagger: 0.06 },
          '-=0.5',
        )
        .fromTo('[data-overlay-meta]', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.7 }, '-=0.5')
    } else {
      tl.to('[data-overlay-item]', { yPercent: -70, autoAlpha: 0, duration: 0.4, stagger: 0.03, ease: 'power3.in' })
        .to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.65, ease: EASE.travel }, '-=0.2')
        .set(root, { autoAlpha: 0, pointerEvents: 'none' })
    }
    return () => tl.kill()
  }, [open, reducedMotion])

  return (
    <div
      id="nav-overlay"
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      aria-hidden={!open}
      className="pointer-events-none fixed inset-0 z-[99] flex flex-col justify-between bg-carbon px-gutter pb-10 pt-28 opacity-0"
      style={{ clipPath: 'inset(0% 0% 100% 0%)' }}
    >
      <div className="pointer-events-none absolute inset-0 grid-field opacity-40" />

      <ul className="relative flex flex-col">
        {navItems.map((item) => {
          const active = item.to ? pathname === item.to : activeId === item.target
          return (
            <li key={item.id} className="overflow-hidden border-b border-smoke/60">
              <button
                type="button"
                data-overlay-item
                data-cursor="link"
                tabIndex={open ? 0 : -1}
                onClick={() => onNavigate(item)}
                className="group flex w-full items-baseline gap-4 py-4 text-left"
              >
                <span className="font-mono text-[10px] text-mist tabular-nums transition-colors group-hover:text-brass">
                  {item.index}
                </span>
                <span
                  className={cn(
                    'font-display text-[clamp(2rem,11vw,4rem)] font-medium leading-none tracking-tight transition-all duration-500 ease-out-expo group-hover:translate-x-2 group-hover:text-brass',
                    active ? 'text-brass' : 'text-bone',
                  )}
                >
                  {item.label}
                </span>
                <span className="ml-auto self-center font-mono text-[10px] text-mist opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  →
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div data-overlay-meta className="relative flex flex-col gap-5 opacity-0">
        <div className="hairline" />
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <span className="label">Get in touch</span>
            <a
              href={`mailto:${brand.email}`}
              data-cursor="link"
              className="font-display text-lg text-bone transition-colors hover:text-brass"
            >
              {brand.email}
            </a>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {brand.socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                data-cursor="link"
                className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist transition-colors hover:text-bone"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          tabIndex={open ? 0 : -1}
          className="self-start font-mono text-[10px] uppercase tracking-[0.18em] text-mist transition-colors hover:text-bone"
        >
          Close ✕
        </button>
      </div>
    </div>
  )
}
