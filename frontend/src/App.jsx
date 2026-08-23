import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ExperienceProvider, useExperience } from './context/ExperienceContext'
import { SoundProvider } from './context/SoundContext'
import { TransitionProvider, TransitionStage } from './components/transitions/TransitionProvider'
import { ProjectEntryProvider } from './components/projects/ProjectEntryContext'
import { BootSequence } from './components/boot/BootSequence'
import { Nav } from './components/navigation/Nav'
import { CustomCursor } from './components/ui/CustomCursor'
import { Grain } from './components/effects/Grain'
import { Atmosphere } from './components/effects/Atmosphere'
import { Footer } from './components/layout/Footer'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
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
    // Pins are measured after layout settles; two passes cover late webfonts.
    const a = setTimeout(() => ScrollTrigger.refresh(), 260)
    const b = setTimeout(() => ScrollTrigger.refresh(), 1200)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [booted, pathname])

  return null
}

function Shell() {
  const { booted } = useExperience()

  return (
    <TransitionProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[400] focus:rounded-full focus:bg-brass focus:px-5 focus:py-3 focus:font-mono focus:text-[11px] focus:uppercase focus:tracking-[0.16em] focus:text-void"
      >
        Skip to content
      </a>

      <Atmosphere />
      {!booted && <BootSequence />}

      {/* Persistent chrome lives outside the stage so it never travels with a route. */}
      <Nav />

      <ProjectEntryProvider>
        <TransitionStage>
          <main id="main" className="relative z-10">
            <ErrorBoundary>
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/work" element={<WorkPage />} />
                  <Route path="/work/:id" element={<ProjectPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
          <Footer />
        </TransitionStage>
      </ProjectEntryProvider>

      <Grain />
      <CustomCursor />
    </TransitionProvider>
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
