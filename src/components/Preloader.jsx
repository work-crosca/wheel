import React from "react";
import { useEffect, useMemo, useState } from "react";
import "../styles/Preloader.css";

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
    <div className="preloader" style={{ "--progress": `${progress}%` }}>
      <div className="preloader__card">
        <div className="preloader__header">
          <div className="preloader__logo-bubble">
            <div className="preloader__logo-dot" />
          </div>
          <div>
            <div className="preloader__title">{title}</div>
            <div className="preloader__subtitle">{subtitle}</div>
          </div>
        </div>

        <div className="preloader__status-row">
          <div className="preloader__status-text">{activeLabel}</div>
          <div className="preloader__percent">{Math.round(progress)}%</div>
        </div>

        <div className="preloader__bar">
          <div className="preloader__bar-fill" />
        </div>

        <div className="preloader__dots">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`preloader__dot${
                i === activeStep ? " is-active" : ""
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
