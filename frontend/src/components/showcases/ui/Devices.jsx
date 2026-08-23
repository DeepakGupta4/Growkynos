import { forwardRef } from 'react'
import { cn } from '../../../lib/utils'

/**
 * Device shells. These are drawn, not imaged — so they stay crisp at any
 * scale, take real lighting from CSS, and cost nothing to load.
 */

/* ── Phone ─────────────────────────────────────────────────── */
export const PhoneFrame = forwardRef(function PhoneFrame(
  { children, className, width = 300, screenRef, glare = true },
  ref,
) {
  const height = Math.round(width * 2.1)
  return (
    <div
      ref={ref}
      className={cn('relative preserve-3d will-change-transform', className)}
      style={{ width, height }}
    >
      {/* Body */}
      <div
        className="absolute inset-0 rounded-[13%/6.2%]"
        style={{
          background: 'linear-gradient(148deg,#3A3A44 0%,#1A1A20 26%,#0C0C10 62%,#26262E 100%)',
          boxShadow:
            '0 60px 120px -40px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 1px rgba(255,255,255,0.22)',
        }}
      />
      {/* Bezel */}
      <div
        className="absolute rounded-[12%/5.8%] bg-black"
        style={{ inset: Math.max(3, width * 0.026) }}
      />
      {/* Screen */}
      <div
        ref={screenRef}
        className="absolute overflow-hidden rounded-[11.4%/5.5%] bg-carbon"
        style={{ inset: Math.max(5, width * 0.038) }}
      >
        {children}
      </div>
      {/* Dynamic island */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black"
        style={{ top: width * 0.055, width: width * 0.3, height: width * 0.085 }}
      >
        <span
          className="absolute right-[14%] top-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: width * 0.028,
            height: width * 0.028,
            background: 'radial-gradient(circle at 30% 30%, #2b3a4a, #05070a)',
          }}
        />
      </div>
      {/* Side buttons */}
      <span
        className="absolute -left-[2px] rounded-l-sm"
        style={{ top: '21%', width: 3, height: '5%', background: 'linear-gradient(90deg,#4a4a55,#22222a)' }}
      />
      <span
        className="absolute -left-[2px] rounded-l-sm"
        style={{ top: '29%', width: 3, height: '8%', background: 'linear-gradient(90deg,#4a4a55,#22222a)' }}
      />
      <span
        className="absolute -right-[2px] rounded-r-sm"
        style={{ top: '26%', width: 3, height: '11%', background: 'linear-gradient(270deg,#4a4a55,#22222a)' }}
      />
      {/* Specular glare — sells the glass */}
      {glare && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[13%/6.2%] mix-blend-screen"
          style={{
            background:
              'linear-gradient(122deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 22%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 74%, rgba(198,168,124,0.09) 100%)',
          }}
        />
      )}
    </div>
  )
})

/* ── Browser ───────────────────────────────────────────────── */
export const BrowserFrame = forwardRef(function BrowserFrame(
  { children, className, url = 'growkynos.com', width, style, accent = '#C6A87C', chromeRef, viewportRef },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden rounded-xl preserve-3d will-change-transform', className)}
      style={{
        width,
        background: 'linear-gradient(160deg,#26262E 0%,#141418 40%,#0B0B0F 100%)',
        boxShadow:
          '0 70px 140px -50px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.12)',
        ...style,
      }}
    >
      {/* Chrome */}
      <div
        ref={chromeRef}
        className="flex items-center gap-3 border-b border-white/[0.07] px-3 py-2.5 md:px-4"
      >
        <div className="flex gap-1.5">
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c, opacity: 0.85 }} />
          ))}
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-md bg-black/45 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
          <span className="truncate font-mono text-[9px] tracking-[0.06em] text-silver md:text-[10px]">
            {url}
          </span>
        </div>
        <div className="hidden gap-1.5 md:flex">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[2px] w-3.5 rounded-full bg-mist/60" />
          ))}
        </div>
      </div>
      {/* Viewport */}
      <div ref={viewportRef} className="relative overflow-hidden bg-void">
        {children}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{
          background:
            'linear-gradient(118deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 76%, rgba(198,168,124,0.06) 100%)',
        }}
      />
    </div>
  )
})

/* ── Laptop / desktop plate ────────────────────────────────── */
export const PanelFrame = forwardRef(function PanelFrame({ children, className, label, accent = '#C6A87C', style }, ref) {
  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden rounded-lg preserve-3d will-change-transform', className)}
      style={{
        background: 'linear-gradient(160deg,#1E1E25 0%,#121216 45%,#0A0A0D 100%)',
        boxShadow:
          '0 50px 100px -44px rgba(0,0,0,0.92), 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.09)',
        ...style,
      }}
    >
      {label && (
        <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: accent }}>
            {label}
          </span>
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-1 w-1 rounded-full bg-mist/60" />
            ))}
          </span>
        </div>
      )}
      {children}
    </div>
  )
})

/* ── Screen media: image or video, with poster + lazy loading ── */
export function ScreenMedia({ src, video, poster, alt, className, style, playing = false, priority = false }) {
  if (video) {
    return (
      <VideoMedia src={video} poster={poster ?? src} alt={alt} className={className} style={style} playing={playing} />
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      draggable="false"
      className={cn('h-full w-full object-cover object-top', className)}
      style={style}
    />
  )
}

function VideoMedia({ src, poster, alt, className, style, playing }) {
  return (
    <video
      className={cn('h-full w-full object-cover', className)}
      style={style}
      poster={poster}
      muted
      playsInline
      loop
      preload="none"
      aria-label={alt}
      ref={(el) => {
        if (!el) return
        if (playing && el.paused) el.play().catch(() => {})
        if (!playing && !el.paused) el.pause()
      }}
    >
      {src.webm && <source src={src.webm} type="video/webm" />}
      {src.src && <source src={src.src} type="video/mp4" />}
    </video>
  )
}
