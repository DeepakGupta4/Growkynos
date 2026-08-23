import { useProjectEntry } from '../../projects/ProjectEntryContext'
import { cn } from '../../../lib/utils'

/** Compact project attribution shown beneath a device in a world. */
export function ProjectTag({ project, accent = '#C6A87C', className }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center', className)}>
      <span className="font-display text-[13px] font-semibold text-bone">{project.title}</span>
      <span className="h-1 w-1 rounded-full bg-smoke" />
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist">{project.client}</span>
      <span className="h-1 w-1 rounded-full bg-smoke" />
      <span className="font-mono text-[9px] tabular-nums" style={{ color: accent }}>
        {project.year}
      </span>
      {project.url && (
        <>
          <span className="h-1 w-1 rounded-full bg-smoke" />
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer noopener"
            data-cursor="link"
            className="font-mono text-[9px] uppercase tracking-[0.14em] text-silver underline decoration-smoke underline-offset-4 transition-colors hover:text-brass"
          >
            Live ↗
          </a>
        </>
      )}
    </div>
  )
}

/**
 * Reduced-motion fallback for every world. Same content, no choreography —
 * the requirement that the site stays understandable without animation.
 */
export function StaticShowcase({ project, service, aspect = 'wide' }) {
  const { enterProject } = useProjectEntry()

  return (
    <div className="flex flex-col gap-8">
      <div
        className={cn(
          'grid gap-4',
          aspect === 'phone' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2',
        )}
      >
        {project.images.map((src, i) => (
          <figure key={src} className="surface overflow-hidden rounded-lg">
            <img
              src={src}
              alt={`${project.title} — view ${i + 1}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-top"
            />
          </figure>
        ))}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-6 border-t border-smoke/60 pt-6">
        <div className="flex flex-col gap-2">
          <span className="label" style={{ color: service.accent }}>
            {project.category}
          </span>
          <h3 className="font-display text-2xl font-semibold text-bone">{project.title}</h3>
          <p className="max-w-xl text-sm leading-relaxed text-silver">{project.excerpt}</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {project.technologies.map((t) => (
              <li
                key={t}
                className="rounded-full border border-smoke px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-mist"
              >
                {t}
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={(e) => enterProject(project, e.currentTarget)}
          className="rounded-full border border-brass/50 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-brass transition-colors hover:bg-brass hover:text-void"
        >
          View project →
        </button>
      </div>
    </div>
  )
}

/** Thin metric readout used inside several worlds. */
export function MetricRow({ items, accent = '#C6A87C', className }) {
  return (
    <dl className={cn('flex flex-wrap gap-x-8 gap-y-3', className)}>
      {items.map((it) => (
        <div key={it.label} className="flex flex-col gap-1">
          <dd
            className="font-display text-xl font-bold leading-none tabular-nums md:text-2xl"
            style={{ color: accent }}
          >
            {it.value}
          </dd>
          <dt className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-mist">{it.label}</dt>
        </div>
      ))}
    </dl>
  )
}
