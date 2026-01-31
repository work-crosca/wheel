import React from "react";
import "../styles/OpenInTelegramModal.css";

const BOT_LINK = "https://t.me/McellWheel_Bot";
const TG_DEEP_LINK = "tg://resolve?domain=McellWheel_Bot";

function openBotLink() {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    window.location.href = TG_DEEP_LINK;
    setTimeout(() => {
      window.open(BOT_LINK, "_blank", "noopener,noreferrer");
    }, 700);
    return;
  }

  window.open(BOT_LINK, "_blank", "noopener,noreferrer");
}

export default function OpenInTelegramModal({ open, onClose }) {
  if (!open) return null;

  const handleOpen = () => {
    openBotLink();
    onClose?.();
  };

  return (
    <div className="open-tg-modal" onClick={onClose}>
      <div className="open-tg-modal__card" onClick={(e) => e.stopPropagation()}>
        <div className="open-tg-modal__title">Deschide in Telegram</div>
        <div className="open-tg-modal__text">
          Trebuie sa deschizi aplicatia in Telegram ca sa poti invarti roata.
        </div>

        <button type="button" onClick={handleOpen} className="open-tg-modal__button">
          Deschide
        </button>
        <button type="button" onClick={onClose} className="open-tg-modal__cancel">
          Cancel
        </button>
      </div>
    </div>
  );
}
