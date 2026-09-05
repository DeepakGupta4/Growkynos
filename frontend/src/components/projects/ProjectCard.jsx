import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

/**
 * A project as a physical plate. Deliberately thin: the universe owns all
 * positioning and depth, the card owns only its own material and content —
 * which is what lets one component serve every project in the data file.
 */
export const ProjectCard = forwardRef(function ProjectCard(
  { project, index, onSelect, compact = false, className, style, priority = false },
  ref,
) {
  return (
    <button
      type="button"
      ref={ref}
      data-project-card
      data-project-id={project.id}
      data-cursor="view"
      data-cursor-label="VIEW"
      onClick={(e) => onSelect?.(project, e.currentTarget)}
      aria-label={`${project.title} — ${project.category}. ${project.excerpt}`}
      className={cn(
        'group absolute left-1/2 top-1/2 overflow-hidden rounded-lg text-left preserve-3d will-change-transform',
        className,
      )}
      style={{
        width: compact ? 168 : 268,
        background: 'linear-gradient(160deg,#1A1A20 0%,#0D0D11 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 40px 90px -38px rgba(0,0,0,0.95)',
        ...style,
      }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: '16 / 10' }}>
        <img
          src={project.thumbnail}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          draggable="false"
          className="h-full w-full object-cover object-top transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.06]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-700 group-hover:opacity-25"
          style={{ background: 'linear-gradient(180deg, rgba(5,5,7,0.25) 0%, rgba(5,5,7,0.85) 100%)' }}
        />
        <span className="absolute left-2.5 top-2.5 font-mono text-[9px] tabular-nums text-brass">
          {String(index + 1).padStart(2, '0')}
        </span>
        {project.featured && (
          <span className="absolute right-2.5 top-2.5 h-1 w-1 rounded-full bg-brass" />
        )}
      </div>

      <div className={cn('flex flex-col gap-1', compact ? 'p-2.5' : 'p-3.5')}>
        <span
          className={cn(
            'truncate font-display font-semibold leading-tight text-bone',
            compact ? 'text-[11.5px]' : 'text-[14px]',
          )}
        >
          {project.title}
        </span>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-[9px] uppercase tracking-[0.13em] text-mist">
            {project.category}
          </span>
          <span className="shrink-0 font-mono text-[9px] tabular-nums text-mist">{project.year}</span>
        </div>
      </div>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-lg border border-brass/0 transition-colors duration-500 group-hover:border-brass/60"
      />
    </button>
  )
})
