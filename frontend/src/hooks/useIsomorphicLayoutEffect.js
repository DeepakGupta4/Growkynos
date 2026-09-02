import { useEffect, useLayoutEffect } from 'react'

/**
 * GSAP setup MUST run in a layout effect.
 *
 * ScrollTrigger's `pin` physically relocates the pinned element into a
 * `pin-spacer` wrapper it injects into the DOM. If teardown is deferred to a
 * passive `useEffect` cleanup, React can remove those nodes first and then
 * throw `NotFoundError: Failed to execute 'removeChild'` — which takes out the
 * whole route change. A layout effect's cleanup runs synchronously before
 * React touches the DOM, so `ctx.revert()` puts the tree back first.
 *
 * Guarded for non-DOM environments so a future SSR pass doesn't warn.
 */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect
