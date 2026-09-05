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
import { useSEO } from '../hooks/useSEO'
import { brand } from '../data/brand'

export default function Home() {
  useSEO({
    title: brand.seo.title,
    description: brand.seo.description,
    path: '/',
  })

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
