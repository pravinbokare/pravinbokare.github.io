/* =========================================================
   Pravin Bokare · Portfolio v2
   ========================================================= */

/* ---- Edit me -------------------------------------------------------
   Set your GitHub username to show GitHub links (menu + contact). */
const CONFIG = {
  github: 'pravinbokare',
  email: 'pravinbokare10@gmail.com',
  linkedin: 'https://linkedin.com/in/pravin-bokare',
  leetcode: 'https://leetcode.com/u/pravin-bokare',
  resume: 'assets/Pravin_Bokare_Resume.pdf',
};
const githubUrl = CONFIG.github ? `https://github.com/${CONFIG.github}` : '';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const isMobile = () => innerWidth <= 820;

const state = { mouseX: innerWidth / 2, mouseY: innerHeight / 2, nx: 0, ny: 0, moved: false, vel: 0, lastY: scrollY };
let GL = null; // particle API once WebGL is up

/* ---------- toast + clipboard ---------- */
let toastT;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('show'), 2200);
}
async function copyText(text, msg) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch { /* ignore */ }
    ta.remove();
  }
  toast('✓ ' + msg);
}

/* =========================================================
   WebGL particle field — morphs into a shape per section
   ========================================================= */
function buildShapes(N) {
  const C = {
    cyan: [0.13, 0.83, 0.93], violet: [0.55, 0.36, 0.96], pink: [0.96, 0.45, 0.71], white: [0.86, 0.9, 1],
    bronze: [0.88, 0.52, 0.26], silver: [0.8, 0.84, 0.92], gold: [1, 0.76, 0.2], blue: [0.38, 0.65, 0.98], green: [0.2, 0.85, 0.6],
  };
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const R = Math.random;
  const gauss = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const dir = () => { const x = gauss(), y = gauss(), z = gauss(); const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
  const golden = Math.PI * (3 - Math.sqrt(5));
  const layer = new Float32Array(N);
  const make = (fn) => {
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const [p, c] = fn(i); pos.set(p, i * 3); col.set(c, i * 3); }
    return { pos, col };
  };

  const shapes = {};

  // Data core: fibonacci shell + glowing nucleus
  const shellN = Math.floor(N * 0.78);
  shapes.sphere = make((i) => {
    if (i < shellN) {
      const y = 1 - (i / (shellN - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i, s = 1.75 * (1 + (R() - 0.5) * 0.04);
      return [[Math.cos(th) * r * s, y * s, Math.sin(th) * r * s], mixc(C.cyan, C.violet, (y + 1) / 2)];
    }
    const d = dir(), rr = 0.95 * Math.cbrt(R());
    return [[d[0] * rr, d[1] * rr, d[2] * rr], mixc(C.pink, C.white, R())];
  });

  // DNA double helix
  shapes.helix = make(() => {
    const t = R() * 2 - 1, y = t * 2.7, a = t * Math.PI * 3.2;
    if (R() < 0.8) {
      const strand = R() < 0.5 ? 0 : Math.PI, j = 0.06;
      return [[Math.cos(a + strand) * 0.95 + gauss() * j, y + gauss() * j, Math.sin(a + strand) * 0.95 + gauss() * j], strand ? C.pink : C.cyan];
    }
    const ty = Math.round(t * 14) / 14, ay = ty * Math.PI * 3.2, u = R();
    const x0 = Math.cos(ay) * 0.95, z0 = Math.sin(ay) * 0.95;
    return [[lerp(x0, -x0, u), ty * 2.7, lerp(z0, -z0, u)], mixc(C.violet, C.white, 0.2)];
  });

  // Medallion layers: bronze / silver / gold discs + vertical streams
  const LY = [-1.15, 0, 1.15], LC = [C.bronze, C.silver, C.gold];
  shapes.layers = make((i) => {
    if (R() < 0.82) {
      const l = (R() * 3) | 0, r = 1.95 * Math.sqrt(R()), a = R() * Math.PI * 2;
      const ring = Math.abs(Math.sin(r * 9)) * 0.03;
      layer[i] = l + 1;
      return [[Math.cos(a) * r, LY[l] + gauss() * 0.025 + ring, Math.sin(a) * r], mixc(LC[l], C.white, R() * 0.15)];
    }
    const k = (R() * 14) | 0, a = (k / 14) * Math.PI * 2, r = 1.25;
    layer[i] = 0;
    return [[Math.cos(a) * r + gauss() * 0.02, -1.6 + R() * 3.2, Math.sin(a) * r + gauss() * 0.02], C.cyan];
  });

  // Data ocean: wave grid
  const cols = Math.ceil(Math.sqrt(N * 2.6)), rows = Math.ceil(N / cols);
  shapes.wave = make((i) => {
    const gx = i % cols, gz = Math.floor(i / cols);
    const x = (gx / cols) * 9 - 4.5, z = (gz / rows) * 4.4 - 2.2;
    const y = Math.sin(x * 1.1) * 0.38 + Math.cos(z * 1.7 + x * 0.6) * 0.28;
    return [[x, y, z], mixc(mixc(C.cyan, C.violet, (x + 4.5) / 9), C.pink, clamp((y + 0.6) / 1.4) * 0.5)];
  });

  // Torus knot
  shapes.knot = make(() => {
    const t = R() * Math.PI * 2, p = 2, q = 3, r = Math.cos(q * t) + 2.1;
    const d = dir(), tube = 0.2 * Math.sqrt(R());
    const k = 0.62;
    const hue = (Math.sin(t * 2) + 1) / 2;
    return [[(r * Math.cos(p * t)) * k + d[0] * tube, (r * Math.sin(p * t)) * k + d[1] * tube, (-Math.sin(q * t)) * k * 1.3 + d[2] * tube], mixc(mixc(C.cyan, C.violet, hue), C.pink, Math.max(0, Math.cos(t * 3)) * 0.6)];
  });

  // Agent network: clusters + edges
  const nodes = [[0, 0, 0]];
  for (let k = 0; k < 9; k++) { const d = dir(); nodes.push([d[0] * 1.7, d[1] * 1.2, d[2] * 1.7]); }
  const edges = [];
  for (let k = 1; k < nodes.length; k++) { edges.push([0, k]); edges.push([k, (k % 9) + 1]); }
  shapes.network = make(() => {
    if (R() < 0.58) {
      const k = (R() * nodes.length) | 0, n = nodes[k], s = k === 0 ? 0.22 : 0.13;
      return [[n[0] + gauss() * s, n[1] + gauss() * s, n[2] + gauss() * s], k === 0 ? C.white : (k % 2 ? C.violet : C.pink)];
    }
    const [a, b] = edges[(R() * edges.length) | 0], u = R(), A = nodes[a], B = nodes[b];
    return [[lerp(A[0], B[0], u) + gauss() * 0.02, lerp(A[1], B[1], u) + gauss() * 0.02, lerp(A[2], B[2], u) + gauss() * 0.02], mixc(C.cyan, C.blue, u)];
  });

  // Warehouse cube: outer + inner edges + lattice
  const cubeEdge = (s) => {
    const axis = (R() * 3) | 0, a = R() < 0.5 ? -s : s, b = R() < 0.5 ? -s : s, t = (R() * 2 - 1) * s;
    return axis === 0 ? [t, a, b] : axis === 1 ? [a, t, b] : [a, b, t];
  };
  shapes.cube = make(() => {
    const r = R();
    if (r < 0.4) return [cubeEdge(1.55), C.cyan];
    if (r < 0.6) return [cubeEdge(0.75), C.gold];
    const g = () => (Math.round(R() * 5) / 5) * 3.1 - 1.55;
    return [[g() + gauss() * 0.02, g() + gauss() * 0.02, g() + gauss() * 0.02], mixc(C.violet, C.cyan, R() * 0.4)];
  });

  // Spiral galaxy
  shapes.galaxy = make((i) => {
    const arms = 4, r = Math.pow(R(), 1.6) * 3.3, br = ((i % arms) / arms) * Math.PI * 2, spin = r * 1.25;
    const sc = Math.pow(R(), 3) * 0.6 * (R() < 0.5 ? 1 : -1);
    const x = Math.cos(br + spin) * r + sc, z = Math.sin(br + spin) * r + Math.pow(R(), 3) * 0.6 * (R() < 0.5 ? 1 : -1);
    return [[x, gauss() * 0.09 * (1.4 - r / 3.3), z], mixc(mixc(C.white, C.pink, clamp(r / 1.6)), C.violet, clamp((r - 1.6) / 1.7))];
  });

  // Wormhole: rings along Y, tipped toward the camera by SHAPE_TF
  shapes.tunnel = make(() => {
    const ring = (R() * 46) | 0, y = (ring / 45) * 9 - 4.5, a = R() * Math.PI * 2;
    const r = 1.55 + Math.sin(ring * 0.7) * 0.14 + gauss() * 0.03;
    return [[Math.cos(a) * r, y + gauss() * 0.02, Math.sin(a) * r], ring % 6 === 0 ? C.pink : mixc(C.cyan, C.violet, ring / 45)];
  });

  return { shapes, layer };
}

const SHAPE_TF = {
  sphere: { x: 2.75, y: 0, rx: 0, s: 0.95, spin: 1 },
  helix: { x: 2.9, y: 0.4, rx: 0.15, s: 1, spin: 1.2 },
  layers: { x: 0, y: -0.2, rx: 0.5, s: 1.2, spin: 0.6 },
  tunnel: { x: 0, y: 0, rx: 1.42, s: 1, spin: 0.9 },
  wave: { x: 0, y: -1.7, rx: 0.5, s: 1.15, spin: 0.08 },
  knot: { x: 0, y: 0.1, rx: 0.25, s: 1.05, spin: 0.8 },
  network: { x: 0, y: 0, rx: 0.1, s: 1.15, spin: 0.5 },
  cube: { x: 3.0, y: 0, rx: 0.45, s: 0.95, spin: 0.7 },
  galaxy: { x: 0, y: 0.6, rx: 1.05, s: 1.25, spin: 0.35 },
};

const VERT = /* glsl */ `
uniform float uMix; uniform float uTime; uniform float uSize; uniform float uPR;
uniform vec2 uMouse; uniform float uAspect; uniform float uLayer; uniform float uLayerOn;
attribute vec3 aFrom; attribute vec3 aTo; attribute vec3 aCFrom; attribute vec3 aCTo;
attribute float aRand; attribute float aLayer;
varying vec3 vColor; varying float vAlpha;
void main() {
  float t = clamp((uMix - aRand * 0.35) / 0.65, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 swirl = vec3(sin(aRand * 40.0), cos(aRand * 30.0), sin(aRand * 20.0 + 1.0));
  vec3 p = mix(aFrom, aTo, t) + swirl * sin(t * 3.14159265) * 0.8;
  p += 0.05 * vec3(sin(uTime * 0.9 + p.y * 2.5 + aRand * 6.28), cos(uTime * 0.8 + p.x * 2.5 + aRand * 3.0), sin(uTime * 0.7 + p.z * 2.5));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;
  vec2 ndc = clip.xy / clip.w;
  vec2 d = ndc - uMouse; d.x *= uAspect;
  float dist = length(d);
  float push = smoothstep(0.34, 0.0, dist);
  vec2 dir = d / max(dist, 0.0001); dir.x /= uAspect;
  clip.xy += dir * push * 0.12 * clip.w;
  gl_Position = clip;
  float layerSel = uLayerOn * step(0.5, uLayer);
  float hl = layerSel * (1.0 - step(0.5, abs(aLayer - uLayer)));
  gl_PointSize = uSize * uPR * (0.45 + aRand) * (1.0 + hl * 1.3 + push * 0.9) / -mv.z;
  vColor = mix(aCFrom, aCTo, t) * (1.0 + hl * 0.9) + push * 0.3;
  vAlpha = (0.55 + 0.45 * sin(uTime * 1.5 + aRand * 30.0)) * (1.0 - layerSel * 0.55 * (1.0 - hl));
}`;
const FRAG = /* glsl */ `
varying vec3 vColor; varying float vAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5; float d = length(c);
  if (d > 0.5) discard;
  float a = pow(1.0 - d * 2.0, 1.8);
  gl_FragColor = vec4(vColor, a * vAlpha);
}`;

function initGL() {
  const canvas = $('#gl');
  if (!window.THREE || !canvas) { canvas?.remove(); return null; }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch { canvas.remove(); return null; }

  const mobile = isMobile();
  const N = mobile ? 4200 : 9000;
  const pr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
  renderer.setPixelRatio(pr);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
  camera.position.z = 8;

  const { shapes, layer } = buildShapes(N);
  const rand = new Float32Array(N);
  for (let i = 0; i < N; i++) rand[i] = Math.random();

  const from = new Float32Array(shapes.sphere.pos), to = new Float32Array(shapes.sphere.pos);
  const cFrom = new Float32Array(shapes.sphere.col), cTo = new Float32Array(shapes.sphere.col);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const aFrom = new THREE.BufferAttribute(from, 3), aTo = new THREE.BufferAttribute(to, 3);
  const aCFrom = new THREE.BufferAttribute(cFrom, 3), aCTo = new THREE.BufferAttribute(cTo, 3);
  geo.setAttribute('aFrom', aFrom);
  geo.setAttribute('aTo', aTo);
  geo.setAttribute('aCFrom', aCFrom);
  geo.setAttribute('aCTo', aCTo);
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  geo.setAttribute('aLayer', new THREE.BufferAttribute(layer, 1));

  const uniforms = {
    uMix: { value: 1 }, uTime: { value: 0 }, uSize: { value: mobile ? 22 : 26 }, uPR: { value: pr },
    uMouse: { value: new THREE.Vector2(9, 9) }, uAspect: { value: innerWidth / innerHeight },
    uLayer: { value: 0 }, uLayerOn: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const group = new THREE.Group();
  group.add(points);
  scene.add(group);

  let current = 'sphere', mix = 1, layerTarget = 0, layerOn = 0;
  const tf = () => {
    const base = SHAPE_TF[current];
    return mobile ? { ...base, x: 0, y: base.y * 0.5, s: base.s * 0.72 } : base;
  };
  const cur = { x: tf().x, y: 0, rx: 0, s: 0.2 };

  // Bake the in-flight blend into `from` so a morph can be interrupted without a jump
  function setShape(name) {
    if (name === current || !shapes[name]) return;
    for (let i = 0; i < N; i++) {
      let t = clamp((mix - rand[i] * 0.35) / 0.65);
      t = t * t * (3 - 2 * t);
      const s = Math.sin(t * Math.PI) * 0.8, r = rand[i];
      const sw = [Math.sin(r * 40), Math.cos(r * 30), Math.sin(r * 20 + 1)];
      for (let k = 0; k < 3; k++) {
        const j = i * 3 + k;
        from[j] = from[j] + (to[j] - from[j]) * t + sw[k] * s;
        cFrom[j] = cFrom[j] + (cTo[j] - cFrom[j]) * t;
      }
    }
    to.set(shapes[name].pos);
    cTo.set(shapes[name].col);
    aFrom.needsUpdate = aTo.needsUpdate = aCFrom.needsUpdate = aCTo.needsUpdate = true;
    mix = reduceMotion ? 1 : 0;
    current = name;
    if (reduceMotion) render(0);
  }

  let last = performance.now(), raf = 0, time = 0;
  function render(dt) {
    time += dt;
    uniforms.uTime.value = time;
    if (mix < 1) mix = Math.min(1, mix + dt / 1.9);
    uniforms.uMix.value = mix;
    layerOn = lerp(layerOn, layerTarget > 0 && current === 'layers' ? 1 : 0, 0.06);
    uniforms.uLayerOn.value = layerOn;
    if (layerTarget > 0) uniforms.uLayer.value = layerTarget;
    const track = finePointer && state.moved;
    uniforms.uMouse.value.set(track ? state.nx : 9, track ? -state.ny : 9);

    const t = tf();
    cur.x = lerp(cur.x, t.x, 0.035);
    cur.y = lerp(cur.y, t.y, 0.035);
    cur.rx = lerp(cur.rx, t.rx, 0.035);
    cur.s = lerp(cur.s, t.s, 0.04);
    group.position.set(cur.x, cur.y, 0);
    group.scale.setScalar(cur.s);
    group.rotation.x = cur.rx;
    if (!reduceMotion) group.rotation.y += dt * (0.14 * t.spin + Math.min(Math.abs(state.vel) * 0.004, 0.6));

    camera.position.x = lerp(camera.position.x, state.nx * 0.45, 0.04);
    camera.position.y = lerp(camera.position.y, -state.ny * 0.3, 0.04);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    render(dt);
    raf = requestAnimationFrame(loop);
  }
  const start = () => { if (!raf && !reduceMotion) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    uniforms.uAspect.value = camera.aspect;
  });

  render(0.016);
  start();
  return {
    setShape,
    setLayer: (n) => { layerTarget = n; },
  };
}

/* =========================================================
   Loader + hero
   ========================================================= */
async function initLoader() {
  const el = $('#loader');
  const ready = () => {
    document.documentElement.classList.add('ready');
    setTimeout(() => $$('.char').forEach((c) => c.classList.add('settled')), 1900);
  };
  let seen = false;
  try { seen = sessionStorage.getItem('pb2-boot') === '1'; } catch { /* storage blocked */ }
  if (seen || reduceMotion) { el.remove(); ready(); return; }

  document.body.classList.add('lock');
  const num = $('#loader-num'), bar = $('#loader-bar'), msg = $('#loader-msg');
  const msgs = ['allocating executors…', 'mounting unity catalog…', 'replaying kafka offsets…', 'optimizing delta tables…', 'warming vector index…', 'ready.'];
  const dur = 1700, t0 = performance.now();
  await new Promise((res) => {
    const step = (t) => {
      const p = clamp((t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      num.textContent = String(Math.round(e * 100)).padStart(3, '0');
      bar.style.width = e * 100 + '%';
      msg.textContent = msgs[Math.min(msgs.length - 1, Math.floor(p * msgs.length))];
      if (p < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
    setTimeout(() => { num.textContent = '100'; bar.style.width = '100%'; res(); }, dur + 600);
  });
  try { sessionStorage.setItem('pb2-boot', '1'); } catch { /* ignore */ }
  el.classList.add('out');
  document.body.classList.remove('lock');
  ready();
  setTimeout(() => el.remove(), 1100);
}

function initSplit() {
  let n = 0;
  $$('[data-split]').forEach((el) => {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((ch) => {
      const s = document.createElement('span');
      s.className = 'char';
      s.style.setProperty('--i', n++);
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch;
      el.appendChild(s);
    });
  });
}

function initTyped() {
  const el = $('#typed');
  if (!el) return;
  const roles = [
    'real-time Kafka pipelines.',
    'governed lakehouses.',
    'agentic AI on Databricks.',
    'zero-egress RAG systems.',
    'Spark that costs 25% less.',
    'PB-scale cloud migrations.',
  ];
  if (reduceMotion) { el.textContent = roles[0]; return; }
  let i = 0, j = roles[0].length, deleting = true;
  const tick = () => {
    const word = roles[i];
    j += deleting ? -1 : 1;
    el.textContent = word.slice(0, j);
    let delay = deleting ? 28 : 55;
    if (!deleting && j === word.length) { deleting = true; delay = 1900; }
    else if (deleting && j === 0) { deleting = false; i = (i + 1) % roles.length; delay = 300; }
    setTimeout(tick, delay);
  };
  setTimeout(tick, 3200);
}

function initDecrypt() {
  const el = $('#decrypt');
  const phrases = ['STREAMING 360M EVENTS / DAY', 'GOVERNING 100+ BANKING DATASETS', 'SHIPPING LLM AGENTS TO PROD', 'CUTTING DATABRICKS COST 25%', 'MIGRATING 5+ PB TO THE CLOUD'];
  if (reduceMotion) return;
  const glyphs = '01ΣΔλ#%&*<>/\\[]{}=+';
  let i = 0;
  const show = (target) => {
    const t0 = performance.now(), dur = 900;
    const run = () => {
      const p = clamp((performance.now() - t0) / dur);
      el.textContent = [...target].map((ch, k) => (ch === ' ' || k / target.length < p ? ch : glyphs[(Math.random() * glyphs.length) | 0])).join('');
      if (p < 1) requestAnimationFrame(run); else el.textContent = target;
    };
    run();
    setTimeout(() => { el.textContent = target; }, dur + 100);
  };
  setInterval(() => { i = (i + 1) % phrases.length; show(phrases[i]); }, 3200);
}

/* =========================================================
   Cursor, pointer FX
   ========================================================= */
function initCursor() {
  addEventListener('pointermove', (e) => {
    state.mouseX = e.clientX; state.mouseY = e.clientY;
    state.nx = (e.clientX / innerWidth) * 2 - 1;
    state.ny = (e.clientY / innerHeight) * 2 - 1;
    state.moved = true;
  }, { passive: true });
  if (!finePointer) return;

  document.documentElement.classList.add('has-cursor');
  const cur = $('#cursor'), dot = $('.c-dot', cur), ring = $('.c-ring', cur), label = $('#c-label');
  let rx = state.mouseX, ry = state.mouseY;
  const tick = () => {
    rx = lerp(rx, state.mouseX, 0.16);
    ry = lerp(ry, state.mouseY, 0.16);
    dot.style.transform = `translate(${state.mouseX}px, ${state.mouseY}px)`;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(tick);
  };
  tick();
  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest('input, textarea, [data-cursor], a, button, [role="button"]');
    cur.classList.remove('hover', 'label', 'text');
    if (!t) return;
    if (t.matches('input, textarea')) { cur.classList.add('text'); return; }
    if (t.dataset.cursor) { label.textContent = t.dataset.cursor; cur.classList.add('label'); }
    else cur.classList.add('hover');
  });
  document.addEventListener('pointerdown', () => cur.classList.add('down'));
  document.addEventListener('pointerup', () => cur.classList.remove('down'));
  document.addEventListener('mouseleave', () => { cur.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cur.style.opacity = '1'; });
}

function initPointerFx() {
  $$('.spot').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
  if (!finePointer || reduceMotion) return;

  $$('.tilt').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transition = 'transform .15s ease-out, border-color .4s, box-shadow .4s';
      el.style.transform = `perspective(1000px) rotateX(${(-py * 9).toFixed(2)}deg) rotateY(${(px * 11).toFixed(2)}deg)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform .8s cubic-bezier(.16,1,.3,1), border-color .4s, box-shadow .4s';
      el.style.transform = '';
    });
  });

  $$('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * 0.28}px, ${y * 0.35}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform .7s cubic-bezier(.16,1,.3,1)';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 700);
    });
  });
}

/* =========================================================
   Reveal, counters, scrub text
   ========================================================= */
function initReveal() {
  $$('.reveal').forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
    if (sibs.length > 1) el.style.setProperty('--d', Math.min(sibs.indexOf(el) * 0.08, 0.5) + 's');
  });
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  $$('.reveal').forEach((el) => io.observe(el));

  const cio = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.to;
    if (reduceMotion) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 2000;
    const step = (t) => {
      const p = clamp((t - t0) / dur);
      el.textContent = Math.round(to * (p === 1 ? 1 : 1 - Math.pow(2, -10 * p)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.6 });
  $$('.count').forEach((el) => cio.observe(el));

  const ring = $('#cgpa-ring');
  new IntersectionObserver(([e], o) => {
    if (!e.isIntersecting) return;
    ring.style.strokeDashoffset = 2 * Math.PI * 52 * (1 - 0.945);
    o.disconnect();
  }, { threshold: 0.5 }).observe(ring);
}

function initScrub() {
  const el = $('#scrub');
  const words = [];
  const frag = document.createDocumentFragment();
  [...el.childNodes].forEach((node) => {
    const em = node.nodeType === 1;
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
      const s = document.createElement('span');
      s.className = 'w' + (em ? ' em' : '');
      s.textContent = part;
      frag.appendChild(s);
      words.push(s);
    });
  });
  el.textContent = '';
  el.appendChild(frag);
  if (reduceMotion) { words.forEach((w) => w.classList.add('lit')); return () => {}; }
  let lastN = -1;
  return () => {
    const r = el.getBoundingClientRect();
    const p = clamp((innerHeight * 0.82 - r.top) / (r.height + innerHeight * 0.3));
    const n = Math.round(p * words.length);
    if (n === lastN) return;
    lastN = n;
    words.forEach((w, i) => w.classList.toggle('lit', i < n));
  };
}

/* =========================================================
   Pipeline scrollytelling
   ========================================================= */
const STAGES = [
  { c: '#94a3b8', k: 'SOURCES', t: 'Source systems & data contracts', layer: 0,
    p: 'REST APIs, PostgreSQL, MySQL, on-prem SQL Server and Kafka topics across financial and operational systems. Data contracts pin down schemas and SLAs before a single byte moves.',
    m: ['15+', 'source systems'], tags: ['REST APIs', 'PostgreSQL', 'MySQL', 'SQL Server', 'Data Contracts'] },
  { c: '#22d3ee', k: 'INGEST', t: 'Streaming & incremental ingestion', layer: 0,
    p: 'Kafka + Spark Structured Streaming for events, Auto Loader for files landing in cloud storage, and reusable ADF frameworks for bulk migration. Latency went from hours to minutes.',
    m: ['360M+', 'events / day'], tags: ['Apache Kafka', 'Structured Streaming', 'Auto Loader', 'ADF'] },
  { c: '#e08a4a', k: 'BRONZE', t: 'Raw, replayable history', layer: 1,
    p: 'Append-only Delta tables with schema evolution and ingestion metadata, so every downstream layer can be rebuilt from source at any time.',
    m: ['100+ GB', 'landed daily'], tags: ['Delta Lake', 'Parquet', 'Schema Evolution', 'ADLS Gen2 / S3'] },
  { c: '#cbd5e1', k: 'SILVER', t: 'Cleaned, validated, conformed', layer: 2,
    p: 'Lakeflow Declarative Pipelines (DLT) with expectations enforce data quality inline: deduplication, typing, conformance and PII tagging, orchestrated by Lakeflow Jobs.',
    m: ['−50%', 'SLA violations'], tags: ['DLT Expectations', 'Lakeflow Jobs', 'PySpark', 'Spark SQL'] },
  { c: '#fbbf24', k: 'GOLD', t: 'Business-ready dimensional models', layer: 3,
    p: 'Star-schema facts and dimensions with tuned partitioning and Spark optimizations, plus predictive optimization on Unity Catalog managed tables.',
    m: ['+60%', 'BI performance'], tags: ['Dimensional Modeling', 'Partitioning', 'Predictive Optimization'] },
  { c: '#a78bfa', k: 'SERVE', t: 'Analytics & GenAI consumption', layer: 0,
    p: 'AI/BI Dashboards and Power BI for analysts; Vector Search, Model Serving and LangGraph agents for GenAI, all reading the same governed data.',
    m: ['3h → 20m', 'risk report drafting'], tags: ['AI/BI', 'Power BI', 'Vector Search', 'LangGraph', 'Llama 3 70B'] },
  { c: '#60a5fa', k: 'GOVERN', t: 'Unity Catalog across every layer', layer: 0,
    p: 'PII classification, row/column-level security, data lineage, audit logging and secrets hardening for banking & payments data used by 10+ cross-functional teams.',
    m: ['100+', 'datasets governed'], tags: ['Unity Catalog', 'RLS / CLS', 'Lineage', 'Audit Logging', 'PII'] },
];

function initPipeline() {
  const sec = $('#pipeline'), stage = $('#stage'), nodes = $$('[data-i]', $('.flow'));
  const bar = $('#stage-progress'), playBtn = $('#flow-play');
  const DUR = 4800;
  let cur = -1, playing = !reduceMotion, visible = false, timer = 0;

  const restartBar = () => {
    bar.classList.remove('run');
    void bar.offsetWidth;
    if (playing && visible) { bar.style.setProperty('--dur', DUR + 'ms'); bar.classList.add('run'); }
  };
  const schedule = () => {
    clearTimeout(timer);
    if (playing && visible) timer = setTimeout(() => show((cur + 1) % STAGES.length), DUR);
  };
  function show(i, force) {
    if (i !== cur || force) {
      const changed = i !== cur;
      cur = i;
      const s = STAGES[i];
      stage.style.setProperty('--c', s.c);
      $('#stage-num').textContent = String(i + 1).padStart(2, '0');
      $('#stage-kicker').innerHTML = `${s.k}<br><span class="dim">stage ${i + 1} of ${STAGES.length}</span>`;
      $('#stage-title').textContent = s.t;
      $('#stage-text').textContent = s.p;
      $('#stage-metric').textContent = s.m[0];
      $('#stage-mlabel').textContent = s.m[1];
      $('#stage-tags').innerHTML = s.tags.map((t) => `<span>${t}</span>`).join('');
      if (changed) { stage.classList.remove('swap'); void stage.offsetWidth; stage.classList.add('swap'); }
      nodes.forEach((n) => n.classList.toggle('active', +n.dataset.i === i));
      GL?.setLayer(s.layer);
    }
    restartBar();
    schedule();
  }
  const setPlaying = (on) => {
    playing = on;
    playBtn.setAttribute('aria-pressed', String(on));
    $('.pi', playBtn).textContent = on ? '❚❚' : '▶';
    $('.pt', playBtn).textContent = on ? 'auto-play' : 'paused';
    show(cur, true);
  };

  nodes.forEach((n) => n.addEventListener('click', () => { playing = false; setPlaying(false); show(+n.dataset.i); }));
  playBtn.addEventListener('click', () => setPlaying(!playing));
  if (reduceMotion) setPlaying(false);
  show(0);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) show(cur, true); else { clearTimeout(timer); bar.classList.remove('run'); }
  }, { threshold: 0.35 }).observe(sec);
}

/* =========================================================
   Experience filter
   ========================================================= */
function initXpFilter() {
  const buttons = $$('.xp-filter button'), lists = $$('.xp-list');
  buttons.forEach((b) => b.addEventListener('click', () => {
    buttons.forEach((x) => x.classList.toggle('on', x === b));
    const f = b.dataset.f;
    lists.forEach((ul) => {
      ul.classList.toggle('filtering', f !== 'all');
      $$('li', ul).forEach((li) => li.classList.toggle('match', f !== 'all' && li.dataset.t.split(' ').includes(f)));
    });
  }));
}

/* =========================================================
   Horizontal builds
   ========================================================= */
function initBuilds() {
  const sec = $('#projects'), track = $('#builds-track'), vp = $('.builds-viewport'), bar = $('#builds-bar'), counter = $('#bc-cur');
  const N = track.children.length;
  [...track.children].forEach((card, i) => {
    const g = document.createElement('span');
    g.className = 'bc-ghost';
    g.setAttribute('aria-hidden', 'true');
    g.textContent = String(i + 1).padStart(2, '0');
    card.prepend(g);
  });
  let dist = 0, enabled = false;
  const setCount = (p) => { counter.textContent = String(Math.min(N, Math.floor(p * N) + 1)).padStart(2, '0'); bar.style.width = p * 100 + '%'; };
  const layout = () => {
    enabled = !isMobile();
    if (enabled) {
      dist = Math.max(0, track.scrollWidth - innerWidth);
      sec.style.height = dist + innerHeight + 'px';
    } else {
      sec.style.height = '';
      track.style.transform = '';
    }
  };
  vp.addEventListener('scroll', () => { if (!enabled) setCount(vp.scrollLeft / Math.max(1, vp.scrollWidth - vp.clientWidth)); }, { passive: true });
  addEventListener('resize', layout);
  addEventListener('load', layout);
  layout();
  return () => {
    if (!enabled) return;
    const r = sec.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = clamp(-r.top / Math.max(1, sec.offsetHeight - innerHeight));
    track.style.transform = `translate3d(${-p * dist}px, 0, 0)`;
    setCount(p);
  };
}

/* =========================================================
   Résumé agent (local keyword retrieval, streamed answer)
   ========================================================= */
// Each chunk answers with a short lead line and bullet points (**bold** = highlight)
const KB = [
  { id: 'profile.summary', k: ['who', 'about', 'summary', 'yourself', 'introduce', 'background', 'profile', 'overview', 'pravin'],
    t: 'Pravin in a nutshell:',
    p: ['**Data Engineer, 3+ years** building batch & streaming platforms on Databricks, Azure and AWS',
      '**Senior Data Engineer at DataNimbus** since Feb 2025; previously at **TCS**',
      'Kafka pipelines processing **360M+ events/day**',
      '**100+ Unity Catalog datasets** governed; Databricks costs cut by **25%**',
      'Hands-on with **GenAI**: RAG, Vector Search and LLM agents'] },
  { id: 'role.datanimbus', k: ['datanimbus', 'current', 'currently', 'now', 'senior', 'present', 'hyderabad', 'latest'],
    t: 'Senior Data Engineer · DataNimbus (Feb 2025 → now, Hyderabad):',
    p: ['Medallion lakehouse ingesting **100+ GB/day** from 10+ financial sources; BI **60% faster**',
      'Databricks costs cut by **25%** with zero SLA impact',
      'Agentic AI accelerator: risk-report drafting **3h → 20m**',
      'Unity Catalog governance for **100+** banking datasets used by **10+** teams',
      'Owns production architecture, **client & stakeholder requests**, runbooks and code reviews'] },
  { id: 'role.tcs', k: ['tcs', 'tata', 'previous', 'before', 'bengaluru', 'bangalore', 'first', 'earlier'],
    t: 'Data Engineer · TCS (Oct 2023 → Feb 2025, Bengaluru):',
    p: ['Kafka + Structured Streaming pipelines processing **360M+ events/day**',
      'Data latency cut from **hours to minutes**',
      'Reusable ADF frameworks for a **5+ PB** SQL Server → ADLS Gen2 migration (**−30%** effort)',
      'Partition tuning: query performance **+35%**, pipeline runtime **−50%**',
      'S3 → Redshift loads, complex SQL and **Azure DevOps CI/CD**'] },
  { id: 'skill.streaming', k: ['kafka', 'stream', 'streaming', 'real-time', 'realtime', 'events', 'latency', 'structured', 'kinesis'],
    t: 'Streaming experience:',
    p: ['Event-driven PySpark pipelines on **Apache Kafka** + **Spark Structured Streaming**',
      '**Delta Lake** sinks on Databricks',
      '**360M+ events/day** in production',
      'Data latency reduced from **hours to minutes**'] },
  { id: 'skill.lakehouse', k: ['lakehouse', 'medallion', 'bronze', 'silver', 'gold', 'delta', 'dlt', 'auto loader', 'autoloader', 'architecture', 'modeling', 'dimensional', 'warehouse', 'databricks'],
    t: 'Lakehouse work on Databricks:',
    p: ['**Medallion architecture**: bronze → silver → gold',
      '**Auto Loader** + **Lakeflow Declarative Pipelines (DLT)** ingesting **100+ GB/day**',
      '10+ financial sources modelled into **Gold-layer dimensional models**',
      'Spark optimizations made BI dashboards **60% faster**'] },
  { id: 'impact.cost', k: ['cost', 'save', 'saving', 'finops', 'cheaper', 'serverless', 'spot', 'optimiz', 'money', 'budget', 'spend', 'cut'],
    t: 'How he cut Databricks costs by 25% (zero SLA impact):',
    p: ['Moved eligible pipelines to **serverless compute**',
      'Used **spot instances** on classic clusters',
      'Enabled **predictive optimization** on Unity Catalog managed tables'] },
  { id: 'skill.governance', k: ['governance', 'unity', 'catalog', 'pii', 'security', 'lineage', 'rls', 'cls', 'access', 'compliance', 'audit', 'bank', 'payments', 'secure'],
    t: 'Unity Catalog governance · 100+ banking & payments datasets · 10+ teams:',
    p: ['**PII classification**',
      '**Row/column-level security**',
      '**Data lineage** and **audit logging**',
      'Fixes for **access control and secrets**'] },
  { id: 'genai.agent', k: ['agent', 'agentic', 'langgraph', 'llama', 'llm', 'react', 'mlflow', 'genai', 'report', 'accelerator'],
    t: 'Agentic AI accelerator (internal):',
    p: ['Python **LangGraph ReAct agent**',
      'Runs on Databricks-hosted **Llama 3 70B**',
      '**MLflow Tracing** + **Model Serving**',
      'Risk-case report drafting cut from **3 hours to 20 minutes**'] },
  { id: 'genai.rag', k: ['rag', 'retrieval', 'vector', 'embedding', 'gte', 'egress', 'semantic', 'search', 'document'],
    t: 'RAG & semantic search:',
    p: ['**Zero-egress RAG** on Databricks Vector Search with **GTE-large** embeddings',
      'Governed SQL tools for the agent via **Unity Catalog functions**',
      'Semantic search platform indexing **10K+ documents**',
      'Manual tagging effort reduced by **80%**'] },
  { id: 'project.migration', k: ['migration', 'migrate', 'adf', 'factory', 'petabyte', 'pb', 'sql server', 'on-prem', 'adls', 'cloud'],
    t: 'PB-scale cloud migration (TCS):',
    p: ['Reusable **Azure Data Factory** ingestion & transformation frameworks',
      '**5+ PB** moved from on-prem SQL Server (T-SQL) to **ADLS Gen2**',
      'Engineering effort reduced by **30%**'] },
  { id: 'quality.orchestration', k: ['quality', 'orchestrat', 'jobs', 'lakeflow', 'sla', 'etl', 'expectation', 'sources', 'api', 'postgres', 'mysql', 'pipeline'],
    t: 'Orchestration & data quality:',
    p: ['PySpark + Spark SQL ETL in **Lakeflow Jobs**',
      '**1M+ records/day** from **15+ sources** (REST APIs, PostgreSQL, MySQL)',
      '**DLT expectations** for automated data-quality tests',
      'SLA violations cut by **50%**'] },
  { id: 'skills.stack', k: ['skill', 'stack', 'tools', 'tech', 'technolog', 'language', 'python', 'sql', 'know', 'aws', 'azure', 'gcp', 'snowflake', 'spark', 'pyspark'],
    t: 'Tech stack:',
    p: ['**Languages:** Python (PySpark, Pandas), SQL (Spark SQL, T-SQL, PostgreSQL, MySQL)',
      '**Big data:** Spark, Spark Streaming, Kafka, Delta Lake, Parquet',
      '**Databricks:** Unity Catalog, DLT, Lakeflow Jobs, Auto Loader, AI/BI',
      '**Cloud:** Azure (ADF, ADLS Gen2, Synapse), AWS (S3, Redshift, Kinesis), Snowflake, GCP',
      '**GenAI:** RAG, LangGraph, LangChain, Vector Search, Embeddings, MLflow',
      '**Tools:** Git, Azure DevOps CI/CD, Power BI, Claude Code'] },
  { id: 'certs', k: ['cert', 'certified', 'certification', 'dp-203', 'dp203', 'microsoft', 'exam', 'credential'],
    t: 'Three certifications:',
    p: ['**Databricks** Certified Data Engineer Professional',
      '**Databricks** Certified Data Engineer Associate',
      '**Microsoft** Certified: Azure Data Engineer Associate (DP-203)'] },
  { id: 'education', k: ['education', 'degree', 'college', 'university', 'btech', 'b.tech', 'cgpa', 'gpa', 'walchand', 'study', 'studied', 'graduat'],
    t: 'Education:',
    p: ['**B.Tech**, Walchand Institute of Technology, Solapur',
      '2019 – 2023',
      'CGPA **9.45 / 10**'] },
  { id: 'fit.fde', k: ['forward', 'deployed', 'fde', 'customer', 'client', 'stakeholder', 'fit', 'why', 'hire', 'role', 'looking', 'open', 'job'],
    t: 'Why he fits Forward Deployed Engineer roles:',
    p: ['Handles **client & stakeholder requests** directly at DataNimbus',
      'Owns **production pipeline architecture** end to end',
      'Writes **design docs & runbooks**, leads **code reviews**, sets data-contract standards',
      'Has shipped **lakehouses, governance and LLM agents** to production',
      'Open to **Data Engineer** and **Forward Deployed Engineer** roles'] },
  { id: 'contact', k: ['contact', 'email', 'reach', 'linkedin', 'connect', 'talk', 'resume', 'cv', 'leetcode', 'mail'],
    t: 'Get in touch:',
    p: ['**Email:** pravinbokare10@gmail.com',
      '**LinkedIn:** linkedin.com/in/pravin-bokare',
      '**LeetCode:** leetcode.com/u/pravin-bokare',
      '**Résumé:** download it with the button below'] },
  { id: 'location', k: ['where', 'location', 'based', 'live', 'city', 'pune', 'india'],
    t: 'Location:',
    p: ['Based in **Pune, India**',
      'Has worked with teams in **Hyderabad** and **Bengaluru**'] },
];
const KB_FALLBACK = {
  t: "I couldn't find that in the résumé. Try asking about:",
  p: ['**Kafka streaming** and the lakehouse', '**Cost savings** on Databricks', '**RAG and AI agents**', '**Governance** and certifications', 'Why he fits **Forward Deployed** roles'],
};
const KB_GREETING = {
  t: "Hi, I'm Pravin's résumé agent 👋 Ask me about:",
  p: ['**Streaming & lakehouse** work at scale', '**GenAI agents and RAG** in production', 'How he cut Databricks costs by **25%**', "Why he'd be a strong **Forward Deployed Engineer**"],
};
const STOP = new Set('a an the is are was were be been of to in on for and or with his her he she it its this that what whats which who how did does do can could would should tell me about any has have had give some please you your pravin s'.split(' '));

// Follow-up actions offered under each answer, keyed by the top chunk
const KB_ACTIONS = {
  'profile.summary': [['Download résumé', 'resume'], ['See experience', '#experience']],
  'role.datanimbus': [['See experience', '#experience'], ['Live ops dashboard', '#ops']],
  'role.tcs': [['See experience', '#experience']],
  'skill.streaming': [['View architecture', '#pipeline'], ["Things I've shipped", '#projects']],
  'skill.lakehouse': [['View architecture', '#pipeline'], ['Live ops dashboard', '#ops']],
  'impact.cost': [['Live ops dashboard', '#ops'], ['FinOps project', '#projects']],
  'skill.governance': [['View architecture', '#pipeline']],
  'genai.agent': [["Things I've shipped", '#projects']],
  'genai.rag': [["Things I've shipped", '#projects']],
  'project.migration': [["Things I've shipped", '#projects']],
  'quality.orchestration': [['View architecture', '#pipeline']],
  'skills.stack': [['Open stack sphere', '#skills'], ['Run SQL in terminal', 'sql']],
  'certs': [['View badges', '#certs']],
  'education': [['View credentials', '#certs']],
  'fit.fde': [['Email Pravin', 'email'], ['See experience', '#experience']],
  'contact': [['Copy email', 'copy'], ['Open LinkedIn', 'linkedin'], ['Download résumé', 'resume']],
  'location': [['Contact', '#contact']],
};

function initAgent() {
  const root = $('#aw'), panel = $('#aw-panel'), launch = $('#aw-launch'), teaser = $('#aw-teaser');
  const log = $('#agent-log'), form = $('#agent-form'), input = $('#agent-q');
  let busy = false, greeted = false, open = false;

  const tokenize = (q) => q.toLowerCase().replace(/[^a-z0-9.\-\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));
  const retrieve = (q, terms) => {
    const ql = q.toLowerCase();
    return KB.map((c) => {
      let score = 0;
      c.k.forEach((k) => {
        if (k.includes(' ') || k.includes('-')) { if (ql.includes(k)) score += 2; }
        else if (terms.some((t) => t === k || (k.length >= 4 && t.startsWith(k)) || (t.length >= 4 && k.startsWith(t)))) score += 1;
      });
      return { c, score };
    }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
  };
  const scrollLog = () => { log.scrollTop = log.scrollHeight; };
  const addUser = (text) => {
    const d = document.createElement('div');
    d.className = 'msg user';
    d.textContent = text;
    log.appendChild(d);
    scrollLog();
  };
  const addBot = () => {
    const d = document.createElement('div');
    d.className = 'msg bot';
    d.innerHTML = '<span class="bot-av">PB</span><div class="bot-body"><div class="bot-txt"><span class="typing"><i></i><i></i><i></i></span><span class="think">thinking…</span></div></div>';
    log.appendChild(d);
    scrollLog();
    return d;
  };
  const plain = (t) => t.replace(/\*\*/g, '');
  const rich = (t) => escapeHtml(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const typeInto = async (node, text) => {
    const words = plain(text).split(' ');
    node.classList.add('typing-now');
    for (let i = 0; i < words.length; i++) {
      node.textContent += (i ? ' ' : '') + words[i];
      if (i % 4 === 0) scrollLog();
      if (!reduceMotion) await sleep(12 + Math.random() * 22);
    }
    node.innerHTML = rich(text);
    node.classList.remove('typing-now');
    scrollLog();
  };
  const streamBlocks = async (el, blocks) => {
    el.innerHTML = '';
    for (const b of blocks) {
      const lead = document.createElement('p');
      lead.className = 'ans-lead';
      el.appendChild(lead);
      await typeInto(lead, b.t);
      const ul = document.createElement('ul');
      ul.className = 'ans-list';
      el.appendChild(ul);
      for (const pt of b.p) {
        const li = document.createElement('li');
        ul.appendChild(li);
        await typeInto(li, pt);
        if (!reduceMotion) await sleep(60);
      }
    }
  };
  const tokenCount = (blocks) => blocks.reduce((n, b) => n + plain([b.t, ...b.p].join(' ')).split(/\s+/).length, 0);

  const runAction = (target) => {
    const jump = (sel) => {
      if (isMobile()) setOpen(false);
      $(sel)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: sel === '#ops' ? 'center' : 'start' });
    };
    if (target.startsWith('#')) return jump(target);
    if (target === 'copy') return copyText(CONFIG.email, 'Email copied');
    if (target === 'email') { location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Let's work together")}`; return; }
    if (target === 'linkedin') return window.open(CONFIG.linkedin, '_blank', 'noopener');
    if (target === 'resume') { const a = document.createElement('a'); a.href = CONFIG.resume; a.download = 'Pravin_Bokare_Resume.pdf'; a.click(); return; }
    if (target === 'sql') { if (isMobile()) setOpen(false); window.__term?.run('SELECT * FROM skills;'); }
  };

  async function ask(q) {
    q = q.trim();
    if (!q || busy) return;
    busy = true;
    input.value = '';
    addUser(q);
    const t0 = performance.now();
    const bot = addBot(), think = $('.think', bot), body = $('.bot-body', bot);
    const pause = (ms) => sleep(reduceMotion ? 0 : ms);
    const steps = [];

    const terms = tokenize(q);
    think.textContent = 'parsing query…';
    steps.push(['parse', `${terms.length} terms → [${escapeHtml(terms.slice(0, 6).join(', '))}]`]);
    await pause(280);

    think.textContent = `retrieving from ${KB.length} résumé chunks…`;
    const top = retrieve(q, terms).slice(0, 3), max = top[0]?.score || 1;
    steps.push(['retrieve', `top_k=3 · keyword match over ${KB.length} chunks`]);
    top.forEach((r) => steps.push([r.c.id, `score ${r.score}<span class="bar" style="width:${Math.round((r.score / max) * 100)}%"></span>`, 'chunk']));
    if (!top.length) steps.push(['∅ no match', 'fallback help text', 'chunk']);
    await pause(360);

    const blocks = !top.length ? [KB_FALLBACK] : [top[0].c];
    if (top[1] && top[1].score >= Math.max(2, top[0].score * 0.75)) blocks.push(top[1].c);
    think.textContent = 'generating…';
    steps.push(['generate', `${blocks.length} block${blocks.length > 1 ? 's' : ''} · ${blocks.reduce((n, b) => n + b.p.length, 0)} points · ${tokenCount(blocks)} tokens`]);
    await pause(240);
    await streamBlocks($('.bot-txt', bot), blocks);

    const acts = top.length ? (KB_ACTIONS[top[0].c.id] || []) : [['Contact Pravin', '#contact']];
    if (acts.length) {
      const row = document.createElement('div');
      row.className = 'bot-acts';
      acts.forEach(([label, target], k) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label + (target.startsWith('#') ? ' →' : '');
        b.style.animationDelay = k * 80 + 'ms';
        b.addEventListener('click', () => runAction(target));
        row.appendChild(b);
      });
      body.appendChild(row);
    }
    const ms = Math.round(performance.now() - t0);
    steps.push(['✓ done', `${ms} ms · 0 bytes sent`, 'ok']);
    const tr = document.createElement('details');
    tr.className = 'bot-trace';
    tr.innerHTML = `<summary>trace · ${top.length} chunk${top.length === 1 ? '' : 's'} · ${ms} ms · 0 bytes sent</summary><ol>${steps.map(([t, b, c]) => `<li class="${c || ''}"><b>${escapeHtml(t)}</b>${b}</li>`).join('')}</ol>`;
    tr.addEventListener('toggle', scrollLog);
    body.appendChild(tr);
    scrollLog();
    if (!open) root.classList.add('unread');
    busy = false;
  }

  async function greet() {
    greeted = true;
    const bot = addBot();
    await sleep(reduceMotion ? 0 : 450);
    await streamBlocks($('.bot-txt', bot), [KB_GREETING]);
  }

  function setOpen(v) {
    if (v === open) return;
    open = v;
    state.botOpen = v;
    root.classList.toggle('open', v);
    launch.setAttribute('aria-expanded', String(v));
    launch.setAttribute('aria-label', v ? 'Close résumé agent chat' : 'Open résumé agent chat');
    panel.setAttribute('aria-hidden', String(!v));
    document.body.classList.toggle('lock', v && isMobile());
    // Particles reassemble into the agent network while the chat is open
    GL?.setShape(v ? 'network' : state.sectionShape || 'sphere');
    if (v) {
      dismissTeaser();
      root.classList.remove('unread');
      if (!greeted) greet();
      if (finePointer) setTimeout(() => input.focus({ preventScroll: true }), 380);
    } else if (panel.contains(document.activeElement)) {
      launch.focus({ preventScroll: true });
    }
  }

  // One-time teaser bubble
  let teaserTimer = 0;
  function dismissTeaser() {
    clearTimeout(teaserTimer);
    teaser.hidden = true;
    try { sessionStorage.setItem('pb3-teaser', '1'); } catch { /* ignore */ }
  }
  let teaserSeen = false;
  try { teaserSeen = sessionStorage.getItem('pb3-teaser') === '1'; } catch { /* ignore */ }
  if (!teaserSeen) {
    teaserTimer = setTimeout(() => {
      if (open) return;
      teaser.hidden = false;
      root.classList.add('unread');
    }, 7000);
  }
  $('#aw-teaser-x').addEventListener('click', (e) => { e.stopPropagation(); dismissTeaser(); });
  teaser.addEventListener('click', () => setOpen(true));

  launch.addEventListener('click', () => setOpen(!open));
  $('#aw-close').addEventListener('click', () => setOpen(false));
  $('#aw-reset').addEventListener('click', () => {
    if (busy) return;
    log.innerHTML = '';
    greet();
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); });
  $$('#agent-suggest button').forEach((b) => b.addEventListener('click', () => ask(b.textContent)));
  $$('[data-agent-open]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); setOpen(true); }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });
  // Click outside the widget closes it on desktop
  document.addEventListener('pointerdown', (e) => {
    if (open && !isMobile() && !root.contains(e.target) && !e.target.closest('[data-agent-open], .palette')) setOpen(false);
  });

  window.__agent = {
    open: () => setOpen(true),
    ask: (q) => { setOpen(true); setTimeout(() => ask(q), greeted ? 300 : 1400); },
  };
}

/* =========================================================
   Skill sphere
   ========================================================= */
const SKILL_CATS = [
  { name: 'Programming', c: '#22d3ee', tags: ['Python', 'PySpark', 'Pandas', 'SQL', 'Spark SQL', 'T-SQL', 'PostgreSQL', 'MySQL'] },
  { name: 'Big Data', c: '#fb923c', tags: ['Apache Spark', 'Spark Streaming', 'Kafka', 'Delta Lake', 'Parquet', 'Perf Tuning'] },
  { name: 'Databricks', c: '#ff5a3c', tags: ['Unity Catalog', 'DLT', 'Lakeflow Jobs', 'Auto Loader', 'AI/BI'] },
  { name: 'Cloud', c: '#38bdf8', tags: ['ADF', 'ADLS Gen2', 'Synapse', 'AWS S3', 'Redshift', 'Kinesis', 'Snowflake', 'GCP'] },
  { name: 'Data Eng', c: '#fbbf24', tags: ['ETL/ELT', 'Warehousing', 'Dimensional Modeling', 'Medallion', 'Data Contracts'] },
  { name: 'Governance', c: '#60a5fa', tags: ['PII Classification', 'Row/Col Security', 'Lineage', 'Data Quality', 'Audit Logging'] },
  { name: 'GenAI & ML', c: '#a78bfa', tags: ['RAG', 'LLMs', 'Agentic AI', 'LangGraph', 'LangChain', 'Vector Search', 'Embeddings', 'OpenAI APIs', 'MLflow'] },
  { name: 'DevOps', c: '#34d399', tags: ['Git', 'GitHub', 'Azure DevOps', 'CI/CD', 'Power BI', 'Claude Code'] },
];

function initSphere() {
  const root = $('#sphere'), legend = $('#legend'), list = $('#legend-list');
  const items = [];
  SKILL_CATS.forEach((cat, ci) => cat.tags.forEach((t) => items.push({ t, ci })));
  // Shuffle so categories spread across the sphere
  for (let i = items.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [items[i], items[j]] = [items[j], items[i]]; }
  const golden = Math.PI * (3 - Math.sqrt(5));
  const pts = items.map((it, i) => {
    const y = 1 - (i / (items.length - 1)) * 2, r = Math.sqrt(1 - y * y), th = golden * i;
    const el = document.createElement('span');
    el.className = 'tag';
    el.textContent = it.t;
    el.style.setProperty('--c', SKILL_CATS[it.ci].c);
    root.appendChild(el);
    return { x: Math.cos(th) * r, y, z: Math.sin(th) * r, el, ci: it.ci };
  });

  let active = -1;
  SKILL_CATS.forEach((cat, ci) => {
    const b = document.createElement('button');
    b.style.setProperty('--c', cat.c);
    b.innerHTML = `<i></i>${cat.name}`;
    b.addEventListener('click', () => {
      active = active === ci ? -1 : ci;
      $$('button', legend).forEach((x, k) => x.classList.toggle('on', k === active));
      root.classList.toggle('filtering', active >= 0);
      pts.forEach((p) => p.el.classList.toggle('hl', p.ci === active));
      list.style.setProperty('--c', active >= 0 ? cat.c : '#fff');
      list.innerHTML = active >= 0 ? `<b>${cat.name}:</b> ${cat.tags.join(' · ')}` : '';
    });
    legend.appendChild(b);
  });

  let vx = 0.0035, vy = 0.006, dragging = false, lx = 0, ly = 0, visible = false, hover = false;
  root.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; root.setPointerCapture(e.pointerId); });
  root.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    vy = (e.clientX - lx) * 0.004;
    vx = -(e.clientY - ly) * 0.004;
    lx = e.clientX; ly = e.clientY;
  });
  const end = () => { dragging = false; };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
  root.addEventListener('pointerenter', () => { hover = true; });
  root.addEventListener('pointerleave', () => { hover = false; });

  const draw = () => {
    const R = root.clientWidth * (isMobile() ? 0.34 : 0.4);
    const ay = vy, ax = vx;
    const cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
    for (const p of pts) {
      const x1 = p.x * cy + p.z * sy, z1 = -p.x * sy + p.z * cy;
      const y2 = p.y * cx - z1 * sx, z2 = p.y * sx + z1 * cx;
      p.x = x1; p.y = y2; p.z = z2;
      const s = 0.55 + (z2 + 1) * 0.35;
      p.el.style.transform = `translate(-50%, -50%) translate3d(${(x1 * R).toFixed(1)}px, ${(y2 * R).toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
      p.el.style.opacity = (0.18 + ((z2 + 1) / 2) * 0.82).toFixed(2);
      p.el.style.zIndex = String(Math.round((z2 + 1) * 100));
    }
  };
  const tick = () => {
    if (!visible) return;
    if (!dragging) {
      const base = hover ? 0.0012 : 0.004;
      vx = lerp(vx, finePointer && hover ? 0 : base * 0.5, 0.03);
      vy = lerp(vy, finePointer && hover ? 0.0015 : base, 0.03);
    }
    draw();
    requestAnimationFrame(tick);
  };
  draw();
  if (reduceMotion) return;
  new IntersectionObserver(([e]) => { const was = visible; visible = e.isIntersecting; if (visible && !was) tick(); }).observe(root);
}

/* =========================================================
   Live dashboards: hero stream monitor + lakehouse-ops panel
   ========================================================= */
function initLiveConsole() {
  const count = $('#live-count'), bars = $('#bars');
  if (!count) return;
  const perSecond = 360e6 / 86400, t0 = performance.now(), fmt = new Intl.NumberFormat('en-US');
  const update = () => {
    count.textContent = fmt.format(Math.floor(((performance.now() - t0) / 1000) * perSecond));
    requestAnimationFrame(update);
  };
  update();
  bars.innerHTML = '<span></span>'.repeat(28);
  const spans = [...bars.children];
  const shuffle = () => spans.forEach((s, k) => {
    const base = 35 + 30 * Math.sin(k / 3 + performance.now() / 900);
    s.style.height = Math.max(8, Math.min(100, base + Math.random() * 35)) + '%';
  });
  shuffle();
  if (!reduceMotion) setInterval(shuffle, 650);
}

function initOps() {
  const root = $('#ops');
  if (!root) return () => {};
  const el = (id) => document.getElementById(id);
  const evEl = el('ops-events'), epsEl = el('ops-eps'), gbEl = el('ops-gb'), dqEl = el('ops-dq'), rowsEl = el('ops-rows');
  const costEl = el('ops-cost'), clockEl = el('ops-clock'), log = el('ops-log'), gauge = el('gauge-fg');
  const src = el('src-grid');
  src.innerHTML = '<span></span>'.repeat(15);
  const dots = [...src.children];
  const fmt = new Intl.NumberFormat('en-US');
  const tfmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const dayFrac = () => {
    const parts = tfmt.formatToParts(new Date());
    const g = (t) => +parts.find((p) => p.type === t).value;
    return (g('hour') * 3600 + g('minute') * 60 + g('second') + (Date.now() % 1000) / 1000) / 86400;
  };

  // Sparkline of events/sec
  const canvas = el('spark-events'), ctx = canvas.getContext('2d');
  const pts = Array.from({ length: 64 }, (_, i) => 4166 * (1 + 0.14 * Math.sin(i / 4) + 0.06 * (Math.random() - 0.5)));
  const drawSpark = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const min = Math.min(...pts) * 0.97, max = Math.max(...pts) * 1.03;
    const X = (i) => (i / (pts.length - 1)) * w, Y = (v) => h - 4 - ((v - min) / (max - min)) * (h - 10);
    const path = () => { ctx.beginPath(); pts.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)))); };
    const fill = ctx.createLinearGradient(0, 0, 0, h);
    fill.addColorStop(0, 'rgba(34,211,238,.32)');
    fill.addColorStop(1, 'rgba(34,211,238,0)');
    path(); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    const line = ctx.createLinearGradient(0, 0, w, 0);
    line.addColorStop(0, '#22d3ee'); line.addColorStop(0.55, '#8b5cf6'); line.addColorStop(1, '#f472b6');
    path(); ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.shadowColor = 'rgba(34,211,238,.7)'; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(w - 3, Y(pts[pts.length - 1]), 3.2, 0, Math.PI * 2); ctx.fill();
  };

  // Job log
  const SRC = ['payments', 'cards', 'loans', 'ledger', 'kyc', 'merchants', 'fx_rates', 'crm', 'disputes', 'settlements'];
  const GOLD = ['fact_txn', 'fact_settlement', 'dim_customer', 'dim_merchant', 'agg_daily_risk'];
  const TEAMS = ['risk', 'finance', 'fraud', 'compliance', 'bi'];
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const rint = (a, b) => a + ((Math.random() * (b - a + 1)) | 0);
  const lines = [
    () => `<span class="tb">bronze.${pick(SRC)}</span> +${fmt.format(rint(800, 9000))} rows <span class="ok">✓ autoloader</span>`,
    () => { const k = rint(8, 24); return `<span class="tb">silver.${pick(SRC)}</span> expectations <span class="ok">${k}/${k} ✓</span>`; },
    () => `<span class="g">gold.${pick(GOLD)}</span> MERGE ${fmt.format(rint(2000, 40000))} rows · ${rint(900, 4200)}ms`,
    () => `<span class="tb">uc.audit</span> access check <span class="ok">ok</span> · team=${pick(TEAMS)}`,
    () => `<span class="tb">kafka</span> consumer lag ${rint(0, 40)} · <span class="ok">healthy</span>`,
    () => `<span class="tb">agent.risk</span> report drafted in ${rint(15, 23)}m <span class="ok">✓</span>`,
  ];
  const addLog = () => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="ts">${tfmt.format(new Date())}</span> ${pick(lines)()}`;
    log.prepend(li);
    while (log.children.length > 18) log.lastChild.remove();
  };
  for (let i = 0; i < 10; i++) addLog();

  let visible = false, armed = false;
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !armed) {
      armed = true;
      gauge.style.strokeDashoffset = 157.08 * (1 - 0.25);
      el('m-b').style.width = '100%';
      el('m-s').style.width = '94%';
      el('m-g').style.width = '41%';
      const t0 = performance.now();
      const step = (t) => {
        const p = clamp((t - t0) / 1800);
        costEl.textContent = Math.round(25 * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      reduceMotion ? (costEl.textContent = '25') : requestAnimationFrame(step);
      drawSpark();
    }
  }, { threshold: 0.15 }).observe(root);
  addEventListener('resize', drawSpark);

  let tNum = 0, tSpark = 0, tLog = 0, tSrc = 0;
  return () => {
    if (!visible) return;
    const now = performance.now();
    if (now - tNum > 90) {
      tNum = now;
      const f = dayFrac();
      evEl.textContent = fmt.format(Math.floor(360e6 * f));
      gbEl.textContent = (100 * f).toFixed(2);
      rowsEl.textContent = fmt.format(Math.floor(1e6 * f));
      clockEl.textContent = tfmt.format(new Date());
    }
    if (reduceMotion) return;
    if (now - tSpark > 450) {
      tSpark = now;
      const eps = 4166 * (1 + 0.15 * Math.sin(now / 2600) + 0.09 * (Math.random() - 0.5));
      pts.push(eps); pts.shift();
      epsEl.textContent = fmt.format(Math.round(eps));
      dqEl.textContent = (99.62 + Math.random() * 0.33).toFixed(2);
      drawSpark();
    }
    if (now - tSrc > 260) {
      tSrc = now;
      dots.forEach((d) => d.classList.remove('hit'));
      dots[(Math.random() * 15) | 0].classList.add('hit');
      dots[(Math.random() * 15) | 0].classList.add('hit');
    }
    if (now - tLog > 1400) { tLog = now; addLog(); }
  };
}

/* =========================================================
   Terminal + command palette (from v1)
   ========================================================= */
const SKILLS = {
  Programming: 'Python, PySpark, Pandas, SQL, Spark SQL, T-SQL, PostgreSQL, MySQL',
  'Big Data': 'Spark, Spark Streaming, Kafka, Delta Lake, Parquet, Perf Tuning',
  Databricks: 'Unity Catalog, DLT, Lakeflow Jobs, Auto Loader, AI/BI',
  Cloud: 'ADF, ADLS Gen2, Synapse, S3, Redshift, Kinesis, Snowflake, GCP',
  'Data Eng': 'ETL/ELT, Warehousing, Dimensional Modeling, Medallion, Contracts',
  Governance: 'PII, Row/Column Security, Lineage, Data Quality, Audit Logs',
  'GenAI & ML': 'RAG, LLMs, Agents, LangGraph, LangChain, Vector Search, MLflow',
  'DevOps': 'Git, GitHub, Azure DevOps CI/CD, Power BI, Claude Code',
};
const CERTS = [
  ['Databricks', 'Certified Data Engineer Professional'],
  ['Databricks', 'Certified Data Engineer Associate'],
  ['Microsoft', 'Azure Data Engineer Associate (DP-203)'],
];

function asciiTable(headers, rows) {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)));
  const sep = '+' + widths.map((w) => '-'.repeat(w + 2)).join('+') + '+';
  const line = (cells, cls) => '|' + cells.map((c, i) => ` <span class="${cls[i] || ''}">${escapeHtml(c.padEnd(widths[i]))}</span> `).join('|') + '|';
  return [
    `<span class="t-dim">${sep}</span>`,
    line(headers, ['t-bold', 't-bold']),
    `<span class="t-dim">${sep}</span>`,
    ...rows.map((r) => line(r, ['t-cyan', ''])),
    `<span class="t-dim">${sep}</span>`,
    `<span class="t-dim">(${rows.length} rows)</span>`,
  ].join('\n');
}

function initTerminal() {
  const body = $('#term-body');
  const out = $('#term-out');
  const input = $('#term-input');
  const history = [];
  let hIdx = 0;
  let busy = false;

  const print = (html = '') => {
    const div = document.createElement('div');
    div.innerHTML = html;
    out.appendChild(div);
    body.scrollTop = body.scrollHeight;
  };
  const promptHtml = (cmd) =>
    `<span class="t-green">pravin</span><span class="t-dim">@</span><span class="t-cyan">lakehouse</span><span class="t-dim">:</span><span class="t-lilac">~</span><span class="t-dim">$</span> ${escapeHtml(cmd)}`;
  const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text}</a>`;

  const files = {
    'about.md': () => cmds.about(),
    'experience.log': () => cmds.experience(),
    'certs.json': () => JSON.stringify(CERTS.map(([issuer, name]) => ({ issuer, name })), null, 2),
    'skills.parquet': () => '<span class="t-amber">binary columnar file.</span> Try: <span class="t-cyan">SELECT * FROM skills;</span>',
    'resume.pdf': () => cmds.resume(),
  };

  const cmds = {
    help: () => [
      '<span class="t-bold">Available commands</span>',
      ...[
        ['whoami', 'who is this guy?'],
        ['about', 'short bio'],
        ['experience', 'work history'],
        ['projects', 'selected builds & impact'],
        ['skills', 'the toolkit'],
        ['SELECT * FROM skills;', 'same, but in SQL (also: certs)'],
        ['certs', 'certifications'],
        ['education', 'degree'],
        ['contact', 'how to reach me'],
        ['resume', 'download the PDF'],
        ['neofetch', 'system info'],
        ['ls / cat <file>', 'browse files'],
        ['ask <question>', 'chat with my résumé agent'],
        ['sudo hire pravin', 'you know you want to'],
        ['clear', 'clear screen'],
      ].map(([c, d]) => `  <span class="t-cyan">${escapeHtml(c.padEnd(24))}</span><span class="t-dim">${d}</span>`),
    ].join('\n'),
    whoami: () => '<span class="t-bold">Pravin Bokare</span> · Senior Data Engineer @ DataNimbus · Pune, India\n<span class="t-dim">Databricks · Spark · Kafka · Azure · AWS · GenAI</span>',
    about: () => 'Data Engineer with 3+ years building batch/streaming platforms on Databricks, Azure and AWS (Python, SQL, PySpark).\nBuilt Kafka pipelines processing <span class="t-cyan">360M+ events/day</span>, governed <span class="t-cyan">100+</span> Unity Catalog datasets and cut costs by <span class="t-green">25%</span>.\nDatabricks Certified Data Engineer Professional; hands-on with GenAI, RAG, Vector Search and LLM agents.',
    experience: () => [
      '<span class="t-amber">▸ Feb 2025 – Present</span>  <span class="t-bold">Senior Data Engineer</span> · DataNimbus India (Hyderabad)',
      '    medallion lakehouse 100+ GB/day · −25% Databricks cost · +60% BI speed',
      '    agentic AI accelerator (3h → 20m) · zero-egress RAG · UC governance for 100+ datasets',
      '',
      '<span class="t-amber">▸ Oct 2023 – Feb 2025</span> <span class="t-bold">Data Engineer</span> · Tata Consultancy Services (Bengaluru)',
      '    Kafka + Structured Streaming 360M+ events/day · 5+ PB SQL Server → ADLS Gen2 migration',
      '    +35% query perf · −50% pipeline runtime · Azure DevOps CI/CD',
    ].join('\n'),
    projects: () => [
      ['Risk-Case Agent Accelerator', '3h → 20m report drafting'],
      ['Real-time Event Streaming', '360M+ events/day'],
      ['Medallion Lakehouse', '100+ GB/day, +60% BI'],
      ['Unity Catalog Governance', '100+ datasets, 10+ teams'],
      ['GenAI Semantic Search', '10K+ docs, −80% tagging'],
      ['Zero-Egress RAG', 'Vector Search + GTE-large'],
      ['Cost Optimization', '−25% spend, 0 SLA impact'],
      ['PB-scale Migration', '5+ PB, −30% effort'],
    ].map(([n, i]) => `  <span class="t-pink">◆</span> ${escapeHtml(n.padEnd(30))}<span class="t-green">${escapeHtml(i)}</span>`).join('\n'),
    skills: () => Object.entries(SKILLS).map(([k, v]) => `  <span class="t-cyan">${escapeHtml(k.padEnd(12))}</span> ${escapeHtml(v)}`).join('\n'),
    certs: () => CERTS.map(([i, n]) => `  <span class="t-green">✓</span> <span class="t-amber">${i.padEnd(10)}</span> ${escapeHtml(n)}`).join('\n'),
    education: () => '<span class="t-bold">B.Tech</span> · Walchand Institute of Technology, Solapur (2019–2023)\nCGPA <span class="t-green">9.45 / 10</span>',
    contact: () => [
      `  email     ${link('mailto:' + CONFIG.email, CONFIG.email)}`,
      `  linkedin  ${link(CONFIG.linkedin, 'linkedin.com/in/pravin-bokare')}`,
      `  leetcode  ${link(CONFIG.leetcode, 'leetcode.com/u/pravin-bokare')}`,
      githubUrl ? `  github    ${link(githubUrl, githubUrl.replace('https://', ''))}` : null,
    ].filter(Boolean).join('\n'),
    resume: () => {
      const a = document.createElement('a');
      a.href = CONFIG.resume;
      a.download = 'Pravin_Bokare_Resume.pdf';
      a.click();
      return `<span class="t-green">↓ downloading</span> ${link(CONFIG.resume, 'Pravin_Bokare_Resume.pdf')}`;
    },
    linkedin: () => { window.open(CONFIG.linkedin, '_blank', 'noopener'); return 'opening LinkedIn…'; },
    leetcode: () => { window.open(CONFIG.leetcode, '_blank', 'noopener'); return 'opening LeetCode…'; },
    github: () => {
      if (!githubUrl) return '<span class="t-dim">GitHub link not configured yet.</span>';
      window.open(githubUrl, '_blank', 'noopener');
      return 'opening GitHub…';
    },
    neofetch: () => {
      const art = [
        '<span class="t-cyan">██████╗ ██████╗ </span>',
        '<span class="t-cyan">██╔══██╗██╔══██╗</span>',
        '<span class="t-lilac">██████╔╝██████╔╝</span>',
        '<span class="t-lilac">██╔═══╝ ██╔══██╗</span>',
        '<span class="t-pink">██║     ██████╔╝</span>',
        '<span class="t-pink">╚═╝     ╚═════╝ </span>',
      ].join('\n');
      const info = [
        '<span class="t-green">pravin</span>@<span class="t-cyan">lakehouse</span>',
        '<span class="t-dim">------------------</span>',
        '<span class="t-cyan">Role  </span>   Senior Data Engineer',
        '<span class="t-cyan">Uptime</span>   3+ years in production',
        '<span class="t-cyan">Engine</span>   Spark · Kafka · Delta',
        '<span class="t-cyan">Cloud </span>   Azure · AWS · GCP',
        '<span class="t-cyan">AI    </span>   LangGraph · RAG · Vector Search',
        '<span class="t-cyan">Certs </span>   Databricks Pro · Assoc · DP-203',
        '<span class="t-cyan">CGPA  </span>   9.45 / 10',
      ].join('\n');
      return `<span class="nf"><span class="nf-art">${art}</span><span class="nf-info">${info}</span></span>`;
    },
    ls: () => Object.keys(files).map((f) => (f.endsWith('.pdf') ? `<span class="t-pink">${f}</span>` : f.endsWith('.json') || f.endsWith('.parquet') ? `<span class="t-amber">${f}</span>` : `<span class="t-cyan">${f}</span>`)).join('   '),
    date: () => new Date().toString(),
    history: () => history.map((h, i) => `  ${String(i + 1).padStart(3)}  ${escapeHtml(h)}`).join('\n') || '<span class="t-dim">(empty)</span>',
    exit: () => '<span class="t-dim">There is no exit from the lakehouse. Try</span> <span class="t-cyan">contact</span> <span class="t-dim">instead.</span>',
  };
  cmds.exp = cmds.experience;
  cmds.builds = cmds.projects;
  cmds.edu = cmds.education;
  cmds.cv = cmds.resume;

  async function hire() {
    busy = true;
    const steps = [
      ['<span class="t-dim">[sudo] password for recruiter:</span> ********', 450],
      ['<span class="t-green">✓</span> Verifying credentials ......... Databricks Pro · DP-203', 380],
      ['<span class="t-green">✓</span> Measuring impact .............. 360M events/day · −25% cost', 380],
      ['<span class="t-green">✓</span> Running culture_fit.py ........ passed (0 warnings)', 380],
      ['<span class="t-green">✓</span> Drafting offer letter ......... done', 380],
      [`<span class="t-pink">→</span> Final step: ${link(`mailto:${CONFIG.email}?subject=${encodeURIComponent("Let's work together")}`, 'send the email')} 🚀`, 0],
    ];
    for (const [line, wait] of steps) { print(line); await sleep(wait); }
    busy = false;
  }

  function run(raw) {
    const cmd = raw.trim();
    print(promptHtml(cmd));
    if (!cmd) return;
    history.push(cmd);
    hIdx = history.length;
    const lower = cmd.toLowerCase().replace(/\s+/g, ' ');
    const [name, ...args] = lower.split(' ');

    if (name === 'clear' || name === 'cls') { out.innerHTML = ''; return; }
    if (lower.startsWith('sudo hire') || lower === 'hire pravin' || lower === 'sudo hire-pravin') { hire(); return; }
    if (name === 'sudo') { print('<span class="t-err">pravin is not in the sudoers file. This incident will be reported.</span>\n<span class="t-dim">(psst: try</span> <span class="t-cyan">sudo hire pravin</span><span class="t-dim">)</span>'); return; }
    if (name === 'select') {
      const m = lower.match(/from\s+([a-z_]+)/);
      const table = m && m[1];
      if (table === 'skills') print(asciiTable(['category', 'skills'], Object.entries(SKILLS)));
      else if (table === 'certs' || table === 'certifications') print(asciiTable(['issuer', 'certification'], CERTS));
      else print(`<span class="t-err">[TABLE_OR_VIEW_NOT_FOUND]</span> The table or view ${escapeHtml(table || '?')} cannot be found. Try <span class="t-cyan">skills</span> or <span class="t-cyan">certs</span>.`);
      return;
    }
    if (name === 'echo') { print(escapeHtml(cmd.slice(5))); return; }
    if (name === 'cat') {
      const f = args[0];
      if (!f) print('<span class="t-err">usage: cat &lt;file&gt;</span>');
      else if (files[f]) print(files[f]());
      else print(`<span class="t-err">cat: ${escapeHtml(f)}: No such file or directory</span>`);
      return;
    }
    if (name === 'ask' || name === 'agent') {
      const q = cmd.slice(cmd.indexOf(' ') + 1).trim();
      if (!q || q.toLowerCase() === name) { print('<span class="t-dim">usage: ask &lt;question&gt; · e.g.</span> <span class="t-cyan">ask why forward deployed</span>'); return; }
      print('<span class="t-lilac">✦</span> <span class="t-dim">forwarding to résumé agent →</span>');
      window.__agent?.ask(q);
      return;
    }
    if (cmds[name]) { print(cmds[name]()); return; }
    print(`<span class="t-err">command not found: ${escapeHtml(name)}</span> <span class="t-dim">· type</span> <span class="t-cyan">help</span>`);
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (busy) return;
      run(input.value);
      input.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hIdx > 0) input.value = history[--hIdx];
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hIdx < history.length - 1) input.value = history[++hIdx];
      else { hIdx = history.length; input.value = ''; }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const v = input.value.toLowerCase();
      if (!v) return;
      const pool = [...Object.keys(cmds), 'clear', 'sudo hire pravin', 'select * from skills;', ...Object.keys(files).map((f) => 'cat ' + f)];
      const matches = pool.filter((c) => c.startsWith(v));
      if (matches.length === 1) input.value = matches[0];
      else if (matches.length > 1) { print(promptHtml(input.value)); print(matches.map((m) => `<span class="t-cyan">${escapeHtml(m)}</span>`).join('   ')); }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      out.innerHTML = '';
    }
  });

  body.addEventListener('click', () => {
    if (!window.getSelection().toString()) input.focus({ preventScroll: true });
  });
  $$('.term-quick button').forEach((b) => b.addEventListener('click', () => {
    if (busy) return;
    run(b.dataset.cmd);
    input.focus({ preventScroll: true });
  }));

  print('<span class="t-bold">pravin-shell</span> <span class="t-dim">v3.0 (lakehouse edition)</span>');
  print('<span class="t-dim">Type</span> <span class="t-cyan">help</span> <span class="t-dim">to list commands. Tab completes, ↑/↓ walk history.</span>');
  print('');

  window.__term = { run: (c) => { $('#terminal').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); run(c); } };
}

function initPalette() {
  const palette = $('#palette');
  const input = $('#palette-input');
  const list = $('#palette-list');
  let items = [], filtered = [], sel = 0, lastFocus = null;

  const go = (id) => () => $(id).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  items = [
    { label: 'Home', icon: '⌂', group: 'jump', run: go('#top') },
    { label: 'Manifesto · live ops dashboard', icon: '◎', group: 'jump', run: go('#about') },
    { label: 'Architecture · lakehouse flow', icon: '⇢', group: 'jump', run: go('#pipeline') },
    { label: 'Experience', icon: '▤', group: 'jump', run: go('#experience') },
    { label: "Systems I've shipped", icon: '◆', group: 'jump', run: go('#projects') },
    { label: 'Open résumé agent chat', icon: '✦', group: 'agent', run: () => window.__agent?.open() },
    { label: 'Terminal', icon: '>_', group: 'jump', run: go('#terminal') },
    { label: 'Stack sphere', icon: '⚙', group: 'jump', run: go('#skills') },
    { label: 'Credentials', icon: '✓', group: 'jump', run: go('#certs') },
    { label: 'Contact', icon: '✉', group: 'jump', run: go('#contact') },
    { label: 'Ask agent: Why a Forward Deployed Engineer?', icon: '✦', group: 'agent', run: () => window.__agent?.ask('Why a Forward Deployed Engineer?') },
    { label: 'Ask agent: How did he cut costs?', icon: '✦', group: 'agent', run: () => window.__agent?.ask('How did he cut costs?') },
    { label: 'Copy email address', icon: '⧉', group: 'action', run: () => copyText(CONFIG.email, 'Email copied') },
    { label: 'Download résumé (PDF)', icon: '↓', group: 'action', run: () => { const a = document.createElement('a'); a.href = CONFIG.resume; a.download = 'Pravin_Bokare_Resume.pdf'; a.click(); } },
    { label: 'Open LinkedIn', icon: 'in', group: 'link', run: () => window.open(CONFIG.linkedin, '_blank', 'noopener') },
    { label: 'Open LeetCode', icon: 'LC', group: 'link', run: () => window.open(CONFIG.leetcode, '_blank', 'noopener') },
    ...(githubUrl ? [{ label: 'Open GitHub', icon: 'gh', group: 'link', run: () => window.open(githubUrl, '_blank', 'noopener') }] : []),
    { label: 'Run: neofetch', icon: '$', group: 'shell', run: () => window.__term.run('neofetch') },
    { label: 'Run: SELECT * FROM skills;', icon: '$', group: 'shell', run: () => window.__term.run('SELECT * FROM skills;') },
    { label: 'Run: sudo hire pravin', icon: '$', group: 'shell', run: () => window.__term.run('sudo hire pravin') },
  ];

  const render = () => {
    const q = input.value.trim().toLowerCase();
    filtered = items.filter((it) => !q || it.label.toLowerCase().includes(q) || it.group.includes(q));
    sel = Math.min(sel, Math.max(0, filtered.length - 1));
    list.innerHTML = filtered.length
      ? filtered.map((it, i) => `<li role="option" data-i="${i}" class="${i === sel ? 'sel' : ''}" aria-selected="${i === sel}"><span class="pi mono">${it.icon}</span>${escapeHtml(it.label)}<span class="pg">${it.group}</span></li>`).join('')
      : '<li class="empty mono">no results · try "terminal" or "email"</li>';
    list.querySelector('.sel')?.scrollIntoView({ block: 'nearest' });
  };

  const open = () => {
    lastFocus = document.activeElement;
    palette.hidden = false;
    input.value = '';
    sel = 0;
    render();
    input.focus();
  };
  const close = () => {
    palette.hidden = true;
    lastFocus?.focus?.({ preventScroll: true });
  };
  const choose = (i) => {
    const it = filtered[i];
    if (!it) return;
    close();
    setTimeout(it.run, 60);
  };

  $('#open-palette').addEventListener('click', open);
  palette.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  list.addEventListener('click', (e) => { const li = e.target.closest('li[data-i]'); if (li) choose(+li.dataset.i); });
  list.addEventListener('mousemove', (e) => {
    const li = e.target.closest('li[data-i]');
    if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; render(); }
  });
  input.addEventListener('input', () => { sel = 0; render(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, filtered.length); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + filtered.length) % Math.max(1, filtered.length); render(); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(sel); }
  });

  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName) && document.activeElement !== input;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); palette.hidden ? open() : close(); }
    else if (e.key === '/' && !typing && palette.hidden) { e.preventDefault(); open(); }
    else if (e.key === 'Escape' && !palette.hidden) close();
  });
}

/* =========================================================
   Certs, bands, HUD, menu, misc
   ========================================================= */
function initCerts() {
  $$('.flip').forEach((f) => {
    const toggle = () => f.classList.toggle('flipped');
    f.addEventListener('click', toggle);
    f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });
}

function initBands() {
  const bands = $$('[data-band]').map((b) => {
    const track = $('.band-track', b);
    track.innerHTML += track.innerHTML; // seamless loop
    return { track, dir: +b.dataset.dir || -1, x: 0 };
  });
  return (dt) => {
    for (const b of bands) {
      const half = b.track.scrollWidth / 2;
      const speed = reduceMotion ? 0 : (40 + Math.min(Math.abs(state.vel) * 12, 900)) * dt;
      b.x += speed * b.dir * (state.vel < 0 ? -1 : 1);
      if (b.x <= -half) b.x += half;
      if (b.x > 0) b.x -= half;
      const skew = reduceMotion ? 0 : clamp(state.vel * 0.25, -10, 10);
      b.track.style.transform = `translate3d(${b.x}px,0,0) skewX(${(-skew).toFixed(2)}deg)`;
    }
  };
}

function initHud() {
  const clock = $('#hud-clock'), idx = $('#hud-idx'), label = $('#hud-label'), rail = $('#hud-rail'), hudEl = $('.hud');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tickClock = () => { clock.textContent = fmt.format(new Date()); };
  tickClock();
  setInterval(tickClock, 1000);

  const sections = $$('main section[data-label]');
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const s = e.target;
    idx.textContent = String(sections.indexOf(s)).padStart(2, '0');
    label.textContent = s.dataset.label;
    hudEl.classList.toggle('quiet', s.id === 'projects');
    state.sectionShape = s.dataset.shape;
    if (!state.botOpen) GL?.setShape(s.dataset.shape);
    if (s.id !== 'pipeline') GL?.setLayer(0);
  }), { rootMargin: '-48% 0px -48% 0px' });
  sections.forEach((s) => io.observe(s));

  return () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    rail.style.height = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
  };
}

function initMenu() {
  const btn = $('#menu-btn'), menu = $('#menu'), root = document.documentElement;
  const set = (open) => {
    root.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('lock', open);
    $('.mb-txt', btn).textContent = open ? 'CLOSE' : 'MENU';
  };
  btn.addEventListener('click', () => set(!root.classList.contains('menu-open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => set(false)));

  const order = ['about', 'pipeline', 'experience', 'projects', 'terminal', 'skills', 'certs', 'contact'];
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') set(false);
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName);
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 8) {
      set(false);
      $('#' + order[n - 1]).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  });
}

function initMisc() {
  $('#year').textContent = new Date().getFullYear();
  $('#copy-email').addEventListener('click', (e) => copyText(e.currentTarget.dataset.email, 'Email copied'));
  if (CONFIG.github) {
    $$('.gh-link').forEach((a) => { a.href = `https://github.com/${CONFIG.github}`; });
    $$('.gh-item').forEach((el) => { el.hidden = false; });
  }
}

/* =========================================================
   Boot
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initSplit();
  initLoader();
  try { GL = initGL(); } catch (err) { console.warn('WebGL disabled:', err); $('#gl')?.remove(); }
  initCursor();
  initPointerFx();
  initTyped();
  initReveal();
  initLiveConsole();
  initPipeline();
  initXpFilter();
  initAgent();
  initTerminal();
  initPalette();
  initSphere();
  initCerts();
  initMenu();
  initMisc();

  const scrub = initScrub();
  const ops = initOps();
  const builds = initBuilds();
  const hud = initHud();
  const bands = initBands();

  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const y = scrollY;
    state.vel = lerp(state.vel, y - state.lastY, 0.12);
    state.lastY = y;
    scrub();
    ops();
    builds();
    hud();
    bands(dt);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
});
