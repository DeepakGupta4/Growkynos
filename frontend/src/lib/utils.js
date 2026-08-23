/**
 * Small, dependency-free helpers shared across the experience.
 */

export function cn(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(' ')
}

export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export const lerp = (a, b, t) => a + (b - a) * t

/** Map a value from one range into another, clamped. */
export const mapRange = (value, inMin, inMax, outMin, outMax) => {
  if (inMax === inMin) return outMin
  return outMin + (clamp((value - inMin) / (inMax - inMin)) * (outMax - outMin))
}

/** Frame-rate independent damping — use instead of a raw lerp in RAF loops. */
export const damp = (current, target, smoothing, dt) =>
  lerp(current, target, 1 - Math.pow(smoothing, dt * 60))

export const pad2 = (n) => String(n).padStart(2, '0')

/** Deterministic pseudo-random — keeps layouts stable across renders/SSR. */
export function seeded(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export const splitToChars = (text) =>
  Array.from(text).map((char, i) => ({ char, key: `${char}-${i}`, isSpace: char === ' ' }))

/** Split a string into words while preserving explicit line breaks. */
export const splitToLines = (text) => text.split('\n').map((line) => line.trim())

export function formatBytes(bytes) {
  if (!bytes) return '0 KB'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

export const isBrowser = typeof window !== 'undefined'

export const prefersReducedMotion = () =>
  isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const supportsHover = () =>
  isBrowser && window.matchMedia('(hover: hover) and (pointer: fine)').matches

/** Rough device tier used to scale particle counts and 3D quality. */
export function deviceTier() {
  if (!isBrowser) return 'high'
  const cores = navigator.hardwareConcurrency || 4
  const mem = navigator.deviceMemory || 4
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const narrow = window.innerWidth < 768
  if (narrow || coarse) return cores >= 8 && mem >= 6 ? 'medium' : 'low'
  if (cores >= 8 && mem >= 8) return 'high'
  if (cores >= 4) return 'medium'
  return 'low'
}
