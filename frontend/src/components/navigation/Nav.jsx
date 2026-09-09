import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap, ScrollTrigger, EASE } from '../../lib/gsap'
import { brand, chapters } from '../../data/brand'
import { navItems, primaryCta } from '../../data/nav'
import { Button } from '../ui/Button'
import { useTransition } from '../transitions/TransitionProvider'
import { scrollTo, lockScroll } from '../../hooks/useLenis'
import { useExperience } from '../../context/ExperienceContext'
import { useSound } from '../../context/SoundContext'
import { cn } from '../../lib/utils'

/**
 * NAV
 * ---
 * Rebuilt after the hero gained a saturated animated field behind it. The old
 * bar was transparent at the top of the page, so 9px mono labels sat directly
 * on whatever colour happened to be flowing underneath — legible over black,
 * unreadable over the new backdrop.
 *
 * Three structural changes, each answering something on screen:
 *
 *  1. THE LINKS LIVE IN GLASS. A blurred capsule behind them gives the type a
 *     consistent ground at any scroll position and over any colour, instead of
 *     depending on the page being dark. A scrim across the top does the same
 *     for the wordmark and the CTA, which sit outside the capsule.
 *
 *  2. FEWER THINGS. The bar carried eleven separate elements — wordmark,
 *     descriptor, five numbered links, a chapter readout, a motion toggle, a
 *     sound toggle, a CTA and a menu button. The "01 / 11 ENTRY" readout was
 *     also stale: it counted chapters that are no longer on the page. It is
 *     replaced by a progress line, which says the same thing with no type at
 *     all, and the sound toggle moved into the menu.
 *
 *  3. THE INDICATOR CARRIES THE STATE. One capsule slides between items, so
 *     hover and the active section are told by position and motion rather than
 *     by a colour change on 9px text.
 *
 * Accent comes from `--accent`, which the hero rewrites on every cut, so the
 * indicator and the progress line change colour with the section behind them.
 */
export function Nav() {
  const { go, travel } = useTransition()
  const { pathname } = useLocation()
  const { booted, isMobile, reducedMotion, toggleMotion } = useExperience()
  const navRef = useRef(null)
  const [condensed, setCondensed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [chapter, setChapter] = useState(chapters[0])
  const isHome = pathname === '/'

  /* ── Scroll state ─────────────────────────────────────────── */
  useEffect(() => {
    if (!booted) return undefined
    const bar = navRef.current
    const line = bar?.querySelector('[data-nav-progress]')
    if (!bar) return undefined

    /*
     * The nav condenses but never hides. It used to slide away past 560px,
     * which meant the one button that converts disappeared for most of a very
     * long page.
     */
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        setCondensed(self.scroll() > 60)
        if (line) line.style.transform = `scaleX(${self.progress})`
      },
    })
    return () => st.kill()
  }, [booted])

  /* ── Which section is under the reader, home route only. ──── */
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

  /* ── Entrance ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!booted || reducedMotion) return undefined
    const ctx = gsap.context(() => {
      gsap.from('[data-nav-item]', {
        autoAlpha: 0,
        y: -14,
        filter: 'blur(6px)',
        duration: 0.9,
        ease: EASE.settle,
        stagger: 0.07,
        delay: 0.3,
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
      travel(target, { label: item.label.toUpperCase() })
    },
    [go, travel, isHome],
  )

  const goHome = useCallback(() => {
    setMenuOpen(false)
    if (isHome) scrollTo(0, { duration: 1.5 })
    else go('/', { label: 'GENTECHNE' })
  }, [go, isHome])

  if (!booted) return null

  const activeIndex = navItems.findIndex((item) =>
    item.to ? pathname === item.to : isHome && chapter.id === item.target,
  )

  return (
    <>
      <header
        ref={navRef}
        className="fixed inset-x-0 top-0 z-nav will-change-transform"
      >
        {/*
          Reading scrim. The wordmark and the CTA sit outside the glass capsule,
          and without this they were white type on whatever the field happened
          to be doing. A gradient rather than a bar so the page still reads as
          one continuous surface at the top.
        */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-x-0 top-0 transition-all duration-700 ease-out-expo',
            condensed ? 'h-full opacity-100' : 'h-[160%] opacity-90',
          )}
          style={{
            background: condensed
              ? 'linear-gradient(180deg, rgba(5,5,7,0.88) 0%, rgba(5,5,7,0.72) 100%)'
              : 'linear-gradient(180deg, rgba(5,5,7,0.72) 0%, rgba(5,5,7,0.28) 55%, rgba(5,5,7,0) 100%)',
            backdropFilter: condensed ? 'blur(14px)' : 'blur(2px)',
            WebkitBackdropFilter: condensed ? 'blur(14px)' : 'blur(2px)',
          }}
        />

        <nav
          aria-label="Primary"
          className={cn(
            'shell relative flex items-center justify-between gap-4 transition-[padding] duration-700 ease-out-expo',
            condensed ? 'py-3' : 'py-5 md:py-6',
          )}
        >
          {/* ── Wordmark ── */}
          <button
            type="button"
            data-nav-item
            data-cursor="link"
            onClick={goHome}
            className="group relative flex shrink-0 items-center gap-2 text-left"
            aria-label={`${brand.name} — home`}
          >
            <RollText
              className="font-display text-[15px] font-bold tracking-[0.16em] text-bone md:text-[17px]"
              value={brand.wordmark}
              hoverColor="var(--accent)"
            />
            {/* Live dot. The only place the accent appears on the left side of
                the bar, so the wordmark is tied to the same colour the
                indicator and the progress line are running. */}
            <span
              aria-hidden="true"
              className="block h-[5px] w-[5px] shrink-0 rounded-full transition-all duration-700"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 0 10px 0 color-mix(in srgb, var(--accent) 70%, transparent)',
              }}
            />
          </button>

          {/* ── Links, in glass ── */}
          <NavCapsule
            items={navItems}
            activeIndex={activeIndex}
            condensed={condensed}
            onSelect={handleNav}
          />

          {/* ── Right cluster ── */}
          <div className="flex shrink-0 items-center gap-2 md:gap-3" data-nav-item>
            <MotionToggle on={!reducedMotion} onToggle={toggleMotion} />

            <Button
              as="button"
              size={isMobile ? 'sm' : 'md'}
              variant="ghost"
              className="hidden sm:inline-flex"
              tint="var(--accent)"
              tintGlow="var(--accent)"
              onClick={() => go(primaryCta.to, { label: 'BEGIN A PROJECT' })}
            >
              {primaryCta.label}
            </Button>

            <MenuButton open={menuOpen} onClick={() => setMenuOpen((o) => !o)} />
          </div>
        </nav>

        {/*
          Scroll progress. Replaces the "01 / 11 ENTRY" readout, which counted
          chapters the page no longer has and cost three pieces of 9px type to
          say what a line says at a glance.
        */}
        <div aria-hidden="true" className="relative h-px w-full bg-white/[0.07]">
          <div
            data-nav-progress
            className="h-full w-full origin-left"
            style={{ background: 'var(--accent)', transform: 'scaleX(0)' }}
          />
        </div>
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

/**
 * Two copies of the same word stacked in a clipped box: the top one leaves
 * upward while the second arrives from below. Cheaper and steadier than
 * animating per-character, and it reads as one deliberate movement rather than
 * a ripple.
 */
function RollText({ value, className, hoverColor }) {
  return (
    <span className={cn('relative block overflow-hidden leading-none', className)}>
      <span className="block transition-transform duration-[600ms] ease-out-expo group-hover:-translate-y-full">
        {value}
      </span>
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 block translate-y-full transition-transform duration-[600ms] ease-out-expo group-hover:translate-y-0"
        style={hoverColor ? { color: hoverColor } : undefined}
      >
        {value}
      </span>
    </span>
  )
}

/**
 * The links, and the one capsule that slides between them.
 *
 * The indicator is measured from the DOM rather than derived from an index —
 * the labels are different widths, and hard-coding stops would break the first
 * time a nav item is renamed.
 */
function NavCapsule({ items, activeIndex, condensed, onSelect }) {
  const wrapRef = useRef(null)
  const indicatorRef = useRef(null)
  const glowRef = useRef(null)
  const itemRefs = useRef([])
  const last = useRef(null)
  const [hovered, setHovered] = useState(null)
  const { reducedMotion } = useExperience()

  const shown = hovered ?? (activeIndex >= 0 ? activeIndex : null)

  /*
   * useEffect, not useLayoutEffect, and `condensed` is deliberately NOT a
   * dependency.
   *
   * This tween animates `width`, which is a layout property. Running it
   * synchronously in the layout phase put a layout write on the same path as
   * ScrollTrigger's onUpdate — which sets `condensed` — so a scroll could
   * write layout, which can prompt ScrollTrigger to refresh, which sets state,
   * which re-ran the tween. A "Maximum update depth exceeded" warning appeared
   * once under a fast scripted scroll and could not be reproduced in six
   * further runs, but the feedback path was real whether or not it was the
   * cause, so it is gone.
   *
   * Dropping `condensed` is safe: condensing changes the header's padding, not
   * the capsule's internal layout, so the item offsets this reads are the same
   * either way.
   */
  useEffect(() => {
    const ind = indicatorRef.current
    if (!ind) return

    /* Nothing hovered and no section active — the capsule has nothing to point
       at, so it fades out rather than parking on an arbitrary item. */
    if (shown === null) {
      gsap.to(ind, { autoAlpha: 0, duration: 0.3, ease: 'power2.out' })
      last.current = null
      return
    }

    const el = itemRefs.current[shown]
    if (!el) return
    const to = { x: el.offsetLeft, w: el.offsetWidth }

    /* First appearance, or motion turned off: no travel to animate. */
    if (!last.current || reducedMotion) {
      gsap.set(ind, { x: to.x, width: to.w })
      gsap.to(ind, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' })
      last.current = to
      return
    }

    /*
     * LIQUID TRAVEL, in two phases.
     *
     * A pill that simply slides from one label to the next is the default
     * everyone ships, and it reads as a rectangle being repositioned. Instead
     * the indicator first STRETCHES until it spans both the item it is leaving
     * and the one it is going to, then contracts onto the target — so it
     * behaves like something with surface tension being pulled across, and the
     * eye reads one continuous object rather than a jump.
     *
     * The stretch is also what makes distance legible: crossing four items
     * elongates far more than crossing one, without any of the numbers being
     * hand-set.
     */
    const from = last.current
    const left = Math.min(from.x, to.x)
    const right = Math.max(from.x + from.w, to.x + to.w)

    gsap
      .timeline({ defaults: { overwrite: 'auto' } })
      .to(ind, { x: left, width: right - left, duration: 0.2, ease: 'power2.out' }, 0)
      .to(ind, { x: to.x, width: to.w, duration: 0.36, ease: 'power3.inOut' }, 0.16)

    /* A short bloom on arrival, so landing has a beat of its own. */
    if (glowRef.current) {
      gsap.fromTo(
        glowRef.current,
        { opacity: 0.55 },
        { opacity: 0, duration: 0.6, ease: 'power2.out', delay: 0.3, overwrite: 'auto' },
      )
    }

    last.current = to
  }, [shown, reducedMotion])

  return (
    <div
      ref={wrapRef}
      data-nav-item
      onMouseLeave={() => setHovered(null)}
      className={cn(
        'relative hidden items-center rounded-full border p-1 transition-colors duration-700 lg:flex',
        condensed ? 'border-white/[0.09] bg-white/[0.045]' : 'border-white/[0.13] bg-white/[0.065]',
      )}
      style={{
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        /* A hairline of light along the inside of the top edge. Glass without
           it reads as flat translucent plastic. */
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.09), 0 8px 24px -12px rgba(0,0,0,0.6)',
      }}
    >
      {/* The sliding capsule. Behind the labels, so it never dims them. */}
      <span
        ref={indicatorRef}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 left-0 top-1 rounded-full opacity-0"
        style={{
          /* Lit from the top rather than a flat fill — the same reason the
             glass above needs its highlight. */
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--accent) 34%, transparent) 0%, color-mix(in srgb, var(--accent) 16%, transparent) 100%)',
          boxShadow:
            'inset 0 0 0 1px color-mix(in srgb, var(--accent) 42%, transparent), 0 4px 18px -6px color-mix(in srgb, var(--accent) 55%, transparent)',
        }}
      >
        {/* Underline: the detail that makes it read as a TAB rather than a
            highlighter pass over the word. */}
        <span
          className="absolute inset-x-[22%] bottom-0 h-px rounded-full"
          style={{ background: 'var(--accent)' }}
        />
        {/* Arrival bloom — fades in as the indicator lands, then out. */}
        <span
          ref={glowRef}
          className="absolute inset-0 rounded-full opacity-0"
          style={{ background: 'var(--accent)', filter: 'blur(10px)' }}
        />
      </span>

      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          ref={(el) => {
            itemRefs.current[i] = el
          }}
          data-cursor="link"
          onMouseEnter={() => setHovered(i)}
          onFocus={() => setHovered(i)}
          onBlur={() => setHovered(null)}
          onClick={() => onSelect(item)}
          aria-current={activeIndex === i ? 'true' : undefined}
          className="group relative rounded-full px-[17px] py-[9px] xl:px-[21px]"
        >
          <RollText
            className={cn(
              'font-mono text-[11px] uppercase tracking-[0.15em] transition-colors duration-500',
              activeIndex === i ? 'text-bone' : 'text-silver',
            )}
            value={item.label}
            hoverColor="var(--accent)"
          />
        </button>
      ))}
    </div>
  )
}

/**
 * Motion override. Surfaced because the OS-level "reduce animations" setting is
 * common and otherwise silently disables the whole experience with no way for
 * the visitor to opt back in — that shipped once and looked like a dead site.
 *
 * Icon only now: the label read "MOTION ON" in 9px mono next to four other
 * pieces of 9px mono, and the bars already say which state it is in.
 */
function MotionToggle({ on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      data-cursor="link"
      aria-pressed={on}
      aria-label={on ? 'Turn animation off' : 'Turn animation on'}
      title={on ? 'Motion on' : 'Motion off — click to enable'}
      className="group hidden h-9 w-9 items-center justify-center gap-[3px] rounded-full border border-white/[0.10] bg-white/[0.05] transition-colors duration-500 hover:border-white/25 md:flex"
      style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[2px] rounded-full transition-all duration-500 ease-out-expo"
          style={{
            height: on ? `${6 + ((i * 5) % 7)}px` : '3px',
            background: on ? 'var(--accent)' : '#8E8E9D',
            transitionDelay: `${i * 60}ms`,
          }}
        />
      ))}
    </button>
  )
}

/** Two bars that cross into an X, with the whole control rotating as they do. */
function MenuButton({ open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-cursor="link"
      aria-expanded={open}
      aria-controls="nav-overlay"
      aria-label={open ? 'Close menu' : 'Open menu'}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.05] transition-transform duration-700 ease-out-expo lg:hidden"
      style={{
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        transform: open ? 'rotate(90deg)' : 'none',
      }}
    >
      <span className="relative block h-3 w-5">
        <span
          className="absolute left-0 h-px w-full bg-bone transition-all duration-500 ease-out-expo"
          style={{ top: open ? '50%' : '2px', transform: open ? 'rotate(45deg)' : 'none' }}
        />
        <span
          className="absolute left-0 h-px w-full bg-bone transition-all duration-500 ease-out-expo"
          style={{ top: open ? '50%' : '10px', transform: open ? 'rotate(-45deg)' : 'none' }}
        />
      </span>
    </button>
  )
}

/* ─────────────────────────────────────────────────────────── */

function NavOverlay({ open, onClose, onNavigate, activeId, pathname }) {
  const rootRef = useRef(null)
  const { reducedMotion } = useExperience()
  const { enabled: soundOn, toggle: toggleSound } = useSound()

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
      {/* The menu picks up the same accent as the bar it came from. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 50% at 80% 0%, color-mix(in srgb, var(--accent) 16%, transparent) 0%, rgba(0,0,0,0) 70%)',
        }}
      />

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
                <span className="font-mono text-[10px] text-mist tabular-nums transition-colors group-hover:text-[color:var(--accent)]">
                  {item.index}
                </span>
                <span
                  className="font-display text-[clamp(2rem,11vw,4rem)] font-medium leading-none tracking-tight transition-all duration-500 ease-out-expo group-hover:translate-x-2"
                  style={active ? { color: 'var(--accent)' } : undefined}
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
              className="font-display text-lg text-bone transition-colors hover:text-[color:var(--accent)]"
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
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={onClose}
            tabIndex={open ? 0 : -1}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist transition-colors hover:text-bone"
          >
            Close ✕
          </button>
          {/* Sound moved here from the bar: it is off by default and almost
              never the thing someone came to the nav to do. */}
          <button
            type="button"
            onClick={toggleSound}
            tabIndex={open ? 0 : -1}
            aria-pressed={soundOn}
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mist transition-colors hover:text-bone"
          >
            <span
              className="block h-1.5 w-1.5 rounded-full transition-colors duration-500"
              style={{ background: soundOn ? 'var(--accent)' : '#35353E' }}
            />
            Sound {soundOn ? 'on' : 'off'}
          </button>
        </div>
      </div>
    </div>
  )
}
