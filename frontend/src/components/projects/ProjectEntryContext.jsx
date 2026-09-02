import { createContext, useCallback, useContext, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap, ScrollTrigger, EASE } from '../../lib/gsap'
import { getLenis, lockScroll } from '../../hooks/useLenis'
import { useExperience } from '../../context/ExperienceContext'
import { useSound } from '../../context/SoundContext'

const ProjectEntryContext = createContext(null)

/**
 * PROJECT ENTRY (FLIP)
 * --------------------
 * Not a modal. The element you clicked becomes the page.
 *
 * We capture the source rect and its media, clone it into a fixed layer at
 * exactly that geometry, then expand it to the viewport while the surrounding
 * page recedes. The arriving route renders the same image at the same final
 * geometry, so when the layer releases there is no visual cut — media
 * continuity is preserved through the whole move.
 */
export function ProjectEntryProvider({ children }) {
  const navigate = useNavigate()
  const { reducedMotion } = useExperience()
  const { sfx } = useSound()
  const layerRef = useRef(null)
  const mediaRef = useRef(null)
  const chromeRef = useRef(null)
  const titleRef = useRef(null)
  const busy = useRef(false)

  const enterProject = useCallback(
    (project, sourceEl) => {
      if (!project || busy.current) return

      if (reducedMotion || !sourceEl) {
        navigate(`/work/${project.id}`)
        window.scrollTo(0, 0)
        return
      }

      const layer = layerRef.current
      const media = mediaRef.current
      const title = titleRef.current
      const chrome = chromeRef.current
      if (!layer || !media) {
        navigate(`/work/${project.id}`)
        return
      }

      busy.current = true
      sfx('enter')
      lockScroll(true)

      // FIRST — measure the source exactly as the viewer sees it.
      const rect = sourceEl.getBoundingClientRect()
      // Prefer an <img> inside the source so the media matches pixel for pixel.
      const sourceImg = sourceEl.querySelector('img')
      const src = sourceImg?.currentSrc || sourceImg?.src || project.thumbnail

      media.src = src
      media.alt = project.title
      if (title) title.textContent = project.title

      gsap.set(layer, {
        display: 'block',
        position: 'fixed',
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        borderRadius: getComputedStyle(sourceEl).borderRadius || '12px',
        autoAlpha: 1,
        overflow: 'hidden',
      })
      gsap.set(chrome, { autoAlpha: 0 })

      const tl = gsap.timeline({
        onComplete: () => {
          busy.current = false
        },
      })

      // LAST — the layer travels to the viewport and takes over the frame.
      tl.to(layer, {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        borderRadius: 0,
        duration: 1.05,
        ease: EASE.travel,
      })
        .fromTo(
          media,
          { scale: 1.12, filter: 'brightness(0.72)' },
          { scale: 1, filter: 'brightness(1)', duration: 1.15, ease: EASE.travel },
          0,
        )
        .to(chrome, { autoAlpha: 1, duration: 0.5 }, 0.55)
        // The page behind recedes so the move reads as forward travel.
        .to('#main', { scale: 0.96, opacity: 0.4, filter: 'blur(6px)', duration: 0.9, ease: 'power2.inOut' }, 0)
        .add(() => {
          navigate(`/work/${project.id}`)
          const lenis = getLenis()
          if (lenis) lenis.scrollTo(0, { immediate: true })
          else window.scrollTo(0, 0)
          // Must clear, not reset: a residual identity transform on #main would
          // make it a containing block for position:fixed and break the pinned
          // ScrollTriggers on every page rendered inside it afterwards.
          gsap.set('#main', { clearProps: 'transform,opacity,filter' })
          ScrollTrigger.refresh()
        }, 1.02)
        // Release: the arriving route already shows this image at this geometry.
        .to(chrome, { autoAlpha: 0, duration: 0.35 }, 1.18)
        .to(layer, { autoAlpha: 0, duration: 0.55, ease: 'power2.inOut' }, 1.28)
        .set(layer, { display: 'none' })
        .add(() => lockScroll(false))
    },
    [navigate, reducedMotion, sfx],
  )

  const value = useMemo(() => ({ enterProject }), [enterProject])

  return (
    <ProjectEntryContext.Provider value={value}>
      {children}
      <div
        ref={layerRef}
        aria-hidden="true"
        className="pointer-events-none z-[260] hidden bg-carbon"
        style={{ display: 'none' }}
      >
        <img ref={mediaRef} alt="" className="h-full w-full object-cover object-top" />
        <div
          ref={chromeRef}
          className="absolute inset-0 flex flex-col justify-end p-gutter opacity-0"
          style={{ background: 'linear-gradient(180deg, rgba(5,5,7,0) 42%, rgba(5,5,7,0.9) 100%)' }}
        >
          <span className="label-brass mb-3">ENTERING PROJECT</span>
          <span ref={titleRef} className="font-display text-display-3 font-extrabold text-bone" />
        </div>
      </div>
    </ProjectEntryContext.Provider>
  )
}

export function useProjectEntry() {
  const ctx = useContext(ProjectEntryContext)
  // Showcases render outside the provider in isolated tests — degrade to a
  // plain route change rather than throwing.
  if (!ctx) {
    return {
      enterProject: (project) => {
        if (project) window.location.assign(`/work/${project.id}`)
      },
    }
  }
  return ctx
}
