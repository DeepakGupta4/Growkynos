import { useEffect, useRef } from 'react'
import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect'
import { useParams } from 'react-router-dom'
import { gsap, ScrollTrigger, EASE, SCRUB } from '../lib/gsap'
import { getProject, adjacentProjects } from '../data/projects'
import { getService } from '../data/services'
import { useSEO } from '../hooks/useSEO'
import { useExperience } from '../context/ExperienceContext'
import { useProjectEntry } from '../components/projects/ProjectEntryContext'
import { useTransition } from '../components/transitions/TransitionProvider'
import { Button } from '../components/ui/Button'
import NotFound from './NotFound'

/**
 * PROJECT DETAIL
 * --------------
 * The arrival point of the FLIP entry. The hero image is deliberately rendered
 * full-bleed at the top so it lands exactly where the transition layer released
 * it — that continuity is what makes the move read as *entering* the project
 * rather than opening a page about it.
 */
export default function ProjectPage() {
  const { id } = useParams()
  const project = getProject(id)
  const rootRef = useRef(null)
  const { reducedMotion } = useExperience()
  const { enterProject } = useProjectEntry()
  const { go } = useTransition()

  useSEO({
    title: project ? `${project.title} — ${project.category} | GROWKYNOS` : 'Project — GROWKYNOS',
    description: project?.excerpt ?? 'A GROWKYNOS project.',
    path: `/work/${id}`,
    image: project?.thumbnail ?? '/og.svg',
    type: 'article',
  })

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !project || reducedMotion) return undefined

    const ctx = gsap.context(() => {
      // Hero settles out of the transition rather than animating from nothing.
      gsap.from('[data-pp-hero-img]', {
        scale: 1.08,
        duration: 1.8,
        ease: EASE.settle,
      })

      gsap.to('[data-pp-hero-img]', {
        yPercent: 14,
        ease: 'none',
        scrollTrigger: { trigger: '[data-pp-hero]', start: 'top top', end: 'bottom top', scrub: SCRUB },
      })

      gsap.from('[data-pp-title] > span', {
        yPercent: 116,
        opacity: 0,
        duration: 1.2,
        ease: EASE.settle,
        stagger: 0.08,
        delay: 0.15,
      })

      gsap.from('[data-pp-meta] > *', {
        y: 24,
        autoAlpha: 0,
        duration: 0.9,
        ease: EASE.settle,
        stagger: 0.06,
        delay: 0.4,
      })

      gsap.utils.toArray('[data-pp-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 46,
          autoAlpha: 0,
          duration: 1.1,
          ease: EASE.settle,
          scrollTrigger: { trigger: el, start: 'top 88%' },
        })
      })

      gsap.utils.toArray('[data-pp-figure]').forEach((fig) => {
        const img = fig.querySelector('img')
        gsap.from(fig, {
          clipPath: 'inset(14% 8% 14% 8%)',
          duration: 1.4,
          ease: EASE.travel,
          scrollTrigger: { trigger: fig, start: 'top 86%' },
        })
        if (img) {
          gsap.fromTo(
            img,
            { yPercent: -7 },
            {
              yPercent: 7,
              ease: 'none',
              scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: SCRUB },
            },
          )
        }
      })

      gsap.utils.toArray('[data-pp-result]').forEach((el) => {
        const raw = el.dataset.value ?? ''
        const num = Number.parseFloat(raw.replace(/[^0-9.]/g, ''))
        if (!Number.isFinite(num)) return
        const prefix = raw.match(/^[^0-9.]*/)?.[0] ?? ''
        const suffix = raw.match(/[^0-9.]*$/)?.[0] ?? ''
        const dec = (raw.split('.')[1] ?? '').replace(/[^0-9]/g, '').length
        const obj = { v: 0 }
        gsap.to(obj, {
          v: num,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 92%' },
          onUpdate: () => {
            el.textContent = `${prefix}${dec ? obj.v.toFixed(dec) : Math.round(obj.v)}${suffix}`
          },
        })
      })
    }, root)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [project, reducedMotion])

  if (!project) return <NotFound />

  const service = getService(project.serviceId)
  const accent = service?.accent ?? '#C6A87C'
  const { prev, next } = adjacentProjects(project.id)

  return (
    <article ref={rootRef} className="relative">
      {/* Hero — the FLIP layer releases onto this image */}
      <header data-pp-hero className="relative h-[86svh] w-full overflow-hidden">
        <img
          data-pp-hero-img
          src={project.thumbnail}
          alt={`${project.title} — ${project.category}`}
          className="h-[114%] w-full object-cover object-top will-change-transform"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(5,5,7,0.62) 0%, rgba(5,5,7,0.15) 34%, rgba(5,5,7,0.9) 100%)',
          }}
        />

        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="shell flex flex-col gap-6 pb-10 md:pb-14">
            <span className="label" style={{ color: accent }}>
              {project.category} · {project.year}
            </span>
            <h1 data-pp-title className="font-display text-display-2 font-extrabold text-bone">
              <span className="line-mask">
                <span>{project.title}</span>
              </span>
            </h1>
            <div data-pp-meta className="flex flex-wrap items-end justify-between gap-6">
              <p className="max-w-lg text-[15px] leading-relaxed text-silver">{project.excerpt}</p>
              <div className="flex flex-wrap gap-x-10 gap-y-4">
                <div className="flex flex-col gap-1.5">
                  <span className="label">CLIENT</span>
                  <span className="font-display text-[15px] text-bone">{project.client}</span>
                </div>
                {project.url && (
                  <div className="flex flex-col gap-1.5">
                    <span className="label">LIVE</span>
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      data-cursor="link"
                      className="font-display text-[15px] text-bone underline decoration-smoke underline-offset-4 transition-colors duration-400 hover:text-brass"
                    >
                      {project.url.replace('https://', '')} ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="shell flex flex-col gap-20 py-20 md:gap-32 md:py-28">
        <section data-pp-reveal className="grid gap-10 md:grid-cols-12">
          <div className="flex flex-col gap-4 md:col-span-3">
            <span className="label">THE WORK</span>
            <ul className="flex flex-col gap-0 border-t border-smoke/60">
              {project.scope.map((s) => (
                <li key={s} className="border-b border-smoke/50 py-2.5 text-[13px] text-silver">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-8 md:col-start-5">
            <p className="text-[clamp(1.05rem,2.1vw,1.5rem)] leading-relaxed text-bone">
              {project.description}
            </p>
          </div>
        </section>

        {/* Results */}
        {project.results?.length > 0 && (
          <section data-pp-reveal className="flex flex-col gap-8">
            <span className="label">OUTCOMES</span>
            <dl className="grid gap-x-8 gap-y-10 border-y border-smoke/60 py-10 sm:grid-cols-2 lg:grid-cols-3">
              {project.results.map((r) => (
                <div key={r.label} className="flex flex-col gap-2">
                  <dd
                    data-pp-result
                    data-value={r.value}
                    className="font-display text-[clamp(2.2rem,5.5vw,3.8rem)] font-extrabold leading-none tabular-nums"
                    style={{ color: accent }}
                  >
                    {r.value}
                  </dd>
                  <dt className="label">{r.label}</dt>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Gallery */}
        <section className="flex flex-col gap-6 md:gap-10">
          <div data-pp-reveal className="flex items-baseline justify-between">
            <span className="label">SELECTED VIEWS</span>
            <span className="font-mono text-[10px] tabular-nums text-mist">
              {String(project.images.length).padStart(2, '0')} FRAMES
            </span>
          </div>

          {project.video?.src && (
            <figure data-pp-figure className="overflow-hidden rounded-lg border border-smoke/70">
              <video
                className="w-full"
                poster={project.video.poster ?? project.thumbnail}
                controls
                muted
                playsInline
                preload="none"
                aria-label={`${project.title} — project film`}
              >
                {project.video.webm && <source src={project.video.webm} type="video/webm" />}
                <source src={project.video.src} type="video/mp4" />
                Your browser cannot play this video.
              </video>
            </figure>
          )}

          <div className="grid gap-5 md:gap-8">
            {project.images.map((src, i) => (
              <figure
                key={src}
                data-pp-figure
                className={`overflow-hidden rounded-lg border border-smoke/70 ${
                  i % 3 === 0 ? 'md:col-span-full' : ''
                }`}
              >
                <img
                  src={src}
                  alt={`${project.title} — view ${i + 1} of ${project.images.length}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full object-cover will-change-transform"
                />
              </figure>
            ))}
          </div>
        </section>

        {/* Stack */}
        <section data-pp-reveal className="grid gap-8 md:grid-cols-12">
          <span className="label md:col-span-3">BUILT WITH</span>
          <ul className="flex flex-wrap gap-2.5 md:col-span-9">
            {project.technologies.map((t) => (
              <li
                key={t}
                className="rounded-full border border-smoke px-4 py-2 font-mono text-[10px] uppercase tracking-[0.13em] text-silver"
              >
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section
          data-pp-reveal
          className="surface flex flex-col items-start gap-6 rounded-xl p-8 md:flex-row md:items-center md:justify-between md:p-12"
        >
          <div className="flex flex-col gap-2.5">
            <h2 className="font-display text-display-4 font-semibold text-bone">
              Building something like this?
            </h2>
            <p className="max-w-md text-[14px] leading-relaxed text-mist">
              We take on a limited number of projects a year. Tell us what you have in mind.
            </p>
          </div>
          <Button size="lg" onClick={() => go('/contact', { label: 'BEGIN A PROJECT' })}>
            Begin a project
          </Button>
        </section>
      </div>

      {/* Adjacent projects */}
      <nav aria-label="More projects" className="border-t border-smoke/50">
        <div className="grid md:grid-cols-2">
          {[
            { p: prev, dir: 'PREVIOUS', align: 'items-start' },
            { p: next, dir: 'NEXT', align: 'md:items-end' },
          ].map(({ p, dir, align }) =>
            p ? (
              <button
                key={dir}
                type="button"
                data-cursor="view"
                data-cursor-label="VIEW"
                onClick={(e) => enterProject(p, e.currentTarget)}
                className={`group relative flex flex-col gap-3 overflow-hidden border-smoke/50 p-8 text-left md:p-14 ${align} ${
                  dir === 'PREVIOUS' ? 'border-b md:border-b-0 md:border-r' : ''
                }`}
              >
                <img
                  src={p.thumbnail}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover object-top opacity-[0.12] transition-all duration-[900ms] ease-out-expo group-hover:scale-105 group-hover:opacity-30"
                />
                <span className="relative label-brass">{dir}</span>
                <span className="relative font-display text-[clamp(1.5rem,4vw,2.6rem)] font-semibold leading-tight tracking-tight text-bone transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
                  {p.title}
                </span>
                <span className="relative font-mono text-[10px] uppercase tracking-[0.14em] text-mist">
                  {p.category}
                </span>
              </button>
            ) : null,
          )}
        </div>
      </nav>
    </article>
  )
}
