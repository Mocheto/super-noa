import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const require = createRequire("/Users/03558996/.npm/_npx/e41f203b7505f1fb/node_modules/");
const { chromium } = require("playwright");

const [,, distDir, outFile, ...flags] = process.argv;
const opt = Object.fromEntries(flags.map((f) => f.replace(/^--/, "").split("=")));
const PORT = Number(opt.port ?? 4417);
// Servidor estático mínimo de la compilación.
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".json": "application/json" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(distDir, p);
  fs.readFile(file, (err, data) => { if (err) { res.writeHead(404); res.end(); return; } res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" }); res.end(data); });
}).listen(PORT);

const screens = (opt.screens ?? "5-3,10-3,2-3,9-2,casa").split(",");
const viewports = (opt.viewports ?? "375x812,740x340").split(",").map((v) => v.split("x").map(Number));
const rates = (opt.rates ?? "4,6").split(",").map(Number);
const seconds = Number(opt.seconds ?? 12);

// Instrumentación desde fuera: envuelve requestAnimationFrame y mide cada callback (física + dibujo del cuadro)
// y el intervalo entre cuadros; envuelve drawImage/fill para contar llamadas por cuadro.
const init = () => {
  const raf = window.requestAnimationFrame.bind(window);
  const m = window.__medida = { frames: [], work: [], draws: 0, drawsPerFrame: [], on: false, last: 0 };
  const C = CanvasRenderingContext2D.prototype;
  for (const k of ["drawImage", "fill", "fillRect", "stroke", "fillText"]) { const o = C[k]; C[k] = function (...a) { m.draws++; return o.apply(this, a); }; }
  // La pantalla del Mac va a 120 Hz: se agrupan los callbacks y se sirven a 60 Hz, como en un móvil modesto.
  let queue = [], scheduled = false, lastRun = 0, nextId = 0;
  const drive = (t) => {
    scheduled = false;
    if (lastRun && t - lastRun < 12) { schedule(); return; }
    const list = queue; queue = []; if (!list.length) return;
    if (m.on && lastRun) m.frames.push(t - lastRun);
    lastRun = t; m.draws = 0; if (m.on) performance.mark('cuadro');
    const s = performance.now();
    for (const [, cb] of list) { try { cb(t); } catch (e) { setTimeout(() => { throw e; }); } }
    if (m.on) { m.work.push(performance.now() - s); m.drawsPerFrame.push(m.draws); }
  };
  const schedule = () => { if (!scheduled) { scheduled = true; raf(drive); } };
  window.requestAnimationFrame = (cb) => { const id = ++nextId; queue.push([id, cb]); schedule(); return id; };
  window.cancelAnimationFrame = (id) => { queue = queue.filter(([i]) => i !== id); };
  // Progreso con los mundos 1–5 completos: cinco gatitos en la casa.
  const stats = {};
  for (let w = 1; w <= 5; w++) for (let s = 1; s <= 3; s++) stats[`${w}-${s}`] = { completed: true, bestApples: 5 };
  if (!localStorage.getItem("super-noa-progress-v1")) localStorage.setItem("super-noa-progress-v1", JSON.stringify({ version: 2, levelStats: stats }));
};

const stat = (xs) => { const a = [...xs].sort((x, y) => x - y); const q = (p) => a[Math.min(a.length - 1, Math.floor(p * a.length))]; return { n: a.length, mean: a.reduce((s, x) => s + x, 0) / a.length, p50: q(.5), p95: q(.95), p99: q(.99), max: a[a.length - 1] }; };

const browser = await chromium.launch({ executablePath: opt.shell === "1" ? "/Users/03558996/Library/Caches/ms-playwright/chromium_headless_shell-1223/chrome-headless-shell-mac-arm64/chrome-headless-shell" : "/Users/03558996/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing", headless: opt.headed !== "1", args: [...(opt.sw === "1" ? ["--disable-accelerated-2d-canvas"] : []), "--enable-gpu-rasterization", "--ignore-gpu-blocklist", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"] });
const results = [];
for (const [w, h] of viewports) {
  for (const screen of screens) {
    const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: Number(opt.dpr ?? 2), isMobile: true, hasTouch: true });
    await context.addInitScript(init);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await page.goto(`http://127.0.0.1:${PORT}/?prueba=${screen}${screen === "casa" ? "&casaHora=12" : ""}`);
    await page.waitForTimeout(3000);
    if (screen === "casa") { await page.getByRole("button", { name: /SIGUE/ }).click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(2500); }
    await page.getByText(/no ha podido sonar/).click({ timeout: 500 }).catch(() => {});
    if (opt.shots === "1") await page.screenshot({ path: `${outFile}-${screen}-${w}x${h}-a.png` });
    for (const rate of rates) {
      await cdp.send("Emulation.setCPUThrottlingRate", { rate });
      await page.waitForTimeout(1500);
      let profile;
      if (opt.profile === "1" && rate === rates[rates.length - 1]) { await cdp.send("Profiler.enable"); await cdp.send("Profiler.setSamplingInterval", { interval: 200 }); await cdp.send("Profiler.start"); }
      const traceEvents = [];
      if (opt.trace === "1") { cdp.on("Tracing.dataCollected", (e) => traceEvents.push(...e.value)); await cdp.send("Tracing.start", { transferMode: "ReportEvents", traceConfig: { includedCategories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "disabled-by-default-devtools.timeline.frame", "toplevel", "gpu", "viz", "cc", "blink", "v8", "blink.user_timing"] } }); }
      await page.evaluate(() => { const m = window.__medida; m.frames = []; m.work = []; m.drawsPerFrame = []; m.on = true; });
      // Noa avanza a la derecha y salta cada 0,7 s (en la casa, el dedo recorre la habitación).
      const t0 = Date.now();
      if (screen !== "casa") await page.keyboard.down("ArrowRight");
      while (Date.now() - t0 < seconds * 1000) {
        if (screen === "casa") { await page.mouse.move(w * .7, h * .4); await page.mouse.down(); await page.mouse.move(w * .2, h * .4, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(900); }
        else { await page.keyboard.down("Space"); await page.waitForTimeout(350); await page.keyboard.up("Space"); await page.waitForTimeout(350); }
      }
      if (screen !== "casa") await page.keyboard.up("ArrowRight");
      const m = await page.evaluate(() => { const m = window.__medida; m.on = false; return { frames: m.frames, work: m.work, draws: m.drawsPerFrame }; });
      if (opt.profile === "1" && rate === rates[rates.length - 1]) { ({ profile } = await cdp.send("Profiler.stop")); fs.writeFileSync(`${outFile}-${screen}-${w}x${h}-x${rate}.cpuprofile`, JSON.stringify(profile)); }
      if (opt.trace === "1") { const done = new Promise((r) => cdp.once("Tracing.tracingComplete", r)); await cdp.send("Tracing.end"); await done; cdp.removeAllListeners("Tracing.dataCollected"); fs.writeFileSync(`${outFile}-${screen}-${w}x${h}-x${rate}.trace.json`, JSON.stringify(traceEvents)); }
      const lost = m.frames.reduce((s, f) => s + Math.max(0, Math.round(f / (1000 / 60)) - 1), 0);
      const dur = m.frames.reduce((s, f) => s + f, 0) / 1000;
      const r = { screen, viewport: `${w}x${h}`, rate, fps: m.frames.length / dur, interval: stat(m.frames), work: stat(m.work), draws: stat(m.draws), lost, lostPct: 100 * lost / (m.frames.length + lost) };
      results.push(r);
      console.log(`${screen} ${w}x${h} ×${rate}: ${r.fps.toFixed(1)} fps, intervalo p95 ${r.interval.p95.toFixed(1)} ms, trabajo media ${r.work.mean.toFixed(2)} p95 ${r.work.p95.toFixed(2)} ms, llamadas ${r.draws.p50}, perdidos ${lost} (${r.lostPct.toFixed(1)} %)`);
    }
    if (opt.shots === "1") await page.screenshot({ path: `${outFile}-${screen}-${w}x${h}-b.png` });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await context.close();
  }
}
fs.writeFileSync(`${outFile}.json`, JSON.stringify(results, null, 1));
await browser.close(); server.close();
