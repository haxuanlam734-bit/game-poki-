// LUMI GLIDE - hold to glide up, release to fall. Collect stars, grab power-ups, travel through 5 worlds, unlock skins.
const canvas = document.getElementById("gameCanvas"), ctx = canvas.getContext("2d");
const $ = id => document.getElementById(id);
const scoreEl = $("score"), bestEl = $("best"), runStarsEl = $("runStars");
const startScreen = $("startScreen"), overScreen = $("gameOverScreen");
const startBtn = $("startButton"), restartBtn = $("restartButton"), reviveBtn = $("reviveBtn"), menuBtn = $("menuBtn");
const finalScore = $("finalScore"), finalBest = $("finalBest"), finalStars = $("finalStars");
const walletEl = $("wallet"), skinsEl = $("skins"), skinMsg = $("skinMsg");

const BEST_KEY = "lumiGlideBest", SAVE_KEY = "lumiGlideSave", MUTE_KEY = "lumiGlideMuted";
let W = 480, H = 800, running = false, gameOver = false, score = 0, last = 0, offset = 0, time = 0, shake = 0;
let best = 0, holding = false, revived = false;
try { best = Number(localStorage.getItem(BEST_KEY) || 0); } catch (e) {}

/* ---------- Save data: star wallet + skins ---------- */
const SKINS = [
  { e: null, id: "lumi", name: "Lumi", price: 0 },
  { e: "🐱", id: "🐱", name: "Mèo", price: 50, rot: 0 },
  { e: "🐶", id: "🐶", name: "Cún", price: 60, rot: 0 },
  { e: "🐸", id: "🐸", name: "Ếch", price: 70, rot: 0 },
  { e: "🐥", id: "🐥", name: "Gà con", price: 80, rot: 0 },
  { e: "🐼", id: "🐼", name: "Gấu trúc", price: 100, rot: 0 },
  { e: "🐰", id: "🐰", name: "Thỏ", price: 110, rot: 0 },
  { e: "🐷", id: "🐷", name: "Heo", price: 120, rot: 0 },
  { e: "🐹", id: "🐹", name: "Chuột hamster", price: 130, rot: 0 },
  { e: "🦊", id: "🦊", name: "Cáo", price: 150, rot: 0 },
  { e: "🐨", id: "🐨", name: "Koala", price: 160, rot: 0 },
  { e: "🐮", id: "🐮", name: "Bò sữa", price: 170, rot: 0 },
  { e: "🐧", id: "🐧", name: "Cánh cụt", price: 190, rot: 0 },
  { e: "🐯", id: "🐯", name: "Hổ", price: 200, rot: 0 },
  { e: "🐵", id: "🐵", name: "Khỉ", price: 220, rot: 0 },
  { e: "🦁", id: "🦁", name: "Sư tử", price: 240, rot: 0 },
  { e: "🐻", id: "🐻", name: "Gấu nâu", price: 260, rot: 0 },
  { e: "🦉", id: "🦉", name: "Cú mèo", price: 280, rot: 0 },
  { e: "🍉", id: "🍉", name: "Dưa hấu", price: 300, rot: 0 },
  { e: "🍕", id: "🍕", name: "Pizza", price: 320, rot: 0 },
  { e: "🎈", id: "🎈", name: "Bóng bay", price: 340, rot: 0 },
  { e: "🚀", id: "🚀", name: "Tên lửa", price: 360, rot: 0.785 },
  { e: "🐙", id: "🐙", name: "Bạch tuộc", price: 380, rot: 0 },
  { e: "👻", id: "👻", name: "Ma", price: 400, rot: 0 },
  { e: "🍩", id: "🍩", name: "Donut", price: 430, rot: 0 },
  { e: "🎃", id: "🎃", name: "Bí ngô", price: 460, rot: 0 },
  { e: "☃️", id: "☃️", name: "Người tuyết", price: 500, rot: 0 },
  { e: "🤖", id: "🤖", name: "Robot", price: 550, rot: 0 },
  { e: "👽", id: "👽", name: "Người ngoài hành tinh", price: 600, rot: 0 },
  { e: "🛸", id: "🛸", name: "Đĩa bay", price: 650, rot: 0 },
  { e: "🐲", id: "🐲", name: "Rồng", price: 750, rot: 0 },
  { e: "👑", id: "👑", name: "Vương miện", price: 900, rot: 0 },
  { e: "🌞", id: "🌞", name: "Mặt trời", price: 1000, rot: 0 }
];
let save = { wallet: 0, owned: ["lumi"], sel: "lumi", ver: 2 };
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); if (s && Array.isArray(s.owned)) {
    if (s.ver !== 2) { // older saves stored skin numbers; convert them to ids
      const OLD = ["lumi", "🐱", "🐶", "🐸", "🐼", "🐰", "🦊", "🐧", "🐯", "🐵", "🦁", "🚀", "🐙", "👻", "🍩", "🤖", "👽", "🐲"];
      s.owned = s.owned.map(i => OLD[i] || "lumi"); s.sel = OLD[s.sel] || "lumi"; s.ver = 2;
    }
    save = Object.assign(save, s);
  } } catch (e) {}
addEventListener("pagehide", () => persist());
document.addEventListener("visibilitychange", () => { if (document.hidden) persist(); });
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} };

const sprite = { x: 110, y: 300, r: 16, v: 0, rot: 0, wing: 0 };
// Hold = thrust up, release = gravity. Velocity is clamped so control stays smooth for little fingers.
const PHYS = { g: 1000, up: 1900, vmin: -300, vmax: 460 };
const S = { pw: 84, gap: 235, speed: 140, dist: 320, ground: 90, sh: 38, side: 20, spikes: 4 };
const obstacles = [], hazards = [], stars = [], pows = [], parts = [], popups = [];
const bgStars = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random() * 0.7, s: Math.random() * 1.6 + 0.4, p: Math.random() * 6 }));

// run state
let runStars = 0, combo = 0, x2 = 0, shield = false, rainbow = 0, magnet = 0, inv = 0, world = 0, banner = { text: "", t: 0 }, trailT = 0;

/* ---------- Worlds (colour themes, change every 10 points) ---------- */
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mk = o => { const r = {}; for (const k in o) r[k] = hex(o[k]); return r; };
const WORLDS = [
  { name: "🌙 Hang Tinh Tú", c: mk({ sk0: "#150b33", sk1: "#3a1456", sk2: "#6b1f5e", ridge: "#2a0f45", rk0: "#2b2542", rk1: "#4a3f6e", rk2: "#1d1830", sp0: "#c9d7ff", sp1: "#ff9ec0", sp2: "#ff3d6e", gl: "#ff5a2a", gt: "#ffb347", g0: "#2a1d3d", g1: "#120a1f" }) },
  { name: "🍄 Rừng Nấm Sáng", c: mk({ sk0: "#06231f", sk1: "#0d4a3a", sk2: "#1d7a52", ridge: "#0a2f27", rk0: "#1f3b2b", rk1: "#3d6b4a", rk2: "#12261c", sp0: "#f3ffd0", sp1: "#c4f27a", sp2: "#7ad13b", gl: "#9cff4a", gt: "#e8ff9a", g0: "#173a2a", g1: "#0a1f16" }) },
  { name: "🐠 Đại Dương Xanh", c: mk({ sk0: "#04153a", sk1: "#0a3d7a", sk2: "#1580a8", ridge: "#082a55", rk0: "#1d3e63", rk1: "#3a6d9a", rk2: "#10263f", sp0: "#ffffff", sp1: "#9fe3ff", sp2: "#38b6ff", gl: "#3fd0ff", gt: "#bff0ff", g0: "#12335a", g1: "#081a33" }) },
  { name: "🪐 Vũ Trụ", c: mk({ sk0: "#05050f", sk1: "#1a1040", sk2: "#3a1a6e", ridge: "#150d33", rk0: "#3a3a55", rk1: "#6a6a8c", rk2: "#22223a", sp0: "#fff6c9", sp1: "#ffd45e", sp2: "#ff9d1f", gl: "#ffd45e", gt: "#fff1b0", g0: "#2a2a44", g1: "#10101e" }) },
  { name: "🍭 Xứ Kẹo Ngọt", c: mk({ sk0: "#ff8fcb", sk1: "#ffb8de", sk2: "#ffe0a0", ridge: "#ff7fb8", rk0: "#b8689a", rk1: "#e88ec0", rk2: "#8a3f70", sp0: "#ffffff", sp1: "#ffb3d9", sp2: "#ff5fa8", gl: "#ff5fa8", gt: "#ffffff", g0: "#c9709f", g1: "#8a3f70" }) }
];
const cur = {}; for (const k in WORLDS[0].c) cur[k] = WORLDS[0].c[k].slice();
const col = k => `rgb(${cur[k][0] | 0},${cur[k][1] | 0},${cur[k][2] | 0})`;
function snapWorld(i) { for (const k in cur) cur[k] = WORLDS[i].c[k].slice(); }
function blendWorld(dt) {
  const t = WORLDS[world].c, a = 1 - Math.exp(-dt * 2.2);
  for (const k in cur) for (let i = 0; i < 3; i++) cur[k][i] += (t[k][i] - cur[k][i]) * a;
}

function resize() {
  const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
  canvas.width = r.width * d; canvas.height = r.height * d;
  ctx.setTransform(d, 0, 0, d, 0, 0);
  W = r.width; H = r.height;
  if (!running && !gameOver) { sprite.x = W * 0.5; }
  draw();
}
addEventListener("resize", resize);

/* ---------- Sound (all synthesized with WebAudio, no files needed) ---------- */
let AC = null, master = null, windGain = null, windFilter = null, noiseBuf = null, muted = false, adMuted = false;
try { muted = localStorage.getItem(MUTE_KEY) === "1"; } catch (e) {}
function setMaster() { if (master) master.gain.value = (muted || adMuted) ? 0 : 0.8; }
function initAudio() {
  if (AC) { if (AC.state === "suspended") AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.connect(AC.destination); setMaster();
    noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const w = AC.createBufferSource(); w.buffer = noiseBuf; w.loop = true;
    windFilter = AC.createBiquadFilter(); windFilter.type = "bandpass"; windFilter.frequency.value = 450; windFilter.Q.value = 0.7;
    windGain = AC.createGain(); windGain.gain.value = 0;
    w.connect(windFilter); windFilter.connect(windGain); windGain.connect(master); w.start();
  } catch (e) { AC = null; }
}
function noise(dur, type, f0, f1, vol, q = 1, delay = 0) {
  if (!AC) return; const t = AC.currentTime + delay;
  const src = AC.createBufferSource(); src.buffer = noiseBuf;
  const f = AC.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = AC.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(master); src.start(t, Math.random()); src.stop(t + dur + 0.05);
}
function tone(f0, f1, dur, type, vol, delay = 0) {
  if (!AC) return; const t = AC.currentTime + delay;
  const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
}
const sfx = {
  flap() { noise(0.2, "bandpass", 450, 1700, 0.35, 0.9); },
  clash() {
    noise(0.16, "highpass", 3500, 7000, 0.35, 1);
    tone(1900, 1350, 0.28, "triangle", 0.12); tone(150, 50, 0.22, "sine", 0.45);
  },
  hit() { noise(0.4, "lowpass", 1400, 120, 0.9, 0.7); tone(240, 45, 0.45, "sawtooth", 0.28); },
  star(c) { const f = 880 + Math.min(c, 14) * 70; tone(f, f * 1.5, 0.14, "sine", 0.22); tone(f * 2, f * 2, 0.1, "triangle", 0.06, 0.04); },
  power() { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.14, "triangle", 0.2, i * 0.06)); },
  pop() { noise(0.25, "bandpass", 900, 3000, 0.7, 1.2); tone(500, 200, 0.2, "sine", 0.3); },
  world() { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, f, 0.22, "sine", 0.18, i * 0.09)); },
  buy() { tone(784, 784, 0.1, "square", 0.1); tone(1175, 1175, 0.2, "square", 0.1, 0.09); },
  no() { tone(200, 150, 0.2, "square", 0.12); },
  alarm() { for (let i = 0; i < 6; i++) tone(i % 2 ? 560 : 840, i % 2 ? 560 : 840, 0.16, "square", 0.12, i * 0.17); },
  alarm1() { tone(900, 900, 0.08, "square", 0.1); tone(900, 900, 0.08, "square", 0.1, 0.14); },
  shoot() { noise(0.18, "bandpass", 1800, 400, 0.5, 1); tone(420, 160, 0.2, "sawtooth", 0.14); },
  laser() { tone(1400, 180, 0.55, "sawtooth", 0.18); noise(0.5, "highpass", 2500, 6000, 0.3, 1); },
  boom() { noise(0.5, "lowpass", 1200, 80, 0.9, 0.7); tone(140, 40, 0.5, "sine", 0.6); }
};
function updateWind() {
  if (!AC || !windGain) return; const t = AC.currentTime;
  const amt = running ? 0.04 + Math.min(0.12, Math.abs(sprite.v) / 4500 + (S.speed - 140) / 1400) : 0;
  windGain.gain.setTargetAtTime(amt, t, 0.12);
  windFilter.frequency.setTargetAtTime(380 + Math.abs(sprite.v) * 0.6 + (S.speed - 140) * 3, t, 0.12);
}

/* ---------- Input: HOLD to rise, release to fall ---------- */
function press() {
  if (!running) return;
  holding = true; sprite.wing = 1; if (sprite.v > -160) sprite.v = -160; sfx.flap();
}
function release() { holding = false; }

/* ---------- Poki SDK (safe if blocked / opened locally) ---------- */
const poki = () => (window.PokiSDK && typeof PokiSDK.init === "function" ? PokiSDK : null);
let pokiReady = false, starting = false, runs = 0;
(function initPoki() {
  const P = poki();
  if (!P) { return; }
  P.init().then(() => { pokiReady = true; }).catch(() => { pokiReady = false; }).finally(() => { try { P.gameLoadingFinished(); } catch (e) {} });
})();
const withTimeout = (pr, ms) => Promise.race([pr, new Promise(r => setTimeout(r, ms))]);
async function start() {
  if (starting || running) return;
  starting = true; initAudio();
  const P = poki();
  // ad break between runs (never before the very first run)
  if (P && runs > 0) { adMuted = true; setMaster(); try { await withTimeout(P.commercialBreak(), 15000); } catch (e) {} adMuted = false; setMaster(); }
  starting = false; runs++;
  begin();
}
function begin() {
  running = true; gameOver = false; score = 0; obstacles.length = 0; hazards.length = 0; stars.length = 0; pows.length = 0; parts.length = 0; popups.length = 0;
  S.speed = 140; S.gap = 235; shake = 0; holding = false; revived = false;
  runStars = 0; combo = 0; x2 = 0; shield = false; rainbow = 0; magnet = 0; inv = 0; world = 0; banner.t = 0; snapWorld(0); resetBoss();
  sprite.x = W * 0.25; sprite.y = H * 0.42; sprite.v = -250; sprite.rot = 0;
  scoreEl.textContent = 0; bestEl.textContent = "BEST: " + best; runStarsEl.textContent = "⭐ 0";
  startScreen.classList.add("hidden"); overScreen.classList.add("hidden");
  last = performance.now(); requestAnimationFrame(loop);
  const P = poki(); if (P) { try { P.gameplayStart(); } catch (e) {} }
}
function end() {
  if (gameOver) return;
  running = false; gameOver = true; holding = false; shake = 12; sfx.hit(); updateWind();
  burst(sprite.x, sprite.y, 26, null);
  persist();
  finalScore.textContent = score; finalBest.textContent = best; finalStars.textContent = runStars;
  reviveBtn.classList.toggle("hidden", !(poki() && !revived && score >= 1));
  overScreen.classList.remove("hidden");
  const P = poki(); if (P) { try { P.gameplayStop(); } catch (e) {} }
}
// Watch a rewarded ad -> continue the same run with a couple of seconds of safety.
function revive() {
  revived = true; running = true; gameOver = false; holding = false;
  const nx = obstacles.find(p => p.x + p.w + S.side > sprite.x - 20);
  sprite.y = nx ? (nx.top + nx.bottom) / 2 : H * 0.4; sprite.v = 0; inv = 2.5; shake = 0;
  overScreen.classList.add("hidden");
  clearThreats();
  last = performance.now(); requestAnimationFrame(loop);
  const P = poki(); if (P) { try { P.gameplayStart(); } catch (e) {} }
}
reviveBtn.onclick = async e => {
  e.stopPropagation(); const P = poki(); if (!P) return;
  reviveBtn.disabled = true; adMuted = true; setMaster(); let ok = false;
  try { ok = await withTimeout(P.rewardedBreak(), 60000); } catch (err) {}
  adMuted = false; setMaster(); reviveBtn.disabled = false;
  if (ok === true) revive(); else reviveBtn.classList.add("hidden");
};
menuBtn.onclick = e => { e.stopPropagation(); overScreen.classList.add("hidden"); gameOver = false; renderShop(); startScreen.classList.remove("hidden"); };

addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); if (e.repeat) return; if (!running) start(); else press(); }
});
addEventListener("keyup", e => { if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); release(); } });
canvas.addEventListener("pointerdown", e => { e.preventDefault(); if (!running) start(); else press(); });
addEventListener("pointerup", release); addEventListener("pointercancel", release); addEventListener("blur", release);
startBtn.onclick = e => { e.stopPropagation(); start(); };
restartBtn.onclick = e => { e.stopPropagation(); start(); };

/* ---------- Skin shop ---------- */
let skinMsgT = 0;
function say(t) { skinMsg.textContent = t; clearTimeout(skinMsgT); skinMsgT = setTimeout(() => skinMsg.textContent = "", 1800); }
function renderShop() {
  walletEl.textContent = "⭐ " + save.wallet;
  skinsEl.innerHTML = "";
  SKINS.forEach((s, i) => {
    const owned = save.owned.includes(s.id), b = document.createElement("button");
    b.className = "skin" + (save.sel === s.id ? " sel" : "") + (owned ? "" : " lock");
    b.innerHTML = (s.e || "🟢") + "<small>" + (owned ? (save.sel === s.id ? "✔" : "chọn") : "⭐" + s.price) + "</small>";
    b.onclick = ev => {
      ev.stopPropagation(); initAudio();
      if (!owned) {
        if (save.wallet < s.price) { sfx.no(); say("Cần thêm " + (s.price - save.wallet) + " ⭐ nữa!"); return; }
        save.wallet -= s.price; save.owned.push(s.id); sfx.buy(); say("Đã mở " + s.name + "!");
      }
      save.sel = s.id; persist(); renderShop();
    };
    skinsEl.appendChild(b);
  });
}

/* ---------- Effects ---------- */
function burst(x, y, n, color) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, v = 60 + Math.random() * 260;
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.6 + Math.random() * 0.4, max: 1, s: 2 + Math.random() * 4, c: color || `hsl(${Math.random() * 360},95%,65%)` });
  }
}
function popup(x, y, text, color) { popups.push({ x, y, text, color: color || "#fff", life: 1 }); }
function stepFX(dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt;
    if (p.life <= 0) parts.splice(i, 1);
  }
  for (let i = popups.length - 1; i >= 0; i--) { const p = popups[i]; p.life -= dt * 0.9; p.y -= 38 * dt; if (p.life <= 0) popups.splice(i, 1); }
  if (banner.t > 0) banner.t -= dt;
}

/* ---------- Obstacles: rock pillars covered in spikes ---------- */
// Every spike is a triangle [ax,ay, bx,by, tx,ty] with x relative to the pillar's left edge.
function buildTris(p) {
  const { top, bottom, w } = p, floor = H - S.ground, n = S.spikes, sw = w / n, tris = [];
  for (let i = 0; i < n; i++) {
    tris.push([i * sw, top, (i + 1) * sw, top, (i + 0.5) * sw, top + S.sh]);
    tris.push([i * sw, bottom, (i + 1) * sw, bottom, (i + 0.5) * sw, bottom - S.sh]);
  }
  for (let k = 1; k <= 3; k++) {
    for (const [y0, dir] of [[top - k * 62, -1], [bottom + k * 62, 1]]) {
      const ya = y0, yb = y0 + dir * 26, ym = (ya + yb) / 2;
      if (ym < 10 || ym > floor - 10) continue;
      tris.push([0, ya, 0, yb, -S.side, ym]);
      tris.push([p.w, ya, p.w, yb, p.w + S.side, ym]);
    }
  }
  p.tris = tris;
}
function placePillar(p, center) { p.top = center - p.gap / 2; p.bottom = center + p.gap / 2; buildTris(p); }
function addObstacle() {
  const prev = obstacles[obstacles.length - 1];
  // Difficulty ramps with score: narrower gaps, closer pillars, and from score 6 pillars start sliding up and down.
  const gap = Math.max(195, 235 - score * 1.4);
  const amp = score >= 6 && Math.random() < Math.min(0.85, 0.25 + (score - 6) * 0.08) ? Math.min(65, 20 + (score - 6) * 4) : 0;
  const margin = S.sh + 45 + amp, floor = H - S.ground;
  const lo = gap / 2 + margin, hi = Math.max(lo + 10, floor - gap / 2 - margin);
  const p = { x: W + 40, w: S.pw, gap, cy: lo + Math.random() * (hi - lo), amp, ph: Math.random() * 6.28, freq: 1.3 + Math.min(1.4, score * 0.05), passed: false, close: 0 };
  placePillar(p, p.cy);
  obstacles.push(p);
  // a star floating in the middle of every gap
  stars.push({ x: p.x + p.w / 2, y: p.cy, pl: p, got: false, missed: false, ph: Math.random() * 6 });
  // a trail of stars flowing from the previous gap to this one (+ sometimes a power-up in the middle)
  if (prev) {
    const d = p.x - prev.x, wantPow = score >= 3 && !pows.length && Math.random() < 0.22;
    for (let k = 1; k <= 3; k++) {
      const x = prev.x + prev.w / 2 + d * (k / 4) + 0, y = prev.cy + (p.cy - prev.cy) * (k / 4);
      if (k === 2 && wantPow) {
        const types = shield ? ["rainbow", "magnet", "x2"] : ["shield", "rainbow", "magnet", "x2"];
        pows.push({ x, y, type: types[(Math.random() * types.length) | 0], ph: Math.random() * 6 });
      } else stars.push({ x, y, pl: null, got: false, missed: false, ph: Math.random() * 6 });
    }
    if (score >= 4 && Math.random() < Math.min(0.7, 0.35 + score * 0.015)) spawnHazard(prev, p, d);
  }
}

/* ---------- Extra hazards between the pillars: spike balls, bats, spinners, meteors ---------- */
function spawnHazard(prev, p, d) {
  const floor = H - S.ground, mx = prev.x + prev.w / 2 + d / 2, my = (prev.cy + p.cy) / 2;
  const pool = ["ball"]; if (score >= 7) pool.push("bat"); if (score >= 12) pool.push("spin"); if (score >= 18) pool.push("meteor");
  const type = pool[(Math.random() * pool.length) | 0], side = my < floor / 2 ? 1 : -1;
  const cl = (y, m) => Math.max(m, Math.min(floor - m, y)), ph = Math.random() * 6;
  if (type === "ball") hazards.push({ type, x: mx, y0: cl(my + side * 110, 60), y: my, amp: 35, ph, r: 19 });
  else if (type === "bat") hazards.push({ type, x: W + 60, y0: 70 + Math.random() * (floor - 140), y: 0, ph });
  else if (type === "spin") hazards.push({ type, x: mx, y: cl(my + side * 135, 75), a: Math.random() * 6, len: 50 });
  else hazards.push({ type, x: W - 30, y: -30, t: 0, go: false, vx: 0, vy: 0 });
}
function hazardHit(h, rr) {
  if (h.type === "ball") return Math.hypot(sprite.x - h.x, sprite.y - h.y) < h.r + rr;
  if (h.type === "bat") return Math.hypot(sprite.x - h.x, sprite.y - h.y) < 14 + rr;
  if (h.type === "meteor") return h.go && Math.hypot(sprite.x - h.x, sprite.y - h.y) < 15 + rr;
  const c = Math.cos(h.a) * h.len, s = Math.sin(h.a) * h.len;
  return distSeg(sprite.x, sprite.y, h.x - c, h.y - s, h.x + c, h.y + s) < rr + 7;
}
function updateHazards(dt) {
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i];
    if (h.type === "meteor") {
      h.t += dt;
      if (h.t < 0.9) continue;
      if (!h.go) { h.go = true; h.x = W + 10; h.y = -10; h.vx = -(S.speed + 120); h.vy = 260; }
      h.x += h.vx * dt; h.y += h.vy * dt;
      parts.push({ x: h.x + 10, y: h.y - 8, vx: 40, vy: -30, life: 0.35, max: 0.35, s: 5, c: "#ffb347" });
      if (h.x < -60 || h.y > H) hazards.splice(i, 1);
    } else {
      h.x -= (S.speed + (h.type === "bat" ? 110 : 0)) * dt;
      if (h.type === "ball") h.y = h.y0 + Math.sin(time * 1.8 + h.ph) * h.amp;
      if (h.type === "bat") h.y = h.y0 + Math.sin(time * 5 + h.ph) * 14;
      if (h.type === "spin") h.a += dt * 2.4;
      if (h.x < -90) { hazards.splice(i, 1); continue; }
    }
    if (rainbow > 0 && hazardHit(h, sprite.r + 12)) { burst(h.x, h.y, 18, "#ff9d1f"); popup(h.x, h.y - 20, "BÙM!", "#ffd45e"); sfx.pop(); hazards.splice(i, 1); }
  }
}

/* ---------- BOSS: pillars vanish, a giant monster attacks, survive until it gives up ---------- */
const BOSSES = [["GAI KHỔNG LỒ", 300], ["RỒNG LỬA", 12], ["BẠCH TUỘC ĐIỆN", 190], ["VUA BÓNG TỐI", 265]]; // [name, hue]
const boss = { state: null, n: 0, next: 15, t: 0, dur: 22, x: 0, y: 0, cd: 1, mouth: 0, wait: 0, starT: 0 };
const shots = [], beams = [], bombs = [];
function resetBoss() { Object.assign(boss, { state: null, n: 0, next: 15, t: 0, dur: 22, x: W + 220, y: H * 0.4, cd: 1, mouth: 0, wait: 0, starT: 0 }); clearThreats(); }
function clearThreats() { shots.length = 0; beams.length = 0; bombs.length = 0; }
const floorY = () => H - S.ground, clampY = (y, m) => Math.max(m, Math.min(floorY() - m, y));
function startBoss() {
  boss.state = "warn"; boss.wait = 0; sfx.alarm();
  banner.text = "⚠️ BOSS " + (boss.n + 1) + " XUẤT HIỆN!"; banner.t = 3;
}
function attack(force) {
  const n = boss.n, bx = boss.x - 50, by = boss.y, fl = floorY();
  const pool = ["aim", "wall"]; if (n >= 1) pool.push("beam"); if (n >= 2) pool.push("bomb");
  const k = force || pool[(Math.random() * pool.length) | 0];
  boss.cd = Math.max(1.0, 2.4 - 0.22 * n) + Math.random() * 0.5; boss.mouth = 1;
  const sp = Math.min(430, 250 + 28 * n);
  if (k === "aim") {            // fan of fireballs aimed at you
    const cnt = Math.min(5, 1 + n), base = Math.atan2(sprite.y - by, sprite.x - bx);
    for (let i = 0; i < cnt; i++) { const a = base + (i - (cnt - 1) / 2) * 0.24; shots.push({ x: bx, y: by, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 13, k: "fire" }); }
    sfx.shoot();
  } else if (k === "wall") {    // wall of rocks with one gap to fly through
    const gapY = 130 + Math.random() * (fl - 260), gapH = Math.max(150, 215 - 12 * n);
    for (let y = 30; y < fl; y += 50) if (Math.abs(y - gapY) > gapH / 2) shots.push({ x: bx, y, vx: -(200 + 16 * n), vy: 0, r: 22, k: "rock" });
    sfx.shoot();
  } else if (k === "beam") {    // laser: red warning line, then the beam
    const y1 = clampY(sprite.y + (Math.random() - 0.5) * 180, 70), warn = Math.max(0.7, 1.1 - 0.08 * n);
    beams.push({ y: y1, t: 0, warn, dur: 0.55, h: 48, fired: false });
    if (n >= 2) beams.push({ y: clampY(y1 + (y1 < fl / 2 ? 1 : -1) * 250, 70), t: 0, warn, dur: 0.55, h: 48, fired: false });
    sfx.alarm1();
  } else {                      // bomb: flies out, then explodes into a ring of bullets
    const cnt = n >= 4 ? 2 : 1;
    for (let i = 0; i < cnt; i++) {
      let y1 = 90 + Math.random() * (fl - 180); if (Math.abs(y1 - sprite.y) < 110) y1 = clampY(sprite.y + (sprite.y < fl / 2 ? 1 : -1) * 190, 90);
      bombs.push({ x0: bx, y0: by, x1: W * 0.5 + (Math.random() - 0.3) * 90, y1, t: -i * 0.5, dur: 1.0, cnt: 10 + 2 * n });
    }
    sfx.shoot();
  }
}
function updateBoss(dt) {
  const n = boss.n, fl = floorY();
  boss.mouth = Math.max(0, boss.mouth - dt * 2);
  // threats keep moving in every state
  for (let i = shots.length - 1; i >= 0; i--) { const q = shots[i]; q.x += q.vx * dt; q.y += q.vy * dt; if (q.x < -50 || q.x > W + 80 || q.y < -50 || q.y > H + 50) shots.splice(i, 1); else if (q.k === "fire" && Math.random() < 0.5) parts.push({ x: q.x + 8, y: q.y, vx: 30, vy: (Math.random() - 0.5) * 30, life: 0.3, max: 0.3, s: 4, c: "#ffb347" }); }
  for (let i = beams.length - 1; i >= 0; i--) { const b = beams[i]; b.t += dt; if (b.t >= b.warn && !b.fired) { b.fired = true; sfx.laser(); shake = Math.max(shake, 6); } if (b.t > b.warn + b.dur) beams.splice(i, 1); }
  for (let i = bombs.length - 1; i >= 0; i--) {
    const b = bombs[i]; b.t += dt;
    if (b.t >= b.dur) {
      const sp = Math.min(260, 150 + 10 * n); for (let j = 0; j < b.cnt; j++) { const a = j / b.cnt * 6.2832; shots.push({ x: b.x1, y: b.y1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 11, k: "orb" }); }
      burst(b.x1, b.y1, 16, "#ff7ad9"); sfx.boom(); bombs.splice(i, 1);
    }
  }
  if (!boss.state) { if (score >= boss.next) startBoss(); return; }
  if (boss.state === "warn") {            // let the last pillars scroll away, then the boss arrives
    boss.wait += dt;
    if (boss.wait > 6 || (obstacles.every(o => o.passed) && !hazards.length)) { boss.state = "enter"; boss.dur = Math.min(40, 22 + 4 * n); boss.x = W + 220; boss.y = H * 0.38; sfx.boom(); shake = 10; }
    return;
  }
  if (boss.state === "enter") { boss.x -= 260 * dt; if (boss.x <= W - 95) { boss.x = W - 95; boss.state = "fight"; boss.t = 0; boss.cd = 1.2; boss.starT = 0.6; } return; }
  if (boss.state === "fight") {
    boss.t += dt; boss.y = H * 0.38 + Math.sin(time * 1.3) * H * 0.16;
    boss.cd -= dt; if (boss.cd <= 0) attack();
    boss.starT -= dt;                       // stars (and sometimes a power-up) keep arriving as bait
    if (boss.starT <= 0) {
      boss.starT = 1.2; const y = 90 + Math.random() * (fl - 170);
      if (!pows.length && Math.random() < 0.14) pows.push({ x: W + 30, y, type: ["shield", "magnet", "x2"][(Math.random() * 3) | 0], ph: 0 });
      else stars.push({ x: W + 30, y, pl: null, got: false, missed: false, ph: Math.random() * 6 });
    }
    if (boss.t >= boss.dur) {               // boss gives up
      clearThreats(); boss.state = "out"; sfx.world(); shake = 8;
      score += 5; scoreEl.textContent = score; if (score > best) { best = score; try { localStorage.setItem(BEST_KEY, best); } catch (e) {} bestEl.textContent = "BEST: " + best; }
      popup(W / 2, H * 0.3, "BOSS THUA RỒI! +5", "#ffe27a"); burst(boss.x, boss.y, 40, null);
      for (let i = 0; i < 8 + 2 * n; i++) stars.push({ x: W + 30 + i * 46, y: fl / 2 + Math.sin(i * 0.7) * 120, pl: null, got: false, missed: false, ph: i });
    }
    return;
  }
  if (boss.state === "out") { boss.x += 420 * dt; if (boss.x > W + 240) { boss.state = null; boss.n++; boss.next = score + 20; } }
}
function bossHit(rr) {
  for (const q of shots) if (Math.hypot(sprite.x - q.x, sprite.y - q.y) < q.r * 0.9 + rr) return true;
  for (const b of beams) if (b.t >= b.warn && Math.abs(sprite.y - b.y) < b.h / 2 + rr - 4) return true;
  return false;
}
function drawBoss() {
  // threats first (behind the boss body)
  for (const b of bombs) {
    if (b.t < 0) continue; const k = b.t / b.dur, x = b.x0 + (b.x1 - b.x0) * k, y = b.y0 + (b.y1 - b.y0) * k - Math.sin(k * Math.PI) * 110;
    ctx.strokeStyle = "rgba(255,122,217," + (0.4 + 0.4 * Math.sin(time * 20)) + ")"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x1, b.y1, 20 + 60 * k, 0, 7); ctx.stroke();
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = "#2a1038"; ctx.beginPath(); ctx.arc(0, 0, 15, 0, 7); ctx.fill(); ctx.strokeStyle = "#ff7ad9"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#ffe27a"; ctx.beginPath(); ctx.arc(8, -14, 4 + 2 * Math.sin(time * 30), 0, 7); ctx.fill(); ctx.restore();
  }
  for (const b of beams) {
    const on = b.t >= b.warn;
    if (!on) {
      ctx.globalAlpha = 0.35 + 0.5 * (Math.floor(b.t * 12) % 2); ctx.strokeStyle = "#ff3d3d"; ctx.lineWidth = 3; ctx.setLineDash([16, 10]);
      ctx.beginPath(); ctx.moveTo(0, b.y); ctx.lineTo(W, b.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = "900 30px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#ff3d3d"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.strokeText("!", 24, b.y); ctx.fillText("!", 24, b.y); ctx.globalAlpha = 1;
    } else {
      const f = 1 - (b.t - b.warn) / b.dur * 0.25, h = b.h * f, g = ctx.createLinearGradient(0, b.y - h / 2, 0, b.y + h / 2);
      g.addColorStop(0, "rgba(255,40,80,0)"); g.addColorStop(0.2, "#ff2d55"); g.addColorStop(0.5, "#ffffff"); g.addColorStop(0.8, "#ff2d55"); g.addColorStop(1, "rgba(255,40,80,0)");
      ctx.fillStyle = g; ctx.fillRect(0, b.y - h / 2 - 6, W, h + 12);
    }
  }
  if (boss.state && boss.state !== "warn") drawBossBody();
  for (const q of shots) {
    ctx.save(); ctx.translate(q.x, q.y);
    if (q.k === "rock") { ctx.rotate(time * 3); spikyBall(q.r - 4, 8, "#7a2a4a", "#ffb3c8"); }
    else {
      const c = q.k === "fire" ? ["255,150,40", "#ffd36b", "#ff5a1a"] : ["255,122,217", "#ffd0f4", "#c11fa0"];
      const gl = ctx.createRadialGradient(0, 0, 2, 0, 0, q.r * 2.3); gl.addColorStop(0, "rgba(" + c[0] + ",.65)"); gl.addColorStop(1, "rgba(" + c[0] + ",0)");
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, q.r * 2.3, 0, 7); ctx.fill();
      const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, q.r); g.addColorStop(0, c[1]); g.addColorStop(1, c[2]); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, q.r, 0, 7); ctx.fill();
    }
    ctx.restore();
  }
}
function drawBossBody() {
  const R = 78 + Math.min(24, boss.n * 6), hue = BOSSES[boss.n % BOSSES.length][1];
  ctx.save(); ctx.translate(boss.x, boss.y);
  const gl = ctx.createRadialGradient(0, 0, R * 0.6, 0, 0, R * 1.9); gl.addColorStop(0, "hsla(" + hue + ",90%,60%,.45)"); gl.addColorStop(1, "hsla(" + hue + ",90%,60%,0)");
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, R * 1.9, 0, 7); ctx.fill();
  ctx.save(); ctx.rotate(time * 0.5); ctx.fillStyle = "hsl(" + hue + ",35%,88%)"; ctx.strokeStyle = "#240b2e"; ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate(i * 0.5236); ctx.beginPath(); ctx.moveTo(R - 8, -13); ctx.lineTo(R + 26, 0); ctx.lineTo(R - 8, 13); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.restore();
  const g = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R); g.addColorStop(0, "hsl(" + hue + ",75%,62%)"); g.addColorStop(1, "hsl(" + hue + ",70%,26%)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill(); ctx.strokeStyle = "#240b2e"; ctx.lineWidth = 5; ctx.stroke();
  // angry eyes that follow you
  const d = Math.atan2(sprite.y - boss.y, sprite.x - boss.x);
  for (const ex of [-R * 0.5, -R * 0.12]) {
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ex, -R * 0.2, R * 0.16, 0, 7); ctx.fill(); ctx.strokeStyle = "#240b2e"; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = "#c00"; ctx.beginPath(); ctx.arc(ex + Math.cos(d) * R * 0.07, -R * 0.2 + Math.sin(d) * R * 0.07, R * 0.08, 0, 7); ctx.fill();
  }
  ctx.strokeStyle = "#240b2e"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-R * 0.7, -R * 0.52); ctx.lineTo(-R * 0.3, -R * 0.36); ctx.moveTo(R * 0.06, -R * 0.52); ctx.lineTo(-R * 0.32, -R * 0.36); ctx.stroke();
  // mouth with teeth, opens when attacking
  const mh = R * (0.1 + 0.26 * boss.mouth); ctx.fillStyle = "#2a0a1c"; ctx.beginPath(); ctx.ellipse(-R * 0.32, R * 0.4, R * 0.42, mh, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fff"; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-R * 0.32 + i * R * 0.15 - 7, R * 0.4 - mh * 0.9); ctx.lineTo(-R * 0.32 + i * R * 0.15, R * 0.4 - mh * 0.9 + 12); ctx.lineTo(-R * 0.32 + i * R * 0.15 + 7, R * 0.4 - mh * 0.9); ctx.fill(); }
  ctx.restore();
}
function drawBossHUD() {
  if (boss.state === "warn") {
    const a = 0.18 + 0.14 * Math.sin(time * 10), g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.75);
    g.addColorStop(0, "rgba(255,0,40,0)"); g.addColorStop(1, "rgba(255,0,40," + a + ")"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (boss.state === "enter" || boss.state === "fight") {
    const f = boss.state === "enter" ? 1 : 1 - boss.t / boss.dur, w = 230, x = (W - w) / 2, y = 130;
    ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(x - 3, y - 3, w + 6, 16);
    ctx.fillStyle = "#ff3d6e"; ctx.fillRect(x, y, w * f, 10);
    ctx.font = "900 12px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = "#fff"; ctx.strokeStyle = "#1a0a30"; ctx.lineWidth = 3;
    const t = "BOSS " + (boss.n + 1) + " · " + BOSSES[boss.n % BOSSES.length][0]; ctx.strokeText(t, W / 2, y + 28); ctx.fillText(t, W / 2, y + 28);
  }
}

/* ---------- Update ---------- */
function collectStar(s) {
  s.got = true; combo++;
  const mult = x2 > 0 ? 2 : 1;
  runStars += mult; save.wallet += mult; runStarsEl.textContent = "⭐ " + runStars; persist();
  sfx.star(combo); burst(s.x, s.y, 8, "#ffe27a");
  if (mult > 1) popup(s.x + 18, s.y - 14, "+2", "#ffe27a");
}
const POWNAME = { shield: "🛡️ KHIÊN!", rainbow: "🌈 SIÊU TỐC!", magnet: "🧲 NAM CHÂM!", x2: "✨ SAO x2!" };
function collectPow(p) {
  p.got = true; sfx.power(); burst(p.x, p.y, 20, null); popup(sprite.x + 20, sprite.y - 36, POWNAME[p.type], "#fff");
  if (p.type === "shield") shield = true;
  if (p.type === "rainbow") { rainbow = 4; inv = Math.max(inv, 0.1); }
  if (p.type === "magnet") magnet = 8;
  if (p.type === "x2") x2 = 8;
}
function hurt() {
  if (rainbow > 0 || inv > 0) return false;
  if (shield) { shield = false; inv = 1.3; sfx.pop(); burst(sprite.x, sprite.y, 20, "#9fe3ff"); sprite.v = -300; popup(sprite.x + 20, sprite.y - 30, "ÚI!", "#9fe3ff"); return false; }
  end(); return true;
}

function update(dt) {
  time += dt;
  const was = rainbow;
  if (rainbow > 0) rainbow = Math.max(0, rainbow - dt);
  if (was > 0 && rainbow === 0) inv = Math.max(inv, 1.2);
  if (magnet > 0) magnet = Math.max(0, magnet - dt);
  if (x2 > 0) x2 = Math.max(0, x2 - dt);
  if (inv > 0) inv = Math.max(0, inv - dt);

  sprite.v += (holding ? -PHYS.up : PHYS.g) * dt;
  sprite.v = Math.max(PHYS.vmin, Math.min(PHYS.vmax, sprite.v));
  sprite.y += sprite.v * dt;
  sprite.rot = Math.max(-0.45, Math.min(1.0, sprite.v / 600));
  sprite.wing = Math.max(0, sprite.wing - dt * 4);
  S.speed = Math.min(235, 140 + score * 2.2) * (rainbow > 0 ? 1.5 : 1);
  S.dist = Math.max(255, 320 - score * 2.5);

  const w = Math.floor(score / 10) % WORLDS.length;
  if (w !== world) { world = w; sfx.world(); banner.text = WORLDS[w].name; banner.t = 3; }
  blendWorld(dt);
  updateWind();

  // trail
  trailT -= dt;
  if (trailT <= 0) {
    trailT = rainbow > 0 ? 0.012 : holding ? 0.025 : 0.07;
    parts.push({ x: sprite.x - 12, y: sprite.y + (Math.random() - 0.5) * 8, vx: -S.speed * 0.7 - Math.random() * 40, vy: (Math.random() - 0.5) * 30, life: 0.45, max: 0.45, s: rainbow > 0 ? 7 : 4, c: rainbow > 0 ? `hsl(${(time * 400) % 360},95%,60%)` : holding ? "#7affea" : "rgba(122,255,234,.55)" });
  }

  if (!boss.state && (!obstacles.length || obstacles[obstacles.length - 1].x < W - S.dist)) addObstacle();
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const p = obstacles[i]; p.x -= S.speed * dt;
    if (p.amp && !p.passed) placePillar(p, p.cy + Math.sin(time * p.freq + p.ph) * p.amp);
    if (!p.passed && p.x + p.w < sprite.x) {
      p.passed = true; sfx.clash(); score++; scoreEl.textContent = score;
      if (score > best) { best = score; try { localStorage.setItem(BEST_KEY, best); } catch (e) {} bestEl.textContent = "BEST: " + best; }
    }
    if (p.passed && p.close < 1) p.close = Math.min(1, p.close + dt * 2.2);
    if (p.x + p.w < -60) obstacles.splice(i, 1);
  }

  // stars
  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i];
    if (s.pl) { s.x = s.pl.x + s.pl.w / 2; s.y = (s.pl.top + s.pl.bottom) / 2; } else s.x -= S.speed * dt;
    if (!s.got) {
      const dx = sprite.x - s.x, dy = sprite.y - s.y, d = Math.hypot(dx, dy);
      if (magnet > 0 && d < 260 && d > 1) { s.pl = null; s.x += dx / d * 600 * dt; s.y += dy / d * 600 * dt; }
      if (d < sprite.r + 27) collectStar(s);
      else if (!s.missed && s.x < sprite.x - 34) { s.missed = true; combo = 0; }
    }
    if (s.got || s.x < -40) stars.splice(i, 1);
  }
  for (let i = pows.length - 1; i >= 0; i--) {
    const p = pows[i]; p.x -= S.speed * dt;
    if (Math.hypot(sprite.x - p.x, sprite.y - p.y) < sprite.r + 22) collectPow(p);
    if (p.got || p.x < -40) pows.splice(i, 1);
  }
  updateHazards(dt);
  updateBoss(dt);
  offset -= S.speed * dt; if (offset < -40) offset += 40;
  stepFX(dt);
  collision();
}

/* ---------- Collision (circle vs rock body + circle vs every spike triangle) ---------- */
function circleRect(cx, cy, r, x, y, w, h) {
  const nx = Math.max(x, Math.min(cx, x + w)), ny = Math.max(y, Math.min(cy, y + h));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}
function circleTri(cx, cy, r, [ax, ay, bx, by, tx, ty]) {
  const s = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
  const d1 = s(cx, cy, ax, ay, bx, by), d2 = s(cx, cy, bx, by, tx, ty), d3 = s(cx, cy, tx, ty, ax, ay);
  const inside = !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  return inside || distSeg(cx, cy, ax, ay, bx, by) < r || distSeg(cx, cy, bx, by, tx, ty) < r || distSeg(cx, cy, tx, ty, ax, ay) < r;
}
function collision() {
  const gy = H - S.ground;
  if (sprite.y + sprite.r >= gy) {
    if (hurt()) return;
    sprite.y = gy - sprite.r; sprite.v = -380;
  }
  if (sprite.y - sprite.r <= 0) { sprite.y = sprite.r; if (sprite.v < 0) sprite.v = 0; }
  if (rainbow > 0 || inv > 0) return;
  const rr = sprite.r * 0.78;
  for (const p of obstacles) {
    if (sprite.x + rr < p.x - S.side - 2 || sprite.x - rr > p.x + p.w + S.side + 2) continue;
    let hit = circleRect(sprite.x, sprite.y, rr, p.x, 0, p.w, p.top) || circleRect(sprite.x, sprite.y, rr, p.x, p.bottom, p.w, H);
    if (!hit) for (const t of p.tris) { if (circleTri(sprite.x, sprite.y, rr, [t[0] + p.x, t[1], t[2] + p.x, t[3], t[4] + p.x, t[5]])) { hit = true; break; } }
    if (hit) { if (hurt()) return; break; }
  }
  for (const h of hazards) if (hazardHit(h, rr)) { if (hurt()) return; break; }
  if (bossHit(rr)) { if (hurt()) return; }
}

/* ---------- Drawing ---------- */
function bg() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, col("sk0")); g.addColorStop(0.6, col("sk1")); g.addColorStop(1, col("sk2"));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (const s of bgStars) {
    ctx.globalAlpha = 0.4 + 0.4 * Math.sin(time * 2 + s.p);
    ctx.fillStyle = "#fff"; ctx.fillRect(s.x * W, s.y * H, s.s, s.s);
  }
  ctx.globalAlpha = 1;
  const mx = W * 0.78, my = H * 0.16;
  const mg = ctx.createRadialGradient(mx, my, 8, mx, my, 70); mg.addColorStop(0, "rgba(255,230,190,.5)"); mg.addColorStop(1, "rgba(255,230,190,0)");
  ctx.fillStyle = mg; ctx.fillRect(mx - 70, my - 70, 140, 140);
  ctx.fillStyle = "#ffe9c4"; ctx.beginPath(); ctx.arc(mx, my, 28, 0, 7); ctx.fill();
  ctx.fillStyle = col("ridge"); ctx.beginPath(); ctx.moveTo(0, H);
  const sh = (-time * 14) % 120;
  for (let x = sh - 120; x <= W + 120; x += 60) { ctx.lineTo(x, H - S.ground - 40 - ((Math.floor((x - sh) / 60) % 3) + 1) * 28); ctx.lineTo(x + 30, H - S.ground - 8); }
  ctx.lineTo(W + 120, H); ctx.fill();
}
function spikeGrad(y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, col("sp0")); g.addColorStop(0.7, col("sp1")); g.addColorStop(1, col("sp2")); return g;
}
function spikePath(t, x) {
  ctx.beginPath(); ctx.moveTo(t[0] + x, t[1]); ctx.lineTo(t[4] + x, t[5]); ctx.lineTo(t[2] + x, t[3]); ctx.closePath();
}
function rockBody(x, y, w, h) {
  if (h <= 0) return;
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, col("rk0")); g.addColorStop(0.4, col("rk1")); g.addColorStop(1, col("rk2"));
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.lineWidth = 2;
  for (let yy = y + 30 - (y % 30); yy < y + h; yy += 30) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w * 0.6, yy + 12); ctx.stroke(); }
  ctx.strokeStyle = "rgba(18,13,34,.9)"; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
}
// After the sprite passes, both rock columns grow into the gap and their spikes interlock.
function drawClosing(p) {
  const e = 1 - Math.pow(1 - p.close, 3), n = S.spikes, sw = p.w / n;
  const mid = (p.top + p.bottom) / 2, topEnd = p.top + (mid - p.top) * e + S.sh * 0.5 * e, botEnd = p.bottom - (p.bottom - mid) * e - S.sh * 0.5 * e;
  rockBody(p.x, p.top - 2, p.w, topEnd - p.top + 2);
  rockBody(p.x, botEnd, p.w, p.bottom - botEnd + 2);
  const spike = (xa, xb, y, tipY) => {
    ctx.beginPath(); ctx.moveTo(p.x + xa, y); ctx.lineTo(p.x + (xa + xb) / 2, tipY); ctx.lineTo(p.x + xb, y); ctx.closePath();
    ctx.fillStyle = spikeGrad(y, tipY); ctx.fill(); ctx.strokeStyle = "#240b2e"; ctx.lineWidth = 2; ctx.stroke();
  };
  const reach = S.sh * (0.6 + 0.9 * e);
  for (let i = 0; i < n; i++) spike(i * sw, (i + 1) * sw, topEnd, topEnd + reach);
  for (let i = 0; i < n; i++) spike(i * sw + sw / 2, (i + 1) * sw + sw / 2 > p.w ? p.w : (i + 1) * sw + sw / 2, botEnd, botEnd - reach);
}
function drawObstacle(p) {
  rockBody(p.x, -4, p.w, p.top + 4);
  rockBody(p.x, p.bottom, p.w, H - p.bottom);
  if (p.close > 0) drawClosing(p);
  for (const t of p.tris) {
    spikePath(t, p.x);
    const g = ctx.createLinearGradient(t[0] + p.x, t[1], t[4] + p.x, t[5]);
    g.addColorStop(0, col("sp0")); g.addColorStop(0.7, col("sp1")); g.addColorStop(1, col("sp2"));
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = "#240b2e"; ctx.lineWidth = 2; ctx.stroke();
  }
}
function starPath(cx, cy, R, rot) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? R * 0.45 : R; ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
  ctx.closePath();
}
function drawStar(s) {
  const bob = Math.sin(time * 4 + s.ph) * 3, R = 14 + Math.sin(time * 6 + s.ph) * 1.2;
  const gl = ctx.createRadialGradient(s.x, s.y + bob, 2, s.x, s.y + bob, 26);
  gl.addColorStop(0, "rgba(255,226,122,.55)"); gl.addColorStop(1, "rgba(255,226,122,0)");
  ctx.fillStyle = gl; ctx.fillRect(s.x - 26, s.y + bob - 26, 52, 52);
  starPath(s.x, s.y + bob, R, Math.sin(time * 2 + s.ph) * 0.25);
  ctx.fillStyle = "#ffd93b"; ctx.fill(); ctx.strokeStyle = "#b8780a"; ctx.lineWidth = 2.5; ctx.lineJoin = "round"; ctx.stroke();
  starPath(s.x - 2, s.y + bob - 2, R * 0.45, 0); ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.fill();
}
const POWICON = { shield: "🛡️", rainbow: "🌈", magnet: "🧲", x2: "✨" }, EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
function drawPow(p) {
  const y = p.y + Math.sin(time * 3 + p.ph) * 5;
  const gl = ctx.createRadialGradient(p.x, y, 4, p.x, y, 38); gl.addColorStop(0, "rgba(255,255,255,.6)"); gl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gl; ctx.fillRect(p.x - 38, y - 38, 76, 76);
  ctx.fillStyle = "rgba(255,255,255,.88)"; ctx.beginPath(); ctx.arc(p.x, y, 22, 0, 7); ctx.fill();
  ctx.strokeStyle = `hsl(${(time * 200) % 360},90%,60%)`; ctx.lineWidth = 3; ctx.stroke();
  ctx.font = "26px " + EMOJI_FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#000";
  ctx.fillText(POWICON[p.type], p.x, y + 2);
}
function spikyBall(r, n, col1, col2) {
  ctx.fillStyle = col2;
  for (let i = 0; i < n; i++) { const a = i * 6.2832 / n; ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(r - 2, -5); ctx.lineTo(r + 9, 0); ctx.lineTo(r - 2, 5); ctx.fill(); ctx.restore(); }
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r); g.addColorStop(0, "#ffd0c0"); g.addColorStop(1, col1);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
}
function drawHazard(h) {
  ctx.save();
  if (h.type === "ball") {
    ctx.translate(h.x, h.y); ctx.rotate(time * 1.5); spikyBall(h.r, 10, "#ff4a3a", "#ffd0c0"); ctx.rotate(-time * 1.5);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-6, -3, 5, 0, 7); ctx.arc(6, -3, 5, 0, 7); ctx.fill();
    ctx.fillStyle = "#220"; ctx.beginPath(); ctx.arc(-5, -2, 2.4, 0, 7); ctx.arc(7, -2, 2.4, 0, 7); ctx.fill();
    ctx.strokeStyle = "#220"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-11, -8); ctx.lineTo(-2, -5); ctx.moveTo(11, -8); ctx.lineTo(2, -5); ctx.stroke();
  } else if (h.type === "spin") {
    ctx.translate(h.x, h.y); ctx.rotate(h.a);
    ctx.strokeStyle = "#ffd45e"; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-h.len, 0); ctx.lineTo(h.len, 0); ctx.stroke();
    ctx.strokeStyle = "#3a1456"; ctx.lineWidth = 2; ctx.stroke();
    for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * h.len, 0); ctx.rotate(time * 4); spikyBall(10, 6, "#ff4a3a", "#ffd0c0"); ctx.restore(); }
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill();
  } else if (h.type === "bat") {
    ctx.font = "34px " + EMOJI_FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#000"; ctx.fillText("🦇", h.x, h.y);
  } else if (h.type === "meteor") {
    if (!h.go) { const k = Math.floor(h.t * 8) % 2; ctx.globalAlpha = k ? 0.4 : 1; ctx.font = "900 34px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#ff3d3d"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 5; ctx.strokeText("!", W - 30, 40); ctx.fillText("!", W - 30, 40); }
    else { ctx.font = "36px " + EMOJI_FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#000"; ctx.fillText("☄️", h.x, h.y); }
  }
  ctx.restore();
}
function drawSprite() {
  const { x, y, r } = sprite, sk = SKINS.find(k => k.id === save.sel) || SKINS[0];
  ctx.save(); ctx.translate(x, y);
  if (inv > 0 && rainbow <= 0 && Math.floor(time * 14) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.rotate(sprite.rot * (sk.e ? 0.6 : 1));
  const pulse = 1 + 0.06 * Math.sin(time * 6);
  const gl = ctx.createRadialGradient(0, 0, 4, 0, 0, r * 2.6 * pulse);
  gl.addColorStop(0, rainbow > 0 ? `hsla(${(time * 400) % 360},95%,65%,.7)` : "rgba(90,255,230,.55)"); gl.addColorStop(1, "rgba(90,255,230,0)");
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, r * 2.6 * pulse, 0, 7); ctx.fill();
  if (sk.e) {
    ctx.rotate(sk.rot || 0);
    ctx.font = Math.round(r * 2.5) + "px " + EMOJI_FONT; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#000";
    ctx.fillText(sk.e, 0, 2);
  } else {
    const fl = sprite.wing * 0.9 + 0.15 * Math.sin(time * 14);
    ctx.fillStyle = "rgba(210,255,250,.85)";
    ctx.save(); ctx.translate(-3, -2); ctx.rotate(-0.6 - fl);
    ctx.beginPath(); ctx.ellipse(-4, -14, 7, 16, -0.3, 0, 7); ctx.fill(); ctx.restore();
    const g = ctx.createRadialGradient(-5, -6, 2, 0, 0, r);
    g.addColorStop(0, "#f2fff9"); g.addColorStop(0.55, "#52f0d2"); g.addColorStop(1, "#1190a8");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.fillStyle = "#7affea"; ctx.beginPath(); ctx.moveTo(-r + 2, -4); ctx.lineTo(-r - 14 - 3 * Math.sin(time * 20), 0); ctx.lineTo(-r + 2, 5); ctx.fill();
    ctx.strokeStyle = "#b9fff1"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(2, -r + 1); ctx.quadraticCurveTo(6, -r - 9, 12, -r - 8); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(12, -r - 8, 3, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(5, -2, 7.5, 0, 7); ctx.fill();
    ctx.fillStyle = "#14243a"; ctx.beginPath(); ctx.arc(7.5, -1.5, 3.6, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(8.5, -3, 1.2, 0, 7); ctx.fill();
    ctx.strokeStyle = "#0b5d70"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(5, 6, 4, 0.2, Math.PI - 0.5); ctx.stroke();
  }
  ctx.restore();
  if (shield && running) {
    ctx.save(); ctx.globalAlpha = 0.75 + 0.15 * Math.sin(time * 8);
    ctx.strokeStyle = "#9fe3ff"; ctx.lineWidth = 3; ctx.fillStyle = "rgba(159,227,255,.2)";
    ctx.beginPath(); ctx.arc(x, y, r * 1.9, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
  }
}
function drawFX() {
  for (const p of parts) { ctx.globalAlpha = Math.max(0, Math.min(1, p.life / (p.max || 1))); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "900 22px Arial";
  for (const p of popups) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5)); ctx.lineWidth = 5; ctx.strokeStyle = "#1a0a30"; ctx.strokeText(p.text, p.x, p.y);
    ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
}
function drawHUD() {
  drawBossHUD();
  // active power-ups, top-left under the star counter
  let y = 66; const items = [];
  if (shield) items.push(["🛡️", 1]);
  if (rainbow > 0) items.push(["🌈", rainbow / 4]);
  if (magnet > 0) items.push(["🧲", magnet / 8]);
  if (x2 > 0) items.push(["✨", x2 / 8]);
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  for (const [ic, f] of items) {
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(14, y - 14, 92, 28);
    ctx.font = "20px " + EMOJI_FONT; ctx.fillStyle = "#000"; ctx.fillText(ic, 18, y + 1);
    ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(46, y - 4, 52, 8);
    ctx.fillStyle = "#5cf5da"; ctx.fillRect(46, y - 4, 52 * f, 8); y += 34;
  }
  if (banner.t > 0) {
    ctx.globalAlpha = Math.min(1, banner.t, (3 - banner.t) * 3 + 0.01); ctx.textAlign = "center"; ctx.font = "900 30px Arial";
    ctx.lineWidth = 6; ctx.strokeStyle = "#1a0a30"; ctx.strokeText(banner.text, W / 2, H * 0.3); ctx.fillStyle = "#fff"; ctx.fillText(banner.text, W / 2, H * 0.3);
    ctx.globalAlpha = 1;
  }
}
function ground() {
  const y = H - S.ground;
  const g = ctx.createLinearGradient(0, y, 0, H); g.addColorStop(0, col("g0")); g.addColorStop(1, col("g1"));
  ctx.fillStyle = g; ctx.fillRect(0, y, W, S.ground);
  ctx.fillStyle = col("gl"); ctx.fillRect(0, y, W, 5);
  ctx.fillStyle = col("gt");
  for (let x = offset - 40; x < W + 40; x += 40) { ctx.beginPath(); ctx.moveTo(x, y + 5); ctx.lineTo(x + 10, y + 16); ctx.lineTo(x + 20, y + 5); ctx.fill(); }
  ctx.globalAlpha = 0.18; ctx.fillStyle = col("gl"); ctx.fillRect(0, y - 10, W, 10); ctx.globalAlpha = 1;
}
function draw() {
  if (!running) stepFX(1 / 60);
  ctx.save();
  if (shake > 0) { ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); shake *= 0.85; if (shake < 0.5) shake = 0; }
  ctx.clearRect(0, 0, W, H); bg();
  for (const p of obstacles) drawObstacle(p);
  for (const h of hazards) drawHazard(h);
  drawBoss();
  for (const s of stars) drawStar(s);
  for (const p of pows) drawPow(p);
  ground();
  if (!gameOver || shake > 0) drawSprite();
  drawFX(); drawHUD();
  ctx.restore();
  if (shake > 0 && !running) requestAnimationFrame(draw);
}
function loop(t) {
  if (!running) { draw(); return; }
  const dt = Math.min((t - last) / 1000, 0.033); last = t;
  update(dt); draw(); requestAnimationFrame(loop);
}

bestEl.textContent = "BEST: " + best;
renderShop();
resize();
// idle animation on the title screen
(function idle(t) { if (!running && !gameOver) { sprite.x = W * 0.5; time = t / 1000; sprite.y = H * 0.12 + Math.sin(time * 3) * 8; sprite.rot = 0; draw(); } requestAnimationFrame(idle); })(0);

// sound on/off button
const soundBtn = $("soundBtn");
const showSound = () => { soundBtn.textContent = muted ? "🔇" : "🔊"; };
soundBtn.addEventListener("pointerdown", e => e.stopPropagation());
soundBtn.onclick = e => {
  e.stopPropagation(); initAudio(); muted = !muted; setMaster(); showSound();
  try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (err) {}
};
showSound();
