import React, { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

export default function WinModal({ prize, onClose }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!prize) return;

    if (firedRef.current) return;
    firedRef.current = true;

    const duration = 1200;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 18,
        spread: 70,
        startVelocity: 35,
        gravity: 1.05,
        ticks: 200,
        origin: { x: Math.random() * 0.4 + 0.3, y: 0.12 },
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    };

    frame();

    return () => {
      firedRef.current = false;
    };
  }, [prize]);

  if (!prize) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.title}>🎉 Felicitări!</div>

        <div style={styles.prizeBox}>
          <div style={styles.label}>{prize.label}</div>
        </div>

        <button onClick={onClose} style={styles.button}>
          OK
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "grid",
    placeItems: "center",
    zIndex: 9999,
    padding: 18,
  },
  card: {
    background: "#111827",
    borderRadius: 20,
    padding: "26px 30px",
    minWidth: 300,
    textAlign: "center",
    boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
    color: "white",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
  },
  title: { fontSize: 22, fontWeight: 900, marginBottom: 18 },
  prizeBox: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: "18px 14px",
    marginBottom: 22,
  },
  label: { fontSize: 20, fontWeight: 800 },
  button: {
    padding: "10px 18px",
    borderRadius: 12,
    border: "none",
    background: "#22C55E",
    color: "#052e16",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 15,
    width: "100%",
  },
};
