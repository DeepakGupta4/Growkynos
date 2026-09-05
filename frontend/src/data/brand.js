export const brand = {
  name: 'GENTECHNE',
  wordmark: 'GENTECHNE',
  tagline: 'Design, code & motion under one roof.',
  statement: ['WE BUILD', 'DIGITAL'],
  /* The value proposition. Says what a client GETS, not what we do. */
  lede: 'We turn ambitious ideas into digital products people actually use.',
  /* The capability strip under the lede — range, in two seconds. */
  disciplines: ['Apps', 'Websites', 'SaaS', 'AI Systems'],
  seo: {
    title: 'Gentechne — Digital Product Studio for Apps, Websites, SaaS & AI',
    description:
      'Gentechne designs and builds high-performance apps, websites, SaaS platforms and AI products for ambitious businesses and startups.',
  },
  descriptor: 'Digital product studio',
  since: 2019,
  email: 'studio@gentechne.com',
  phone: '+91 98765 43210',
  location: 'Remote-first · Building worldwide',
  socials: [
    { label: 'Instagram', href: 'https://instagram.com/gentechne' },
    { label: 'LinkedIn', href: 'https://linkedin.com/company/gentechne' },
    { label: 'Dribbble', href: 'https://dribbble.com/gentechne' },
    { label: 'GitHub', href: 'https://github.com/gentechne' },
  ],
}

/**
 * HERO STORY
 * ----------
 * The hero types the last line of the statement, cycling through ALL TEN
 * services in order — and the visual cluster swaps to the real project that
 * proves each one. The typewriter is not decoration: every word has evidence
 * behind it, and the line underneath names the service in full.
 *
 * WHY SHORT NOUNS RATHER THAN SERVICE NAMES
 * The fixed lines read "BUILD / DIGITAL", so the typed word has to complete
 * that sentence. "BUILD DIGITAL SHOPIFY DEVELOPMENT." is not English, and at
 * display-1 it would be three times too wide. Each service therefore maps to
 * one noun that finishes the sentence properly; `serviceId` carries the real
 * service through so the label below can name it exactly.
 *
 * Words are capped at 10 characters. A longer word overflows the type column
 * at the narrow end of the two-column layout (1280px, column ~650px).
 */
export const heroStory = [
  {
    word: 'APPS.',
    label: 'APPS',
    scene: 'app',
    serviceId: 'app',
    project: 'meridian-health',
    line: 'Offline-first mobile products, built once for iOS and Android.',
  },
  {
    word: 'WEBSITES.',
    label: 'WEBSITES',
    scene: 'web',
    serviceId: 'web',
    project: 'obsidian-architects',
    line: 'Marketing sites and platforms engineered for speed and motion.',
  },
  {
    word: 'AI SYSTEMS.',
    label: 'AI SYSTEMS',
    scene: 'ai',
    serviceId: 'ai',
    project: 'orbit-automation',
    line: 'Retrieval pipelines and agents wired into the tools you already run.',
  },
  {
    word: 'SAAS.',
    label: 'SAAS',
    scene: 'saas',
    serviceId: 'saas',
    project: 'signalyard',
    line: 'Multi-tenant products with billing, permissions and live data.',
  },
]

/** The chapter spine — drives nav, the scroll rail and the section readout. */
export const chapters = [
  { id: 'hero', label: 'Entry', short: 'ENTRY' },
  { id: 'services', label: 'Services', short: 'SERVICES' },
  /* Must match the worlds actually rendered in pages/Home.jsx — a chapter for
     a section that is not on the page leaves the nav readout pointing at
     nothing. */
  { id: 'world-app', label: 'App Development', short: 'APP' },
  { id: 'world-web', label: 'Web Development', short: 'WEB' },
  { id: 'world-saas', label: 'SaaS & Product', short: 'SAAS' },
  { id: 'world-ai', label: 'AI & Automation', short: 'AI' },
  { id: 'more-services', label: 'More Services', short: 'MORE' },
  { id: 'projects', label: 'Projects', short: 'PROJECTS' },
  { id: 'studio', label: 'Studio', short: 'STUDIO' },
  { id: 'technology', label: 'Technology', short: 'TECH' },
  { id: 'contact', label: 'Contact', short: 'CONTACT' },
]
