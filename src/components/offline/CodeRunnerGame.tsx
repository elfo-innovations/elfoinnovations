import { useCallback, useEffect, useMemo, useRef, useState, Fragment } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Deploy Rush 3D — a real three.js endless runner.
 * A glowing "deploy packet" flies down a neon tunnel, switching lanes and
 * jumping to dodge bugs/firewalls while collecting code-language badges
 * (HTML/CSS/JS/PHP/Laravel/React) and shields.
 * <CodeRunnerGame paused={boolean} /> — self-contained, own HUD.
 */

const LANE_X = [-2, 0, 2];
const PLAYER_Z = 0;
const CAMERA_Z = 6.4;
const TUNNEL_LEN = 140;
const RING_COUNT = 24;
const RING_GAP = TUNNEL_LEN / RING_COUNT;
const POOL_SIZE = 20;
const COLLIDE_RADIUS = 0.85;
const JUMP_DURATION = 0.62;
const JUMP_HEIGHT = 1.9;
const BASE_SPEED = 11;
const MAX_SPEED = 36;
const LEVEL_SCORE_STEP = 100;
const LEVEL_COLORS = ["#2a63ff", "#22d3ee", "#a855f7", "#f472b6", "#f59e0b", "#22c55e"];
const TRAIL_LEN = 10;
const STAR_COUNT = 220;

const LANGS = [
  { name: "HTML", bg: "#e34c26", fg: "#ffffff" },
  { name: "CSS", bg: "#2965f1", fg: "#ffffff" },
  { name: "JS", bg: "#f0db4f", fg: "#1a1a1a" },
  { name: "PHP", bg: "#6779b3", fg: "#ffffff" },
  { name: "Laravel", bg: "#ff2d20", fg: "#ffffff" },
  { name: "React", bg: "#0b1633", fg: "#61dafb" },
] as const;

// Small, single-lane errors — dodge by switching lanes.
const SMALL_ERRORS = ["404", "TypeError", "NullPointer", "SyntaxError", "Undefined"] as const;
// Big, all-lane errors — dodge by jumping.
const BIG_ERRORS = ["500 Server Error", "Build Failed", "Merge Conflict", "Deploy Blocked"] as const;

type ItemType = "none" | "bug" | "barrier" | "token" | "shield";

type PoolItem = {
  type: ItemType;
  lane: number;
  z: number;
  handled: boolean;
  spin: number;
  lang: number;
  errIdx: number;
  /** For "bug" type only: 0 = ground-level (jump OR lane-switch avoids it), 1 = floating high (only lane-switch avoids it — jumping does NOT help). */
  heightVariant: 0 | 1;
};

type Controls = { changeLane: (dir: -1 | 1) => void; jump: () => void };

function makeSound() {
  let ctx: AudioContext | null = null;
  const get = () => {
    if (ctx) return ctx;
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    } catch {
      ctx = null;
    }
    return ctx;
  };
  return (freq: number, dur = 0.1, type: OscillatorType = "square", vol = 0.07, slideTo?: number) => {
    const a = get();
    if (!a) return;
    try {
      const t0 = a.currentTime;
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g);
      g.connect(a.destination);
      o.start(t0);
      o.stop(t0 + dur);
    } catch {
      /* noop */
    }
  };
}

/** Draws a rounded badge with a code-language name onto a canvas, for use as a Sprite texture. */
function makeLangTexture(name: string, bg: string, fg: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const r = 28;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(256, 0, 256, 128, r);
  ctx.arcTo(256, 128, 0, 128, r);
  ctx.arcTo(0, 128, 0, 0, r);
  ctx.arcTo(0, 0, 256, 0, r);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.font = "bold 56px 'Segoe UI', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(name, 128, 68);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/** A soft radial glow, used for the player's trail sprites and the ambient starfield. */
function makeGlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(140,200,255,0.7)");
  g.addColorStop(1, "rgba(140,200,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/** Draws a red "error card" badge (hazard border + warning icon) for a specific error name. */
function makeErrorTexture(label: string, big: boolean): THREE.CanvasTexture {
  const w = big ? 512 : 256;
  const h = 128;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const r = 18;
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#7f1d1d");
  grad.addColorStop(1, "#dc2626");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(w, 0, w, h, r);
  ctx.arcTo(w, h, 0, h, r);
  ctx.arcTo(0, h, 0, 0, r);
  ctx.arcTo(0, 0, w, 0, r);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#fbbf24";
  ctx.setLineDash([14, 8]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${big ? 40 : 36}px 'Segoe UI', system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`⚠ ${label}`, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function Scene({
  paused,
  soundOn,
  onScore,
  onDead,
  onHit,
  onCombo,
  onShield,
  onLevelUp,
  restartToken,
  controlsRef,
}: {
  paused: boolean;
  soundOn: boolean;
  onScore: (n: number) => void;
  onDead: () => void;
  onHit: (fatal: boolean) => void;
  onCombo: (n: number) => void;
  onShield: (has: boolean) => void;
  onLevelUp: (level: number) => void;
  restartToken: number;
  controlsRef: { current: Controls | null };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const playerRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const shieldRingRef = useRef<THREE.Mesh>(null);
  const trailRefs = useRef<(THREE.Sprite | null)[]>([]);
  const trailPositions = useRef(
    Array.from({ length: TRAIL_LEN }, () => ({ x: 0, y: 0.55, z: PLAYER_Z }))
  );
  const starGeoRef = useRef<THREE.BufferGeometry>(null);
  const starPositions = useMemo(() => {
    const arr = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 1.8 + Math.random() * 5.4;
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = 0.3 + Math.random() * 5.5;
      arr[i * 3 + 2] = -Math.random() * 44;
    }
    return arr;
  }, []);
  const glowTexture = useMemo(() => makeGlowTexture(), []);
  const wallLRefs = useRef<THREE.Mesh[]>([]);
  const wallRRefs = useRef<THREE.Mesh[]>([]);

  const ringRefs = useRef<THREE.Mesh[]>([]);
  const ringMatRefs = useRef<THREE.MeshStandardMaterial[]>([]);
  const ringZ = useRef<number[]>(Array.from({ length: RING_COUNT }, (_, i) => -i * RING_GAP));

  const poolRefs = useRef<(THREE.Group | null)[]>([]);
  const pool = useRef<PoolItem[]>([]);

  const langTextures = useMemo(() => LANGS.map((l) => makeLangTexture(l.name, l.bg, l.fg)), []);
  const smallErrorTextures = useMemo(() => SMALL_ERRORS.map((label) => makeErrorTexture(label, false)), []);
  const bigErrorTextures = useMemo(() => BIG_ERRORS.map((label) => makeErrorTexture(label, true)), []);

  const laneRef = useRef(1);
  const targetXRef = useRef(LANE_X[1]);
  const jumpTRef = useRef(0);
  const speedRef = useRef(BASE_SPEED);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const hasShieldRef = useRef(false);
  const deadRef = useRef(false);
  const nextSpawnZRef = useRef(-16);
  const lastEmittedScoreRef = useRef(0);
  const levelRef = useRef(1);
  const pendingClusterZRef = useRef<number | null>(null);
  const pendingClusterLaneRef = useRef<number | null>(null);
  const cameraShakeRef = useRef(0);
  const idleT = useRef(0);
  const soundRef = useRef(soundOn);
  const beep = useMemo(() => makeSound(), []);

  useEffect(() => {
    soundRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    laneRef.current = 1;
    targetXRef.current = LANE_X[1];
    jumpTRef.current = 0;
    speedRef.current = BASE_SPEED;
    scoreRef.current = 0;
    comboRef.current = 0;
    hasShieldRef.current = false;
    deadRef.current = false;
    nextSpawnZRef.current = -16;
    lastEmittedScoreRef.current = 0;
    levelRef.current = 1;
    pendingClusterZRef.current = null;
    pendingClusterLaneRef.current = null;
    trailPositions.current = Array.from({ length: TRAIL_LEN }, () => ({ x: 0, y: 0.55, z: PLAYER_Z }));
    onScore(0);
    onCombo(0);
    onShield(false);
    onLevelUp(1);
    ringMatRefs.current.forEach((mat) => {
      if (mat) {
        mat.color.set(LEVEL_COLORS[0]);
        mat.emissive.set(LEVEL_COLORS[0]);
      }
    });

    pool.current = Array.from({ length: POOL_SIZE }, () => ({
      type: "none" as ItemType,
      lane: 1,
      z: -1000,
      handled: true,
      spin: Math.random() * Math.PI,
      lang: 0,
      errIdx: 0,
      heightVariant: 0 as 0 | 1,
    }));
    ringZ.current = Array.from({ length: RING_COUNT }, (_, i) => -i * RING_GAP);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restartToken]);

  const spawnInto = useCallback((item: PoolItem) => {
    const level = levelRef.current;

    if (pendingClusterZRef.current !== null && pendingClusterLaneRef.current !== null) {
      item.type = "bug";
      item.lane = pendingClusterLaneRef.current;
      item.z = pendingClusterZRef.current;
      item.handled = false;
      item.spin = Math.random() * Math.PI * 2;
      item.errIdx = Math.floor(Math.random() * SMALL_ERRORS.length);
      item.heightVariant = Math.random() < Math.min(0.4, 0.1 + level * 0.02) ? 1 : 0;
      pendingClusterZRef.current = null;
      pendingClusterLaneRef.current = null;
      return;
    }

    const hazardBoost = Math.min(0.22, (level - 1) * 0.025);
    const roll = Math.random();
    let type: ItemType;
    if (roll < 0.14 + hazardBoost) type = "bug";
    else if (roll < 0.22 + hazardBoost * 1.3) type = "barrier";
    else if (roll < 0.28) type = "shield";
    else type = "token";

    item.type = type;
    item.lane = type === "barrier" ? 1 : Math.floor(Math.random() * 3);
    item.z = nextSpawnZRef.current;
    item.handled = false;
    item.spin = Math.random() * Math.PI * 2;
    if (type === "token") item.lang = Math.floor(Math.random() * LANGS.length);
    if (type === "bug") {
      item.errIdx = Math.floor(Math.random() * SMALL_ERRORS.length);
      // Floating "high" errors become more common at higher levels — they can only
      // be dodged by switching lanes (jumping does NOT save you), unlike ground
      // errors which jumping over works fine for. Keeps the game from feeling
      // like you can just spam-jump through everything as it gets faster.
      item.heightVariant = Math.random() < Math.min(0.4, 0.1 + level * 0.02) ? 1 : 0;
    }
    if (type === "barrier") item.errIdx = Math.floor(Math.random() * BIG_ERRORS.length);

    if (type === "bug" && level >= 4 && Math.random() < Math.min(0.35, (level - 3) * 0.08)) {
      const otherLanes = [0, 1, 2].filter((l) => l !== item.lane);
      pendingClusterZRef.current = item.z;
      pendingClusterLaneRef.current = otherLanes[Math.floor(Math.random() * otherLanes.length)];
    }

    const gapMin = Math.max(4.2, 7 - (level - 1) * 0.35);
    const gapMax = Math.max(6.5, 13 - (level - 1) * 0.5);
    nextSpawnZRef.current -= gapMin + Math.random() * (gapMax - gapMin);
  }, []);

  const changeLane = useCallback(
    (dir: -1 | 1) => {
      if (deadRef.current) return;
      const next = Math.min(2, Math.max(0, laneRef.current + dir));
      if (next !== laneRef.current) {
        laneRef.current = next;
        targetXRef.current = LANE_X[next];
        if (soundRef.current) beep(320, 0.05, "triangle", 0.04);
      }
    },
    [beep]
  );

  const doJump = useCallback(() => {
    if (deadRef.current || jumpTRef.current > 0) return;
    jumpTRef.current = 0.0001;
    if (soundRef.current) beep(520, 0.12, "square", 0.06, 720);
  }, [beep]);

  // Expose controls to the outer component (used for touch handling scoped to the game area)
  useEffect(() => {
    controlsRef.current = { changeLane, jump: doJump };
    return () => {
      controlsRef.current = null;
    };
  }, [controlsRef, changeLane, doJump]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") changeLane(-1);
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") changeLane(1);
      else if (e.key === "ArrowUp" || e.key === " " || e.key === "w" || e.key === "W") doJump();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [changeLane, doJump]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    idleT.current += delta;

    if (!deadRef.current && !paused) {
      const newLevel = 1 + Math.floor(scoreRef.current / LEVEL_SCORE_STEP);
      if (newLevel !== levelRef.current) {
        levelRef.current = newLevel;
        onLevelUp(newLevel);
        if (soundRef.current) beep(440, 0.1, "square", 0.06, 880);
        const color = LEVEL_COLORS[(newLevel - 1) % LEVEL_COLORS.length];
        ringMatRefs.current.forEach((mat) => {
          if (mat) {
            mat.color.set(color);
            mat.emissive.set(color);
          }
        });
      }

      const targetSpeed = Math.min(MAX_SPEED, BASE_SPEED + (levelRef.current - 1) * 2.6);
      speedRef.current = THREE.MathUtils.lerp(speedRef.current, targetSpeed, Math.min(1, delta * 2.2));

      for (let i = 0; i < RING_COUNT; i++) {
        ringZ.current[i] += speedRef.current * delta;
        if (ringZ.current[i] > CAMERA_Z + 2) ringZ.current[i] -= TUNNEL_LEN;
        const m = ringRefs.current[i];
        if (m) {
          m.position.z = ringZ.current[i];
          m.rotation.z += delta * 0.15;
        }
        const wl = wallLRefs.current[i];
        const wr = wallRRefs.current[i];
        if (wl) wl.position.z = ringZ.current[i];
        if (wr) wr.position.z = ringZ.current[i];
      }

      if (starGeoRef.current) {
        const posAttr = starGeoRef.current.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        for (let i = 0; i < STAR_COUNT; i++) {
          arr[i * 3 + 2] += speedRef.current * delta * 0.55;
          if (arr[i * 3 + 2] > CAMERA_Z) arr[i * 3 + 2] -= 44;
        }
        posAttr.needsUpdate = true;
      }

      for (let i = 0; i < POOL_SIZE; i++) {
        const item = pool.current[i];
        if (item.type === "none") {
          spawnInto(item);
          continue;
        }
        item.z += speedRef.current * delta;
        item.spin += delta * 2.4;
        if (item.z > CAMERA_Z + 2) {
          item.type = "none";
          continue;
        }

        if (!item.handled && Math.abs(item.z - PLAYER_Z) < COLLIDE_RADIUS) {
          const sameLane = item.lane === laneRef.current;
          const airborne = jumpTRef.current > 0.15 && jumpTRef.current < 0.85;

          if (item.type === "token" && sameLane) {
            item.handled = true;
            comboRef.current = Math.min(8, comboRef.current + 1);
            const gain = 10 * (1 + Math.floor(comboRef.current / 3));
            scoreRef.current += gain;
            onScore(scoreRef.current);
            onCombo(comboRef.current);
            if (soundRef.current) beep(700 + comboRef.current * 30, 0.08, "sine", 0.06);
          } else if (item.type === "shield" && sameLane) {
            item.handled = true;
            hasShieldRef.current = true;
            onShield(true);
            if (soundRef.current) beep(500, 0.16, "sine", 0.07, 900);
          } else if (item.type === "bug" && sameLane && (item.heightVariant === 1 || !airborne)) {
            item.handled = true;
            if (hasShieldRef.current) {
              hasShieldRef.current = false;
              onShield(false);
              comboRef.current = 0;
              onCombo(0);
              cameraShakeRef.current = 0.35;
              onHit(false);
              if (soundRef.current) beep(200, 0.15, "sawtooth", 0.08, 90);
            } else {
              deadRef.current = true;
              onHit(true);
              onDead();
              if (soundRef.current) beep(140, 0.35, "sawtooth", 0.1, 40);
            }
          } else if (item.type === "barrier" && !airborne) {
            item.handled = true;
            if (hasShieldRef.current) {
              hasShieldRef.current = false;
              onShield(false);
              comboRef.current = 0;
              onCombo(0);
              cameraShakeRef.current = 0.35;
              onHit(false);
              if (soundRef.current) beep(200, 0.15, "sawtooth", 0.08, 90);
            } else {
              deadRef.current = true;
              onHit(true);
              onDead();
              if (soundRef.current) beep(140, 0.35, "sawtooth", 0.1, 40);
            }
          }
        }

        const g = poolRefs.current[i];
        if (g) {
          const posY = item.type === "bug" && item.heightVariant === 1 ? 1.55 : 0.55;
          g.position.set(LANE_X[item.lane], posY, item.z);
          g.rotation.y = item.spin;
          g.rotation.x = item.type === "token" ? 0 : item.spin * 0.6;
          const show = item.type !== "none" && !item.handled;
          g.scale.setScalar(show ? 1 : 0);
          const children = g.children as (THREE.Mesh | THREE.Sprite)[];
          const shieldM = children[0];
          if (shieldM) shieldM.visible = item.type === "shield";
          for (let ei = 0; ei < SMALL_ERRORS.length; ei++) {
            const sp = children[1 + ei];
            if (sp) sp.visible = item.type === "bug" && item.errIdx === ei;
          }
          for (let ei = 0; ei < BIG_ERRORS.length; ei++) {
            const sp = children[1 + SMALL_ERRORS.length + ei];
            if (sp) sp.visible = item.type === "barrier" && item.errIdx === ei;
          }
          for (let li = 0; li < LANGS.length; li++) {
            const sprite = children[1 + SMALL_ERRORS.length + BIG_ERRORS.length + li];
            if (sprite) sprite.visible = item.type === "token" && item.lang === li;
          }
        }
      }

      scoreRef.current += delta * 3.5;
      const flooredScore = Math.floor(scoreRef.current);
      if (flooredScore !== lastEmittedScoreRef.current) {
        lastEmittedScoreRef.current = flooredScore;
        onScore(flooredScore);
      }

      if (jumpTRef.current > 0) {
        jumpTRef.current += delta / JUMP_DURATION;
        if (jumpTRef.current >= 1) jumpTRef.current = 0;
      }
    }

    if (playerRef.current) {
      const px = playerRef.current.position.x;
      const nx = THREE.MathUtils.lerp(px, targetXRef.current, Math.min(1, delta * 10));
      const jumpY =
        jumpTRef.current > 0 ? Math.sin(Math.min(1, jumpTRef.current) * Math.PI) * JUMP_HEIGHT : 0;
      const bob = deadRef.current ? 0 : Math.sin(idleT.current * 6) * 0.06;
      playerRef.current.position.x = nx;
      playerRef.current.position.y = 0.55 + jumpY + bob;
      playerRef.current.rotation.z = THREE.MathUtils.lerp(
        playerRef.current.rotation.z,
        (targetXRef.current - nx) * -0.35,
        0.2
      );
      playerRef.current.rotation.y += delta * (deadRef.current ? 0 : 1.4);

      if (glowRef.current) {
        glowRef.current.position.set(nx, playerRef.current.position.y, PLAYER_Z + 0.5);
      }
      if (shieldRingRef.current) {
        shieldRingRef.current.position.set(nx, playerRef.current.position.y, PLAYER_Z);
        shieldRingRef.current.visible = hasShieldRef.current;
        shieldRingRef.current.rotation.z += delta * 2;
      }

      // Comet-tail trail: each segment eases toward the previous segment's position.
      let prevX = playerRef.current.position.x;
      let prevY = playerRef.current.position.y;
      let prevZ = playerRef.current.position.z;
      for (let i = 0; i < TRAIL_LEN; i++) {
        const pos = trailPositions.current[i];
        pos.x = THREE.MathUtils.lerp(pos.x, prevX, 0.5);
        pos.y = THREE.MathUtils.lerp(pos.y, prevY, 0.5);
        pos.z = THREE.MathUtils.lerp(pos.z, prevZ, 0.5);
        const seg = trailRefs.current[i];
        if (seg) {
          seg.position.set(pos.x, pos.y, pos.z);
          const t = 1 - i / TRAIL_LEN;
          const alive = deadRef.current ? 0 : 1;
          seg.scale.setScalar(0.55 * t * alive);
          (seg.material as THREE.SpriteMaterial).opacity = 0.6 * t * alive;
        }
        prevX = pos.x;
        prevY = pos.y;
        prevZ = pos.z;
      }
    }

    // Responsive camera: widen FOV and pull back on narrow/portrait (mobile) viewports
    // so all 3 lanes stay comfortably visible.
    const aspect = state.size.width / state.size.height;
    const speedPulse = Math.min(9, Math.max(0, (speedRef.current - BASE_SPEED) * 0.35));
    let fov = 60 + speedPulse;
    let camZ = CAMERA_Z;
    if (aspect < 0.55) {
      fov = 84 + speedPulse;
      camZ = 8.2;
    } else if (aspect < 0.75) {
      fov = 76 + speedPulse;
      camZ = 7.4;
    } else if (aspect < 1.05) {
      fov = 68 + speedPulse;
      camZ = 6.8;
    }
    const cam = state.camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - fov) > 0.5) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }

    cameraShakeRef.current = Math.max(0, cameraShakeRef.current - delta * 1.6);
    const shake = cameraShakeRef.current;
    cam.position.x = (Math.random() - 0.5) * shake * 0.4;
    cam.position.y = 1.5 + (Math.random() - 0.5) * shake * 0.3;
    cam.position.z = camZ;
    cam.lookAt(0, 0.6, -2);
  });

  return (
    <group ref={groupRef}>
      <color attach="background" args={["#050a24"]} />
      <fog attach="fog" args={["#050a24", 8, 34]} />
      <ambientLight intensity={0.35} color="#5b7bff" />
      <pointLight ref={glowRef} intensity={6} distance={9} color="#4fa8ff" />
      <directionalLight position={[3, 8, 4]} intensity={0.25} color="#8fd1ff" />

      {Array.from({ length: RING_COUNT }).map((_, i) => (
        <Fragment key={i}>
          <mesh
            ref={(m) => {
              if (m) ringRefs.current[i] = m;
            }}
            position={[0, 1.4, ringZ.current[i]]}
          >
            <torusGeometry args={[3.6, 0.03, 8, 24]} />
            <meshStandardMaterial
              ref={(m) => {
                if (m) ringMatRefs.current[i] = m;
              }}
              color="#2a63ff"
              emissive="#2a63ff"
              emissiveIntensity={1.4}
              toneMapped={false}
            />
          </mesh>
          <mesh
            ref={(m) => {
              if (m) wallLRefs.current[i] = m;
            }}
            position={[-3.55, 1.4, ringZ.current[i]]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <planeGeometry args={[RING_GAP * 1.05, 3.4]} />
            <meshStandardMaterial
              color="#0d1c4d"
              emissive="#1c3a8f"
              emissiveIntensity={0.5}
              transparent
              opacity={0.32}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
          <mesh
            ref={(m) => {
              if (m) wallRRefs.current[i] = m;
            }}
            position={[3.55, 1.4, ringZ.current[i]]}
            rotation={[0, -Math.PI / 2, 0]}
          >
            <planeGeometry args={[RING_GAP * 1.05, 3.4]} />
            <meshStandardMaterial
              color="#0d1c4d"
              emissive="#1c3a8f"
              emissiveIntensity={0.5}
              transparent
              opacity={0.32}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </Fragment>
      ))}

      {/* Ambient drifting starfield for depth */}
      <points>
        <bufferGeometry ref={starGeoRef}>
          <bufferAttribute attach="attributes-position" count={STAR_COUNT} array={starPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          map={glowTexture}
          size={0.06}
          sizeAttenuation
          transparent
          depthWrite={false}
          opacity={0.75}
          color="#bcdcff"
          blending={THREE.AdditiveBlending}
        />
      </points>

      <mesh position={[0, -0.55, -TUNNEL_LEN / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, TUNNEL_LEN + 20]} />
        <meshStandardMaterial color="#070d2c" metalness={0.4} roughness={0.6} />
      </mesh>
      {[-1.15, 1.15].map((x) => (
        <mesh key={x} position={[x, -0.53, -TUNNEL_LEN / 2]}>
          <boxGeometry args={[0.04, 0.02, TUNNEL_LEN + 20]} />
          <meshStandardMaterial color="#4fa8ff" emissive="#4fa8ff" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      ))}

      {/* Pool items — each slot pre-renders bug/barrier/shield meshes + 6 language sprites; useFrame toggles visibility */}
      {Array.from({ length: POOL_SIZE }).map((_, i) => (
        <group
          key={i}
          ref={(g) => {
            poolRefs.current[i] = g;
          }}
        >
          <mesh visible={false}>
            <torusGeometry args={[0.32, 0.11, 10, 20]} />
            <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
          {SMALL_ERRORS.map((_, ei) => (
            <sprite key={`sm-${ei}`} visible={false} scale={[1.15, 0.58, 1]}>
              <spriteMaterial map={smallErrorTextures[ei]} transparent depthWrite={false} />
            </sprite>
          ))}
          {BIG_ERRORS.map((_, ei) => (
            <sprite key={`bg-${ei}`} visible={false} scale={[5.6, 1.4, 1]}>
              <spriteMaterial map={bigErrorTextures[ei]} transparent depthWrite={false} />
            </sprite>
          ))}
          {LANGS.map((_, li) => (
            <sprite key={li} visible={false} scale={[0.85, 0.42, 1]}>
              <spriteMaterial map={langTextures[li]} transparent depthWrite={false} />
            </sprite>
          ))}
        </group>
      ))}

      {Array.from({ length: TRAIL_LEN }).map((_, i) => (
        <sprite
          key={i}
          ref={(s) => {
            if (s) trailRefs.current[i] = s;
          }}
          scale={[0.5, 0.5, 1]}
        >
          <spriteMaterial
            map={glowTexture}
            transparent
            depthWrite={false}
            opacity={0}
            color="#7cc4ff"
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}

      <mesh ref={playerRef} position={[0, 0.55, PLAYER_Z]}>
        <icosahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial
          color="#7cc4ff"
          emissive="#4fa8ff"
          emissiveIntensity={1.6}
          metalness={0.3}
          roughness={0.2}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={shieldRingRef} visible={false}>
        <torusGeometry args={[0.62, 0.035, 8, 24]} />
        <meshStandardMaterial color="#c084fc" emissive="#c084fc" emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function CodeRunnerGame({ paused = false }: { paused?: boolean }) {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hasShield, setHasShield] = useState(false);
  const [dead, setDead] = useState(false);
  const [restartToken, setRestartToken] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelToast, setLevelToast] = useState<number | null>(null);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(3);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<Controls | null>(null);

  const [best, setBest] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(localStorage.getItem("elfo-runner-best") || "0");
  });
  const [soundOn, setSoundOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("elfo-runner-sound") !== "0";
  });

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("elfo-runner-sound", soundOn ? "1" : "0");
  }, [soundOn]);

  const handleLevelUp = useCallback((n: number) => {
    setLevel(n);
    if (n > 1) {
      setLevelToast(n);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setLevelToast(null), 1400);
    }
  }, []);

  const handleHit = useCallback((fatal: boolean) => {
    setFlashOpacity(fatal ? 0.6 : 0.32);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashOpacity(0), 40);
  }, []);

  const handleDead = useCallback(() => {
    setDead(true);
    setScore((s) => {
      const rounded = Math.floor(s);
      setBest((b) => {
        const nb = Math.max(b, rounded);
        if (typeof window !== "undefined") localStorage.setItem("elfo-runner-best", String(nb));
        return nb;
      });
      return rounded;
    });
  }, []);

  const restart = useCallback(() => {
    setDead(false);
    setScore(0);
    setCombo(0);
    setHasShield(false);
    setLevel(1);
    setLevelToast(null);
    setFlashOpacity(0);
    setRestartToken((t) => t + 1);
  }, []);

  // 3-2-1-GO countdown, on first mount and every restart — gameplay stays paused until it finishes.
  useEffect(() => {
    setCountdown(3);
    const t1 = setTimeout(() => setCountdown(2), 700);
    const t2 = setTimeout(() => setCountdown(1), 1400);
    const t3 = setTimeout(() => setCountdown(0), 2100);
    const t4 = setTimeout(() => setCountdown(null), 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [restartToken]);

  // Touch controls, scoped to the game container only (so taps on the sound/back
  // buttons don't also get interpreted as a jump/lane-change on mobile).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let touchX = 0;
    let touchY = 0;
    const onStart = (e: TouchEvent) => {
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchX;
      const dy = e.changedTouches[0].clientY - touchY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) controlsRef.current?.changeLane(dx > 0 ? 1 : -1);
      else if (dy < -30) controlsRef.current?.jump();
      else if (Math.abs(dx) < 12 && Math.abs(dy) < 12) controlsRef.current?.jump();
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full touch-none select-none">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.5, CAMERA_Z], fov: 60, near: 0.1, far: 60 }}
        className="rounded-xl"
      >
        <Scene
          paused={paused || dead || countdown !== null}
          soundOn={soundOn}
          onScore={(n) => setScore(n)}
          onDead={handleDead}
          onHit={handleHit}
          onCombo={(n) => setCombo(n)}
          onShield={(has) => setHasShield(has)}
          onLevelUp={handleLevelUp}
          restartToken={restartToken}
          controlsRef={controlsRef}
        />
      </Canvas>

      {/* Permanent cinematic vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{ boxShadow: "inset 0 0 130px 36px rgba(0,0,12,0.55)" }}
      />

      {/* Red danger flash on hit */}
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500 ease-out"
        style={{
          opacity: flashOpacity,
          background: "radial-gradient(circle, transparent 38%, rgba(239,68,68,0.95) 145%)",
        }}
      />

      {/* HUD */}
      <div className="pointer-events-none absolute left-2 top-2 z-20 flex flex-col gap-1 sm:left-3 sm:top-3">
        <div className="flex items-center gap-1.5">
          <div className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur sm:px-3 sm:text-xs">
            Score {Math.floor(score)}
          </div>
          <div className="rounded-full border border-blue-300/30 bg-blue-400/10 px-2 py-1 text-[11px] font-semibold text-blue-200 backdrop-blur sm:px-2.5 sm:text-xs">
            Lv {level}
          </div>
        </div>
        {combo > 1 && (
          <div className="w-fit rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-200 backdrop-blur sm:px-3 sm:py-1 sm:text-[11px]">
            Combo ×{1 + Math.floor(combo / 3)}
          </div>
        )}
        {hasShield && (
          <div className="w-fit rounded-full border border-purple-300/30 bg-purple-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-purple-200 backdrop-blur sm:px-3 sm:py-1 sm:text-[11px]">
            🛡 Shield active
          </div>
        )}
      </div>

      {levelToast !== null && (
        <div className="pointer-events-none absolute inset-x-0 top-12 z-20 flex justify-center sm:top-14">
          <div className="animate-in fade-in zoom-in rounded-full border border-white/20 bg-gradient-to-r from-blue-500/90 to-indigo-500/90 px-4 py-1.5 text-xs font-bold text-white shadow-[0_10px_30px_-6px_rgba(59,130,246,0.8)] duration-300 sm:px-5 sm:text-sm">
            Level {levelToast} · Speed up!
          </div>
        </div>
      )}

      <button
        type="button"
        onTouchEnd={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setSoundOn((s) => !s);
        }}
        aria-label={soundOn ? "Mute sound" : "Unmute sound"}
        title={soundOn ? "Sound: on" : "Sound: off"}
        className="absolute right-2 top-2 z-20 rounded-full border border-white/15 bg-black/40 px-2.5 py-2 text-sm text-white/90 backdrop-blur hover:bg-black/60 sm:right-3 sm:top-3 sm:py-1.5 sm:text-xs"
      >
        {soundOn ? "🔊" : "🔇"}
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-between px-4 text-[10px] text-white/40 sm:hidden">
        <span>← swipe →</span>
        <span>tap / swipe ↑ = jump</span>
      </div>

      {countdown !== null && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/20">
          <div
            key={countdown}
            className="animate-in zoom-in fade-in text-7xl font-black text-white duration-300 sm:text-8xl"
            style={{ textShadow: "0 0 40px rgba(79,168,255,0.9)" }}
          >
            {countdown === 0 ? "GO!" : countdown}
          </div>
        </div>
      )}

      {dead && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2.5 bg-[#050a24]/75 px-4 text-center backdrop-blur-sm">
          <div className="text-xs uppercase tracking-widest text-red-300 sm:text-sm">Deploy failed</div>
          <div className="text-2xl font-bold text-white sm:text-3xl">Score {score} · Best {best}</div>
          <div className="text-xs text-white/50">Reached Level {level}</div>
          <button
            onTouchEnd={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              restart();
            }}
            className="mt-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_40px_-10px_rgba(59,130,246,0.8)] hover:opacity-90"
          >
            Redeploy
          </button>
        </div>
      )}
    </div>
  );
}