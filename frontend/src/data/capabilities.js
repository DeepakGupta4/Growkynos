/**
 * MORE SERVICES
 * -------------
 * The capabilities that do not get a full world of their own — because they
 * support the ten that do, rather than because they matter less.
 *
 * Deliberately excludes anything already built as a world (App, Web, Shopify,
 * WordPress, SaaS, UI/UX, Photo, Video, Banner/Poster, AI): listing those twice
 * would pad the section and tell the visitor nothing new.
 *
 * `orbit` is which ring the node sits on (0 = innermost). `angle` is its
 * starting position in degrees — authored, so the composition stays balanced.
 */
export const capabilities = [
  {
    id: 'branding',
    title: 'Branding & Identity',
    short: 'Branding',
    orbit: 0,
    angle: 18,
    summary:
      'Naming, identity systems and the typographic rules that keep a brand coherent once we hand it back.',
    deliverables: ['Identity system', 'Typography', 'Tone of voice', 'Brand guidelines'],
  },
  {
    id: 'custom-software',
    title: 'Custom Software',
    short: 'Software',
    orbit: 0,
    angle: 140,
    summary:
      'Internal tools, integrations and the unglamorous systems that quietly run a business properly.',
    deliverables: ['Internal tooling', 'API integration', 'Data pipelines', 'Migrations'],
  },
  {
    id: 'seo',
    title: 'SEO & Growth',
    short: 'SEO',
    orbit: 0,
    angle: 262,
    summary:
      'Technical SEO, Core Web Vitals and the structured data that makes a fast site legible to machines.',
    deliverables: ['Technical audits', 'Core Web Vitals', 'Structured data', 'Content strategy'],
  },
  {
    id: 'content',
    title: 'Content Production',
    short: 'Content',
    orbit: 1,
    angle: 62,
    summary:
      'Copy, photography and art direction produced against the design system rather than poured into it afterwards.',
    deliverables: ['Copywriting', 'Art direction', 'Photography', 'Asset libraries'],
  },
  {
    id: 'devops',
    title: 'Cloud & DevOps',
    short: 'DevOps',
    orbit: 1,
    angle: 178,
    summary:
      'Deployment pipelines, observability and infrastructure sized to what you actually run.',
    deliverables: ['CI/CD', 'Infrastructure as code', 'Monitoring', 'Cost optimisation'],
  },
  {
    id: 'accessibility',
    title: 'Accessibility Audits',
    short: 'A11y',
    orbit: 1,
    angle: 300,
    summary:
      'WCAG audits with a remediation plan an engineer can act on — not a PDF of violations.',
    deliverables: ['WCAG 2.2 audit', 'Screen-reader testing', 'Remediation plan', 'Team training'],
  },
  {
    id: 'maintenance',
    title: 'Maintenance & Support',
    short: 'Support',
    orbit: 2,
    angle: 108,
    summary:
      'Retained engineering for the years after launch. Dependencies, security patches, small features.',
    deliverables: ['Retained hours', 'Security patching', 'Uptime monitoring', 'Feature work'],
  },
  {
    id: 'analytics',
    title: 'Analytics & Insight',
    short: 'Analytics',
    orbit: 2,
    angle: 232,
    summary:
      'Event design and privacy-respecting measurement that answers questions instead of collecting everything.',
    deliverables: ['Event taxonomy', 'Dashboards', 'Cookieless analytics', 'Experimentation'],
  },
  {
    id: 'consulting',
    title: 'Product Consulting',
    short: 'Consulting',
    orbit: 2,
    angle: 348,
    summary:
      'Discovery, technical due diligence and a second opinion before you commit a budget.',
    deliverables: ['Discovery sprints', 'Technical due diligence', 'Roadmapping', 'Team review'],
  },
]

export const getCapability = (id) => capabilities.find((c) => c.id === id)

/** Ring radii as a fraction of the stage, innermost first. */
export const ORBITS = [0.24, 0.38, 0.52]
