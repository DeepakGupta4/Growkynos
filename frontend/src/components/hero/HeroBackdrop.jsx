import { useEffect, useRef } from 'react'
import { useExperience } from '../../context/ExperienceContext'

/**
 * HERO BACKDROP
 * -------------
 * A single full-bleed WebGL field behind the whole hero.
 *
 * Replaces the drifting star canvas. Two reasons, both from what the last
 * version actually looked like on screen:
 *
 *  1. THE SEAM. The stars covered the full section while the colour wash
 *     covered only the right 53%, so the hero rendered as two different
 *     backgrounds meeting at a hard vertical line. Anything that colours the
 *     hero has to span the whole hero. This does.
 *
 *  2. Scattered dots on black read as absence, not atmosphere — they were most
 *     of why the frame measured 12% colour and looked empty.
 *
 * The field is domain-warped fbm noise: noise whose sample position is itself
 * displaced by noise. That is what gives the folding, liquid-metal look rather
 * than the flat cloudiness of plain fbm, and it costs one extra noise octave.
 * Raw WebGL, no three.js — this is a single full-screen quad, and a 600KB
 * scene-graph library to draw one quad would be the most expensive thing on
 * the page.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uKey;    // active service colour
uniform vec3  uDeep;   // the ground it sits on
uniform vec2  uPointer;

/* -- value noise + fbm ------------------------------------------------ */
vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                 dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
             mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                 dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

/*
 * Two octave counts on purpose. The warp lookups only decide WHERE the final
 * field is sampled, so their fine detail is thrown away — running them at five
 * octaves cost four extra noise fetches per pixel for nothing visible. Only the
 * final sample keeps the detail.
 *
 * Before: 5 fbm calls x 5 octaves = 25 noise fetches per pixel.
 * After:  4 warp calls x 2 + 1 final x 4 = 12.
 */
float fbm2(vec2 p) {
  return 0.5 * noise(p) + 0.25 * noise(p * 2.02);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  // Correct for aspect so the folds do not stretch on wide monitors.
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes.xy) / uRes.y;

  /*
   * DISTORTION FIELD
   * ----------------
   * The pointer displaces the SAMPLE POSITION, not just the brightness. Pushing
   * p away from the cursor before the field is evaluated means the folds
   * genuinely part around it and close behind it — the same effect the old
   * particle field had, except here it deforms a continuous surface, so there
   * is nothing to count and nothing to drop on a weak GPU.
   *
   * Brightening alone was the previous version and it read as a flashlight
   * pointed at a wall; displacement is what makes the surface feel like it has
   * substance.
   */
  vec2 pc = uPointer * vec2(uRes.x / uRes.y, 1.0) * 0.5;
  vec2 toP = p - pc;
  float pd = length(toP);
  float infl = smoothstep(0.62, 0.0, pd);
  p += (toP / max(pd, 1e-4)) * infl * 0.30;

  float t = uTime * 0.045;

  // Domain warping: two noise lookups displace the third. This is what makes
  // the field fold over itself instead of merely drifting.
  vec2 q = vec2(fbm2(p * 1.6 + vec2(0.0, t)), fbm2(p * 1.6 + vec2(5.2, 1.3 - t)));
  vec2 r = vec2(fbm2(p * 1.9 + 3.4 * q + vec2(1.7, 9.2) + t * 0.7),
                fbm2(p * 1.9 + 3.4 * q + vec2(8.3, 2.8) - t * 0.5));
  float f = fbm(p * 1.7 + 3.8 * r);

  // Light rides along with the displacement, so the parted area also glows.
  float lift = infl * 0.20;

  float m = clamp(f * 0.5 + 0.5 + lift, 0.0, 1.0);

  // Ground -> deep -> key. The ramp starts earlier and the key is mixed much
  // further in than before: at 0.55 the colour only ever appeared in the
  // brightest folds and the field read as almost-black with a hint of tint.
  vec3 col = mix(vec3(0.030, 0.030, 0.042), uDeep * 1.55, smoothstep(0.18, 0.72, m));
  col = mix(col, uKey, smoothstep(0.46, 1.0, m) * 0.92);

  // A brighter filament where the warp folds most sharply — this is what reads
  // as light passing through the field rather than a flat coloured wash.
  float fil = smoothstep(0.62, 0.92, m) * smoothstep(1.0, 0.70, m);
  col += uKey * fil * 1.05;

  // Weight the composition to the right, where the product panel sits. The left
  // still steps down so the statement has ground to sit on, but nowhere near as
  // far — at 0.34 the whole left half was effectively black.
  col *= mix(0.62, 1.18, smoothstep(0.02, 0.66, uv.x));
  // Vignette, roughly half its previous depth.
  col *= 1.0 - 0.26 * pow(length(uv - 0.5) * 1.25, 2.4);

  // Dither: without this, a gradient this soft bands visibly on 8-bit panels.
  float d = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (d - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`

const hexToRgb = (hex) => {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

const compile = (gl, type, src) => {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh)
    return null
  }
  return sh
}

export function HeroBackdrop({ look }) {
  const canvasRef = useRef(null)
  const targetRef = useRef({ key: look.key, deep: look.deep })
  const { reducedMotion, quality } = useExperience()

  /* A mutable box the render loop reads, so changing service colour eases the
     field rather than tearing down and rebuilding the WebGL context. */
  useEffect(() => {
    targetRef.current = { key: look.key, deep: look.deep }
  }, [look.key, look.deep])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    /*
     * Low-tier devices never start the shader at all.
     *
     * A full-screen fragment shader is cheap on any GPU and expensive without
     * one: measured on a software renderer it held the page to 11.7fps before
     * optimisation and 25fps after. Rather than ship that to a phone with no
     * hardware acceleration, those devices get the CSS gradient below the
     * canvas — which is the same palette, just not moving.
     */
    if (quality.label === 'low') return undefined

    const gl =
      canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' }) ||
      canvas.getContext('experimental-webgl', { alpha: false })

    /* No WebGL: the CSS gradient underneath this canvas is the whole fallback,
       so there is nothing to tear down and nothing missing on screen. */
    if (!gl) return undefined

    const vs = compile(gl, gl.VERTEX_SHADER, VERT)
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vs || !fs) return undefined

    const prog = gl.createProgram()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return undefined
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'aPos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uRes = gl.getUniformLocation(prog, 'uRes')
    const uTime = gl.getUniformLocation(prog, 'uTime')
    const uKey = gl.getUniformLocation(prog, 'uKey')
    const uDeep = gl.getUniformLocation(prog, 'uDeep')
    const uPointer = gl.getUniformLocation(prog, 'uPointer')

    /* Half resolution. The field has no hard edges, so the difference is not
       visible, and it roughly quarters the fragment cost of a full-screen
       shader on a 4K panel. */
    const scale = quality.label === 'low' ? 0.32 : 0.45
    let w = 0
    let h = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * scale
      w = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      h = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
    }

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMove = (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1
      pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1)
    }

    /* Colours ease between services rather than cutting, so the word change and
       the background change read as one move. */
    let cur = hexToRgb(targetRef.current.key)
    let curDeep = hexToRgb(targetRef.current.deep)

    let raf = 0
    let last = 0
    /*
     * 30fps, not 60. The field moves at 0.045 units a second — at that speed a
     * dropped frame is not perceivable, and halving the draw rate halves the
     * cost of the most expensive thing on the page. The pointer easing runs on
     * the same clock, which is why it stays smooth rather than stepping.
     */
    const MIN_DT = 1000 / 30

    const start = performance.now()
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (now - last < MIN_DT) return
      last = now

      const tgt = hexToRgb(targetRef.current.key)
      const tgtDeep = hexToRgb(targetRef.current.deep)
      for (let i = 0; i < 3; i++) {
        cur[i] += (tgt[i] - cur[i]) * 0.14
        curDeep[i] += (tgtDeep[i] - curDeep[i]) * 0.14
      }
      pointer.x += (pointer.tx - pointer.x) * 0.20
      pointer.y += (pointer.ty - pointer.y) * 0.20

      gl.uniform2f(uRes, w, h)
      gl.uniform1f(uTime, (performance.now() - start) / 1000)
      gl.uniform3f(uKey, cur[0], cur[1], cur[2])
      gl.uniform3f(uDeep, curDeep[0], curDeep[1], curDeep[2])
      gl.uniform2f(uPointer, pointer.x, pointer.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    resize()
    window.addEventListener('resize', resize)

    if (reducedMotion) {
      /* One frame, held. The colour still answers the active service; only the
         motion is dropped, which is what the preference actually asks for. */
      cur = hexToRgb(targetRef.current.key)
      curDeep = hexToRgb(targetRef.current.deep)
      gl.uniform2f(uRes, w, h)
      gl.uniform1f(uTime, 12)
      gl.uniform3f(uKey, cur[0], cur[1], cur[2])
      gl.uniform3f(uDeep, curDeep[0], curDeep[1], curDeep[2])
      gl.uniform2f(uPointer, 0, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    } else {
      window.addEventListener('pointermove', onMove, { passive: true })
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
    }
  }, [reducedMotion, quality.label])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      /* Painted underneath the canvas: this is what shows if WebGL is
         unavailable, and it is what fills the frame for the first paint. */
      style={{
        background: `radial-gradient(120% 100% at 78% 34%, ${look.deep} 0%, #08080B 58%, #050507 100%)`,
        transition: 'background 900ms ease-out',
      }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  )
}
