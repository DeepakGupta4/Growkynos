import { HeroLaptop } from './HeroLaptop'

/**
 * SCENE SHELL
 * -----------
 * The frame the hero's scene plays inside: a laptop where there is room for
 * one, and a plain lit panel on a phone.
 *
 * WHY THE PHONE DOES NOT GET THE LAPTOP.
 * Measured at 390px wide, the laptop's screen comes out 339×212 — the bezel,
 * the chin and the base eat most of the height the phone had to give. The same
 * scene gets 700×438 on a monitor. A composition built for the larger canvas
 * shrinks into the smaller one until the text inside it is unreadable, and the
 * viewer is left looking at a nicely drawn laptop containing nothing they can
 * make out. Dropping the hardware gives the picture that height back.
 *
 * The shell was never the point — the work on the screen is.
 *
 * Both paths keep the identical fixed 16:10 box, and that box has to be real:
 * letting the scene claim the space instead was tried, and with no aspect ratio
 * the frame measured zero height, so the fit resolved to nothing and the scene
 * disappeared entirely.
 */
export function SceneShell({ laptop, tint, video, children }) {
  if (laptop) {
    return (
      <HeroLaptop tint={tint} video={video}>
        {children}
      </HeroLaptop>
    )
  }

  return (
    <div className="relative w-full select-none">
      {/* The same coloured bloom the laptop casts, so the panel still sits in
          the field rather than on top of it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 rounded-[26px] opacity-30 blur-2xl"
        style={{ background: `radial-gradient(62% 52% at 50% 46%, ${tint} 0%, rgba(0,0,0,0) 72%)` }}
      />

      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{
          /*
           * 16:10, the same as the laptop.
           *
           * This was 4:3, on the reasoning that the scenes are tall and narrow
           * at phone width so the fit is limited by height. That was true, but
           * only because the scenes were collapsing: they size in vw, so on a
           * phone they built at a fraction of their design width and came out
           * as strips. With `--hero-vw` pinning them to their design width they
           * are landscape here exactly as they are on a desktop, and a 4:3 box
           * around a 16:10 subject is just empty floor under it.
           */
          aspectRatio: '16 / 10',
          background: 'linear-gradient(158deg, rgba(16,16,21,0.96) 0%, rgba(7,7,10,0.98) 100%)',
          boxShadow: `inset 0 0 0 1px ${tint}33, 0 26px 60px -30px rgba(0,0,0,0.9)`,
        }}
      >
        {video ? (
          <video
            className="h-full w-full object-cover"
            src={video}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">{children}</div>
        )}

        {/* One diagonal sheen, tinted — the panel reads as a lit screen rather
            than a flat rectangle. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 mix-blend-screen"
          style={{
            background: `linear-gradient(118deg, ${tint}1F 0%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0) 48%)`,
          }}
        />
      </div>
    </div>
  )
}
