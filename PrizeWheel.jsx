import React, { useEffect, useMemo, useRef, useState } from "react";

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Desenează roata pe canvas (segmente + text)
function drawWheel(ctx, prizes, size) {
  const r = size / 2;
  ctx.clearRect(0, 0, size, size);

  const cx = r;
  const cy = r;

  const n = prizes.length;
  const slice = (Math.PI * 2) / n;

  // fundal
  ctx.beginPath();
  ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
  ctx.fillStyle = "#111827";
  ctx.fill();

  ctx.save();
  ctx.translate(cx, cy);

  for (let i = 0; i < n; i++) {
    const start = i * slice;
    const end = start + slice;

    // segment
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r - 10, start, end);
    ctx.closePath();
    ctx.fillStyle = prizes[i].color || (i % 2 ? "#7C3AED" : "#22C55E");
    ctx.fill();

    // border
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // text
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

  // cerc interior
  ctx.beginPath();
  ctx.arc(cx, cy, 42, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fill();

  // „buton” vizual
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

// indice câștigător pentru un unghi final (pointer sus, la -90°)
function getWinnerIndex(finalDeg, count) {
  const norm = ((finalDeg % 360) + 360) % 360;
  const pointerSpaceDeg = (360 - ((norm + 90) % 360)) % 360;
  const slice = 360 / count;
  const idx = Math.floor(pointerSpaceDeg / slice);
  return clamp(idx, 0, count - 1);
}

/**
 * Tick engine (WebAudio) — nu ai nevoie de mp3/wav.
 * Dacă vrei, pot să-ți dau și varianta cu fișier audio (tick.wav).
 */
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

  // „clack” mecanic: burst scurt de noise + filtru
  const tick = (intensity = 1) => {
    const c = ensure();
    const now = c.currentTime;

    const duration = 0.02; // 20ms
    const sampleRate = c.sampleRate;
    const buffer = c.createBuffer(1, Math.floor(sampleRate * duration), sampleRate);
    const data = buffer.getChannelData(0);

    // noise burst cu decay rapid
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
    const vol = 0.06 * intensity; // volum mic
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
  size = 360,
  minTurns = 4,
  maxTurns = 7,
  durationMs = 4500,
  onWin,
  forcedWinnerIndex = null,

  // opțional
  soundEnabled = true,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  // AUDIO
  const audioRef = useRef(null);
  const lastTickStepRef = useRef(null);
  const lastTickTimeRef = useRef(0);

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [lastWin, setLastWin] = useState(null);

  const n = prizes.length;

  // init audio
  useEffect(() => {
    audioRef.current = createTickEngine();
    return () => {
      audioRef.current?.dispose?.();
      audioRef.current = null;
    };
  }, []);

  // desenăm roata când se schimbă prizes/size
  useMemo(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    drawWheel(ctx, prizes, size);
  }, [prizes, size]);

  // cleanup RAF la unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const spin = async () => {
    if (isSpinning || n < 2) return;

    // AUDIO resume trebuie în handler de click
    if (soundEnabled) {
      try {
        await audioRef.current?.resume?.();
      } catch {}
    }

    setIsSpinning(true);
    setLastWin(null);

    const start = performance.now();
    const startRot = rotationDeg;

    // decidem câștigătorul
    const winnerIndex =
      forcedWinnerIndex !== null
        ? clamp(forcedWinnerIndex, 0, n - 1)
        : Math.floor(Math.random() * n);

    const slice = 360 / n;

    // centru segment câștigător în coordonate roată (0° spre dreapta)
    const centerOfWinnerDeg = winnerIndex * slice + slice / 2;

    // ca să fie sub pointer (sus), centrul trebuie să ajungă la -90° (= 270°)
    const targetAngleDeg = 270 - centerOfWinnerDeg;

    const turns =
      Math.floor(minTurns + Math.random() * (maxTurns - minTurns + 1)) * 360;

    const jitter = (Math.random() - 0.5) * (slice * 0.6);

    const finalRot =
      startRot + turns + (targetAngleDeg - (startRot % 360)) + jitter;

    // tick tracking: un „pas” = un segment
    lastTickStepRef.current = Math.floor(startRot / slice);
    lastTickTimeRef.current = performance.now();

    const tickFrame = (now) => {
      const t = clamp((now - start) / durationMs, 0, 1);
      const eased = easeOutCubic(t);
      const cur = startRot + (finalRot - startRot) * eased;

      // TICK-URI
      if (soundEnabled && audioRef.current) {
        const step = Math.floor(cur / slice);
        let lastStep = lastTickStepRef.current ?? step;

        const diff = step - lastStep;

        if (diff !== 0) {
          // throttling minim (evită spam audio dacă FPS mic)
          const nowMs = performance.now();
          const minGap = 18; // ms
          if (nowMs - lastTickTimeRef.current >= minGap) {
            // dacă ai sărit multe segmente, dă max 2 tick-uri
            const capped = Math.min(Math.abs(diff), 2);

            // intensitate: mai tare la început, mai încet la final
            const intensity = 0.65 + (1 - t) * 0.75;

            for (let k = 0; k < capped; k++) audioRef.current.tick(intensity);

            lastTickTimeRef.current = nowMs;
          }

          lastTickStepRef.current = step;
        }
      }

      setRotationDeg(cur);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tickFrame);
      } else {
        const finalDeg = cur;
        const idx = getWinnerIndex(finalDeg, n);
        const prize = prizes[idx];

        setLastWin(prize);
        setIsSpinning(false);
        onWin?.({ index: idx, prize });
      }
    };

    rafRef.current = requestAnimationFrame(tickFrame);
  };

  const wrapperStyle = {
    width: size,
    height: size,
    position: "relative",
    userSelect: "none",
  };

  const wheelStyle = {
    width: size,
    height: size,
    borderRadius: "50%",
    overflow: "hidden",
    transform: `rotate(${rotationDeg}deg)`,
    transition: "transform 0ms",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
  };

  const pointerStyle = {
    position: "absolute",
    top: -6,
    left: "50%",
    transform: "translateX(-50%)",
    width: 0,
    height: 0,
    borderLeft: "8px solid transparent",
    borderRight: "8px solid transparent",
    borderBottom: "1px solid transparent",
    borderTop: "8px solid #FFFFFF",
    filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))",
  };

  return (
    <div style={{ display: "grid", gap: 14, justifyItems: "center" }}>
      <div style={wrapperStyle}>
        <div style={pointerStyle} />
        <div style={wheelStyle}>
          <canvas ref={canvasRef} width={size} height={size} />
        </div>
      </div>

      <button
        onClick={spin}
        disabled={isSpinning}
        style={{
          padding: "10px 16px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.15)",
          background: isSpinning ? "#374151" : "#111827",
          color: "white",
          fontWeight: 800,
          cursor: isSpinning ? "not-allowed" : "pointer",
          width: 160,
        }}
      >
        {isSpinning ? "Spinning..." : "Spin"}
      </button>

      <div style={{ color: "#e5e7eb", fontFamily: "system-ui" }}>
        {lastWin ? (
          <>
            Ai câștigat: <b>{lastWin.label}</b>
          </>
        ) : (
          "Apasă Spin 🎯"
        )}
      </div>
    </div>
  );
}
