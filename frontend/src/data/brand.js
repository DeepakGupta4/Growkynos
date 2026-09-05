export const brand = {
  name: 'GENTECHNE',
  wordmark: 'GENTECHNE',
  tagline: 'Design, code & motion under one roof.',
  statement: ['BUILD', 'DIGITAL', 'WORLDS.'],
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
  { word: 'APPS.', serviceId: 'app', browser: 'signalyard', phone: 'meridian-health' },
  { word: 'WEBSITES.', serviceId: 'web', browser: 'obsidian-architects', phone: 'transit-atlas' },
  { word: 'STORES.', serviceId: 'shopify', browser: 'ashgrove-supply', phone: 'lattice-finance' },
  { word: 'NEWSROOMS.', serviceId: 'wordpress', browser: 'chronicle-press', phone: 'transit-atlas' },
  { word: 'PRODUCTS.', serviceId: 'saas', browser: 'signalyard', phone: 'lattice-finance' },
  { word: 'SYSTEMS.', serviceId: 'design', browser: 'vertex-identity', phone: 'meridian-health' },
  { word: 'IMAGERY.', serviceId: 'photo', browser: 'aurelia-campaign', phone: 'lattice-finance' },
  { word: 'FILMS.', serviceId: 'video', browser: 'halcyon-film', phone: 'transit-atlas' },
  { word: 'CAMPAIGNS.', serviceId: 'graphics', browser: 'vertex-identity', phone: 'meridian-health' },
  { word: 'WORKFLOWS.', serviceId: 'ai', browser: 'orbit-automation', phone: 'lattice-finance' },
]

/** The chapter spine — drives nav, the scroll rail and the section readout. */
export const chapters = [
  { id: 'hero', label: 'Entry', short: 'ENTRY' },
  { id: 'services', label: 'Services', short: 'SERVICES' },
  { id: 'world-app', label: 'App Development', short: 'APP' },
  { id: 'world-web', label: 'Web Development', short: 'WEB' },
  { id: 'world-shopify', label: 'Shopify', short: 'SHOPIFY' },
  { id: 'world-wordpress', label: 'WordPress', short: 'WORDPRESS' },
  { id: 'world-saas', label: 'SaaS & Product', short: 'SAAS' },
  { id: 'world-design', label: 'Design', short: 'DESIGN' },
  { id: 'world-photo', label: 'Photo Editing', short: 'PHOTO' },
  { id: 'world-video', label: 'Video Editing', short: 'VIDEO' },
  { id: 'world-ai', label: 'AI & Automation', short: 'AI' },
  { id: 'more-services', label: 'More Services', short: 'MORE' },
  { id: 'projects', label: 'Projects', short: 'PROJECTS' },
  { id: 'studio', label: 'Studio', short: 'STUDIO' },
  { id: 'technology', label: 'Technology', short: 'TECH' },
  { id: 'contact', label: 'Contact', short: 'CONTACT' },
]
