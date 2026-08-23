/**
 * The ten worlds. Order here is the order of the scroll journey.
 *
 * `showcase` maps to a component in components/showcases/registry.js —
 * add a service by adding an entry here plus one showcase component.
 */
export const services = [
  {
    id: 'app',
    index: '01',
    title: 'App Development',
    showcase: 'phone',
    sectionId: 'world-app',
    verb: 'Ships to pockets',
    summary:
      'Native-grade iOS and Android products built once, in React Native and Swift — offline-first, animated, and fast enough to feel invisible.',
    capabilities: ['React Native', 'iOS / Android', 'Offline-first sync', 'Push & realtime', 'App Store delivery'],
    metric: { value: '4.8', unit: '★', caption: 'Average store rating' },
    accent: '#C6A87C',
  },
  {
    id: 'web',
    index: '02',
    title: 'Web Development',
    showcase: 'browser',
    sectionId: 'world-web',
    verb: 'Escapes the browser',
    summary:
      'Marketing sites and web platforms with production-grade engineering underneath — server rendering, edge caching, and motion that never costs a frame.',
    capabilities: ['Next.js', 'Design systems', 'Edge & SSR', 'CMS integration', 'Core Web Vitals'],
    metric: { value: '98', unit: '/100', caption: 'Median Lighthouse' },
    accent: '#9FB4C9',
  },
  {
    id: 'shopify',
    index: '03',
    title: 'Shopify Development',
    showcase: 'store',
    sectionId: 'world-shopify',
    verb: 'Converts',
    summary:
      'Custom Shopify themes and headless storefronts — merchandising that loads instantly and a checkout path engineered around the buyer, not the template.',
    capabilities: ['Custom themes', 'Hydrogen / headless', 'Liquid', 'Subscriptions', 'CRO'],
    metric: { value: '+41', unit: '%', caption: 'Avg. conversion lift' },
    accent: '#A8C0A0',
  },
  {
    id: 'wordpress',
    index: '04',
    title: 'WordPress Development',
    showcase: 'cms',
    sectionId: 'world-wordpress',
    verb: 'Builds itself',
    summary:
      'Editor-first WordPress builds. Custom blocks, ACF architecture and headless front ends — so the content team ships without touching a developer.',
    capabilities: ['Custom Gutenberg blocks', 'ACF architecture', 'Headless WP', 'Multisite', 'Migrations'],
    metric: { value: '0', unit: 'devs', caption: 'Needed to publish' },
    accent: '#B0A8C8',
  },
  {
    id: 'saas',
    index: '05',
    title: 'SaaS / Product Development',
    showcase: 'dashboard',
    sectionId: 'world-saas',
    verb: 'Scales',
    summary:
      'End-to-end product engineering: multi-tenant architecture, billing, permissions, analytics and the dashboard your customers actually live inside.',
    capabilities: ['Multi-tenant', 'Stripe billing', 'RBAC & SSO', 'Realtime data', 'Analytics'],
    metric: { value: '99.9', unit: '%', caption: 'Uptime target' },
    accent: '#C6A87C',
  },
  {
    id: 'design',
    index: '06',
    title: 'UI/UX Design',
    showcase: 'poster',
    sectionId: 'world-design',
    verb: 'Composes',
    summary:
      'Interface systems and brand-grade composition — research, flows, prototypes and a component library engineers can build from without guessing.',
    capabilities: ['Product design', 'Design systems', 'Prototyping', 'Brand systems', 'Motion specs'],
    metric: { value: '240+', unit: '', caption: 'Components shipped' },
    accent: '#D8C4A0',
  },
  {
    id: 'photo',
    index: '07',
    title: 'Photo Editing',
    showcase: 'canvas',
    sectionId: 'world-photo',
    verb: 'Retouches',
    summary:
      'High-end retouching and compositing for commerce and campaign work — masking, colour grading and batch pipelines that hold up at billboard scale.',
    capabilities: ['Retouching', 'Compositing', 'Colour grading', 'Batch pipelines', 'E-commerce cutouts'],
    metric: { value: '12k', unit: '', caption: 'Frames delivered' },
    accent: '#C8A0A0',
  },
  {
    id: 'video',
    index: '08',
    title: 'Video Editing',
    showcase: 'timeline',
    sectionId: 'world-video',
    verb: 'Cuts',
    summary:
      'Story-first editing, motion graphics and colour — from product films to performance ad variants cut for every placement and aspect ratio.',
    capabilities: ['Narrative editing', 'Motion graphics', 'Colour', 'Sound design', 'Ad variants'],
    metric: { value: '3.4', unit: 'x', caption: 'Avg. watch-through' },
    accent: '#A0B8C8',
  },
  {
    id: 'graphics',
    index: '09',
    title: 'Banner / Poster Design',
    showcase: 'poster',
    sectionId: 'world-design',
    verb: 'Prints',
    summary:
      'Campaign graphics with typographic discipline — poster systems, display banners and social kits that stay coherent across a hundred sizes.',
    capabilities: ['Campaign systems', 'Display banners', 'Poster design', 'Social kits', 'Print-ready output'],
    metric: { value: '60+', unit: '', caption: 'Sizes per campaign' },
    accent: '#D8C4A0',
  },
  {
    id: 'ai',
    index: '10',
    title: 'AI & Automation',
    showcase: 'flow',
    sectionId: 'world-ai',
    verb: 'Operates',
    summary:
      'Retrieval systems, agents and internal automation wired into the tools you already run — evaluated, observable, and safe to put in front of customers.',
    capabilities: ['LLM integration', 'RAG pipelines', 'Agent workflows', 'Internal tooling', 'Evals & guardrails'],
    metric: { value: '31', unit: 'hrs', caption: 'Saved per week' },
    accent: '#9FB4C9',
  },
]

export const getService = (id) => services.find((s) => s.id === id)

/** Worlds get one pinned section each; `design` hosts both 06 and 09. */
export const worldOrder = ['app', 'web', 'shopify', 'wordpress', 'saas', 'design', 'photo', 'video', 'ai']
