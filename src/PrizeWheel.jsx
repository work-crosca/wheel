import React, { useEffect, useRef, useState } from "react";
import "./styles/PrizeWheel.css";

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function drawWheel(ctx, prizes, size) {
  const r = size / 2;
  ctx.clearRect(0, 0, size, size);

  const cx = r;
  const cy = r;

  const n = prizes.length;
  const slice = (Math.PI * 2) / n;

  ctx.beginPath();
  ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
  ctx.fillStyle = "#111827";
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);

  for (let i = 0; i < n; i++) {
    const start = i * slice;
    const end = start + slice;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r - 10, start, end);
    ctx.closePath();
    ctx.fillStyle = prizes[i].color || (i % 2 ? "#7C3AED" : "#22C55E");
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();

    const label = prizes[i].label ?? String(prizes[i]);
    const mid = start + slice / 2;

    ctx.save();
    ctx.rotate(mid);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "white";
    ctx.font = "bold 16px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 6;
    ctx.fillText(label, r - 22, 0);
    ctx.restore();
  }

  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, 42, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 34, 0, Math.PI * 2);
  ctx.fillStyle = "#111827";
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "800 14px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SPIN", cx, cy);
}

function getWinnerIndex(finalDeg, count) {
  const norm = ((finalDeg % 360) + 360) % 360;
  const pointerSpaceDeg = (360 - ((norm + 90) % 360)) % 360;
  const slice = 360 / count;
  const idx = Math.floor(pointerSpaceDeg / slice);
  return clamp(idx, 0, count - 1);
}

function createTickEngine() {
  let ctx = null;

  const ensure = () => {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  };

  const resume = async () => {
    const c = ensure();
    if (c.state !== "running") await c.resume();
  };

  const tick = (intensity = 1) => {
    const c = ensure();
    const now = c.currentTime;

    const duration = 0.02;
    const sampleRate = c.sampleRate;
    const buffer = c.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      const decay = Math.pow(1 - t, 6);
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const src = c.createBufferSource();
    src.buffer = buffer;

    const filter = c.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(700, now);

    const gain = c.createGain();
    const vol = 0.06 * intensity;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(c.destination);

    src.start(now);
    src.stop(now + duration);
  };

  const dispose = async () => {
    if (ctx) {
      await ctx.close();
      ctx = null;
    }
  };

  return { resume, tick, dispose };
}

export default function PrizeWheel({
  prizes = [
    { label: "10 coins", value: 10, color: "#22C55E" },
    { label: "Try again", value: 0, color: "#EF4444" },
    { label: "50 coins", value: 50, color: "#3B82F6" },
    { label: "1 ticket", value: 1, color: "#F59E0B" },
    { label: "100 coins", value: 100, color: "#A855F7" },
    { label: "Mystery", value: "mystery", color: "#06B6D4" },
  ],
  size = null,
  minTurns = 4,
  maxTurns = 7,
  durationMs = 4500,
  onWin,
  forcedWinnerIndex = null,
  soundEnabled = true,
  hapticsEnabled = true, // ✅ nou
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const audioRef = useRef(null);
  const lastTickStepRef = useRef(null);
  const lastTickTimeRef = useRef(0);

  // ✅ throttling separat pt haptic (mai rar ca tick-ul audio)
  const lastHapticMsRef = useRef(0);

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [wheelSize, setWheelSize] = useState(320);

  const n = prizes.length;

  useEffect(() => {
    audioRef.current = createTickEngine();
    return () => {
      audioRef.current?.dispose?.();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (size) {
        setWheelSize(size);
        return;
      }

      const padding = 48;
      const max = 380;
      const min = 240;
      const available = Math.min(window.innerWidth, 520) - padding;
      setWheelSize(clamp(Math.floor(available), min, max));
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const renderSize = Math.max(wheelSize - 20, 0);
    drawWheel(ctx, prizes, renderSize);
  }, [prizes, wheelSize]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const spin = async () => {
    if (isSpinning || n < 2) return;

    if (soundEnabled) {
      try {
        await audioRef.current?.resume?.();
      } catch {}
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    setIsSpinning(true);

    const start = performance.now();
    const startRot = rotationDeg;

    const winnerIndex =
      forcedWinnerIndex !== null
        ? clamp(forcedWinnerIndex, 0, n - 1)
        : Math.floor(Math.random() * n);

    const slice = 360 / n;
    const centerOfWinnerDeg = winnerIndex * slice + slice / 2;
    const targetAngleDeg = 270 - centerOfWinnerDeg;

    const turns =
      Math.floor(minTurns + Math.random() * (maxTurns - minTurns + 1)) * 360;

    const jitter =
      forcedWinnerIndex !== null ? 0 : (Math.random() - 0.5) * (slice * 0.6);

    const finalRot =
      startRot + turns + (targetAngleDeg - (startRot % 360)) + jitter;

    lastTickStepRef.current = Math.floor(startRot / slice);
    lastTickTimeRef.current = performance.now();
    lastHapticMsRef.current = performance.now();

    const tickFrame = (now) => {
      const t = clamp((now - start) / durationMs, 0, 1);
      const eased = easeOutCubic(t);
      const cur = startRot + (finalRot - startRot) * eased;

      if (soundEnabled && audioRef.current) {
        const step = Math.floor(cur / slice);
        const lastStep = lastTickStepRef.current ?? step;
        const diff = step - lastStep;

        if (diff !== 0) {
          const nowMs = performance.now();
          const minGap = 18;

          if (nowMs - lastTickTimeRef.current >= minGap) {
            const capped = Math.min(Math.abs(diff), 2);
            const intensity = 0.65 + (1 - t) * 0.75;

            for (let k = 0; k < capped; k++) audioRef.current.tick(intensity);

            // ✅ haptic mai rar (ex: 90ms)
            if (hapticsEnabled) {
              const hapticGap = 90;
              if (nowMs - lastHapticMsRef.current >= hapticGap) {
                try {
                  const tg = window.Telegram?.WebApp;
                  tg?.HapticFeedback?.impactOccurred?.("light");
                } catch {}
                lastHapticMsRef.current = nowMs;
              }
            }

            lastTickTimeRef.current = nowMs;
          }

          lastTickStepRef.current = step;
        }
      }

      setRotationDeg(cur);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tickFrame);
      } else {
        const idx = getWinnerIndex(cur, n);
        const prize = prizes[idx];

        setRotationDeg(cur);
        setIsSpinning(false);
        onWin?.({ index: idx, prize });

        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tickFrame);
  };

  return (
    <div
      className="prize-wheel"
      style={{
        "--wheel-size": `${wheelSize}px`,
        "--rotation": `${rotationDeg}deg`,
      }}
    >
      <div className="prize-wheel__stage">
        <div className="prize-wheel__pointer" />
        <div className="prize-wheel__wheel">
          <canvas
            ref={canvasRef}
            width={Math.max(wheelSize - 20, 0)}
            height={Math.max(wheelSize - 20, 0)}
          />
        </div>
      </div>

      <button
        onClick={spin}
        disabled={isSpinning}
        className={`prize-wheel__button${isSpinning ? " is-spinning" : ""}`}
      >
        {isSpinning ? "Spinning..." : "Spin"}
      </button>
    </div>
  );
}
