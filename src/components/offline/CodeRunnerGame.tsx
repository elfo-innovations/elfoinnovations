import { useEffect, useRef, useState } from "react";

/**
 * Code Runner — Subway-Surfers-style 3-lane endless runner on Canvas.
 * Camera sits behind the runner: we see their back (hoodie + backpack).
 * Tokens and bugs spawn far ahead on the horizon and approach the player.
 * Swipe / Arrow keys to change lanes, Space / Tap / ArrowUp to jump.
 * Optional SFX (WebAudio) and mobile vibration; toggle with the speaker button.
 */
export default function CodeRunnerGame({ paused = false }: { paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("elfo-runner-best") || "0");
  });
  const [dead, setDead] = useState(false);
  const [soundOn, setSoundOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("elfo-runner-sound") !== "0";
  });
  const soundRef = useRef(soundOn);
  const restartRef = useRef<() => void>(() => {});

  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => {
    soundRef.current = soundOn;
    if (typeof window !== "undefined") localStorage.setItem("elfo-runner-sound", soundOn ? "1" : "0");
  }, [soundOn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    // ---- Audio (WebAudio, lazy) --------------------------------------------
    let audio: AudioContext | null = null;
    const getAudio = () => {
      if (!soundRef.current) return null;
      if (audio) return audio;
      try {
        const AC = (window.AudioContext || (window as any).webkitAudioContext);
        if (!AC) return null;
        audio = new AC();
      } catch { audio = null; }
      return audio;
    };
    const beep = (freq: number, dur = 0.1, type: OscillatorType = "square", vol = 0.08, slideTo?: number) => {
      const a = getAudio(); if (!a) return;
      try {
        const t0 = a.currentTime;
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t0);
        if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
        g.gain.setValueAtTime(vol, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g).connect(a.destination);
        o.start(t0); o.stop(t0 + dur + 0.02);
      } catch { /* noop */ }
    };
    const vibrate = (pattern: number | number[]) => {
      if (!soundRef.current) return;
      try { navigator.vibrate?.(pattern); } catch { /* noop */ }
    };
    const sfxJump = () => { beep(520, 0.12, "square", 0.07, 880); vibrate(15); };
    const sfxCoin = () => { beep(880, 0.06, "triangle", 0.09); setTimeout(() => beep(1320, 0.08, "triangle", 0.08), 55); vibrate(10); };
    const sfxHit  = () => { beep(180, 0.28, "sawtooth", 0.12, 60); vibrate([40, 30, 80]); };

    const resize = () => {
      const parent = canvas.parentElement!;
      W = Math.max(320, parent.clientWidth || canvas.clientWidth || 320);
      H = Math.max(320, parent.clientHeight || canvas.clientHeight || 360);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // ---- Perspective helpers -----------------------------------------------
    const LANES = 3;
    const horizonY = () => H * 0.28;
    const nearY = () => H * 0.94;
    const roadNearHalfWidth = () => Math.min(W * 0.48, 260);
    const roadFarHalfWidth = () => Math.min(W * 0.06, 32);

    // z in [0..1], 0 = near (bottom, at player), 1 = far (horizon)
    const project = (laneIdx: number, z: number) => {
      const t = Math.max(0, Math.min(1, z));
      const y = nearY() + (horizonY() - nearY()) * t;
      const halfW = roadNearHalfWidth() + (roadFarHalfWidth() - roadNearHalfWidth()) * t;
      const laneOffset = (laneIdx / (LANES / 2)) * halfW * 0.66;
      const x = W / 2 + laneOffset;
      const scale = 1 - t * 0.85;
      return { x, y, scale };
    };

    // ---- Game state --------------------------------------------------------
    const CODE_TOKENS = ["</>", "{ }", "AI", "☁", "◆", "λ", "npm"];
    const OBSTACLE_KIND = ["bug", "firewall", "error"] as const;
    type ObKind = typeof OBSTACLE_KIND[number];

    let lane = 0;
    let laneVis = 0;
    let playerY = 0;
    let playerVY = 0;
    const gravity = 2600;
    const jumpV = -880;
    let onGround = true;

    let speed = 0.55;
    let dist = 0;
    let scoreLocal = 0;

    type Item = { lane: number; z: number; kind: "coin" | "ob"; g?: string; ok?: ObKind };
    let items: Item[] = [];
    let spawnTimer = 0;

    let roadScroll = 0;

    const stars = Array.from({ length: 70 }, () => ({
      x: Math.random() * W, y: Math.random() * horizonY(), s: Math.random() * 1.6 + 0.3, z: Math.random() * 0.5 + 0.3,
    }));

    let alive = true;
    let raf = 0;
    let last = performance.now();
    let localPaused = false;
    let runPhase = 0;

    const jump = () => {
      if (!alive) { restart(); return; }
      if (onGround) { playerVY = jumpV; onGround = false; sfxJump(); }
    };
    const moveLane = (dir: -1 | 1) => {
      if (!alive) return;
      const nl = Math.max(-1, Math.min(1, lane + dir));
      if (nl !== lane) { lane = nl; vibrate(8); }
    };

    const restart = () => {
      speed = 0.55; dist = 0; scoreLocal = 0;
      items = []; spawnTimer = 0;
      lane = 0; laneVis = 0;
      playerY = 0; playerVY = 0; onGround = true;
      alive = true; setDead(false); setScore(0);
      last = performance.now();
    };
    restartRef.current = restart;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") { e.preventDefault(); jump(); }
      else if (e.code === "ArrowLeft" || e.code === "KeyA") { e.preventDefault(); moveLane(-1); }
      else if (e.code === "ArrowRight" || e.code === "KeyD") { e.preventDefault(); moveLane(1); }
    };
    window.addEventListener("keydown", onKey);

    let touchStartX = 0, touchStartY = 0, touchStartT = 0;
    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      touchStartX = t.clientX; touchStartY = t.clientY; touchStartT = performance.now();
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (Math.max(adx, ady) < 24 && performance.now() - touchStartT < 350) { jump(); return; }
      if (adx > ady) moveLane(dx > 0 ? 1 : -1);
      else if (dy < 0) jump();
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });
    const onClick = () => jump();
    canvas.addEventListener("click", onClick);

    // ---- Loop --------------------------------------------------------------
    const draw = (t: number) => {
      const dt = Math.min(0.033, (t - last) / 1000);
      last = t;
      if (!localPaused && !pausedRef.current && alive) update(dt);
      render();
      raf = requestAnimationFrame(draw);
    };

    const update = (dt: number) => {
      dist += speed * dt * 100;
      speed = Math.min(1.4, speed + 0.02 * dt);
      scoreLocal = Math.floor(dist);

      laneVis += (lane - laneVis) * Math.min(1, dt * 14);
      playerVY += gravity * dt;
      playerY -= playerVY * dt;
      if (playerY <= 0) { playerY = 0; playerVY = 0; onGround = true; }

      roadScroll = (roadScroll + speed * 600 * dt) % 60;
      runPhase += dt * (6 + speed * 4);

      for (const it of items) it.z -= speed * dt;
      items = items.filter((it) => it.z > -0.05);

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        const laneChoices: number[] = [-1, 0, 1].sort(() => Math.random() - 0.5);
        const count = Math.random() < 0.6 ? 1 : 2;
        for (let i = 0; i < count; i++) {
          const ln = laneChoices[i];
          if (Math.random() < 0.55) {
            items.push({ lane: ln, z: 1, kind: "coin", g: CODE_TOKENS[Math.floor(Math.random() * CODE_TOKENS.length)] });
          } else {
            items.push({ lane: ln, z: 1, kind: "ob", ok: OBSTACLE_KIND[Math.floor(Math.random() * OBSTACLE_KIND.length)] });
          }
        }
        spawnTimer = Math.max(0.35, 0.9 - (speed - 0.55) * 0.4) + Math.random() * 0.25;
      }

      for (const it of items) {
        if (it.z < 0.02 || it.z > 0.16) continue;
        if (it.lane !== lane) continue;
        if (it.kind === "coin") {
          it.z = -1;
          scoreLocal += 25;
          sfxCoin();
        } else if (it.kind === "ob") {
          if (playerY < 40) {
            alive = false;
            sfxHit();
            setDead(true);
            const b = Math.max(best, scoreLocal);
            setBest(b);
            localStorage.setItem("elfo-runner-best", String(b));
            setScore(scoreLocal);
            return;
          }
        }
      }
      items = items.filter((it) => it.z > -0.05);

      for (const s of stars) {
        s.x -= speed * 20 * dt * s.z;
        if (s.x < 0) { s.x = W; s.y = Math.random() * horizonY(); }
      }

      setScore(scoreLocal);
    };

    // ---- Render ------------------------------------------------------------
    const drawSky = () => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#050a24");
      g.addColorStop(0.55, "#0a1330");
      g.addColorStop(1, "#0b1a3a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      for (const s of stars) {
        ctx.globalAlpha = 0.4 + s.z * 0.6;
        ctx.fillStyle = "#7cc4ff";
        ctx.fillRect(s.x, s.y, s.s, s.s);
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = "rgba(15,26,66,0.9)";
      const hy = horizonY();
      let x = 0;
      while (x < W) {
        const bw = 20 + ((x * 13) % 40);
        const bh = 20 + ((x * 7) % 50);
        ctx.fillRect(x, hy - bh, bw, bh);
        x += bw + 4;
      }

      const rg = ctx.createRadialGradient(W / 2, hy, 4, W / 2, hy, Math.max(W, H) * 0.6);
      rg.addColorStop(0, "rgba(96,165,250,0.35)");
      rg.addColorStop(1, "rgba(96,165,250,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    };

    const drawRoad = () => {
      const nearHalf = roadNearHalfWidth();
      const farHalf = roadFarHalfWidth();
      const cx = W / 2;
      const ny = nearY();
      const hy = horizonY();

      ctx.beginPath();
      ctx.moveTo(cx - nearHalf, ny);
      ctx.lineTo(cx + nearHalf, ny);
      ctx.lineTo(cx + farHalf, hy);
      ctx.lineTo(cx - farHalf, hy);
      ctx.closePath();
      const rg = ctx.createLinearGradient(0, hy, 0, ny);
      rg.addColorStop(0, "#0a1a3f");
      rg.addColorStop(1, "#0f2a63");
      ctx.fillStyle = rg;
      ctx.fill();

      ctx.strokeStyle = "rgba(124,196,255,0.85)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#60a5fa"; ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(cx - nearHalf, ny); ctx.lineTo(cx - farHalf, hy);
      ctx.moveTo(cx + nearHalf, ny); ctx.lineTo(cx + farHalf, hy);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = "rgba(180,215,255,0.55)";
      ctx.lineWidth = 2;
      for (const laneEdge of [-1 / 3, 1 / 3]) {
        for (let i = 0; i < 14; i++) {
          const z1 = ((i * 60) - roadScroll) / (ny - hy);
          const z2 = z1 + 0.035;
          if (z1 < 0 || z2 > 1) continue;
          const t1 = 1 - z1;
          const t2 = 1 - z2;
          const halfW1 = nearHalf + (farHalf - nearHalf) * t1;
          const halfW2 = nearHalf + (farHalf - nearHalf) * t2;
          const x1 = cx + laneEdge * halfW1 * 2 * 0.5;
          const x2 = cx + laneEdge * halfW2 * 2 * 0.5;
          const y1 = ny + (hy - ny) * t1;
          const y2 = ny + (hy - ny) * t2;
          ctx.beginPath();
          ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    };

    const drawItem = (it: Item) => {
      const p = project(it.lane, 1 - it.z);
      const size = 44 * p.scale;
      if (it.kind === "coin") {
        ctx.shadowColor = "#60a5fa"; ctx.shadowBlur = 18 * p.scale;
        ctx.fillStyle = "#7cc4ff";
        ctx.beginPath(); ctx.arc(p.x, p.y - size * 0.5, size * 0.36, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#03122b";
        ctx.font = `bold ${Math.max(9, size * 0.32)}px ui-monospace, monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(it.g || "</>", p.x, p.y - size * 0.5 + 1);
      } else {
        ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 16 * p.scale;
        const w = size * 1.1, h = size * 0.9;
        const grd = ctx.createLinearGradient(p.x - w / 2, p.y - h, p.x + w / 2, p.y);
        grd.addColorStop(0, "#7f1d1d");
        grd.addColorStop(1, "#ef4444");
        ctx.fillStyle = grd;
        roundRect(ctx, p.x - w / 2, p.y - h, w, h, 6 * p.scale);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(10, size * 0.34)}px system-ui`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const glyph = it.ok === "bug" ? "🐛" : it.ok === "firewall" ? "🔥" : "!";
        ctx.fillText(glyph, p.x, p.y - h * 0.55);
      }
    };

    // Back-view runner: hoodie hood + backpack, so it clearly reads as
    // running AWAY from the camera (into the screen), Subway-Surfers-style.
    const drawPlayer = () => {
      const p = project(laneVis, 0.02);
      const cx = p.x;
      const baseY = p.y - playerY;

      // Shadow
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.beginPath();
      ctx.ellipse(cx, p.y + 2, 30, 8 - Math.min(6, playerY / 40), 0, 0, Math.PI * 2);
      ctx.fill();

      // Legs (running cycle) — visible below hoodie
      const swing = Math.sin(runPhase) * 8;
      ctx.strokeStyle = "#0b1330"; ctx.lineWidth = 7; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - 7, baseY - 22);
      ctx.lineTo(cx - 7 + swing, baseY);
      ctx.moveTo(cx + 7, baseY - 22);
      ctx.lineTo(cx + 7 - swing, baseY);
      ctx.stroke();
      // Shoes
      ctx.fillStyle = "#e5e7eb";
      ctx.fillRect(cx - 12 + swing, baseY - 3, 12, 4);
      ctx.fillRect(cx + swing * -1, baseY - 3, 12, 4);

      // Hoodie body (back view — no face, wider shoulders)
      ctx.shadowColor = "#3b82f6"; ctx.shadowBlur = 20;
      const bodyGrad = ctx.createLinearGradient(cx - 24, baseY - 62, cx + 24, baseY - 20);
      bodyGrad.addColorStop(0, "#60a5fa");
      bodyGrad.addColorStop(1, "#1d4ed8");
      ctx.fillStyle = bodyGrad;
      roundRect(ctx, cx - 22, baseY - 58, 44, 44, 10);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Backpack (center, on back)
      const bp = ctx.createLinearGradient(cx - 14, baseY - 52, cx + 14, baseY - 22);
      bp.addColorStop(0, "#0f172a");
      bp.addColorStop(1, "#1e293b");
      ctx.fillStyle = bp;
      roundRect(ctx, cx - 14, baseY - 52, 28, 30, 6);
      ctx.fill();
      // Backpack straps peeking on shoulders
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(cx - 18, baseY - 56, 5, 10);
      ctx.fillRect(cx + 13, baseY - 56, 5, 10);
      // Reflector strip
      ctx.fillStyle = "#7cc4ff";
      ctx.fillRect(cx - 12, baseY - 36, 24, 2);
      // Elfo badge on backpack (facing camera, since we see the back)
      ctx.fillStyle = "#7cc4ff";
      ctx.font = "bold 10px ui-monospace, monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("</>", cx, baseY - 40);

      // Arms swinging at sides (behind pack silhouette)
      ctx.strokeStyle = "#1e3a8a"; ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx - 20, baseY - 44);
      ctx.lineTo(cx - 26 - swing * 0.4, baseY - 26);
      ctx.moveTo(cx + 20, baseY - 44);
      ctx.lineTo(cx + 26 + swing * 0.4, baseY - 26);
      ctx.stroke();

      // Hooded head (back of head — dark hood, no face)
      const hoodGrad = ctx.createLinearGradient(cx - 14, baseY - 82, cx + 14, baseY - 56);
      hoodGrad.addColorStop(0, "#2563eb");
      hoodGrad.addColorStop(1, "#1e40af");
      ctx.fillStyle = hoodGrad;
      ctx.beginPath();
      ctx.ellipse(cx, baseY - 68, 15, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      // Hood rim shadow
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(cx, baseY - 60, 15, 4, 0, 0, Math.PI);
      ctx.fill();
    };

    const drawHUD = () => {
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.font = "600 13px ui-monospace, monospace";
      ctx.fillStyle = "rgba(230,236,255,0.9)";
      ctx.fillText(`SCORE  ${scoreLocal}`, 14, 12);
      ctx.fillText(`BEST   ${Math.max(best, scoreLocal)}`, 14, 30);
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(124,196,255,0.85)";
      ctx.fillText("ELFO • CODE RUNNER", W - 14, 12);
      ctx.font = "500 11px system-ui";
      ctx.fillStyle = "rgba(230,236,255,0.55)";
      ctx.fillText("← → swipe · ↑/Space jump", W - 14, 30);
    };

    const render = () => {
      drawSky();
      drawRoad();
      const sorted = [...items].sort((a, b) => b.z - a.z);
      for (const it of sorted) drawItem(it);
      drawPlayer();
      drawHUD();

      if (!alive) {
        ctx.fillStyle = "rgba(5,10,36,0.72)";
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.font = "700 28px system-ui";
        ctx.fillText("Build failed 💥", W / 2, H / 2 - 20);
        ctx.font = "500 14px system-ui";
        ctx.fillStyle = "rgba(230,236,255,0.85)";
        ctx.fillText("Tap / Space to redeploy", W / 2, H / 2 + 14);
      } else if (pausedRef.current) {
        ctx.fillStyle = "rgba(5,10,36,0.58)";
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillStyle = "#d1fae5";
        ctx.font = "700 24px system-ui";
        ctx.fillText("Connection Restored ✅", W / 2, H / 2 - 8);
        ctx.font = "500 13px system-ui";
        ctx.fillStyle = "rgba(230,236,255,0.78)";
        ctx.fillText("Choose continue or keep playing above.", W / 2, H / 2 + 24);
      }
    };

    raf = requestAnimationFrame(draw);
    const vis = () => { localPaused = document.hidden; last = performance.now(); };
    document.addEventListener("visibilitychange", vis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKey);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", vis);
      try { audio?.close(); } catch { /* noop */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="block w-full h-full rounded-xl touch-none select-none" aria-label="Code Runner game" />

      {/* Sound toggle */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setSoundOn((s) => !s); }}
        aria-label={soundOn ? "Mute sound" : "Unmute sound"}
        title={soundOn ? "Sound & vibration: on" : "Sound & vibration: off"}
        className="absolute right-3 top-3 z-10 rounded-full border border-white/15 bg-black/40 px-2.5 py-1.5 text-xs text-white/90 backdrop-blur hover:bg-black/60"
      >
        {soundOn ? "🔊" : "🔇"}
      </button>

      {/* Mobile control hints */}
      <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-between px-6 text-white/40 text-xs sm:hidden">
        <span>← swipe</span>
        <span>tap = jump</span>
        <span>swipe →</span>
      </div>

      {dead && (
        <button
          onClick={() => restartRef.current()}
          className="absolute left-1/2 bottom-4 -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-lg hover:opacity-90"
        >
          Redeploy · Score {score} · Best {best}
        </button>
      )}
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
