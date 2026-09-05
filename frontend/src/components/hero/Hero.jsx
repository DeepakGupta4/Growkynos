import { useRef } from 'react'
import { useIsomorphicLayoutEffect } from '../../hooks/useIsomorphicLayoutEffect'
import { gsap } from '../../lib/gsap'
import { brand } from '../../data/brand'
import { services } from '../../data/services'
import { HeroField } from './HeroField'
import { Button } from '../ui/Button'
import { useExperience } from '../../context/ExperienceContext'
import { useTransition } from '../transitions/TransitionProvider'
import { scrollTo } from '../../hooks/useLenis'
import { buildHeroIntro, buildHeroScrollHandoff, floatFragments } from '../../animations/heroAnimations'

/**
 * Small floating digital elements — real artefacts of the work, not decoration.
 *
 * All four live in the right-hand column. The statement occupies the left
 * ~55–60% of the frame at every size where these are shown (lg and up), so
 * anchoring them right is what keeps them off the typography instead of
 * sitting behind it.
 */
const FRAGMENTS = [
  { id: 'f1', label: 'build.status', value: 'PASSING', top: '21%', right: '7%', tone: 'sage' },
  { id: 'f2', label: 'frame.budget', value: '16.6 ms', top: '37%', right: '16%', tone: 'brass' },
  { id: 'f3', label: 'lighthouse', value: '98 / 100', top: '53%', right: '6%', tone: 'brass' },
  // Kept clear of the CTA row, which sits at roughly 76–85% of the frame.
  { id: 'f4', label: 'projects.live', value: '90+', top: '64%', right: '24%', tone: 'bone' },
]

const TONE = {
  sage: '#A8C0A0',
  brass: '#C6A87C',
  bone: '#E6E6EA',
}

export function Hero() {
  const rootRef = useRef(null)
  const progress = useRef(0)
  const { reducedMotion, booted, isMobile } = useExperience()
  const { go } = useTransition()

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
      floatFragments(gsap.utils.toArray('[data-hero-frag]'), { reducedMotion })
    }, el)

    return () => ctx.revert()
  }, [booted, reducedMotion])

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
        className="shell relative z-20 grid h-full grid-cols-1 items-center gap-10 pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-14"
        style={{ paddingTop: 'calc(var(--nav-h) + 1.5rem)' }}
      >
        <div data-hero-type className="preserve-3d">
          <div data-hero-eyebrow className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 overflow-hidden md:mb-9">
            <span className="inline-block overflow-hidden">
              <span className="label-brass inline-block">{brand.wordmark}</span>
            </span>
            <span className="inline-block overflow-hidden">
              <span className="label inline-block">— {brand.descriptor}</span>
            </span>
            <span className="inline-block overflow-hidden">
              <span className="label inline-block">EST. {brand.since}</span>
            </span>
          </div>

          <h1 className="preserve-3d" aria-label={brand.statement.join(' ')}>
            {brand.statement.map((line) => (
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
                      className="inline-block font-display text-display-1 font-extrabold text-gradient-bone will-change-transform"
                      style={{ transformOrigin: '50% 100%' }}
                    >
                      {ch}
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
          </h1>

          <div className="mt-7 flex flex-col gap-6 md:mt-10 md:flex-row md:items-end md:justify-between md:gap-10">
            <div data-hero-meta className="flex max-w-md flex-col gap-3.5">
              <div data-hero-rule className="rule-brass h-px w-32 origin-left" />
              <p className="text-[14.5px] leading-relaxed text-silver md:text-base">
                We build apps, websites, storefronts and platforms for companies that need the work to be
                right. {brand.tagline}
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
                Begin a project
              </Button>
              <Button variant="ghost" size="lg" onClick={() => scrollTo('#services', { duration: 1.8 })}>
                Explore the work
                <span aria-hidden="true" className="transition-transform duration-500 group-hover:translate-y-0.5">
                  ↓
                </span>
              </Button>
            </div>
          </div>
        </div>

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
