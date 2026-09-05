const S = '/studio'

export const studio = {
  statement: ['DESIGN, CODE & MOTION', 'UNDER ONE ROOF.'],
  intro:
    'Most studios hand you off. A designer draws it, an agency builds it, a freelancer animates it, and the seams show in every one of them. We kept the three disciplines in the same room so the work arrives whole.',
  paragraphs: [
    'GENTECHNE is a small, senior team. The person who designs your interface writes the motion spec for it, and sits next to the engineer who builds it. Nothing is thrown over a wall, because there is no wall.',
    'We take on a limited number of projects a year. That is not scarcity marketing — it is the only way to stay this involved in each one.',
  ],
  stats: [
    { value: '2019', label: 'Founded' },
    { value: '90+', label: 'Projects shipped' },
    { value: '14', label: 'Countries served' },
    { value: '3', label: 'Disciplines, one room' },
  ],
  principles: [
    {
      index: '01',
      title: 'Show, never tell',
      body: 'A studio that claims motion expertise should not need to claim it. The work is the argument.',
    },
    {
      index: '02',
      title: 'Craft is measurable',
      body: 'Frame budgets, Lighthouse scores, bundle sizes. Taste and engineering are the same discipline.',
    },
    {
      index: '03',
      title: 'Build for the handover',
      body: 'Every system we ship is one your team can extend after we leave. No dependency by design.',
    },
  ],
  /* Layered editorial composition — not employee cards. */
  images: [
    { src: `${S}/01.svg`, alt: 'The GENTECHNE studio floor during a design review', span: 'tall', depth: 0.9 },
    { src: `${S}/02.svg`, alt: 'Interface exploration pinned across the studio wall', span: 'wide', depth: 0.55 },
    { src: `${S}/03.svg`, alt: 'A motion timeline being reviewed frame by frame', span: 'square', depth: 1.15 },
    { src: `${S}/04.svg`, alt: 'Engineering workstation with a build in progress', span: 'tall', depth: 0.7 },
    { src: `${S}/05.svg`, alt: 'Printed type specimens and colour proofs on the studio table', span: 'wide', depth: 1.0 },
  ],
  process: [
    { index: '01', title: 'Orient', body: 'Two weeks understanding the business before we touch a canvas.' },
    { index: '02', title: 'Compose', body: 'Direction, system and motion language decided together, not in sequence.' },
    { index: '03', title: 'Build', body: 'Weekly builds you can open on your phone. No reveal at the end.' },
    { index: '04', title: 'Hand over', body: 'Documentation, tokens and a team that knows how to extend it.' },
  ],
}
