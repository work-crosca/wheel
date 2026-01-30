import React, { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import "../styles/WinModal.css";

export default function WinModal({ prize, onClose }) {
  const firedRef = useRef(false);

  const sharePrize = async () => {
    const label = prize?.label ?? "premiu";
    const prizeText = `Am câștigat ${label}! 🎉`;
    const ctaText = `🎁 Încearcă și tu: https://t.me/McellWheel_Bot`;

    const message = `${prizeText}\n${ctaText}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Prize Wheel", text: message });
        return;
      } catch {
        // user cancelled or share failed
      }
    }

    try {
      await navigator.clipboard.writeText(message);
    } catch {}
  };

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
    <div className="win-modal" onClick={onClose}>
      <div className="win-modal__card" onClick={(e) => e.stopPropagation()}>
        <div className="win-modal__title">🎉 Felicitări!</div>

        <div className="win-modal__prize">
          <div className="win-modal__label">{prize.label}</div>
        </div>

        <button onClick={onClose} className="win-modal__button">
          OK
        </button>

        <button onClick={sharePrize} className="win-modal__share">
          Share
        </button>
      </div>
    </div>
  );
}
