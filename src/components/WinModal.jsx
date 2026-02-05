import React, { useEffect, useState } from "react";
import Confetti from "react-confetti";
import "../styles/WinModal.css";

export default function WinModal({ prize, promoCode, onClose }) {
  const [confettiActive, setConfettiActive] = useState(false);
  const [size, setSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  const sharePrize = async () => {
    const label = prize?.label ?? "premiu";
    const prizeText = `Am castigat ${label}! 🎉`;
    const ctaText = `🎁 Incearca si tu: https://t.me/McellWheel_Bot`;

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
    if (!prize) {
      setConfettiActive(false);
      return;
    }

    setConfettiActive(true);
    const timeout = setTimeout(() => setConfettiActive(false), 2000);
    return () => clearTimeout(timeout);
  }, [prize]);

  useEffect(() => {
    const handleResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!prize) return null;

  return (
    <div className="win-modal" onClick={onClose}>
      {confettiActive && (
        <Confetti
          width={size.width}
          height={size.height}
          numberOfPieces={220}
          gravity={0.25}
          wind={0.01}
          recycle={false}
        />
      )}
      <div className="win-modal__card" onClick={(e) => e.stopPropagation()}>
        <div className="win-modal__title">🎉 Felicitari!</div>

        <div className="win-modal__prize">
          <div className="win-modal__label">{prize.label}</div>
          {promoCode?.code && (
            <div className="win-modal__promo">
              <div className="win-modal__promo-label">Promo code</div>
              <div className="win-modal__promo-code">{promoCode.code}</div>
            </div>
          )}
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
