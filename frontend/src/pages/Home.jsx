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
import { useSEO } from '../hooks/useSEO'
import { brand } from '../data/brand'

export default function Home() {
  useSEO({
    title: `${brand.name} — Design, Code & Motion Under One Roof`,
    description:
      'GROWKYNOS is a digital product studio building apps, websites, storefronts and SaaS platforms — design, code and motion under one roof.',
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
    </>
  )
}
