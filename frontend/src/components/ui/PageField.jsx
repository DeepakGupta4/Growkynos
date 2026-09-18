import { useEffect, useRef } from 'react'
import { getAccent, onAccent } from '../../lib/accent'
import { useExperience } from '../../context/ExperienceContext'

/**
 * PAGE FIELD
 * ----------
 * One WebGL field behind the entire site, whose colour follows whichever
 * section the reader is in.
 *
 * WHY ONE, AND WHY GLOBAL.
 * The hero used to own a field of its own while every other section sat on
 * flat black with a small accent wash — so the page looked like the hero and
 * then like something else. Giving each section its own field would have meant
 * ten WebGL contexts (browsers cap out around sixteen, and each one costs),
 * and the boundary between any two would be a visible seam, which is exactly
 * the bug the hero already had once.
 *
 * Fixed rather than scrolling: the field is the room the page moves through,
 * not a layer of the page.
 *
 * The field is domain-warped fbm noise — noise whose sample position is itself
 * displaced by noise — which is what gives the folding, liquid look rather than
 * flat cloudiness. Raw WebGL, no three.js: this is one full-screen quad, and a
 * scene-graph library to draw one quad would be the heaviest thing on the page.
 */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform vec3  uKey;      // active section colour
uniform vec3  uDeep;     // the ground it sits on
uniform vec2  uPointer;
uniform float uBias;     // 1 = weight the light to the right (hero), 0 = centred

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

/* Two octave counts on purpose: the warp lookups only decide WHERE the final
   field is sampled, so their detail is thrown away. 12 noise fetches a pixel
   rather than 25. */
float fbm2(vec2 p) { return 0.5 * noise(p) + 0.25 * noise(p * 2.02); }

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes.xy) / uRes.y;

  /* Distortion field: the pointer displaces the SAMPLE POSITION, not just the
     brightness, so the folds genuinely part around the cursor and close behind
     it. Brightening alone reads as a torch pointed at a wall. */
  vec2 pc = uPointer * vec2(uRes.x / uRes.y, 1.0) * 0.5;
  vec2 toP = p - pc;
  float pd = length(toP);
  float infl = smoothstep(0.62, 0.0, pd);
  p += (toP / max(pd, 1e-4)) * infl * 0.30;

  float t = uTime * 0.045;

  vec2 q = vec2(fbm2(p * 1.6 + vec2(0.0, t)), fbm2(p * 1.6 + vec2(5.2, 1.3 - t)));
  vec2 r = vec2(fbm2(p * 1.9 + 3.4 * q + vec2(1.7, 9.2) + t * 0.7),
                fbm2(p * 1.9 + 3.4 * q + vec2(8.3, 2.8) - t * 0.5));
  float f = fbm(p * 1.7 + 3.8 * r);

  float lift = infl * 0.20;
  float m = clamp(f * 0.5 + 0.5 + lift, 0.0, 1.0);

  vec3 col = mix(vec3(0.030, 0.030, 0.042), uDeep * 1.55, smoothstep(0.18, 0.72, m));
  col = mix(col, uKey, smoothstep(0.46, 1.0, m) * 0.92);

  float fil = smoothstep(0.62, 0.92, m) * smoothstep(1.0, 0.70, m);
  col += uKey * fil * 1.05;

  /* In the hero the light leans right, where the product panel sits, and the
     left steps down so the statement has ground. Everywhere else the content
     is centred, so the lean is eased away rather than fighting the layout. */
  float leanR = mix(0.62, 1.18, smoothstep(0.02, 0.66, uv.x));
  float even = mix(0.80, 1.04, smoothstep(0.0, 0.5, 1.0 - abs(uv.x - 0.5) * 2.0));
  col *= mix(even, leanR, uBias);

  /*
   * CALM DOWN OUTSIDE THE HERO.
   *
   * The hero puts a reading scrim between this field and its text, so the
   * field can be loud there. No other section has one — their content sits
   * straight on it — and at full strength the Studio photographs were floating
   * on bright blue silk that read louder than they did. Same palette, same
   * motion, roughly half the level.
   */
  col *= mix(0.30, 1.0, uBias);

  col *= 1.0 - 0.26 * pow(length(uv - 0.5) * 1.25, 2.4);

  /* Dither: a gradient this soft bands visibly on 8-bit panels without it. */
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

export function PageField() {
  const canvasRef = useRef(null)
  const { reducedMotion, quality } = useExperience()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    /*
     * Low-tier devices never start the shader. A full-screen fragment shader is
     * cheap on any GPU and expensive without one — measured on a software
     * renderer it held the page to 25fps even after optimisation. Those devices
     * get the CSS gradient underneath instead: same palette, not moving.
     */
    if (quality.label === 'low') return undefined

    const gl =
      canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' }) ||
      canvas.getContext('experimental-webgl', { alpha: false })
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

    const U = {
      res: gl.getUniformLocation(prog, 'uRes'),
      time: gl.getUniformLocation(prog, 'uTime'),
      key: gl.getUniformLocation(prog, 'uKey'),
      deep: gl.getUniformLocation(prog, 'uDeep'),
      pointer: gl.getUniformLocation(prog, 'uPointer'),
      bias: gl.getUniformLocation(prog, 'uBias'),
    }

    /* Under half resolution. The field has no hard edges, so the difference is
       not visible, and it roughly quarters the fragment cost on a 4K panel. */
    const scale = 0.45
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

    let target = getAccent()
    const unsubscribe = onAccent((a) => {
      target = a
    })

    let cur = hexToRgb(target.key)
    let curDeep = hexToRgb(target.deep)
    let bias = 1

    let raf = 0
    let last = 0
    let stillUnsub = null
    let stillResize = null
    /* 30fps. The field moves at 0.045 units a second — a dropped frame is not
       perceivable there, and halving the draw rate halves the cost of the most
       expensive thing on the page. */
    const MIN_DT = 1000 / 30
    const start = performance.now()

    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (now - last < MIN_DT) return
      last = now

      const tgt = hexToRgb(target.key)
      const tgtDeep = hexToRgb(target.deep)
      for (let i = 0; i < 3; i++) {
        cur[i] += (tgt[i] - cur[i]) * 0.09
        curDeep[i] += (tgtDeep[i] - curDeep[i]) * 0.09
      }
      pointer.x += (pointer.tx - pointer.x) * 0.2
      pointer.y += (pointer.ty - pointer.y) * 0.2

      // Lean right only while the hero is on screen.
      const wantBias = window.scrollY < window.innerHeight * 0.8 ? 1 : 0
      bias += (wantBias - bias) * 0.06

      gl.uniform2f(U.res, w, h)
      gl.uniform1f(U.time, (performance.now() - start) / 1000)
      gl.uniform3f(U.key, cur[0], cur[1], cur[2])
      gl.uniform3f(U.deep, curDeep[0], curDeep[1], curDeep[2])
      gl.uniform2f(U.pointer, pointer.x, pointer.y)
      gl.uniform1f(U.bias, bias)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    resize()
    window.addEventListener('resize', resize)

    /* One still frame, at whatever colour the page is currently on. */
    const drawStill = () => {
      cur = hexToRgb(target.key)
      curDeep = hexToRgb(target.deep)
      gl.uniform2f(U.res, w, h)
      gl.uniform1f(U.time, 12)
      gl.uniform3f(U.key, cur[0], cur[1], cur[2])
      gl.uniform3f(U.deep, curDeep[0], curDeep[1], curDeep[2])
      gl.uniform2f(U.pointer, 0, 0)
      gl.uniform1f(U.bias, 0.5)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    if (reducedMotion) {
      /*
       * This used to draw once and stop. The canvas is opaque, so it covers the
       * CSS fallback underneath — and that one frame was painted at whatever
       * accent happened to be set at mount, which is the brass default. The
       * result: the hero cycled through its four worlds, the button and the
       * type changed colour, and the background stayed the same brown for the
       * whole page. Reported from a phone, where reduced motion is common.
       *
       * Changing colour is not motion. Redrawing the still frame when the
       * section colour changes keeps the promise reduced motion actually makes
       * — nothing moves — while letting the page stay one piece.
       */
      drawStill()
      stillUnsub = onAccent((a) => {
        target = a
        drawStill()
      })
      stillResize = () => drawStill()
      window.addEventListener('resize', stillResize)
    } else {
      window.addEventListener('pointermove', onMove, { passive: true })
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(raf)
      unsubscribe()
      stillUnsub?.()
      if (stillResize) window.removeEventListener('resize', stillResize)
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
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      /* Painted under the canvas: the whole fallback when WebGL is missing,
         and what fills the frame on the very first paint. */
      style={{
        background:
          'radial-gradient(120% 100% at 70% 30%, var(--accent) 0%, #08080B 55%, #050507 100%)',
      }}
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  )
}
