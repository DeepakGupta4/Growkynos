import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

/**
 * SOUND-READY ARCHITECTURE
 * ------------------------
 * The experience is designed silent. This bus exists so subtle sound can be
 * switched on later without touching a single component: call sites already
 * emit named cues (`sfx('hover')`), and the bus resolves them against the
 * registry below. Until a file is registered for a cue, the call is a no-op.
 *
 * To enable sound:
 *   1. Drop files into /public/sound/
 *   2. Add them to SOUND_MAP
 * Nothing else changes. Autoplay policy is respected — the context is only
 * created after a real user gesture, and OFF is the default.
 */
const SOUND_MAP = {
  // hover: '/sound/hover.mp3',
  // click: '/sound/click.mp3',
  // transition: '/sound/transition.mp3',
  // enter: '/sound/enter.mp3',
  // reveal: '/sound/reveal.mp3',
  // boot: '/sound/boot.mp3',
}

const SoundContext = createContext(null)
const PREF_KEY = 'gt:sound'

export function SoundProvider({ children }) {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem(PREF_KEY) === 'on'
    } catch {
      return false
    }
  })

  const ctxRef = useRef(null)
  const buffers = useRef(new Map())
  const gainRef = useRef(null)
  const available = Object.keys(SOUND_MAP).length > 0

  const ensureContext = useCallback(async () => {
    if (!available) return null
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      ctxRef.current = new AC()
      gainRef.current = ctxRef.current.createGain()
      gainRef.current.gain.value = 0.28
      gainRef.current.connect(ctxRef.current.destination)
    }
    if (ctxRef.current.state === 'suspended') await ctxRef.current.resume()
    return ctxRef.current
  }, [available])

  const load = useCallback(
    async (name) => {
      const url = SOUND_MAP[name]
      if (!url) return null
      if (buffers.current.has(name)) return buffers.current.get(name)
      const ctx = await ensureContext()
      if (!ctx) return null
      try {
        const res = await fetch(url)
        const buf = await ctx.decodeAudioData(await res.arrayBuffer())
        buffers.current.set(name, buf)
        return buf
      } catch {
        buffers.current.set(name, null)
        return null
      }
    },
    [ensureContext],
  )

  /** Fire a named cue. Silent and free when sound is off or unregistered. */
  const sfx = useCallback(
    async (name, { volume = 1, rate = 1 } = {}) => {
      if (!enabled || !SOUND_MAP[name]) return
      const ctx = await ensureContext()
      const buf = await load(name)
      if (!ctx || !buf) return
      const src = ctx.createBufferSource()
      const g = ctx.createGain()
      g.gain.value = volume
      src.buffer = buf
      src.playbackRate.value = rate
      src.connect(g).connect(gainRef.current)
      src.start(0)
    },
    [enabled, ensureContext, load],
  )

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem(PREF_KEY, next ? 'on' : 'off')
      } catch {
        /* ignore */
      }
      if (next) ensureContext()
      return next
    })
  }, [ensureContext])

  useEffect(
    () => () => {
      ctxRef.current?.close?.()
    },
    [],
  )

  const value = useMemo(() => ({ enabled, toggle, sfx, available }), [enabled, toggle, sfx, available])

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
}

export function useSound() {
  const ctx = useContext(SoundContext)
  // Safe fallback so components never need a null check.
  return ctx ?? { enabled: false, toggle: () => {}, sfx: () => {}, available: false }
}
