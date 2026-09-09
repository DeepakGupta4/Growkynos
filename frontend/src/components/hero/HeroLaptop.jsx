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
 * WHAT MAKES IT READ AS A MACHINE RATHER THAN A ROUNDED RECTANGLE.
 * The first version was a flat grey box with a thin strip under it, and it
 * looked like a placeholder. Four things carry the difference, and all of them
 * are lighting rather than shape:
 *
 *  1. A RIM LIGHT along the top edge and down both sides. Real anodised
 *     aluminium catches a hard specular line where the surface turns away from
 *     the viewer; without it, any grey gradient reads as paper.
 *  2. A CHIN. Screens do not reach the bottom edge of a lid. The extra 20px of
 *     shell below the panel is most of what makes the proportions look real.
 *  3. SCREEN SPILL. The picture throws its own colour onto the deck below it
 *     and onto the ground behind it. This is the single detail that stops the
 *     laptop looking pasted on top of the background.
 *  4. A DECK WITH DEPTH — hinge, keyboard well, trackpad, front lip — instead
 *     of one flat bar.
 *
 * Drawn in CSS rather than shipped as an image: sharp at any density, recolours
 * with the active service, and costs nothing to download.
 */
export function HeroLaptop({ children, tint = '#4F86FF', video = null, poster = null }) {
  return (
    <div className="relative w-full select-none">
      {/*
        Two layers, and the order matters.

        A DARK CORE directly behind the machine, then colour only further out.
        A single bright bloom was the first attempt and it backfired: the field
        behind the hero is already saturated, so adding more light right where
        the laptop sits left the screen — which is mostly near-black UI — with
        less contrast against its surroundings than the surroundings had against
        each other. The screen stopped reading as a lit panel.

        Darkening the air immediately behind the object and letting the colour
        bloom outside it is the standard product-shot fix: the machine gets its
        own pool of shadow to sit in, and the picture is the brightest thing
        inside its own silhouette again.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-[8%] -top-[8%] bottom-[-10%] blur-2xl"
        style={{
          background:
            'radial-gradient(52% 44% at 50% 46%, rgba(4,4,7,0.82) 0%, rgba(4,4,7,0.45) 58%, rgba(0,0,0,0) 80%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-[16%] -top-[14%] bottom-[-20%] blur-3xl"
        style={{
          background: `radial-gradient(60% 48% at 50% 44%, rgba(0,0,0,0) 0%, ${tint}1C 52%, rgba(0,0,0,0) 78%)`,
        }}
      />

      {/* ── Lid ───────────────────────────────────────────────────────── */}
      <div
        className="relative w-full rounded-[16px] px-[10px] pb-[19px] pt-[10px]"
        style={{
          /* Anodised shell: a cool highlight at the top-left falling through
             two dark steps to a lifted bottom edge, which is the light bouncing
             back off the deck. */
          background:
            'linear-gradient(154deg, #4A4D57 0%, #23252C 22%, #14161A 52%, #0D0E12 78%, #2A2D35 100%)',
          boxShadow:
            '0 2px 1px rgba(255,255,255,0.06) inset, 0 40px 90px -28px rgba(0,0,0,0.85), 0 8px 24px -12px rgba(0,0,0,0.6)',
        }}
      >
        {/* Rim light — top edge, brightest in the middle where it faces us. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[8%] top-0 h-px rounded-full"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 46%, rgba(255,255,255,0.18) 100%)',
          }}
        />
        {/* Rim light — side edges, fading out before the corners so they do not
            cross the radius and break the silhouette. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-[10%] left-0 w-px"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.30), rgba(255,255,255,0) 70%)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-[10%] right-0 w-px"
          style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 70%)' }}
        />

        {/* Camera */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[4px] h-[3px] w-[3px] -translate-x-1/2 rounded-full"
          style={{ background: 'radial-gradient(circle, #4A4D55 0%, #1A1C20 70%)' }}
        />

        {/* ── Screen ── */}
        <div
          className="relative w-full overflow-hidden rounded-[5px] bg-[#040406]"
          style={{ aspectRatio: '16 / 10', boxShadow: '0 0 0 1px rgba(0,0,0,0.9)' }}
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

          {/* Backlight. The scenes are near-black interfaces, and against a
              saturated field an unlit black rectangle reads as a switched-off
              screen. A faint lift from the centre is what a real panel does and
              it is enough to say "this is on". */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(70% 60% at 50% 42%, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0) 72%)',
            }}
          />

          {/* Glass: one diagonal sheen across the top-left corner, tinted to the
              active service so the hardware belongs to the same frame. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 mix-blend-screen"
            style={{
              background: `linear-gradient(118deg, ${tint}26 0%, rgba(255,255,255,0.07) 22%, rgba(255,255,255,0) 46%)`,
            }}
          />
          {/* The panel is recessed behind the shell, so the bezel casts inward. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ boxShadow: 'inset 0 0 26px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)' }}
          />
        </div>

        {/* Chin. Screens do not reach the bottom of a lid, and the wordmark
            here is what gives the eye the scale of the machine. */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-[6px] text-center font-mono text-[6.5px] uppercase tracking-[0.42em] text-white/22"
        >
          Gentechne
        </div>
      </div>

      {/* ── Hinge ─────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="relative mx-auto h-[4px] w-[96%] rounded-b-[3px]"
        style={{ background: 'linear-gradient(180deg, #23252B 0%, #121317 60%, #08090B 100%)' }}
      />

      {/* ── Deck ──────────────────────────────────────────────────────── */}
      <div aria-hidden="true" className="relative mx-auto" style={{ width: '116%', marginLeft: '-8%' }}>
        <div
          className="relative h-[17px] overflow-hidden"
          style={{
            /* Trapezoid: the deck recedes toward the hinge. Faking the
               perspective with a clip-path rather than a 3D transform keeps the
               screen content perfectly flat and avoids a preserve-3d parent,
               which brings its own hit-testing problems. */
            clipPath: 'polygon(2.2% 0%, 97.8% 0%, 94% 100%, 6% 100%)',
            background: 'linear-gradient(180deg, #383B44 0%, #202329 26%, #14161A 62%, #0B0C0F 100%)',
          }}
        >
          {/* Screen spill: the picture lighting the deck immediately below it.
              This is the detail that stops the machine looking pasted on. */}
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(180deg, ${tint}2E 0%, ${tint}0B 40%, rgba(0,0,0,0) 78%)` }}
          />
          {/* Keyboard well */}
          <div
            className="absolute inset-x-[16%] top-[26%] h-[38%] rounded-[2px]"
            style={{ background: 'rgba(0,0,0,0.42)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
          />
          {/* Trackpad */}
          <div
            className="absolute bottom-[6%] left-1/2 h-[26%] w-[15%] -translate-x-1/2 rounded-[1.5px]"
            style={{ background: 'rgba(255,255,255,0.045)' }}
          />
          {/* Front lip catching the light */}
          <div
            className="absolute inset-x-[6%] bottom-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)' }}
          />
        </div>

        {/* Contact shadow: tight and dark where the machine meets the ground,
            widening and fading as it moves away. */}
        <div
          className="mx-auto h-7 w-[86%] blur-lg"
          style={{
            background: 'radial-gradient(ellipse 60% 100% at center top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 72%)',
          }}
        />
        {/* Screen colour pooling on the ground under the machine. */}
        <div
          className="mx-auto -mt-6 h-10 w-[70%] blur-2xl"
          style={{
            background: `radial-gradient(ellipse 55% 100% at center top, ${tint}22 0%, rgba(0,0,0,0) 74%)`,
          }}
        />
      </div>
    </div>
  )
}
