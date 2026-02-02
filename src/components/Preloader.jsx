import React from "react";
import { useEffect, useMemo, useState } from "react";
import "../styles/Preloader.css";

const defaultSteps = [
  { key: "ui", label: "Pregatim interfata..." },
  { key: "assets", label: "Incarcam resursele..." },
  { key: "ready", label: "Aproape gata..." },
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// mic helper: asteapta X ms (pentru animatie smooth)
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function Preloader({
  title = "Se incarca...",
  subtitle = "Doar o secunda",
  steps = defaultSteps,
  minDurationMs = 0, // 0 = nu simulam timpul
  onDone, // callback cand e gata
  // daca vrei sa folosesti loaderul pentru asteptat un async extern:
  run, // async () => void
}) {
  const [progress, setProgress] = useState(0); // 0..100
  const [activeStep, setActiveStep] = useState(0);
  const [done, setDone] = useState(false);

  const activeLabel = useMemo(() => {
    return steps?.[activeStep]?.label ?? "Se incarca...";
  }, [steps, activeStep]);

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      // animam pana la 100
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

      setActiveStep(0);
      setProgress(12);

      setActiveStep(1);
      setProgress(38);

      // daca ai run() — il asteptam aici
      if (run) await run();

      setActiveStep(2);
      setProgress(82);

      // respecta minDuration
      const elapsed = performance.now() - startedAt;
      const remaining = clamp(minDurationMs - elapsed, 0, minDurationMs);
      if (remaining) await wait(remaining);

      if (!cancelled) await finish();
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
