import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ExperienceProvider, useExperience } from './context/ExperienceContext'
import { SoundProvider } from './context/SoundContext'
import { TransitionProvider } from './components/transitions/TransitionProvider'
import { ProjectEntryProvider } from './components/projects/ProjectEntryContext'
import { BootSequence } from './components/boot/BootSequence'
import { Nav } from './components/navigation/Nav'
import { CustomCursor } from './components/ui/CustomCursor'
import { Grain } from './components/effects/Grain'
import { Atmosphere } from './components/effects/Atmosphere'
import { Footer } from './components/layout/Footer'
import { useLenisScroll } from './hooks/useLenis'
import { ScrollTrigger } from './lib/gsap'
import Home from './pages/Home'

const ProjectPage = lazy(() => import('./pages/ProjectPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const WorkPage = lazy(() => import('./pages/WorkPage'))
const NotFound = lazy(() => import('./pages/NotFound'))

/** Recalculate scroll choreography once the boot panel is out of the way. */
function ScrollSystem() {
  const { booted, reducedMotion } = useExperience()
  useLenisScroll({ enabled: booted && !reducedMotion })
  const { pathname } = useLocation()

  useEffect(() => {
    if (!booted) return undefined
    const t = setTimeout(() => ScrollTrigger.refresh(), 240)
    return () => clearTimeout(t)
  }, [booted, pathname])

  return null
}

function Shell() {
  const { booted } = useExperience()

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[400] focus:rounded-full focus:bg-brass focus:px-5 focus:py-3 focus:font-mono focus:text-[11px] focus:uppercase focus:tracking-[0.16em] focus:text-void"
      >
        Skip to content
      </a>

      <Atmosphere />
      {!booted && <BootSequence />}
      <Nav />

      <TransitionProvider>
        <ProjectEntryProvider>
          <main id="main" className="relative z-10">
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/work" element={<WorkPage />} />
                <Route path="/work/:id" element={<ProjectPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </ProjectEntryProvider>
      </TransitionProvider>

      <Grain />
      <CustomCursor />
    </>
  )
}

function RouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-void" role="status" aria-live="polite">
      <span className="label-brass animate-pulse">Loading</span>
    </div>
  )
}

export default function App() {
  return (
    <ExperienceProvider>
      <SoundProvider>
        <BrowserRouter>
          <ScrollSystem />
          <Shell />
        </BrowserRouter>
      </SoundProvider>
    </ExperienceProvider>
  )
}
