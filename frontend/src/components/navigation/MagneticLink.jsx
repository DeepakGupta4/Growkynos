import { useMagnetic } from '../../hooks/useMagnetic'
import { useSound } from '../../context/SoundContext'
import { cn } from '../../lib/utils'

/**
 * Nav item with a two-layer label: the resting copy slides up and out while a
 * duplicate slides in from below. Reads as a mechanical flip rather than a
 * colour change.
 */
export function MagneticLink({ children, index, onClick, active = false, className, ...props }) {
  const { ref, innerRef } = useMagnetic({ strength: 0.24, innerStrength: 0.5, radius: 1.6 })
  const { sfx } = useSound()

  return (
    <button
      type="button"
      ref={ref}
      data-cursor="link"
      aria-current={active ? 'true' : undefined}
      onPointerEnter={() => sfx('hover', { volume: 0.4 })}
      onClick={(e) => {
        sfx('click')
        onClick?.(e)
      }}
      className={cn(
        'group relative flex items-baseline gap-2 py-2 will-change-transform',
        className,
      )}
      {...props}
    >
      {index && (
        <span
          className={cn(
            'font-mono text-[9px] tabular-nums transition-colors duration-500',
            active ? 'text-brass' : 'text-mist group-hover:text-brass',
          )}
        >
          {index}
        </span>
      )}
      <span ref={innerRef} className="relative block overflow-hidden will-change-transform">
        <span
          className={cn(
            'block font-mono text-[11px] uppercase tracking-[0.16em] transition-transform duration-500 ease-out-expo group-hover:-translate-y-full',
            active ? 'text-bone' : 'text-silver',
          )}
        >
          {children}
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 block translate-y-full font-mono text-[11px] uppercase tracking-[0.16em] text-brass transition-transform duration-500 ease-out-expo group-hover:translate-y-0"
        >
          {children}
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'absolute -bottom-0.5 left-0 h-px bg-brass transition-all duration-500 ease-out-expo',
          active ? 'w-full opacity-100' : 'w-0 opacity-0',
        )}
      />
    </button>
  )
}
