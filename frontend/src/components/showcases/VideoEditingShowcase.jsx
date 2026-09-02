import { useCallback, useEffect, useMemo, useRef } from 'react'
import { gsap, EASE } from '../../lib/gsap'
import { ShowcaseFrame } from './ShowcaseFrame'
import { PanelFrame } from './ui/Devices'
import { ProjectTag, StaticShowcase } from './ui/ShowcaseParts'
import { getService } from '../../data/services'
import { projectsByService } from '../../data/projects'
import { useProjectEntry } from '../projects/ProjectEntryContext'
import { seeded } from '../../lib/utils'

const service = getService('video')

/**
 * VIDEO WORLD
 * -----------
 * A working NLE. The playhead drives the preview: clips cut and dissolve as it
 * crosses their boundaries, a clip is selected and physically dragged to a new
 * position on the track, a transition is dropped at the junction, and the
 * preview changes to match. The timeline is the interface *and* the animation.
 *
 * If a project supplies real footage (`project.video`), the preview plays it —
 * mp4 + webm sources, poster, muted/inline for mobile autoplay policy, and
 * playback gated to when the section is on screen. With no footage supplied,
 * the preview runs the cut itself from the project stills.
 */
export function VideoEditingShowcase() {
  const project = projectsByService('video')[0]
  const { enterProject } = useProjectEntry()
  const hasFootage = Boolean(project.video?.src)

  const nleRef = useRef(null)
  const playheadRef = useRef(null)
  const previewsRef = useRef([])
  const clipsRef = useRef([])
  const transitionRef = useRef(null)
  const progressRef = useRef(null)
  const timecodeRef = useRef(null)
  const videoRef = useRef(null)
  const glowRef = useRef(null)
  const tagRef = useRef(null)

  const setPreview = (el, i) => {
    previewsRef.current[i] = el
  }
  const setClip = (el, i) => {
    clipsRef.current[i] = el
  }

  /**
   * Footage playback is gated to visibility: nothing decodes until the world is
   * on screen, and it pauses the moment it leaves. Failure to autoplay is
   * non-fatal — the poster stays up.
   */
  useEffect(() => {
    const el = videoRef.current
    if (!el || !hasFootage) return undefined
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.preload = 'auto'
          el.play().catch(() => {})
        } else {
          el.pause()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasFootage])

  /* Deterministic audio waveform. */
  const waveform = useMemo(() => {
    const rand = seeded(19871122)
    return Array.from({ length: 96 }, (_, i) => {
      const env = Math.sin((i / 96) * Math.PI)
      return 0.16 + env * (0.35 + rand() * 0.5)
    })
  }, [])

  const build = useCallback((tl, { isMobile: mobile }) => {
    const nle = nleRef.current
    const playhead = playheadRef.current
    const previews = previewsRef.current.filter(Boolean)
    const clips = clipsRef.current.filter(Boolean)
    const transition = transitionRef.current
    const progress = progressRef.current
    const timecode = timecodeRef.current
    const glow = glowRef.current
    const tag = tagRef.current
    // With real footage the preview is a <video>, so there are no still layers
    // to cross-fade — the edit choreography still runs, it just skips those steps.
    if (!nle) return
    const hasStills = previews.length > 0

    const frames = 2160 // 90s at 24fps
    const setTC = (p) => {
      if (!timecode) return
      const f = Math.floor(p * frames)
      const s = Math.floor(f / 24)
      timecode.textContent = `00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(
        2,
        '0',
      )}:${String(f % 24).padStart(2, '0')}`
    }

    /* Initial */
    gsap.set(nle, { z: -1050, rotateX: 18, opacity: 0, scale: 0.92 })
    if (hasStills) {
      gsap.set(previews, { autoAlpha: 0 })
      gsap.set(previews[0], { autoAlpha: 1 })
    }
    gsap.set(playhead, { left: '4%' })
    gsap.set(transition, { autoAlpha: 0, scale: 0.6 })
    gsap.set(progress, { scaleX: 0.04, transformOrigin: 'left center' })
    gsap.set(glow, { opacity: 0 })
    gsap.set(tag, { autoAlpha: 0, y: 12 })
    clips.forEach((c) => gsap.set(c, { autoAlpha: 0, scaleX: 0.7, transformOrigin: 'left center' }))
    setTC(0.04)

    /* 01 — NLE ARRIVES */
    tl.to(nle, { z: 0, rotateX: 0, opacity: 1, scale: 1, duration: 2, ease: 'power3.out' })
      .to(glow, { opacity: 1, duration: 1 }, '-=1.2')
      .to(tag, { autoAlpha: 1, y: 0, duration: 0.6 }, '-=0.9')

    /* 02 — CLIPS LOAD onto the tracks. */
    tl.to(clips, {
      autoAlpha: 1,
      scaleX: 1,
      duration: 0.55,
      ease: EASE.overshoot,
      stagger: 0.075,
    }, '-=0.8')

    /* 03 — PLAYHEAD MOVES: the preview cuts at every clip boundary. */
    const scrub = { p: 0.04 }
    const cutAt = [0.22, 0.44, 0.66]
    tl.to(
      scrub,
      {
        p: 0.72,
        duration: 3.2,
        ease: 'none',
        onUpdate: () => {
          gsap.set(playhead, { left: `${scrub.p * 100}%` })
          gsap.set(progress, { scaleX: scrub.p })
          setTC(scrub.p)
          if (!hasStills) return
          const idx = cutAt.filter((c) => scrub.p >= c).length
          previews.forEach((el, i) => {
            const target = i === Math.min(idx, previews.length - 1) ? 1 : 0
            if (Number(el.dataset.on ?? '0') !== target) {
              el.dataset.on = String(target)
              gsap.to(el, { autoAlpha: target, duration: 0.42, ease: 'power2.inOut', overwrite: 'auto' })
            }
          })
        },
      },
      '-=0.4',
    )

    /* 04 — CLIP SELECTED */
    const target = clips[2]
    tl.to(
      target,
      {
        boxShadow: `0 0 0 2px ${service.accent}, 0 0 26px -6px ${service.accent}`,
        duration: 0.35,
        ease: 'power2.out',
      },
      '-=0.5',
    ).to('[data-video-inspector]', { autoAlpha: 1, x: 0, duration: 0.6, ease: EASE.settle }, '-=0.2')

    /* 05 — CLIP MOVES: lifted, carried, dropped. */
    tl.to(target, { y: -22, scale: 1.04, rotateZ: -1.2, duration: 0.42, ease: 'power2.out' })
      .to(target, { x: mobile ? -46 : -92, duration: 0.85, ease: 'power2.inOut' })
      .to(target, { y: 0, scale: 1, rotateZ: 0, duration: 0.42, ease: EASE.overshoot })
      // The neighbouring clip slides to close the gap — the edit is real.
      .to(clips[3], { x: mobile ? -46 : -92, duration: 0.6, ease: 'power3.inOut' }, '-=0.5')

    /* 06 — TRANSITION APPLIED at the junction. */
    tl.to(transition, { autoAlpha: 1, scale: 1, duration: 0.5, ease: EASE.overshoot }, '-=0.15')
      .fromTo(
        '[data-video-transition-icon]',
        { rotate: 0 },
        { rotate: 180, duration: 0.8, ease: 'power2.inOut' },
        '<',
      )

    /* 07 — PREVIEW CHANGES: a real cross-dissolve through the transition. */
    if (hasStills) {
      tl.to(previews[previews.length - 2], { autoAlpha: 0, duration: 0.9, ease: 'power2.inOut' }, '+=0.1').to(
        previews[previews.length - 1],
        { autoAlpha: 1, duration: 0.9, ease: 'power2.inOut' },
        '<',
      )
    }
    tl.fromTo(
        '[data-video-flash]',
        { autoAlpha: 0 },
        { autoAlpha: 0.42, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.inOut' },
        '<+0.32',
      )

    /* 08 — FINAL VIDEO PLAYS: playhead runs out, preview takes the frame. */
    const finish = { p: 0.72 }
    tl.to(finish, {
      p: 1,
      duration: 1.6,
      ease: 'power1.inOut',
      onUpdate: () => {
        gsap.set(playhead, { left: `${finish.p * 100}%` })
        gsap.set(progress, { scaleX: finish.p })
        setTC(finish.p)
      },
    })
      .to('[data-video-chrome]', { autoAlpha: 0, duration: 0.8, ease: 'power2.inOut' }, '-=0.9')
      .to('[data-video-preview-wrap]', { scale: mobile ? 1.06 : 1.4, duration: 1.6, ease: 'power2.inOut' }, '-=0.8')
      .to(nle, { scale: mobile ? 1.04 : 1.32, z: mobile ? 180 : 300, duration: 1.6, ease: 'power2.in' }, '<')
      .to(glow, { opacity: 1.7, duration: 1.2 }, '<')
      .to(tag, { autoAlpha: 0, duration: 0.4 }, '<')
      .fromTo(
        '[data-video-cta]',
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: EASE.settle },
        '-=0.9',
      )
  }, [])

  /* Tracks — authored so the edit reads clearly at small sizes. */
  const tracks = [
    {
      id: 'V2',
      kind: 'video',
      clips: [
        { id: 'v2a', left: '8%', width: '20%', label: 'TITLE' },
        { id: 'v2b', left: '52%', width: '16%', label: 'LOWER 3RD' },
      ],
    },
    {
      id: 'V1',
      kind: 'video',
      clips: [
        { id: 'v1a', left: '2%', width: '20%', label: 'WIDE' },
        { id: 'v1b', left: '23%', width: '21%', label: 'PRODUCT' },
        { id: 'v1c', left: '45%', width: '21%', label: 'DETAIL' },
        { id: 'v1d', left: '67%', width: '26%', label: 'HERO' },
      ],
    },
    { id: 'A1', kind: 'audio', clips: [{ id: 'a1', left: '2%', width: '91%', label: 'SCORE' }] },
  ]

  let clipIndex = -1

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
        className="pointer-events-none absolute left-1/2 top-1/2 h-[64vmin] w-[86vmin] -translate-x-1/2 -translate-y-1/2 opacity-0"
        style={{ background: `radial-gradient(ellipse, ${service.accent}20 0%, rgba(5,5,7,0) 70%)` }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 preserve-3d">
        <div ref={nleRef} className="relative preserve-3d will-change-transform">
          <PanelFrame
            label="HALCYON_MASTER_v14 — 23.976"
            accent={service.accent}
            className="w-[min(92vw,880px)]"
          >
            <div className="p-2.5 md:p-4">
              <div className="flex gap-2.5 md:gap-4">
                {/* Preview */}
                <div data-video-preview-wrap className="relative flex-1 will-change-transform">
                  <div className="relative aspect-video overflow-hidden rounded-sm bg-black">
                    {hasFootage ? (
                      <video
                        ref={videoRef}
                        className="h-full w-full object-cover"
                        poster={project.video.poster ?? project.thumbnail}
                        muted
                        playsInline
                        loop
                        preload="none"
                        aria-label={`${project.title} — preview`}
                      >
                        {project.video.webm && <source src={project.video.webm} type="video/webm" />}
                        <source src={project.video.src} type="video/mp4" />
                      </video>
                    ) : (
                      project.images.concat(project.images[0]).map((src, i) => (
                        <img
                          key={`${src}-${i}`}
                          ref={(el) => setPreview(el, i)}
                          src={src}
                          alt={i === 0 ? `${project.title} — programme monitor` : ''}
                          aria-hidden={i > 0}
                          loading={i === 0 ? 'eager' : 'lazy'}
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ))
                    )}

                    {/* Dissolve flash */}
                    <div
                      data-video-flash
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-white opacity-0"
                    />

                    {/* Safe-area guides */}
                    <div
                      data-video-chrome
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-[9%] border border-white/15"
                    />
                    <div
                      data-video-chrome
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25"
                    />

                    {/* Timecode */}
                    <span
                      data-video-chrome
                      ref={timecodeRef}
                      className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[7.5px] tabular-nums text-bone md:text-[9px]"
                    >
                      00:00:00:00
                    </span>
                  </div>

                  {/* Transport */}
                  <div data-video-chrome className="mt-1.5 flex items-center gap-2 md:mt-2.5">
                    <span className="flex gap-1">
                      {['◀◀', '▶', '▶▶'].map((g, i) => (
                        <span
                          key={g}
                          className="grid h-5 w-5 place-items-center rounded text-[7px] md:h-6 md:w-6 md:text-[8px]"
                          style={{
                            backgroundColor: i === 1 ? service.accent : '#232329',
                            color: i === 1 ? '#050507' : '#9C9CA8',
                          }}
                        >
                          {g}
                        </span>
                      ))}
                    </span>
                    <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-smoke">
                      <span
                        ref={progressRef}
                        className="absolute inset-y-0 left-0 w-full origin-left rounded-full"
                        style={{ backgroundColor: service.accent }}
                      />
                    </span>
                  </div>
                </div>

                {/* Inspector */}
                <div
                  data-video-inspector
                  data-video-chrome
                  className="hidden w-40 shrink-0 translate-x-4 flex-col gap-2 rounded border border-smoke/70 p-2.5 opacity-0 lg:flex"
                >
                  <span
                    className="font-mono text-[8px] uppercase tracking-[0.16em]"
                    style={{ color: service.accent }}
                  >
                    EFFECT CONTROLS
                  </span>
                  {['Opacity', 'Scale', 'Position', 'Lumetri'].map((e, i) => (
                    <div key={e} className="flex flex-col gap-1">
                      <span className="text-[9px] text-silver">{e}</span>
                      <span className="relative h-[3px] rounded-full bg-smoke">
                        <span
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ width: `${34 + i * 17}%`, backgroundColor: service.accent }}
                        />
                        <span
                          className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
                          style={{ left: `${34 + i * 17}%`, backgroundColor: service.accent }}
                        />
                      </span>
                    </div>
                  ))}
                  <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.16em] text-mist">SCOPES</span>
                  <div className="flex h-10 items-end gap-[1.5px]">
                    {waveform.slice(0, 22).map((v, i) => (
                      <span
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{ height: `${v * 100}%`, backgroundColor: '#A8C0A0', opacity: 0.5 }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div data-video-chrome className="relative mt-2.5 overflow-hidden rounded border border-smoke/70 md:mt-4">
                {/* Ruler */}
                <div className="relative flex h-5 items-end border-b border-smoke/70 bg-graphite px-1 md:h-6">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span key={i} className="flex-1 border-l border-smoke/60 pl-1">
                      <span className="font-mono text-[6px] text-mist md:text-[7px]">
                        00:{String(i * 9).padStart(2, '0')}
                      </span>
                    </span>
                  ))}
                </div>

                {tracks.map((t) => (
                  <div key={t.id} className="relative flex border-b border-smoke/50 last:border-0">
                    <span className="grid w-8 shrink-0 place-items-center border-r border-smoke/60 bg-graphite font-mono text-[7px] text-mist md:w-10 md:text-[8px]">
                      {t.id}
                    </span>
                    <div className="relative h-9 flex-1 bg-carbon md:h-11">
                      {t.clips.map((c) => {
                        clipIndex += 1
                        const idx = clipIndex
                        return (
                          <div
                            key={c.id}
                            ref={(el) => setClip(el, idx)}
                            className="absolute inset-y-1 overflow-hidden rounded-sm will-change-transform"
                            style={{
                              left: c.left,
                              width: c.width,
                              backgroundColor:
                                t.kind === 'audio' ? 'rgba(168,192,160,0.16)' : `${service.accent}2e`,
                              border: `1px solid ${t.kind === 'audio' ? 'rgba(168,192,160,0.5)' : `${service.accent}77`}`,
                            }}
                          >
                            {t.kind === 'video' ? (
                              <>
                                <img
                                  src={project.images[idx % project.images.length]}
                                  alt=""
                                  loading="lazy"
                                  className="absolute inset-0 h-full w-full object-cover opacity-40"
                                />
                                <span className="relative block px-1 pt-0.5 font-mono text-[5.5px] uppercase tracking-[0.1em] text-bone md:text-[6.5px]">
                                  {c.label}
                                </span>
                              </>
                            ) : (
                              <svg viewBox="0 0 96 24" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
                                {waveform.map((v, i) => (
                                  <line
                                    key={i}
                                    x1={i}
                                    y1={12 - v * 11}
                                    x2={i}
                                    y2={12 + v * 11}
                                    stroke="#A8C0A0"
                                    strokeWidth="0.7"
                                    opacity="0.75"
                                  />
                                ))}
                              </svg>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* Transition badge at the junction */}
                <div
                  ref={transitionRef}
                  aria-hidden="true"
                  className="absolute z-20 flex items-center gap-1 rounded-full border px-1.5 py-0.5 opacity-0 will-change-transform"
                  style={{
                    left: '39%',
                    top: '46%',
                    borderColor: service.accent,
                    backgroundColor: 'rgba(5,5,7,0.92)',
                  }}
                >
                  <span
                    data-video-transition-icon
                    className="block h-2 w-2 rounded-sm"
                    style={{ background: `linear-gradient(90deg, ${service.accent} 50%, transparent 50%)` }}
                  />
                  <span className="font-mono text-[6px] uppercase tracking-[0.12em] md:text-[7px]" style={{ color: service.accent }}>
                    CROSS DISSOLVE
                  </span>
                </div>

                {/* Playhead */}
                <div
                  ref={playheadRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 z-30 w-px will-change-transform"
                  style={{ backgroundColor: service.accent, left: '4%' }}
                >
                  <span
                    className="absolute -left-[5px] top-0 block h-2 w-[11px]"
                    style={{ backgroundColor: service.accent, clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
                  />
                </div>
              </div>
            </div>
          </PanelFrame>
        </div>

        <div ref={tagRef} className="opacity-0">
          <ProjectTag project={project} accent={service.accent} />
        </div>
      </div>

      <div data-video-cta className="absolute inset-x-0 bottom-[26%] z-40 flex justify-center opacity-0 md:bottom-[16%]">
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
