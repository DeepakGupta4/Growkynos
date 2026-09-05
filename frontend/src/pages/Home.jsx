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

      {/* The ten worlds, in journey order */}
      <AppShowcase />
      <WebShowcase />
      <ShopifyShowcase />
      <WordPressShowcase />
      <SaaSShowcase />
      <DesignShowcase />
      <PhotoEditingShowcase />
      <VideoEditingShowcase />
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
