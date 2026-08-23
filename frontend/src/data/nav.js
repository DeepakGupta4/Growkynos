/**
 * Navigation targets. `target` is an in-page section id on the home route;
 * `to` is a real route. Both are handled by the same cinematic transition.
 */
export const navItems = [
  { id: 'studio', label: 'Studio', target: 'studio', index: '01' },
  { id: 'services', label: 'Services', target: 'services', index: '02' },
  { id: 'projects', label: 'Projects', target: 'projects', index: '03' },
  { id: 'technology', label: 'Technology', target: 'technology', index: '04' },
  { id: 'contact', label: 'Contact', to: '/contact', index: '05' },
]

export const primaryCta = { label: 'Begin a project', to: '/contact' }
