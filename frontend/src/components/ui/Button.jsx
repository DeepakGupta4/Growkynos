import { forwardRef } from 'react'
import { useMagnetic } from '../../hooks/useMagnetic'
import { useSound } from '../../context/SoundContext'
import { cn } from '../../lib/utils'

/**
 * The site's one button. Magnetic on hover, with the label travelling further
 * than the shell so the two separate slightly — the detail that sells weight.
 */
export const Button = forwardRef(function Button(
  {
    as: Tag = 'button',
    variant = 'primary',
    size = 'md',
    className,
    children,
    onClick,
    magnetic = true,
    ...props
  },
  externalRef,
) {
  const { ref, innerRef } = useMagnetic({ strength: magnetic ? 0.3 : 0, innerStrength: 0.55 })
  const { sfx } = useSound()

  const base =
    'group relative inline-flex select-none items-center justify-center overflow-hidden rounded-full font-mono uppercase tracking-[0.16em] transition-colors duration-500 ease-out-expo will-change-transform'

  const variants = {
    primary: 'bg-brass text-void hover:bg-brass-bright',
    ghost: 'border border-smoke text-bone hover:border-brass/70 hover:text-brass',
    solid: 'bg-bone text-void hover:bg-white',
    quiet: 'text-silver hover:text-bone',
  }

  const sizes = {
    sm: 'h-9 px-5 text-[10px]',
    md: 'h-12 px-7 text-[11px]',
    lg: 'h-16 px-10 text-[12px]',
  }

  return (
    <Tag
      ref={(node) => {
        ref.current = node
        if (typeof externalRef === 'function') externalRef(node)
        else if (externalRef) externalRef.current = node
      }}
      data-cursor="link"
      onClick={(e) => {
        sfx('click')
        onClick?.(e)
      }}
      onPointerEnter={() => sfx('hover', { volume: 0.5 })}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {/* Sheen — a single light pass, not a permanent glow */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-[900ms] ease-out-expo group-hover:translate-x-full"
      />
      <span ref={innerRef} className="relative flex items-center gap-2.5 will-change-transform">
        {children}
      </span>
    </Tag>
  )
})
