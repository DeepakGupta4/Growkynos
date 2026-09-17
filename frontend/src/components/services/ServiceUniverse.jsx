import { useRef, useState } from 'react'
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect'
import { gsap, EASE } from '../../lib/gsap'
import { primaryServices, supportingServices } from '../../data/services'
import { useExperience } from '../../context/ExperienceContext'
import { scrollTo } from '../../hooks/useLenis'
import { useSound } from '../../context/SoundContext'
import { cn } from '../../lib/utils'

/**
 * SERVICES
 * --------
 * Four disciplines, as four cards you can read.
 *
 * WHAT THIS REPLACED, AND WHY.
 * This was a 3D "cloud": plates scattered on seeded orbits at random depths and
 * rotations, with a scroll-driven camera pushing from z -220 to z +500. Three
 * things went wrong with it and all three were visible on screen:
 *
 *  1. THE CAMERA CROPPED THE CARDS. Pushing the cloud toward the viewer made
 *     the plates grow past the frame, so by the end of the section the top row
 *     was sliced off at the viewport edge and the fourth card ran off the right
 *     side entirely.
 *  2. TWO THIRDS OF THE SECTION WAS EMPTY. The cloud sat in the upper part of
 *     an 78svh stage, leaving a large field of nothing underneath it.
 *  3. THE SCATTER READ AS ACCIDENTAL. Random rotation and scale per card looks
 *     like a layout that failed rather than one that was authored.
 *
 * A grid is not a lesser idea here — it is the one that lets four services be
 * compared, which is what someone deciding whether to hire us is doing. The
 * motion moved into the cards themselves: they arrive in sequence, and the one
 * under the pointer lights up in its own colour.
 */

/**
 * The ring that travels around every card: one continuous line carrying all
 * four brand colours, rotating forever. A single-accent comet read as a
 * highlight passing by; a full multicolour ring reads as the card being alive.
 * Repeating the first colour at 360deg closes the loop, otherwise there is a
 * hard seam where the gradient wraps.
 */
const RING = '#FF7A4D, #4F86FF, #FF4D8D, #9B72FF, #FF7A4D'

export function ServiceUniverse() {
  const rootRef = useRef(null)
  const [hovered, setHovered] = useState(null)
  const { reducedMotion } = useExperience()
  const { sfx } = useSound()

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current
    if (!root || reducedMotion) return undefined

    const ctx = gsap.context(() => {
      gsap.from('[data-universe-line] > span', {
        immediateRender: false,
        yPercent: 110,
        duration: 1,
        ease: EASE.settle,
        stagger: 0.08,
        scrollTrigger: { trigger: root, start: 'top 75%' },
      })
      gsap.from('[data-universe-sub]', {
        immediateRender: false,
        autoAlpha: 0,
        y: 18,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: root, start: 'top 75%' },
      })
      /*
       * Cards arrive from the side they sit on: the left column from the left,
       * the right column from the right, closing on the centre.
       *
       * NOT ScrollTrigger. It would not fire for this grid at all — measured
       * with the grid at y=304 in a 900px viewport, far past its own "top 85%"
       * start at 765, the cards stayed at opacity 0 and x=-90 indefinitely,
       * through a gradual scroll and three seconds of waiting. Its cached
       * geometry had gone stale against a layout that changed underneath it
       * (the hero pin came out, section padding changed) and nothing re-fired
       * it. Two workarounds made it worse: immediateRender:false kept the cards
       * visible but cut the travel to 29px of the 90 asked for, and a
       * setTimeout guard ran 2.2s after mount, when the grid was still far
       * below the fold, so it never saw anything to fix.
       *
       * An observer has no cached geometry to go stale.
       */
      const cards = gsap.utils.toArray('[data-service-card]')
      const restX = (el) => (el.dataset.side === 'right' ? 90 : -90)
      gsap.set(cards, { autoAlpha: 0, x: (i, el) => restX(el), y: 28 })

      /*
       * ONE OBSERVER PER CARD, AND IT RUNS BOTH WAYS.
       *
       * Watching the grid as a single element was wrong twice over. It fired
       * when the grid was 12% visible — which is the moment only the top row is
       * on screen — so the bottom two cards played their entrance below the
       * fold and were already settled by the time anyone scrolled to them. Only
       * two cards ever appeared to animate. And `disconnect()` on first fire
       * meant scrolling back up left them sitting there; they never left the
       * way they arrived.
       *
       * Per-card observation fixes both: each card animates as it personally
       * enters, and reverses to the side it came from when it leaves.
       */
      const observers = cards.map((el) => {
        const io = new IntersectionObserver(
          ([entry]) => {
            gsap.to(el, {
              autoAlpha: entry.isIntersecting ? 1 : 0,
              x: entry.isIntersecting ? 0 : restX(el),
              y: entry.isIntersecting ? 0 : 28,
              duration: entry.isIntersecting ? 0.9 : 0.5,
              ease: entry.isIntersecting ? EASE.settle : 'power2.in',
              overwrite: 'auto',
            })
          },
          /* A shallow threshold with a bottom margin: the card starts moving
             while it is still a little below the fold, so it arrives settled
             rather than catching up after it is already in view. */
          { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
        )
        io.observe(el)
        return io
      })

      return () => observers.forEach((io) => io.disconnect())
    }, root)

    return () => ctx.revert()
  }, [reducedMotion])

  const open = (s) => {
    sfx('click')
    scrollTo(`#${s.sectionId}`, { duration: 1.9 })
  }

  return (
    <section
      id="services"
      ref={rootRef}
      aria-label="Services"
      className="section relative border-t border-smoke/40 pb-20 pt-10 md:pb-28 md:pt-14"
    >
      <div className="shell relative z-20 flex flex-col gap-12 md:gap-16">
        {/*
          The heading used to run the full width with the statement on the left,
          which left the entire right half of the opening frame empty. The
          supporting disciplines were stranded in a thin strip at the very
          bottom of the section. Putting them side by side fills the frame with
          real content rather than filler, and gives the minor services a place
          where they read as a list instead of a footnote.
        */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] lg:items-end lg:gap-16">
          <Heading />
          <SupportingList />
        </div>

        {/*
          Two by two from md up. Four across on a wide screen made each card too
          narrow to hold its summary without wrapping to five lines; 2×2 keeps
          the text measure readable and the block square enough to sit in the
          frame without a field of empty space under it.
        */}
        <div data-service-grid className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {primaryServices.map((s, i) => (
            <ServiceCard
              key={s.id}
              service={s}
              side={i % 2 === 0 ? 'left' : 'right'}
              /* Staggered so the four lights never travel in lockstep — four
                 identical orbits read as one mechanism, not four objects. */
              orbitSeconds={5.5 + i * 1.3}
              accent={s.accent}
              hovered={hovered === s.id}
              dimmed={hovered !== null && hovered !== s.id}
              reducedMotion={reducedMotion}
              onEnter={() => {
                setHovered(s.id)
                sfx('hover', { volume: 0.35 })
              }}
              onLeave={() => setHovered(null)}
              onSelect={() => open(s)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────────────── */

function Heading() {
  /* Was "TEN WORLDS." and stayed that way after the homepage dropped to four —
     the heading was counting sections that are no longer on the page. */
  const lines = ['FOUR WORLDS.', 'ONE STUDIO.']
  return (
    <div data-universe-heading className="flex flex-col gap-6">
      <span data-universe-sub className="label-brass">
        THE DIGITAL UNIVERSE
      </span>
      <h2 className="font-display text-display-2 font-extrabold text-gradient-bone">
        {lines.map((l) => (
          <span key={l} data-universe-line className="line-mask">
            <span>{l}</span>
          </span>
        ))}
      </h2>
      <p data-universe-sub className="max-w-xl text-[15px] leading-relaxed text-silver">
        Each discipline is its own environment below — a working demonstration rather than a description.
        Move through them, or jump straight to the one you need.
      </p>
    </div>
  )
}

function ServiceCard({
  service,
  accent,
  side,
  orbitSeconds,
  hovered,
  dimmed,
  reducedMotion,
  onEnter,
  onLeave,
  onSelect,
}) {
  return (
    <button
      type="button"
      data-service-card
      data-side={side}
      data-plate-id={service.id}
      data-cursor="view"
      data-cursor-label="ENTER"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={onSelect}
      aria-label={`${service.title} — ${service.summary}`}
      className={cn(
        'group relative rounded-2xl p-[1.5px] text-left transition-all duration-500 ease-out-expo',
        dimmed ? 'opacity-55' : 'opacity-100',
        hovered ? '-translate-y-2' : 'translate-y-0',
      )}
      style={{
        boxShadow: hovered
          ? `0 30px 70px -30px rgba(0,0,0,0.92), 0 0 56px -24px ${accent}`
          : '0 16px 38px -26px rgba(0,0,0,0.8)',
      }}
    >
      {/*
        THE TRAVELLING LIGHT.
        A border cannot be animated around a shape, so this is a conic gradient
        sized well past the card, spun with `transform`, and clipped to a 1px
        ring by the opaque panel that sits on top of it. Only the transform
        changes, so it composites on the GPU and costs nothing to run on all
        four cards at once.
      */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-1.5 rounded-[22px] opacity-30 blur-lg"
        style={{
          background: `conic-gradient(from 0deg, ${RING})`,
          animation: reducedMotion ? 'none' : `gt-orbit ${orbitSeconds}s linear infinite`,
        }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden rounded-2xl transition-opacity duration-500"
        style={{ opacity: hovered ? 1 : 0.9 }}
      >
        <span
          className="absolute left-1/2 top-1/2 aspect-square w-[170%]"
          style={{
            background: `conic-gradient(from 0deg, ${RING})`,
            transform: 'translate(-50%, -50%)',
            animation: reducedMotion ? 'none' : `gt-orbit ${orbitSeconds}s linear infinite`,
          }}
        />
      </span>

      {/* Resting rim, so the card still has an edge between passes of the light. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl transition-colors duration-500"
        style={{ boxShadow: `inset 0 0 0 1px ${hovered ? `${accent}59` : 'rgba(35,35,41,0.95)'}` }}
      />

      {/* The panel. Opaque on purpose — it is what clips the ring to 1px. */}
      <span
        className="relative flex min-h-[15rem] flex-col gap-5 overflow-hidden rounded-[15px] p-6 md:min-h-[17rem] md:p-8"
        style={{
          background: hovered
            ? `radial-gradient(120% 90% at 12% 0%, ${accent}24 0%, rgba(8,8,11,0.985) 58%)`
            : 'linear-gradient(158deg, rgba(19,19,24,0.985) 0%, rgba(8,8,11,0.99) 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* A soft glow in the corner the light passes, so the panel reacts too. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full blur-2xl transition-opacity duration-700"
          style={{ background: accent, opacity: hovered ? 0.2 : 0.07 }}
        />

        <span className="relative flex items-center gap-3">
          <span
            className="font-mono text-[11px] tabular-nums transition-colors duration-500"
            style={{ color: hovered ? accent : '#8E8E9D' }}
          >
            {service.index}
          </span>
          <span
            aria-hidden="true"
            className="h-1 w-1 rounded-full transition-all duration-500"
            style={{
              backgroundColor: hovered ? accent : '#35353E',
              boxShadow: hovered ? `0 0 10px ${accent}` : 'none',
            }}
          />
        </span>

        <span className="relative flex flex-col gap-2">
          <span className="font-display text-[clamp(1.35rem,2.4vw,1.9rem)] font-semibold leading-tight tracking-tight text-bone">
            {service.title}
          </span>
          <span
            className="font-mono text-[10px] uppercase tracking-[0.16em] transition-colors duration-500"
            style={{ color: hovered ? accent : '#8E8E9D' }}
          >
            {service.verb}
          </span>
        </span>

        <span className="relative max-w-[46ch] text-[14px] leading-relaxed text-silver">
          {service.summary}
        </span>

        {/*
          Capabilities, not the old metric block.
          Each card used to lead with a figure — "4.8 ★ average store rating",
          "98/100 median Lighthouse", "99.9% uptime", "31 hrs saved per week".
          Every one of those was invented, and invented numbers on an agency
          site are the fastest way to lose a client who checks. These are true
          statements of what we build with, and they say more about fit anyway.
        */}
        <span className="relative mt-auto flex flex-wrap gap-1.5 pt-2">
          {service.capabilities.slice(0, 4).map((c) => (
            <span
              key={c}
              className="rounded-full border px-2.5 py-1 font-mono text-[9px] max-md:text-[10px] uppercase tracking-[0.12em] transition-colors duration-500"
              style={{
                borderColor: hovered ? `${accent}55` : 'rgba(35,35,41,0.95)',
                color: hovered ? '#C9C9D2' : '#8E8E9D',
              }}
            >
              {c}
            </span>
          ))}
        </span>

        <span
          aria-hidden="true"
          className="relative flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-all duration-500"
          style={{
            /* #5F5F6B measured 2.83:1 against the panel — below WCAG AA's 4.5
               for text this small. mist is the palette's tested floor. */
            color: hovered ? accent : '#8E8E9D',
            transform: hovered ? 'translateX(5px)' : 'translateX(0)',
          }}
        >
          Enter the world <span className="text-current">→</span>
        </span>
      </span>
    </button>
  )
}

/**
 * The remaining disciplines.
 *
 * Third attempt at this, and the first two are why it looks like this. Plain
 * hairline rows read as an unstyled table of contents; wrapping them in a
 * bordered panel with numbered rows just made a second, weaker card sitting
 * next to four strong ones.
 *
 * So it stops competing with the cards and starts matching them instead: the
 * same pill language the cards already use for their capabilities, at the same
 * size, wrapped into a block. It reads as the same system rather than another
 * box, and a pill is honest about what these are — a list of things we also do,
 * not four more headline services.
 */
function SupportingList() {
  if (!supportingServices.length) return null
  return (
    <div data-universe-sub className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="h-px w-6 shrink-0" style={{ background: 'var(--accent)' }} />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">
          Also in the studio
        </span>
      </div>

      <ul className="flex flex-wrap gap-2">
        {supportingServices.map((s) => (
          <li key={s.id}>
            <span
              className="inline-flex items-center rounded-full border border-smoke/80 px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-silver transition-all duration-500 hover:border-[color:var(--accent)] hover:text-bone"
              style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
            >
              {s.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
