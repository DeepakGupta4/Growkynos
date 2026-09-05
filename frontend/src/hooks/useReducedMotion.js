import { useMediaQuery } from './useMediaQuery'

/**
 * The SYSTEM motion preference, nothing more.
 *
 * Deliberately does not stamp `<html data-reduced-motion>`: the value the rest
 * of the site acts on is the RESOLVED preference (system, unless the visitor
 * has overridden it), and that lives in ExperienceContext. Two writers on one
 * attribute meant the CSS flag could disagree with the JS behaviour.
 */
export function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
