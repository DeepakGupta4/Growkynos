import { Hero } from '../components/hero/Hero'
import { ServiceUniverse } from '../components/services/ServiceUniverse'
import { AppShowcase } from '../components/showcases/AppShowcase'
import { WebShowcase } from '../components/showcases/WebShowcase'
import { ShopifyShowcase } from '../components/showcases/ShopifyShowcase'
import { WordPressShowcase } from '../components/showcases/WordPressShowcase'
import { SaaSShowcase } from '../components/showcases/SaaSShowcase'
import { DesignShowcase } from '../components/showcases/DesignShowcase'
import { PhotoEditingShowcase } from '../components/showcases/PhotoEditingShowcase'
import { VideoEditingShowcase } from '../components/showcases/VideoEditingShowcase'
import { AIShowcase } from '../components/showcases/AIShowcase'
import { MoreServices } from '../components/services/MoreServices'
import { ProjectUniverse } from '../components/projects/ProjectUniverse'
import { StudioSection } from '../components/studio/StudioSection'
import { TechConstellation } from '../components/technology/TechConstellation'
import { ContactCta } from '../components/contact/ContactCta'
import { useEffect } from 'react'
import { useSEO } from '../hooks/useSEO'
import { brand } from '../data/brand'
import { ScrollTrigger } from '../lib/gsap'
import { SECTION_ACCENT, setAccent, resetAccent } from '../lib/accent'

export default function Home() {
  useSEO({
    title: brand.seo.title,
    description: brand.seo.description,
    path: '/',
  })

  /*
   * Hand the page's colour over to whichever section the reader is in.
   *
   * One field sits behind the whole site (see PageField) and everything that
   * has to agree on colour reads from the same store — the field itself, the
   * nav's indicator, the scroll progress line, the hero's CTA. Driving it from
   * here rather than from inside each section keeps the sequence in one place,
   * next to the section order it belongs to.
   *
   * The hero is absent from the map on purpose: it changes colour four times
   * on its own beat, so it owns its own accent while it is on screen.
   */
  useEffect(() => {
    const triggers = Object.entries(SECTION_ACCENT)
      .map(([id, accent]) => {
        const el = document.getElementById(id)
        if (!el) return null
        return ScrollTrigger.create({
          trigger: el,
          start: 'top 60%',
          end: 'bottom 40%',
          onToggle: (self) => self.isActive && setAccent(accent),
        })
      })
      .filter(Boolean)

    return () => {
      triggers.forEach((t) => t.kill())
      resetAccent()
    }
  }, [])

  return (
    <>
      <Hero />
      <ServiceUniverse />

      {/*
        FOUR worlds, not nine.
        Measured: nine pinned worlds cost 72 screens of scrolling and pushed the
        page to 93 screens end to end. The showcases for Shopify, WordPress,
        Design, Photo and Video are NOT deleted — they still exist and can be
        restored by adding them back here — but a homepage that takes ninety
        screens to read is not a homepage. These four carry the positioning.
      */}
      <AppShowcase />
      <WebShowcase />
      <SaaSShowcase />
      <AIShowcase />

      {/* Everything that supports the ten worlds, without a world of its own */}
      <MoreServices />

      {/* The identity moment, then who and how */}
      <ProjectUniverse />
      <StudioSection />
      <TechConstellation />
      <ContactCta />
    </>
  )
}
