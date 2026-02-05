import React, { useEffect, useState } from "react";
import Confetti from "react-confetti";
import "../styles/WinModal.css";

export default function WinModal({ prize, promoCode, onClose }) {
  const [confettiActive, setConfettiActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  const sharePrize = async () => {
    const label = prize?.label ?? "premiu";
    const prizeText = `Am câștigat ${label}! 🎉`;
    const ctaText = `🎁 Încearcă și tu: https://t.me/McellWheel_Bot`;

    const message = `${prizeText}\n${ctaText}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Roata Premiilor", text: message });
        return;
      } catch {
        // user cancelled or share failed
      }
    }

    try {
      await navigator.clipboard.writeText(message);
    } catch {}
  };

  const copyPromoCode = async () => {
    if (!promoCode?.code) return;
    try {
      await navigator.clipboard.writeText(promoCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  useEffect(() => {
    if (!prize) {
      setConfettiActive(false);
      return;
    }

    setConfettiActive(true);
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
          recycle={true}
        />
      )}
      <div className="win-modal__card" onClick={(e) => e.stopPropagation()}>
        <div className="win-modal__title">🎉 Felicitări!</div>

        <div className="win-modal__prize">
          <div className="win-modal__label">
            Ai câștigat 🎁
            <br />
            premiu {prize.label}
          </div>
          {promoCode?.code && (
            <div className="win-modal__promo">
              <div className="win-modal__promo-label">Cod promo</div>
              <div className="win-modal__promo-row">
                <div className="win-modal__promo-code">{promoCode.code}</div>
                <button
                  type="button"
                  className="win-modal__promo-copy"
                  onClick={copyPromoCode}
                >
                  Copiază 📋
                </button>
                {copied && <span className="win-modal__promo-tooltip">Copiat!</span>}
              </div>
            </div>
          )}
        </div>

        <button onClick={onClose} className="win-modal__button">
          OK
        </button>

        <button onClick={sharePrize} className="win-modal__share">
          Distribuie 📣
        </button>
      </div>
    </div>
  );
}
