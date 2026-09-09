import { useCallback, useEffect, useRef, useState } from 'react'
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect'
import { gsap } from '../../lib/gsap'
import { brand, heroStory } from '../../data/brand'
import { WordCycle } from './WordCycle'
import { HeroSequence } from './HeroSequence'
import { services } from '../../data/services'
import { HeroBackdrop } from './HeroBackdrop'
import { HeroVisual, HERO_LOOK } from './HeroVisual'
import { Button } from '../ui/Button'
import { useExperience } from '../../context/ExperienceContext'
import { useTransition } from '../transitions/TransitionProvider'
import { scrollTo } from '../../hooks/useLenis'
import { buildHeroIntro, buildHeroScrollHandoff } from '../../animations/heroAnimations'

/** One place to tune the hero's rhythm — the word, the bar and the scene share it. */
const HOLD_MS = 2600

export function Hero() {
  const rootRef = useRef(null)
  const progress = useRef(0)
  const { reducedMotion, booted } = useExperience()
  const { go } = useTransition()

  /* Which beat the hero is on. WordCycle commits this at the exact frame the
     new word lands, so the scene on the right never disagrees with the word. */
  const [slide, setSlide] = useState(0)
  const setSlideStable = useCallback((i) => setSlide(i), [])
  const story = heroStory[slide] ?? heroStory[0]
  const look = HERO_LOOK[story.scene] ?? HERO_LOOK.app

  /*
   * Publish the active service colour to the document, so chrome that lives
   * outside the hero — the nav, its sliding indicator, the scroll progress
   * line — can follow the same cut. Cleared on unmount so routes without a
   * hero fall back to brass rather than keeping whatever was last on screen.
   */
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', look.key)
    return () => document.documentElement.style.removeProperty('--accent')
  }, [look.key])

  useIsomorphicLayoutEffect(() => {
    if (!booted) return undefined
    const el = rootRef.current
    if (!el) return undefined

    const ctx = gsap.context(() => {
      buildHeroIntro(el, { reducedMotion, delay: 0.15 })
      buildHeroScrollHandoff(el, {
        reducedMotion,
        onProgress: (p) => {
          progress.current = p
        },
      })
    }, el)

    return () => ctx.revert()
  }, [booted, reducedMotion])

  /*
   * Re-animate the service label and copy on every story beat. Without this the
   * text swaps silently and the left column reads as static — which is exactly
   * how it looked with only the typed word moving.
   */
  useIsomorphicLayoutEffect(() => {
    if (!booted || reducedMotion) return undefined
    const el = rootRef.current
    if (!el) return undefined

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-hero-swap]',
        { autoAlpha: 0, y: 10 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.06, overwrite: 'auto' },
      )
    }, el)

    return () => ctx.revert()
  }, [slide, booted, reducedMotion])

  return (
    <section
      id="hero"
      ref={rootRef}
      aria-label="Introduction"
      className="section relative h-[100svh] w-full overflow-hidden perspective-far"
    >
      {/*
        Environment. ONE field across the whole hero — the star canvas covered
        the full section while the colour wash covered only the right half, and
        the two met at a hard vertical line down the middle of the frame.
      */}
      <HeroBackdrop look={look} />
      <div className="pointer-events-none absolute inset-0 grid-field opacity-[0.22] mask-fade-edges" />
      {/*
        Reading scrim, spanning the FULL width. It has to start at the edge of
        the section rather than at the edge of the product panel — when it began
        at the panel's edge it went from nothing to solid black in one pixel and
        drew a visible seam down the middle of the hero.
      */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(5,5,7,0.80) 0%, rgba(5,5,7,0.62) 28%, rgba(5,5,7,0.24) 54%, rgba(5,5,7,0) 76%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64"
        style={{ background: 'linear-gradient(180deg, rgba(5,5,7,0) 0%, #050507 92%)' }}
      />

      {/*
        The product panel. A sibling of the content rather than a grid column,
        so it can run the full height of the section and bleed off the right
        edge — a composition that has to carry half the frame cannot be boxed
        inside the same padded container as the text.
      */}
      <HeroVisual slideIndex={slide} />

      {/*
        Fixed height, not min-height: the hero is a single frame. Top padding is
        derived from the nav so the statement clears it at any size.

        Single column, capped width: the panel behind it holds the right-hand
        side, so the statement no longer has to stretch to fill the viewport.
      */}
      <div
        className="shell relative z-20 flex h-full items-center pb-16"
        style={{ paddingTop: 'calc(var(--nav-h) + 1.5rem)' }}
      >
        <div data-hero-type className="w-full max-w-[36rem] preserve-3d lg:max-w-[40rem]">
          {/*
            No eyebrow. "EST. 2019" sat here restating what the footer already
            says, and it was one of ELEVEN small mono labels competing in the
            first frame (nav items, motion toggle, sequence counter, per-beat
            line, three stat labels, scroll cue). Small uppercase type is the
            most expensive kind to read and the least worth reading; the frame
            is down to three.
          */}
          {/*
            Two fixed lines that animate in per character, then the cycling
            word. The size steps down twice: at xl because the two-column layout
            narrows this column (the longest word, "AI SYSTEMS.", would run past
            it at 1280), and again below 700px of viewport height so the rest of
            the block still fits. Taking height from the type is the right
            trade — the words stay dominant either way, whereas dropping the
            copy removes the only thing naming what is on screen.
          */}
          <h1
            className="preserve-3d [&_.hero-size]:xl:text-[clamp(3rem,min(9.2vw,15.5svh),8.5rem)] [@media(max-height:899px)]:[&_.hero-size]:text-[clamp(2.4rem,min(9vw,15svh),9rem)] [@media(max-height:700px)]:[&_.hero-size]:text-[clamp(2rem,min(10.5vw,12.5svh),4.75rem)]"
            aria-label={`${brand.statement[0]} ${brand.statement[1]} ${story.word}`}
          >
            {[brand.statement[0], brand.statement[1]].map((line) => (
              <span
                key={line}
                data-hero-line
                className="relative block overflow-hidden pb-[0.06em] preserve-3d"
              >
                <span className="relative flex preserve-3d" aria-hidden="true">
                  {Array.from(line).map((ch, ci) => (
                    <span
                      key={`${line}-${ci}`}
                      data-hero-char
                      className="hero-size inline-block font-display text-display-1 font-extrabold text-gradient-bone will-change-transform"
                      style={{ transformOrigin: '50% 100%' }}
                    >
                      {/* Non-breaking space: a plain space inside an
                          inline-block collapses, which rendered "WEBUILD". */}
                      {ch === ' ' ? '\u00A0' : ch}
                    </span>
                  ))}
                </span>
                {/* Light pass */}
                <span
                  data-hero-sweep
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 w-[28%] opacity-0 mix-blend-overlay"
                  style={{
                    background:
                      'linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 48%, rgba(198,168,124,0.5) 62%, rgba(255,255,255,0) 100%)',
                    filter: 'blur(2px)',
                  }}
                />
              </span>
            ))}

            {/* No preserve-3d here: this line is never transformed in 3D, and
                keeping it out of the 3D context stops Chrome promoting a layer
                it then has to repaint on every keystroke. */}
            <span data-hero-line className="relative block pb-[0.06em]">
              {/*
                The cycling word takes the ACTIVE SERVICE's colour rather than a
                fixed brass. With the panel behind it now washed in that same
                colour, a gold word over a blue panel read as two designs
                fighting; tying them together is what makes the frame look
                deliberate instead of decorated.
              */}
              <WordCycle
                words={heroStory}
                onCommit={setSlideStable}
                holdMs={HOLD_MS}
                className="hero-size flex font-display text-display-1 font-extrabold transition-colors duration-700"
                style={{ color: look.glow, textShadow: `0 0 70px ${look.key}59` }}
              />
            </span>
          </h1>

          {/*
            Names the service the typed word stands for. NEVER hidden: this is
            the only place the service is named, and hiding it on short windows
            left the whole left column looking static while a single word
            changed. It is line-clamped instead of dropped.
          */}
          {/* Sequence position — the hero's own counter, with a bar that fills
              across each beat so the loop is legible rather than surprising. */}
          <div data-hero-note className="mt-5 md:mt-6">
            <HeroSequence index={slide} holdMs={HOLD_MS} />
          </div>

          {/* Side by side while the statement owns the full width; stacked once
              the visual cluster takes the right-hand column. */}
          <div className="mt-7 flex flex-col gap-6 md:mt-10 md:flex-row md:items-end md:justify-between md:gap-10 xl:flex-col xl:items-start xl:gap-7">
            <div data-hero-meta className="flex max-w-md flex-col gap-3.5">
              {/* The decorative rule and the discipline strip both came out.
                  The strip listed APPS · WEBSITES · SAAS · AI SYSTEMS — exactly
                  the four words the headline already cycles through, with the
                  sequence indicator already saying "01 / 04". Two lines of pure
                  repetition, and the height they cost is what was keeping the
                  statement small. */}
              {/*
                The copy changes with the typed service rather than sitting
                static. Clamped to two lines on short windows so it costs the
                same height everywhere — clamping keeps the story; hiding it
                would not.
              */}
              {/* Positioning line first, then the line for the active beat —
                  so the copy says who we are AND what is on screen. */}
              <p className="text-[15px] leading-relaxed text-bone md:text-[17px]">{brand.lede}</p>
              {/*
                Per-beat detail is the enhancement, not the essential — the
                discipline strip above already states the range and the sequence
                indicator names the active beat. So this is the first thing to
                go when height is short, rather than either of those.
              */}
              <p
                data-hero-swap
                className="hidden font-mono text-[11px] uppercase tracking-[0.13em] text-mist [@media(min-height:820px)]:block"
              >
                {story.line}
              </p>
              {/*
                The "90+ projects / 14 countries / 10 disciplines" block is gone.
                Those numbers were invented, and invented numbers on an agency
                homepage are the fastest way to lose a client who checks — the
                same reason no project in data/projects.js carries a `results`
                block yet. Real figures go back in here the moment they exist.
              */}
            </div>

            <div data-hero-actions className="flex flex-wrap items-center gap-3 md:gap-4">
              {/* Both CTAs take the active service colour, so the buttons
                  belong to the same frame as the field and the headline word
                  rather than staying gold on a magenta ground. */}
              <Button
                onClick={() => go('/contact', { label: 'BEGIN A PROJECT' })}
                size="lg"
                tint={look.key}
                tintGlow={look.glow}
              >
                Start a project
                <span aria-hidden="true">&rarr;</span>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                tint={look.key}
                tintGlow={look.glow}
                onClick={() => scrollTo('#services', { duration: 1.8 })}
              >
                View our work
                <span aria-hidden="true" className="transition-transform duration-500 group-hover:translate-y-0.5">
                  ↓
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/*
          The "SCROLL TO ENTER" cue came out. It sat centred across the bottom
          of the frame, which put it on top of the product panel, and it told
          the visitor to do the one thing every visitor already does. The bar
          under the sequence counter carries the same "there is more" signal
          without spending a line of the frame on it.
        */}
      </div>

      {/* The interface the typography becomes — the first world's index */}
      <div
        data-hero-interface
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 flex items-center opacity-0"
      >
        <div className="shell w-full">
          <div className="surface-raised overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-smoke/60 px-5 py-3.5 md:px-8">
              <span className="label-brass">GENTECHNE / SERVICE INDEX</span>
              <span className="label hidden md:block">SELECT A WORLD</span>
              <span className="font-mono text-[10px] text-mist tabular-nums">{services.length} MODULES</span>
            </div>
            <ul className="max-h-[52svh] overflow-hidden">
              {services.slice(0, 6).map((s) => (
                <li
                  key={s.id}
                  data-hero-interface-row
                  className="flex items-center gap-4 border-b border-smoke/40 px-5 py-3 last:border-0 md:gap-8 md:px-8 md:py-4"
                >
                  <span className="font-mono text-[10px] text-brass tabular-nums">{s.index}</span>
                  <span className="font-display text-[clamp(0.95rem,2.6vw,1.5rem)] font-medium text-bone">
                    {s.title}
                  </span>
                  <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.14em] text-mist md:block">
                    {s.verb}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
