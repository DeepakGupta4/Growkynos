import { useCallback, useRef, useState } from 'react'
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect'
import { gsap } from '../../lib/gsap'
import { brand, heroStory } from '../../data/brand'
import { WordCycle } from './WordCycle'
import { HeroSequence } from './HeroSequence'
import { services } from '../../data/services'
import { HeroField } from './HeroField'
import { HeroVisual } from './HeroVisual'
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
      {/* Environment */}
      <HeroField scrollProgress={progress} />
      <div className="pointer-events-none absolute inset-0 grid-field opacity-[0.55] mask-fade-edges" />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64"
        style={{ background: 'linear-gradient(180deg, rgba(5,5,7,0) 0%, #050507 92%)' }}
      />

      {/*
        Fixed height, not min-height: the hero is a single frame. Top padding is
        derived from the nav so the statement clears it at any size, and the
        bottom leaves room for the scroll cue.

        Two columns from lg up: the statement no longer stretches across the
        full width leaving a wall of black beside it — the visual cluster holds
        the right-hand half.
      */}
      <div
        className="shell relative z-20 grid h-full grid-cols-1 items-center gap-10 pb-20 xl:grid-cols-[minmax(0,1.06fr)_minmax(0,0.94fr)] xl:gap-8"
        style={{ paddingTop: 'calc(var(--nav-h) + 1.5rem)' }}
      >
        <div data-hero-type className="preserve-3d">
          {/*
            The old eyebrow read "GENTECHNE — DIGITAL PRODUCT STUDIO — EST. 2019",
            which is word-for-word what the nav already says two inches above it.
            Removing it costs no information and returns ~55px of height to the
            statement, which is the element that actually has to carry the page.
          */}
          <div data-hero-eyebrow className="mb-4 flex overflow-hidden md:mb-5">
            <span className="inline-block overflow-hidden">
              <span className="label inline-block">EST. {brand.since}</span>
            </span>
          </div>

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
              <WordCycle
                words={heroStory}
                onCommit={setSlideStable}
                holdMs={HOLD_MS}
                className="hero-size flex font-display text-display-1 font-extrabold text-brass"
                style={{ textShadow: '0 0 60px rgba(198,168,124,0.28)' }}
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
                The stats are the first thing to go on a short viewport — they
                are the least load-bearing element here, and dropping them keeps
                the CTAs above the fold on 720–800px-tall laptops.
              */}
              <dl className="hidden flex-wrap gap-x-8 gap-y-3 pt-1 [@media(min-height:780px)]:flex">
                {[
                  ['90+', 'Projects'],
                  ['14', 'Countries'],
                  ['10', 'Disciplines'],
                ].map(([v, k]) => (
                  <div key={k} className="flex flex-col gap-1">
                    <dt className="label">{k}</dt>
                    <dd className="font-display text-2xl font-semibold tabular-nums text-bone">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div data-hero-actions className="flex flex-wrap items-center gap-3 md:gap-4">
              <Button onClick={() => go('/contact', { label: 'BEGIN A PROJECT' })} size="lg">
                Start a project
                <span aria-hidden="true">&rarr;</span>
              </Button>
              <Button variant="ghost" size="lg" onClick={() => scrollTo('#services', { duration: 1.8 })}>
                View our work
                <span aria-hidden="true" className="transition-transform duration-500 group-hover:translate-y-0.5">
                  ↓
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Right column: the products the statement is claiming */}
        <HeroVisual slideIndex={slide} />

        {/* Scroll cue */}
        <div
          data-hero-scroll
          className="pointer-events-none absolute inset-x-0 bottom-6 flex items-center justify-center gap-3 md:bottom-8"
        >
          <span className="label">SCROLL TO ENTER</span>
          <span className="relative block h-8 w-px overflow-hidden bg-smoke">
            <span
              className="absolute inset-x-0 top-0 h-3 bg-brass"
              style={{ animation: 'gt-scanline 2.2s cubic-bezier(0.4,0,0.1,1) infinite' }}
            />
          </span>
        </div>
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
