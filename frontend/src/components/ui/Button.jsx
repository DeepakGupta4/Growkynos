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
    tint = null,
    tintGlow = null,
    style,
    ...props
  },
  externalRef,
) {
  const { ref, innerRef } = useMagnetic({ strength: magnetic ? 0.3 : 0, innerStrength: 0.55 })
  const { sfx } = useSound()

  const base =
    'group relative inline-flex select-none items-center justify-center overflow-hidden rounded-full font-mono uppercase tracking-[0.16em] transition-colors duration-500 ease-out-expo will-change-transform'

  /*
   * `tint` recolours the button to whatever the surrounding frame is doing —
   * the hero passes the active service colour, so the CTA belongs to the same
   * composition as the field behind it instead of staying gold on a magenta
   * ground. Everywhere else the prop is absent and the button stays brass.
   *
   * It goes through CSS custom properties rather than an inline background
   * because inline styles cannot express a hover state, and the hover is the
   * half that makes it read as a control.
   *
   * Label stays `text-void`: every colour in HERO_LOOK is light enough that
   * near-black clears WCAG AA on it (6.4:1 at worst, on the violet), while
   * white would fail on all four.
   */
  const variants = {
    primary: tint
      ? 'bg-[var(--btn)] text-void hover:bg-[var(--btn-glow)]'
      : 'bg-brass text-void hover:bg-brass-bright',
    ghost: tint
      ? 'border border-smoke text-bone hover:border-[var(--btn)] hover:text-[var(--btn-glow)]'
      : 'border border-smoke text-bone hover:border-brass/70 hover:text-brass',
    solid: 'bg-bone text-void hover:bg-white',
    quiet: 'text-silver hover:text-bone',
  }

  const tintVars = tint ? { '--btn': tint, '--btn-glow': tintGlow ?? tint } : null

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
      data-cursor-magnetic=""
      onClick={(e) => {
        sfx('click')
        onClick?.(e)
      }}
      onPointerEnter={() => sfx('hover', { volume: 0.5 })}
      className={cn(base, variants[variant], sizes[size], className)}
      style={tintVars ? { ...tintVars, ...style } : style}
      {...props}
    >
      {/* Sheen — a single light pass, not a permanent glow */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-[900ms] ease-out-expo group-hover:translate-x-full"
      />
      <span
        ref={innerRef}
        className="relative flex items-center gap-2.5 whitespace-nowrap will-change-transform"
      >
        {children}
      </span>
    </Tag>
  )
})
