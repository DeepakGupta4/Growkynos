import { useCallback, useRef } from 'react'
import { gsap, EASE } from '../../lib/gsap'
import { ShowcaseFrame } from './ShowcaseFrame'
import { PanelFrame } from './ui/Devices'
import { ProjectTag, StaticShowcase } from './ui/ShowcaseParts'
import { getService } from '../../data/services'
import { projectsByService } from '../../data/projects'
import { useExperience } from '../../context/ExperienceContext'
import { useProjectEntry } from '../projects/ProjectEntryContext'

const service = getService('shopify')

const PRODUCTS = [
  { id: 'p1', name: 'Waxed Field Jacket', price: 180, meta: 'OLIVE / WAXED COTTON' },
  { id: 'p2', name: 'Canvas Trouser', price: 132, meta: 'STONE / 12OZ CANVAS' },
  { id: 'p3', name: 'Work Shirt', price: 95, meta: 'CHAMBRAY / INDIGO' },
  { id: 'p4', name: 'Cotton Tee', price: 45, meta: 'BONE / HEAVY JERSEY' },
  { id: 'p5', name: 'Belt — Bridle', price: 68, meta: 'TAN / SOLID BRASS' },
  { id: 'p6', name: 'Watch Cap', price: 38, meta: 'CHARCOAL / MERINO' },
]

/**
 * SHOPIFY WORLD
 * -------------
 * Not the web world with different pictures — a commerce machine.
 * The storefront assembles, a product detaches from the grid and opens, it is
 * added to a cart that physically reacts, checkout resolves, and the entire
 * store then compresses into a single object that carries into the next world.
 */
export function ShopifyShowcase() {
  const project = projectsByService('shopify')[0]
  const { isMobile } = useExperience()
  const { enterProject } = useProjectEntry()

  const storeRef = useRef(null)
  const gridRef = useRef(null)
  const cardsRef = useRef([])
  const detailRef = useRef(null)
  const cartRef = useRef(null)
  const cartCountRef = useRef(null)
  const flyRef = useRef(null)
  const checkoutRef = useRef(null)
  const objectRef = useRef(null)
  const glowRef = useRef(null)
  const tagRef = useRef(null)

  const setCard = (el, i) => {
    cardsRef.current[i] = el
  }

  const build = useCallback((tl, { isMobile: mobile }) => {
    const store = storeRef.current
    const cards = cardsRef.current.filter(Boolean)
    const detail = detailRef.current
    const cart = cartRef.current
    const cartCount = cartCountRef.current
    const fly = flyRef.current
    const checkout = checkoutRef.current
    const object = objectRef.current
    const glow = glowRef.current
    const tag = tagRef.current
    if (!store || !cards.length) return

    /* Initial */
    gsap.set(store, { z: -1200, rotateX: 18, opacity: 0, scale: 0.9 })
    gsap.set(cards, { autoAlpha: 0, y: 46, scale: 0.94 })
    gsap.set(detail, { autoAlpha: 0, xPercent: 6, scale: 0.96 })
    gsap.set(cart, { autoAlpha: 0, y: -12 })
    gsap.set(fly, { autoAlpha: 0, scale: 0.5 })
    gsap.set(checkout, { autoAlpha: 0, yPercent: 12 })
    gsap.set(object, { autoAlpha: 0, scale: 0.2, rotateY: 0 })
    gsap.set(glow, { opacity: 0 })
    gsap.set(tag, { autoAlpha: 0, y: 12 })
    if (cartCount) cartCount.textContent = '0'

    /* 01 — STORE APPEARS */
    tl.to(store, { z: 0, rotateX: 0, opacity: 1, scale: 1, duration: 2.2, ease: 'power3.out' })
      .to(glow, { opacity: 1, duration: 1 }, '-=1.4')
      .to(cart, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=1.2')
      .to(tag, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.9')

    /* 02 — PRODUCT CARDS LOAD, one after another with real stagger. */
    tl.to(cards, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.72,
      ease: EASE.overshoot,
      stagger: { each: 0.085, from: 'start' },
    }, '-=0.6')

    /* 03 — ONE PRODUCT FLOATS FORWARD out of the grid. */
    const hero = cards[0]
    tl.to(cards.slice(1), { autoAlpha: 0.24, scale: 0.95, filter: 'blur(2px)', duration: 0.7 }, '+=0.25')
      .to(
        hero,
        {
          z: mobile ? 160 : 300,
          scale: mobile ? 1.18 : 1.32,
          x: mobile ? 0 : -110,
          y: mobile ? -36 : -18,
          rotateY: mobile ? 0 : -9,
          duration: 1.4,
          ease: EASE.mass,
        },
        '-=0.55',
      )

    /* 04 — PRODUCT DETAIL OPENS beside it. */
    tl.to(detail, { autoAlpha: 1, xPercent: 0, scale: 1, duration: 0.95, ease: EASE.settle }, '-=0.6')
      .fromTo(
        '[data-shop-detail-row]',
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power3.out' },
        '-=0.55',
      )

    /* 05 — ADD TO CART: a real object travels to the cart, which reacts. */
    tl.fromTo(
      '[data-shop-add]',
      { scale: 1 },
      { scale: 0.93, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.inOut' },
      '+=0.3',
    )
      .to(fly, { autoAlpha: 1, scale: 1, duration: 0.22 }, '-=0.1')
      .to(fly, {
        x: mobile ? 108 : 268,
        y: mobile ? -168 : -212,
        scale: 0.34,
        rotateZ: 22,
        duration: 0.95,
        ease: 'power2.in',
      })
      .to(fly, { autoAlpha: 0, duration: 0.12 })
      .add(() => {
        if (cartCount) cartCount.textContent = '1'
      })
      .fromTo(
        cart,
        { scale: 1 },
        { scale: 1.22, duration: 0.24, ease: 'back.out(3)' },
      )
      .to(cart, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.5)' })

    /* 06 — CHECKOUT resolves over the store. */
    tl.to([detail, hero], { autoAlpha: 0, scale: 0.92, duration: 0.6, ease: 'power2.in' }, '+=0.2')
      .to(cards.slice(1), { autoAlpha: 0.1, duration: 0.5 }, '<')
      .to(checkout, { autoAlpha: 1, yPercent: 0, duration: 0.9, ease: EASE.settle }, '-=0.3')
      .fromTo(
        '[data-shop-checkout-row]',
        { autoAlpha: 0, x: -16 },
        { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.09, ease: 'power3.out' },
        '-=0.55',
      )
      .fromTo(
        '[data-shop-paid]',
        { autoAlpha: 0, scale: 0.8 },
        { autoAlpha: 1, scale: 1, duration: 0.6, ease: EASE.overshoot },
        '+=0.2',
      )

    /* 07 — COMPRESSION: the whole store folds into one object. */
    tl.to(store, {
      scale: 0.06,
      rotateY: 220,
      rotateX: 34,
      autoAlpha: 0,
      filter: 'blur(6px)',
      duration: 1.5,
      ease: 'power3.inOut',
    }, '+=0.35')
      .to(object, { autoAlpha: 1, scale: 1, duration: 0.9, ease: EASE.overshoot }, '-=0.75')
      .to(object, { rotateY: 360, duration: 2.2, ease: 'power2.inOut' }, '-=0.5')
      .to(glow, { opacity: 1.7, duration: 1 }, '<')
      .to(tag, { autoAlpha: 0, duration: 0.4 }, '<')
      // The object carries forward into the next world.
      .to(object, { y: mobile ? 180 : 280, scale: 0.7, autoAlpha: 0.4, duration: 1.4, ease: 'power2.in' })
      .fromTo(
        '[data-shop-cta]',
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.settle },
        '-=1.1',
      )
  }, [])

  return (
    <ShowcaseFrame
      service={service}
      id={service.sectionId}
      beats={7}
      build={build}
      fallback={<StaticShowcase project={project} service={service} />}
    >
      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[66vmin] w-[84vmin] -translate-x-1/2 -translate-y-1/2 opacity-0"
        style={{
          background: `radial-gradient(ellipse, ${service.accent}22 0%, rgba(5,5,7,0) 70%)`,
        }}
      />

      {/* Cart — lives outside the store panel so it can react independently */}
      <div
        ref={cartRef}
        aria-hidden="true"
        className="surface-raised absolute right-[6%] top-[10%] z-40 flex items-center gap-2.5 rounded-full px-4 py-2.5 opacity-0 will-change-transform md:right-[10%] md:top-[12%]"
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M2 2h2l1.6 8.4h7.2L15 5H5"
            stroke={service.accent}
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="6.5" cy="13.5" r="1.1" fill={service.accent} />
          <circle cx="12.5" cy="13.5" r="1.1" fill={service.accent} />
        </svg>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist">CART</span>
        <span
          ref={cartCountRef}
          className="grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold text-void"
          style={{ backgroundColor: service.accent }}
        >
          0
        </span>
      </div>

      {/* Flying product used by "add to cart" */}
      <div
        ref={flyRef}
        aria-hidden="true"
        className="absolute z-40 h-14 w-12 overflow-hidden rounded opacity-0 will-change-transform md:h-16 md:w-14"
      >
        <img src={project.images[1] ?? project.images[0]} alt="" className="h-full w-full object-cover" />
      </div>

      {/* The compressed store object */}
      <div
        ref={objectRef}
        aria-hidden="true"
        className="absolute z-30 grid h-24 w-24 place-items-center opacity-0 preserve-3d will-change-transform md:h-32 md:w-32"
      >
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(150deg, ${service.accent}44, rgba(10,10,13,0.95))`,
            border: `1px solid ${service.accent}88`,
            boxShadow: `0 0 60px -12px ${service.accent}88, inset 0 1px 0 rgba(255,255,255,0.16)`,
          }}
        />
        <div className="relative flex flex-col items-center gap-1">
          <span className="font-display text-lg font-bold text-bone md:text-2xl">£312</span>
          <span className="font-mono text-[7.5px] uppercase tracking-[0.16em] text-mist">ORDER PLACED</span>
        </div>
      </div>

      {/* Store */}
      <div className="relative z-10 flex flex-col items-center gap-6 preserve-3d">
        <div ref={storeRef} className="relative preserve-3d will-change-transform">
          <PanelFrame
            label="ASHGROVE.SUPPLY — STOREFRONT"
            accent={service.accent}
            className="w-[min(88vw,740px)]"
          >
            <div className="relative p-4 md:p-6">
              {/* Storefront header */}
              <div className="mb-4 flex items-center justify-between border-b border-smoke/60 pb-3 md:mb-5">
                <span className="font-display text-[12px] font-bold tracking-[0.2em] text-bone md:text-[14px]">
                  ASHGROVE
                </span>
                <div className="flex gap-4 md:gap-6">
                  {['NEW IN', 'SHOP', 'ABOUT'].map((n, i) => (
                    <span
                      key={n}
                      className="font-mono text-[8px] uppercase tracking-[0.14em] md:text-[9px]"
                      style={{ color: i === 1 ? service.accent : '#8E8E9D' }}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>

              {/* Product grid */}
              <div ref={gridRef} className="grid grid-cols-3 gap-2.5 preserve-3d md:gap-4">
                {PRODUCTS.slice(0, isMobile ? 6 : 6).map((p, i) => (
                  <div
                    key={p.id}
                    ref={(el) => setCard(el, i)}
                    className="surface overflow-hidden rounded-md preserve-3d will-change-transform"
                  >
                    <div className="relative aspect-[5/4] overflow-hidden">
                      <img
                        src={project.images[i % project.images.length]}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                        style={{ objectPosition: `${20 + i * 12}% ${18 + i * 9}%` }}
                      />
                      {i === 0 && (
                        <span
                          className="absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 font-mono text-[6.5px] font-bold uppercase tracking-[0.12em] text-void md:text-[7.5px]"
                          style={{ backgroundColor: service.accent }}
                        >
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline justify-between p-1.5 md:p-2.5">
                      <span className="truncate font-display text-[8.5px] font-medium text-silver md:text-[10.5px]">
                        {p.name}
                      </span>
                      <span className="font-mono text-[8px] tabular-nums md:text-[9.5px]" style={{ color: service.accent }}>
                        £{p.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Product detail sheet */}
              <div
                ref={detailRef}
                className="absolute inset-y-4 right-4 z-20 w-[54%] overflow-hidden rounded-lg opacity-0 md:inset-y-6 md:right-6 md:w-[46%]"
                style={{
                  background: 'linear-gradient(160deg,rgba(30,30,37,0.98),rgba(10,10,13,0.99))',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 40px 90px -36px rgba(0,0,0,0.95)',
                }}
              >
                <div className="flex h-full flex-col gap-2.5 p-3.5 md:gap-3.5 md:p-5">
                  <span
                    data-shop-detail-row
                    className="font-mono text-[7.5px] uppercase tracking-[0.16em] md:text-[8.5px]"
                    style={{ color: service.accent }}
                  >
                    FIELD COLLECTION
                  </span>
                  <h3
                    data-shop-detail-row
                    className="font-display text-[15px] font-semibold leading-tight text-bone md:text-[21px]"
                  >
                    Waxed Field Jacket
                  </h3>
                  <p data-shop-detail-row className="font-display text-base font-medium md:text-lg" style={{ color: service.accent }}>
                    £180.00
                  </p>
                  <div data-shop-detail-row className="flex gap-1.5">
                    {['S', 'M', 'L', 'XL'].map((s, i) => (
                      <span
                        key={s}
                        className="grid h-6 w-7 place-items-center rounded font-mono text-[8px] md:h-7 md:w-8 md:text-[9px]"
                        style={
                          i === 1
                            ? { backgroundColor: '#E6E6EA', color: '#050507' }
                            : { border: '1px solid #232329', color: '#9C9CA8' }
                        }
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div
                    data-shop-add
                    data-shop-detail-row
                    className="mt-auto grid h-9 place-items-center rounded font-mono text-[9px] uppercase tracking-[0.16em] text-void md:h-11 md:text-[10px]"
                    style={{ backgroundColor: service.accent }}
                  >
                    Add to cart
                  </div>
                  <div
                    data-shop-detail-row
                    className="grid h-8 place-items-center rounded border border-smoke font-mono text-[8.5px] uppercase tracking-[0.14em] text-mist md:h-9"
                  >
                    Free returns · 30 days
                  </div>
                </div>
              </div>

              {/* Checkout */}
              <div
                ref={checkoutRef}
                /* A sheet over the store, not a full-bleed panel — it must read
                   as checkout arriving on top of the storefront. */
                className="absolute inset-x-4 top-[9%] z-30 flex flex-col gap-2.5 overflow-hidden rounded-lg p-3.5 opacity-0 md:inset-x-10 md:gap-3 md:p-6"
                style={{
                  background: 'linear-gradient(160deg,rgba(30,30,37,0.99),rgba(12,12,16,1))',
                  border: `1px solid ${service.accent}3d`,
                  boxShadow: `0 40px 90px -34px rgba(0,0,0,0.96), 0 0 70px -26px ${service.accent}44`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-[13px] font-semibold text-bone md:text-[17px]">Checkout</span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-mist">SECURE</span>
                </div>
                {[
                  ['EMAIL', 'sam@ashgrove.supply'],
                  ['DELIVERY', '14 Bridge Road, Leeds LS2'],
                  ['PAYMENT', '•••• •••• •••• 4429'],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    data-shop-checkout-row
                    className="flex flex-col gap-1 rounded border border-smoke/70 px-2.5 py-1.5 md:px-3.5 md:py-2.5"
                  >
                    <span className="font-mono text-[7px] uppercase tracking-[0.16em] text-mist md:text-[8px]">
                      {k}
                    </span>
                    <span className="truncate text-[10px] text-silver md:text-[12px]">{v}</span>
                  </div>
                ))}
                <div data-shop-checkout-row className="mt-1 flex items-center justify-between border-t border-smoke/70 pt-2.5">
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-mist">TOTAL</span>
                  <span className="font-display text-base font-bold text-bone md:text-xl">£312.00</span>
                </div>
                <div
                  data-shop-paid
                  className="grid h-9 place-items-center rounded font-mono text-[9px] uppercase tracking-[0.18em] text-void opacity-0 md:h-11 md:text-[10px]"
                  style={{ backgroundColor: service.accent }}
                >
                  ✓ Order confirmed
                </div>
              </div>
            </div>
          </PanelFrame>
        </div>

        <div ref={tagRef} className="opacity-0">
          <ProjectTag project={project} accent={service.accent} />
        </div>
      </div>

      <div data-shop-cta className="absolute inset-x-0 bottom-[26%] z-40 flex justify-center opacity-0 md:bottom-[16%]">
        <button
          type="button"
          data-cursor="view"
          data-cursor-label="ENTER"
          onClick={(e) => enterProject(project, e.currentTarget)}
          className="group flex items-center gap-3 rounded-full border px-5 py-3 backdrop-blur-md transition-colors duration-500"
          style={{ borderColor: `${service.accent}80`, backgroundColor: 'rgba(5,5,7,0.7)' }}
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: service.accent }}>
            Enter {project.title}
          </span>
          <span className="transition-transform duration-500 group-hover:translate-x-1" style={{ color: service.accent }}>
            →
          </span>
        </button>
      </div>
    </ShowcaseFrame>
  )
}
