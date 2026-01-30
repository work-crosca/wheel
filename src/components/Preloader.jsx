import React from "react";
import { useEffect, useMemo, useState } from "react";

const defaultSteps = [
  { key: "ui", label: "Pregătim interfața…" },
  { key: "assets", label: "Încărcăm resursele…" },
  { key: "ready", label: "Aproape gata…" },
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// mic helper: așteaptă X ms (pentru animație smooth)
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Preloader({
  title = "Se încarcă…",
  subtitle = "Doar o secundă",
  steps = defaultSteps,
  minDurationMs = 700, // ca să nu pâlpâie dacă e prea rapid
  onDone, // callback când e gata
  // dacă vrei să folosești loaderul pentru așteptat un async extern:
  run, // async () => void
}) {
  const [progress, setProgress] = useState(0); // 0..100
  const [activeStep, setActiveStep] = useState(0);
  const [done, setDone] = useState(false);

  const activeLabel = useMemo(() => {
    return steps?.[activeStep]?.label ?? "Se încarcă…";
  }, [steps, activeStep]);

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      // animăm până la 100
      setProgress((p) => (p < 95 ? 95 : p));
      await wait(150);
      if (cancelled) return;
      setProgress(100);
      await wait(200);
      if (cancelled) return;
      setDone(true);
      onDone?.();
    };

    const start = async () => {
      const startedAt = performance.now();

      // progres "fake" controlat ca să fie fluid
      const pump = setInterval(() => {
        setProgress((p) => {
          if (p >= 92) return p;
          return p + Math.max(0.4, (92 - p) * 0.03);
        });
      }, 50);

      try {
        // rulăm pașii
        setActiveStep(0);
        await wait(120);

        setActiveStep(1);
        await wait(120);

        // dacă ai run() — îl așteptăm aici
        if (run) await run();

        setActiveStep(2);

        // respectă minDuration
        const elapsed = performance.now() - startedAt;
        const remaining = clamp(minDurationMs - elapsed, 0, minDurationMs);
        if (remaining) await wait(remaining);

        if (!cancelled) await finish();
      } finally {
        clearInterval(pump);
      }
    };

    start();

    return () => {
      cancelled = true;
    };
  }, [minDurationMs, onDone, run]);

  if (done) return null;

  return (
    <div style={styles.backdrop}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBubble}>
            <div style={styles.logoDot} />
          </div>
          <div>
            <div style={styles.title}>{title}</div>
            <div style={styles.subtitle}>{subtitle}</div>
          </div>
        </div>

        <div style={styles.statusRow}>
          <div style={styles.statusText}>{activeLabel}</div>
          <div style={styles.percent}>{Math.round(progress)}%</div>
        </div>

        <div style={styles.barWrap}>
          <div style={{ ...styles.barFill, width: `${progress}%` }} />
        </div>

        <div style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                ...styles.dot,
                opacity: i === activeStep ? 1 : 0.35,
                transform: i === activeStep ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "radial-gradient(1200px 800px at 50% 30%, #111827, #05070f)",
    display: "grid",
    placeItems: "center",
    zIndex: 9999,
    padding: 18,
  },
  card: {
    width: "min(520px, 100%)",
    borderRadius: 20,
    padding: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 30px 100px rgba(0,0,0,0.45)",
    backdropFilter: "blur(10px)",
    color: "white",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
  },
  header: {
    display: "flex",
    gap: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  logoBubble: {
    width: 44,
    height: 44,
    borderRadius: 16,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)",
    display: "grid",
    placeItems: "center",
  },
  logoDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    background: "white",
    boxShadow: "0 0 0 6px rgba(255,255,255,0.10)",
  },
  title: { fontWeight: 900, fontSize: 16, lineHeight: 1.1 },
  subtitle: { opacity: 0.75, fontSize: 13, marginTop: 3 },
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  statusText: { fontSize: 13, opacity: 0.9 },
  percent: { fontSize: 13, opacity: 0.85, fontWeight: 800 },
  barWrap: {
    height: 12,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    background: "rgba(255,255,255,0.95)",
    transition: "width 120ms linear",
  },
  dotsRow: {
    display: "flex",
    gap: 8,
    marginTop: 12,
    justifyContent: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    background: "white",
    transition: "all 180ms ease",
  },
};
