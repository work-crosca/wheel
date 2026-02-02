import React from "react";
import { getTg } from "../telegram";
import "../styles/WinModal.css";

function openChannelLink(channel) {
  if (!channel) return;
  const clean = channel.replace("@", "");
  const tg = getTg();
  const webLink = `https://t.me/${clean}`;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (tg?.openTelegramLink) {
    tg.openTelegramLink(webLink);
    return;
  }

  if (isMobile) {
    window.location.href = `tg://resolve?domain=${clean}`;
    setTimeout(() => {
      window.open(webLink, "_blank", "noopener,noreferrer");
    }, 700);
    return;
  }

  window.open(webLink, "_blank", "noopener,noreferrer");
}

export default function SubscribeModal({ open, channel, onClose }) {
  if (!open) return null;

  const handleSubscribe = () => {
    openChannelLink(channel);
    onClose?.();
  };

  return (
    <div className="win-modal" onClick={onClose}>
      <div className="win-modal__card" onClick={(e) => e.stopPropagation()}>
        <div className="win-modal__title">Abonare necesara</div>

        <div className="win-modal__prize">
          <div className="win-modal__label">
            Trebuie sa fii abonat la {channel || "canal"}.
          </div>
        </div>

        <button onClick={handleSubscribe} className="win-modal__button">
          Aboneaza-te
        </button>

        <button onClick={onClose} className="win-modal__share">
          Cancel
        </button>
      </div>
    </div>
  );
}
