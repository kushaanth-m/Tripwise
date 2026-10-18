/* ==========================================================================
   TOPOGRAPHIC CONTOUR BACKGROUND & HERO TYPOGRAPHY ANIMATION
   ========================================================================== */
(() => {
  const cv = document.querySelector('#bg'), g = cv.getContext('2d'), N = 28, STEP = .042, SC = 1 / 380, DET = .65;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cMin = 16, ms = 0, fr = 0, W, H, C, cols, rows, F, drift = 0, morph = 0, px = 0, py = 0, mx = -999, my = -999, inside = false, trA = 0, trH = 0, last = 0, amp = 1, aIn = 1;
  const born = performance.now(), pulses = [], sm = t => t * t * (3 - 2 * t);
  const T = new Float32Array(65536); { let r = 1337; for (let i = 0; i < 65536; i++) { r = (r * 1664525 + 1013904223) >>> 0; T[i] = r / 4294967296; } }
  const q5 = t => t * t * t * (t * (t * 6 - 15) + 10);
  const vn = (a, b) => { const i = Math.floor(a), j = Math.floor(b), u = q5(a - i), v = q5(b - j), x = i & 255, y = j & 255, x1 = (x + 1) & 255, y1 = (y + 1) & 255;
    return (T[x | y << 8] * (1 - u) + T[x1 | y << 8] * u) * (1 - v) + (T[x | y1 << 8] * (1 - u) + T[x1 | y1 << 8] * u) * v; };
  const fbm = (x, y) => { const wx = vn(x * .5 + 7 + morph, y * .5) - .5, wy = vn(x * .5 - 3, y * .5 + 5 + morph) - .5; x += wx * 1.4; y += wy * 1.4;
    return .55 * vn(x, y) + .27 * vn(x * 2.03 + 5.2, y * 2.03 + 1.3) + .13 * vn(x * 4.1 + 9, y * 4.1 + 3) + .05 * vn(x * 8.3, y * 8.3 + 7); };
  const height = (x, y) => {
    const sx = (x + px) * SC, sy = (y + py - drift) * SC;
    const n = fbm(sx, sy) - .5 + DET * .05 * (vn(sx * 16, sy * 16) - .5);
    const s = Math.log(1 + Math.exp(7 * (2.4 * n + .05))) / 7;
    let h = s * s * 1.6;
    for (const p of pulses) { const z = (Math.hypot(x - p.x, y - p.y) - p.R) / (34 + p.R * .06); h += .1 * Math.exp(-z * z) * p.k; }
    return h * amp;
  };
  const SEG = [[], [3, 2], [2, 1], [3, 1], [0, 1], [0, 3, 2, 1], [0, 2], [0, 3], [0, 3], [0, 2], [0, 1, 3, 2], [0, 1], [3, 1], [2, 1], [3, 2], []];
  const pt = (e, x, y, a, b, c, d, l) => e === 0 ? [x + C * (l - a) / (b - a), y] : e === 1 ? [x + C, y + C * (l - b) / (c - b)] : e === 2 ? [x + C * (l - d) / (c - d), y + C] : [x, y + C * (l - a) / (d - a)];

  function grid() { C = Math.max(cMin, Math.sqrt(W * H / 10000)); cols = Math.ceil(W / C) + 2; rows = Math.ceil(H / C) + 2; F = new Float32Array(cols * rows); }
  function size() {
    const r = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; grid();
    cv.width = W * r; cv.height = H * r; g.setTransform(r, 0, 0, r, 0, 0);
    if (reduce) paint();
  }

  function step(dt, now) {
    const age = (now - born) / 1000;
    amp = reduce ? 1 : sm(Math.min(age / 2.8, 1)); aIn = reduce ? 1 : Math.min(age / 1, 1);
    if (!reduce) { drift += dt * 10; morph += dt * .02; }
    const e = 1 - Math.exp(-dt / .35);
    px += ((inside ? (mx / W - .5) * 70 : 0) - px) * e; py += ((inside ? (my / H - .5) * 70 : 0) - py) * e;
    trA += ((inside ? 1 : 0) - trA) * (1 - Math.exp(-dt / .2));
    if (inside) { const h = height(mx, my); trH = trA < .05 ? h : trH + (h - trH) * (1 - Math.exp(-dt / .09)); }
    for (let i = pulses.length - 1; i >= 0; i--) { const p = pulses[i]; p.age += dt; p.R = p.age * 540; p.k = Math.exp(-p.age * 1.1) * Math.min(p.age / .08, 1); if (p.age > 4) pulses.splice(i, 1); }
  }

  function paint() {
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) F[j * cols + i] = height(i * C, j * C);
    g.clearRect(0, 0, W, H);
    const minor = new Path2D(), major = new Path2D();
    for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
      const a = F[j * cols + i], b = F[j * cols + i + 1], c = F[(j + 1) * cols + i + 1], d = F[(j + 1) * cols + i];
      const lo = Math.max(1, Math.ceil(Math.min(a, b, c, d) / STEP)), hi = Math.min(N, Math.floor(Math.max(a, b, c, d) / STEP));
      for (let k = lo; k <= hi; k++) {
        const l = k * STEP, s = SEG[(a > l ? 8 : 0) + (b > l ? 4 : 0) + (c > l ? 2 : 0) + (d > l ? 1 : 0)], P = k % 5 ? minor : major;
        for (let m = 0; m < s.length; m += 2) {
          const p = pt(s[m], i * C, j * C, a, b, c, d, l), q = pt(s[m + 1], i * C, j * C, a, b, c, d, l);
          P.moveTo(p[0], p[1]); P.lineTo(q[0], q[1]);
        }
      }
    }
    g.lineJoin = g.lineCap = 'round';
    g.strokeStyle = `rgba(255,255,255,${.2 * aIn})`; g.lineWidth = .7; g.stroke(minor);
    g.strokeStyle = `rgba(255,255,255,${.42 * aIn})`; g.lineWidth = 1.1; g.stroke(major);
    g.globalCompositeOperation = 'destination-out';
    const f = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .2, W / 2, H / 2, Math.hypot(W, H) * .55);
    f.addColorStop(0, 'rgba(0,0,0,0)'); f.addColorStop(1, 'rgba(0,0,0,.92)');
    g.fillStyle = f; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = 0; return; }
    const dt = last ? Math.min((now - last) / 1000, .05) : .016; last = now;
    const t0 = performance.now(); step(dt, now); paint();
    ms += (performance.now() - t0 - ms) * .05;
    if (++fr % 90 === 0 && ms > 9 && cMin < 28) { cMin += 2; grid(); }
  }

  addEventListener('resize', size);
  size(); if (!reduce) requestAnimationFrame(frame);
})();

const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NAMES = ['Japan', 'Brazil', 'Kenya', 'Norway', 'India', 'Peru', 'Morocco'];
function typer(set, words, pre = '') {
  if (still) { set(pre + words[0]); return; }
  let w = 0, i = 0, del = false;
  (function tick() {
    const word = words[w]; i += del ? -1 : 1; set(pre + word.slice(0, i));
    let d = del ? 45 : 95;
    if (!del && i === word.length) { del = true; d = 1400; } else if (del && i === 0) { del = false; w = (w + 1) % words.length; d = 400; }
    setTimeout(tick, d);
  })();
}
typer(t => { document.querySelector('#tw').textContent = t; }, NAMES);
typer(t => { const e = document.querySelector('#hq'); if (document.activeElement !== e && !e.value) e.placeholder = t || 'Search for a country'; }, NAMES, 'Try ');
(() => {
  const h = document.querySelector('#hh'), t = h.textContent; h.textContent = ''; let n = 0;
  t.split(' ').forEach(w => {
    const s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true');
    for (const c of w) { const l = document.createElement('span'); l.className = 'ch'; l.style.setProperty('--i', n++); l.textContent = c; s.append(l); }
    h.append(s);
  });
})();