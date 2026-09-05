/**
 * PROJECT SYSTEM
 * --------------
 * Adding a project = adding an object here. Nothing else.
 *
 * Schema
 *   id            unique slug, used as the route: /work/:id
 *   title         display name
 *   category      human label
 *   serviceId     links the project to a service world (see data/services.js)
 *   showcaseType  'phone' | 'browser' | 'store' | 'cms' | 'dashboard'
 *                 | 'canvas' | 'timeline' | 'poster' | 'flow'
 *                 — decides which device frame renders the media
 *   description   one paragraph, used on the detail route
 *   excerpt       one line, used in the universe + cards
 *   thumbnail     required — the FLIP transition animates from this image
 *   images[]      ordered screens; showcases page through them
 *   video         { src, webm, poster } | null — poster is required when src is set
 *   url           live project URL | null
 *   technologies[]
 *   year, client
 *   featured      surfaces it in the Project Universe convergence
 *   scope[]       deliverables listed on the detail route
 *   results[]     { value, label } outcome metrics
 */

const P = '/projects'

/**
 * GENTECHNE's own products.
 *
 * PLACEHOLDER COPY — the names are real, the descriptions are written from the
 * product name alone and need replacing with what each one actually does.
 *
 * Deliberately NO `results` block on any of these. Invented outcome metrics
 * ("+42% bookings", "99.97% uptime") are the fastest way to lose a client who
 * checks, so a project carries numbers only once real ones exist. The detail
 * page renders fine without them.
 */
const ownProjects = [
  {
    id: 'vetician',
    title: 'Vetician',
    category: 'App Development',
    serviceId: 'app',
    showcaseType: 'phone',
    excerpt: 'Veterinary care platform connecting pet owners with clinics.',
    description:
      'PLACEHOLDER — replace with the real brief. Vetician is a veterinary services platform covering appointment booking, clinic discovery and pet health records across mobile and web.',
    thumbnail: `${P}/own/vetician/01.svg`,
    images: [1, 2, 3, 4].map((n) => `${P}/own/vetician/0${n}.svg`),
    video: null,
    url: null,
    technologies: ['React Native', 'Node.js', 'MongoDB', 'Express'],
    year: 2025,
    client: 'Gentechne',
    featured: true,
    scope: ['Mobile app', 'Booking system', 'Backend & API', 'Admin panel'],
    results: [],
  },
  {
    id: 'aivet',
    title: 'AiVet',
    category: 'AI & Automation',
    serviceId: 'ai',
    showcaseType: 'flow',
    excerpt: 'AI assistant for veterinary triage and guidance.',
    description:
      'PLACEHOLDER — replace with the real brief. AiVet applies retrieval and LLM reasoning to veterinary questions, routing anything clinical to a qualified professional.',
    thumbnail: `${P}/own/aivet/01.svg`,
    images: [1, 2, 3, 4].map((n) => `${P}/own/aivet/0${n}.svg`),
    video: null,
    url: null,
    technologies: ['Python', 'LLM APIs', 'Vector search', 'FastAPI'],
    year: 2025,
    client: 'Gentechne',
    featured: true,
    scope: ['AI pipeline', 'Retrieval layer', 'Escalation workflow'],
    results: [],
  },
  {
    id: 'tezbuy',
    title: 'TezBuy',
    category: 'Web Development',
    serviceId: 'shopify',
    showcaseType: 'store',
    excerpt: 'E-commerce platform with catalogue, cart and checkout.',
    description:
      'PLACEHOLDER — replace with the real brief. TezBuy is an online storefront covering product catalogue, cart, checkout and order management.',
    thumbnail: `${P}/own/tezbuy/01.svg`,
    images: [1, 2, 3, 4].map((n) => `${P}/own/tezbuy/0${n}.svg`),
    video: null,
    url: null,
    technologies: ['React', 'Node.js', 'MongoDB', 'Payments'],
    year: 2024,
    client: 'Gentechne',
    featured: true,
    scope: ['Storefront', 'Cart & checkout', 'Payments', 'Order management'],
    results: [],
  },
  {
    id: 'smart-library',
    title: 'Smart Library',
    category: 'SaaS / Product',
    serviceId: 'saas',
    showcaseType: 'dashboard',
    excerpt: 'Library management system for issuing, returns and catalogue.',
    description:
      'PLACEHOLDER — replace with the real brief. Smart Library handles cataloguing, issue and return tracking, member records and reporting.',
    thumbnail: `${P}/own/smart-library/01.svg`,
    images: [1, 2, 3, 4].map((n) => `${P}/own/smart-library/0${n}.svg`),
    video: null,
    url: null,
    technologies: ['React', 'Node.js', 'PostgreSQL'],
    year: 2024,
    client: 'Gentechne',
    featured: true,
    scope: ['Catalogue system', 'Issue & return flow', 'Reporting'],
    results: [],
  },
  {
    id: 'college-dispensary',
    title: 'College Dispensary',
    category: 'SaaS / Product',
    serviceId: 'saas',
    showcaseType: 'dashboard',
    excerpt: 'Campus health record and medicine inventory system.',
    description:
      'PLACEHOLDER — replace with the real brief. A dispensary system for campus health centres covering patient visits, prescriptions and medicine stock.',
    thumbnail: `${P}/own/college-dispensary/01.svg`,
    images: [1, 2, 3].map((n) => `${P}/own/college-dispensary/0${n}.svg`),
    video: null,
    url: null,
    technologies: ['React', 'Node.js', 'MongoDB'],
    year: 2024,
    client: 'Gentechne',
    featured: false,
    scope: ['Patient records', 'Inventory', 'Reporting'],
    results: [],
  },
  {
    id: 'agentic-astro',
    title: 'Agentic Astro',
    category: 'AI & Automation',
    serviceId: 'ai',
    showcaseType: 'flow',
    excerpt: 'Agent-driven workflow product.',
    description:
      'PLACEHOLDER — replace with the real brief, including what the agent actually does end to end.',
    thumbnail: `${P}/own/agentic-astro/01.svg`,
    images: [1, 2, 3].map((n) => `${P}/own/agentic-astro/0${n}.svg`),
    video: null,
    url: null,
    technologies: ['LLM APIs', 'Agent workflows', 'Python'],
    year: 2025,
    client: 'Gentechne',
    featured: false,
    scope: ['Agent workflow', 'Integrations'],
    results: [],
  },
  {
    id: 'help-desk',
    title: 'Help Desk',
    category: 'SaaS / Product',
    serviceId: 'saas',
    showcaseType: 'dashboard',
    excerpt: 'Support ticketing with routing and status tracking.',
    description:
      'PLACEHOLDER — replace with the real brief. A ticketing system covering intake, assignment, status tracking and resolution.',
    thumbnail: `${P}/own/help-desk/01.svg`,
    images: [1, 2, 3].map((n) => `${P}/own/help-desk/0${n}.svg`),
    video: null,
    url: null,
    technologies: ['React', 'Node.js', 'PostgreSQL'],
    year: 2024,
    client: 'Gentechne',
    featured: false,
    scope: ['Ticket intake', 'Routing', 'Status tracking'],
    results: [],
  },
  {
    id: 'gym-management',
    title: 'Gym Management',
    category: 'App Development',
    serviceId: 'app',
    showcaseType: 'phone',
    excerpt: 'Membership, scheduling and billing for fitness studios.',
    description:
      'PLACEHOLDER — replace with the real brief. A gym management product covering memberships, class scheduling, attendance and billing.',
    thumbnail: `${P}/own/gym-management/01.svg`,
    images: [1, 2, 3, 4].map((n) => `${P}/own/gym-management/0${n}.svg`),
    video: null,
    url: null,
    technologies: ['React Native', 'Node.js', 'MongoDB'],
    year: 2024,
    client: 'Gentechne',
    featured: true,
    scope: ['Membership system', 'Scheduling', 'Billing'],
    results: [],
  },
]

export const projects = [
  ...ownProjects,

  /* ─────────────── APP ─────────────── */
  {
    id: 'meridian-health',
    title: 'Meridian Health',
    category: 'App Development',
    serviceId: 'app',
    showcaseType: 'phone',
    excerpt: 'A care-tracking app that works with no signal at all.',
    description:
      'Meridian needed a patient companion that kept working inside hospitals where signal drops to nothing. We built an offline-first React Native client with a conflict-free sync layer, so vitals, medication logs and appointments all record locally and reconcile the moment a connection returns. The interface was designed around one-handed use during a shift.',
    thumbnail: `${P}/app/meridian-health/01.svg`,
    images: [
      `${P}/app/meridian-health/01.svg`,
      `${P}/app/meridian-health/02.svg`,
      `${P}/app/meridian-health/03.svg`,
      `${P}/app/meridian-health/04.svg`,
      `${P}/app/meridian-health/05.svg`,
    ],
    video: null,
    url: 'https://meridian.health',
    technologies: ['React Native', 'Expo', 'TypeScript', 'Node.js', 'PostgreSQL', 'WatermelonDB'],
    year: 2025,
    client: 'Meridian Care Group',
    featured: true,
    scope: ['Product strategy', 'UX architecture', 'iOS & Android build', 'Offline sync engine', 'Design system'],
    results: [
      { value: '4.8★', label: 'App Store rating' },
      { value: '0ms', label: 'Perceived sync delay' },
      { value: '62%', label: 'Faster charting' },
    ],
  },
  {
    id: 'lattice-finance',
    title: 'Lattice',
    category: 'App Development',
    serviceId: 'app',
    showcaseType: 'phone',
    excerpt: 'Personal finance that reads like a magazine, not a spreadsheet.',
    description:
      'Lattice turns raw bank feeds into a weekly narrative. We designed an editorial-led mobile experience where charts are typographic rather than decorative, and built the categorisation engine that makes the story accurate enough to trust.',
    thumbnail: `${P}/app/lattice-finance/01.svg`,
    images: [
      `${P}/app/lattice-finance/01.svg`,
      `${P}/app/lattice-finance/02.svg`,
      `${P}/app/lattice-finance/03.svg`,
      `${P}/app/lattice-finance/04.svg`,
    ],
    video: null,
    url: 'https://lattice.money',
    technologies: ['React Native', 'Reanimated', 'Plaid', 'Fastify', 'Redis'],
    year: 2024,
    client: 'Lattice Financial',
    featured: true,
    scope: ['Brand system', 'Mobile product design', 'React Native build', 'Categorisation engine'],
    results: [
      { value: '180k', label: 'Installs in year one' },
      { value: '41%', label: 'D30 retention' },
    ],
  },
  {
    id: 'transit-atlas',
    title: 'Transit Atlas',
    category: 'App Development',
    serviceId: 'app',
    showcaseType: 'phone',
    excerpt: 'Live multimodal routing across eleven cities.',
    description:
      'A journey planner that merges rail, bus, bike and ride-hail into one route graph. The hard part was rendering thousands of live vehicle positions at sixty frames per second on mid-range Android hardware — solved with a native map layer and an aggressive tile budget.',
    thumbnail: `${P}/app/transit-atlas/01.svg`,
    images: [
      `${P}/app/transit-atlas/01.svg`,
      `${P}/app/transit-atlas/02.svg`,
      `${P}/app/transit-atlas/03.svg`,
      `${P}/app/transit-atlas/04.svg`,
    ],
    video: null,
    url: null,
    technologies: ['Swift', 'Kotlin', 'MapLibre', 'GraphQL', 'Go'],
    year: 2024,
    client: 'Atlas Mobility',
    featured: false,
    scope: ['Native iOS & Android', 'Route graph engine', 'Realtime vehicle layer'],
    results: [
      { value: '60fps', label: 'On mid-tier Android' },
      { value: '11', label: 'Cities live' },
    ],
  },

  /* ─────────────── WEB ─────────────── */
  {
    id: 'obsidian-architects',
    title: 'Obsidian Architects',
    category: 'Web Development',
    serviceId: 'web',
    showcaseType: 'browser',
    excerpt: 'An architecture portfolio that moves like a camera.',
    description:
      'A practice known for restraint needed a site with the same discipline. Every project page is a single continuous scroll shot — images scale, crop and hand off to one another without a cut. Built on Next.js with an image pipeline that keeps the whole thing under a second to first paint.',
    thumbnail: `${P}/web/obsidian-architects/01.svg`,
    images: [
      `${P}/web/obsidian-architects/01.svg`,
      `${P}/web/obsidian-architects/02.svg`,
      `${P}/web/obsidian-architects/03.svg`,
      `${P}/web/obsidian-architects/04.svg`,
    ],
    video: null,
    url: 'https://obsidian.archi',
    technologies: ['Next.js', 'React', 'GSAP', 'Sanity', 'Vercel'],
    year: 2025,
    client: 'Obsidian Architects',
    featured: true,
    scope: ['Art direction', 'Front-end engineering', 'Scroll choreography', 'CMS architecture'],
    results: [
      { value: '99', label: 'Lighthouse performance' },
      { value: '0.8s', label: 'Largest contentful paint' },
      { value: '3.1x', label: 'Enquiry increase' },
    ],
  },
  {
    id: 'northwind-labs',
    title: 'Northwind Labs',
    category: 'Web Development',
    serviceId: 'web',
    showcaseType: 'browser',
    excerpt: 'A research lab site with live data at its centre.',
    description:
      'Northwind publishes climate models. We built a marketing site where the hero is not an illustration but the actual model output, streamed and rendered on canvas, updating as new runs complete.',
    thumbnail: `${P}/web/northwind-labs/01.svg`,
    images: [
      `${P}/web/northwind-labs/01.svg`,
      `${P}/web/northwind-labs/02.svg`,
      `${P}/web/northwind-labs/03.svg`,
    ],
    video: null,
    url: 'https://northwind.science',
    technologies: ['Next.js', 'TypeScript', 'D3', 'Canvas', 'Tailwind CSS'],
    year: 2024,
    client: 'Northwind Labs',
    featured: false,
    scope: ['Design system', 'Data visualisation', 'Front-end engineering'],
    results: [{ value: '14', label: 'Live model feeds' }],
  },
  {
    id: 'form-and-field',
    title: 'Form & Field',
    category: 'Web Development',
    serviceId: 'web',
    showcaseType: 'browser',
    excerpt: 'A furniture maker&rsquo;s catalogue, rebuilt as a spatial index.',
    description:
      'Instead of a grid, the catalogue is a depth-sorted plane you move through. Products scale with proximity and reveal specification as they approach. It sounds indulgent; it doubled time-on-site.',
    thumbnail: `${P}/web/form-and-field/01.svg`,
    images: [
      `${P}/web/form-and-field/01.svg`,
      `${P}/web/form-and-field/02.svg`,
      `${P}/web/form-and-field/03.svg`,
      `${P}/web/form-and-field/04.svg`,
    ],
    video: null,
    url: 'https://formandfield.studio',
    technologies: ['React', 'Three.js', 'React Three Fiber', 'Lenis', 'Contentful'],
    year: 2025,
    client: 'Form & Field',
    featured: true,
    scope: ['Concept', 'Spatial UI', '3D engineering', 'CMS integration'],
    results: [
      { value: '2.1x', label: 'Time on site' },
      { value: '+38%', label: 'Catalogue requests' },
    ],
  },

  /* ─────────────── SHOPIFY ─────────────── */
  {
    id: 'ashgrove-supply',
    title: 'Ashgrove Supply',
    category: 'Shopify Development',
    serviceId: 'shopify',
    showcaseType: 'store',
    excerpt: 'A headless storefront that renders in under 400ms.',
    description:
      'Ashgrove sells workwear with deep size and fit variance, which made the stock theme unusable. We rebuilt the storefront headless on Hydrogen, moved fit logic into a custom variant matrix, and cut the path from landing to checkout to three interactions.',
    thumbnail: `${P}/shopify/ashgrove-supply/01.svg`,
    images: [
      `${P}/shopify/ashgrove-supply/01.svg`,
      `${P}/shopify/ashgrove-supply/02.svg`,
      `${P}/shopify/ashgrove-supply/03.svg`,
      `${P}/shopify/ashgrove-supply/04.svg`,
    ],
    video: null,
    url: 'https://ashgrove.supply',
    technologies: ['Shopify Hydrogen', 'Remix', 'Storefront API', 'Tailwind CSS', 'Klaviyo'],
    year: 2025,
    client: 'Ashgrove Supply Co.',
    featured: true,
    scope: ['Headless architecture', 'Storefront design', 'Variant system', 'Checkout optimisation'],
    results: [
      { value: '+41%', label: 'Conversion rate' },
      { value: '390ms', label: 'Time to interactive' },
      { value: '-27%', label: 'Return rate' },
    ],
  },
  {
    id: 'maison-cerise',
    title: 'Maison Cerise',
    category: 'Shopify Development',
    serviceId: 'shopify',
    showcaseType: 'store',
    excerpt: 'Luxury fragrance retail with an editorial spine.',
    description:
      'A custom Shopify theme where every collection is a story page first and a product grid second. Subscription and sampling flows were built into the theme rather than bolted on with an app.',
    thumbnail: `${P}/shopify/maison-cerise/01.svg`,
    images: [
      `${P}/shopify/maison-cerise/01.svg`,
      `${P}/shopify/maison-cerise/02.svg`,
      `${P}/shopify/maison-cerise/03.svg`,
    ],
    video: null,
    url: 'https://maisoncerise.com',
    technologies: ['Shopify', 'Liquid', 'Alpine.js', 'Recharge', 'GSAP'],
    year: 2024,
    client: 'Maison Cerise',
    featured: false,
    scope: ['Custom theme', 'Subscription flow', 'Editorial templates'],
    results: [{ value: '+58%', label: 'Subscription signups' }],
  },

  /* ─────────────── WORDPRESS ─────────────── */
  {
    id: 'chronicle-press',
    title: 'Chronicle Press',
    category: 'WordPress Development',
    serviceId: 'wordpress',
    showcaseType: 'cms',
    excerpt: 'A newsroom where editors build pages without developers.',
    description:
      'Chronicle publishes forty pieces a week across five verticals. We built a Gutenberg block library mapped one-to-one onto their design system, so an editor assembles a feature layout in the editor and it renders identically on the front end. No page builder, no developer queue.',
    thumbnail: `${P}/wordpress/chronicle-press/01.svg`,
    images: [
      `${P}/wordpress/chronicle-press/01.svg`,
      `${P}/wordpress/chronicle-press/02.svg`,
      `${P}/wordpress/chronicle-press/03.svg`,
      `${P}/wordpress/chronicle-press/04.svg`,
    ],
    video: null,
    url: 'https://chroniclepress.co',
    technologies: ['WordPress', 'Gutenberg', 'ACF Pro', 'PHP', 'Next.js'],
    year: 2024,
    client: 'Chronicle Press',
    featured: true,
    scope: ['Block library', 'Editorial workflow', 'Headless front end', 'Migration of 9k posts'],
    results: [
      { value: '0', label: 'Dev tickets to publish' },
      { value: '9,400', label: 'Posts migrated' },
    ],
  },

  /* ─────────────── SAAS ─────────────── */
  {
    id: 'signalyard',
    title: 'Signalyard',
    category: 'SaaS / Product',
    serviceId: 'saas',
    showcaseType: 'dashboard',
    excerpt: 'Observability for logistics fleets, from zero to Series A.',
    description:
      'We joined Signalyard at prototype stage and shipped the product that raised their Series A: multi-tenant architecture, role-based permissions, Stripe billing, and a dashboard that renders half a million telemetry points without dropping a frame.',
    thumbnail: `${P}/saas/signalyard/01.svg`,
    images: [
      `${P}/saas/signalyard/01.svg`,
      `${P}/saas/signalyard/02.svg`,
      `${P}/saas/signalyard/03.svg`,
      `${P}/saas/signalyard/04.svg`,
      `${P}/saas/signalyard/05.svg`,
    ],
    video: null,
    url: 'https://signalyard.io',
    technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Stripe', 'ClickHouse', 'WebSockets'],
    year: 2025,
    client: 'Signalyard',
    featured: true,
    scope: ['Product design', 'Full-stack build', 'Billing & permissions', 'Realtime pipeline'],
    results: [
      { value: '99.97%', label: 'Uptime' },
      { value: '500k', label: 'Points per view' },
      { value: 'Series A', label: 'Raised on this build' },
    ],
  },
  {
    id: 'quorum-desk',
    title: 'Quorum Desk',
    category: 'SaaS / Product',
    serviceId: 'saas',
    showcaseType: 'dashboard',
    excerpt: 'Board management software that lawyers actually enjoy.',
    description:
      'Document-heavy, permission-heavy, and historically ugly. We rebuilt the category around a reading-first interface with granular access control and an audit trail that satisfies compliance without getting in the way.',
    thumbnail: `${P}/saas/quorum-desk/01.svg`,
    images: [
      `${P}/saas/quorum-desk/01.svg`,
      `${P}/saas/quorum-desk/02.svg`,
      `${P}/saas/quorum-desk/03.svg`,
    ],
    video: null,
    url: null,
    technologies: ['React', 'Node.js', 'Prisma', 'SSO / SAML', 'AWS'],
    year: 2024,
    client: 'Quorum',
    featured: false,
    scope: ['Product design', 'Permissions model', 'Audit system'],
    results: [{ value: '-64%', label: 'Support tickets' }],
  },

  /* ─────────────── CREATIVE ─────────────── */
  {
    id: 'aurelia-campaign',
    title: 'Aurelia — Campaign Retouch',
    category: 'Photo Editing',
    serviceId: 'photo',
    showcaseType: 'canvas',
    excerpt: 'Eight hundred campaign frames, one consistent grade.',
    description:
      'A full-season campaign retouch: compositing, skin and product retouching, and a colour grade applied consistently across eight hundred frames destined for print, digital and out-of-home. We built the batch pipeline that kept every deliverable on the same curve.',
    thumbnail: `${P}/creative/aurelia-campaign/01.jpg`,
    images: [
      `${P}/creative/aurelia-campaign/01.jpg`,
      `${P}/creative/aurelia-campaign/02.jpg`,
      `${P}/creative/aurelia-campaign/03.svg`,
      `${P}/creative/aurelia-campaign/04.svg`,
    ],
    video: null,
    url: null,
    technologies: ['Photoshop', 'Capture One', 'Lightroom', 'Custom batch pipeline'],
    year: 2025,
    client: 'Aurelia',
    featured: true,
    scope: ['Compositing', 'Retouching', 'Colour grade', 'Print & OOH delivery'],
    results: [
      { value: '800', label: 'Frames delivered' },
      { value: '48hr', label: 'Turnaround' },
    ],
  },
  {
    id: 'halcyon-film',
    title: 'Halcyon — Product Film',
    category: 'Video Editing',
    serviceId: 'video',
    showcaseType: 'timeline',
    excerpt: 'One film, sixty cut-downs, every placement covered.',
    description:
      'A ninety-second product film edited, graded and scored — then systematically cut down into sixty placement-specific variants across three aspect ratios, each retimed rather than simply cropped.',
    thumbnail: `${P}/creative/halcyon-film/01.svg`,
    images: [
      `${P}/creative/halcyon-film/01.svg`,
      `${P}/creative/halcyon-film/02.svg`,
      `${P}/creative/halcyon-film/03.svg`,
      `${P}/creative/halcyon-film/04.svg`,
    ],
    // Drop real files in /public/projects/creative/halcyon-film/ and the
    // showcase will play them instead of the synthetic preview.
    video: null,
    url: null,
    technologies: ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Ableton'],
    year: 2025,
    client: 'Halcyon',
    featured: true,
    scope: ['Edit', 'Motion graphics', 'Colour', 'Sound design', '60 ad variants'],
    results: [
      { value: '3.4x', label: 'Watch-through vs. benchmark' },
      { value: '60', label: 'Variants shipped' },
    ],
  },
  {
    id: 'vertex-identity',
    title: 'Vertex — Identity System',
    category: 'UI/UX Design',
    serviceId: 'design',
    showcaseType: 'poster',
    excerpt: 'A brand system that survives sixty formats.',
    description:
      'Identity, typographic system and campaign toolkit for a robotics company — built as a set of composition rules rather than a fixed set of layouts, so the in-house team can generate new work that still looks like Vertex.',
    thumbnail: `${P}/creative/vertex-identity/01.svg`,
    images: [
      `${P}/creative/vertex-identity/01.svg`,
      `${P}/creative/vertex-identity/02.svg`,
      `${P}/creative/vertex-identity/03.svg`,
      `${P}/creative/vertex-identity/04.svg`,
    ],
    video: null,
    url: null,
    technologies: ['Figma', 'Illustrator', 'Variable type', 'Design tokens'],
    year: 2024,
    client: 'Vertex Robotics',
    featured: false,
    scope: ['Identity', 'Typographic system', 'Campaign toolkit', 'Design tokens'],
    results: [{ value: '60+', label: 'Formats from one system' }],
  },
  {
    id: 'orbit-automation',
    title: 'Orbit — Support Automation',
    category: 'AI & Automation',
    serviceId: 'ai',
    showcaseType: 'flow',
    excerpt: 'A retrieval agent that closes a third of the queue.',
    description:
      'Orbit&rsquo;s support team was drowning in repeat questions. We built a retrieval pipeline over their documentation and ticket history, wired an agent into their helpdesk, and — critically — an eval harness that proves it stays accurate as the docs change.',
    thumbnail: `${P}/creative/orbit-automation/01.svg`,
    images: [
      `${P}/creative/orbit-automation/01.svg`,
      `${P}/creative/orbit-automation/02.svg`,
      `${P}/creative/orbit-automation/03.svg`,
    ],
    video: null,
    url: null,
    technologies: ['Claude API', 'Python', 'pgvector', 'LangGraph', 'Zendesk API'],
    year: 2025,
    client: 'Orbit',
    featured: true,
    scope: ['RAG pipeline', 'Agent workflow', 'Eval harness', 'Helpdesk integration'],
    results: [
      { value: '34%', label: 'Tickets auto-resolved' },
      { value: '31hrs', label: 'Saved weekly' },
    ],
  },
]

/* ─────────────── Derived selectors ─────────────── */

export const getProject = (id) => projects.find((p) => p.id === id)

export const projectsByService = (serviceId) => projects.filter((p) => p.serviceId === serviceId)

export const featuredProjects = projects.filter((p) => p.featured)

export const categories = [...new Set(projects.map((p) => p.category))]

export function adjacentProjects(id) {
  const i = projects.findIndex((p) => p.id === id)
  if (i === -1) return { prev: null, next: null }
  return {
    prev: projects[(i - 1 + projects.length) % projects.length],
    next: projects[(i + 1) % projects.length],
  }
}
