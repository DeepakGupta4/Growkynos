/**
 * HERO LAPTOP
 * -----------
 * A single hardware frame that every hero scene is shown inside.
 *
 * The four scenes are hand-built and none of them is the same shape — a tall
 * phone, a wide dashboard, a node graph. Cut to cut the visual changed size and
 * the right-hand side of the hero never settled. Putting all four on the same
 * screen fixes that at the source: whatever is playing, the object on screen is
 * the same laptop at the same size in the same place.
 *
 * The screen is a fixed 16:10 area, which is also the aspect a real screen
 * recording comes out at — so when there is footage to show, a <video> drops
 * into exactly this box with nothing else moving (see `video` below).
 *
 * Drawn in CSS rather than shipped as an image: it stays sharp at any density,
 * it recolours with the active service, and it costs nothing to download.
 */
export function HeroLaptop({ children, tint = '#4F86FF', video = null, poster = null }) {
  return (
    <div className="relative w-full select-none">
      {/* ── Lid ── */}
      <div
        className="relative w-full rounded-[14px] p-[9px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)]"
        style={{
          /* Brushed-metal edge: a light top-left rim falling to a dark bottom
             edge is what reads as a machined shell rather than a grey box. */
          background: 'linear-gradient(150deg, #3A3C44 0%, #1B1D22 38%, #101116 78%, #26282F 100%)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        {/* Camera */}
        <div className="absolute left-1/2 top-[3px] h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-[#2A2C33]" />

        {/* ── Screen ── */}
        <div
          className="relative w-full overflow-hidden rounded-[6px] bg-[#050507]"
          style={{ aspectRatio: '16 / 10' }}
        >
          {video ? (
            /*
             * muted + playsInline are what make autoplay legal on iOS and in
             * Chrome; without both, the element silently never starts and the
             * screen sits black. poster covers the gap before the first frame.
             */
            <video
              className="h-full w-full object-cover"
              src={video}
              poster={poster ?? undefined}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">{children}</div>
          )}

          {/* Screen glass: a single diagonal sheen, tinted to the active
              service so the hardware belongs to the same frame as the field. */}
          <div
            className="pointer-events-none absolute inset-0 mix-blend-screen"
            style={{
              background: `linear-gradient(112deg, ${tint}1F 0%, rgba(255,255,255,0.05) 26%, rgba(255,255,255,0) 52%)`,
            }}
          />
          {/* Inner bezel shadow, so the picture sits behind glass. */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[6px]"
            style={{ boxShadow: 'inset 0 0 22px rgba(0,0,0,0.55)' }}
          />
        </div>
      </div>

      {/* ── Base ── */}
      <div className="relative mx-auto" style={{ width: '112%', marginLeft: '-6%' }}>
        <div
          className="h-[11px] w-full"
          style={{
            /* Trapezoid: the deck recedes, which is what gives the machine
               depth without needing a 3D transform (and without the hit-testing
               problems a preserve-3d parent brings with it). */
            clipPath: 'polygon(1.5% 0%, 98.5% 0%, 95% 100%, 5% 100%)',
            background: 'linear-gradient(180deg, #2B2D34 0%, #17181D 55%, #0C0D10 100%)',
          }}
        />
        {/* Notch for opening the lid */}
        <div className="absolute left-1/2 top-0 h-[3px] w-[13%] -translate-x-1/2 rounded-b-full bg-[#0B0C0F]" />
        {/* Contact shadow on the ground */}
        <div
          className="mx-auto h-6 w-[78%] blur-md"
          style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 70%)' }}
        />
      </div>
    </div>
  )
}
