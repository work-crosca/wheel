// src/components/ProfileBar.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./ProfileBar.css";

const BOT_LINK = "https://t.me/McellWheel_Bot";

function isTelegramMiniApp() {
  return Boolean(window.Telegram?.WebApp?.initDataUnsafe?.user);
}

function initialsFromName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "U";
}

function openBotLink() {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // încearcă să deschidă direct Telegram app pe mobil (best UX)
  if (isMobile) {
    // tg:// resolve pentru bot
    window.location.href = "tg://resolve?domain=McellWheel_Bot";
    // fallback dacă nu se deschide (desktop / fără tg://)
    setTimeout(() => {
      window.open(BOT_LINK, "_blank", "noopener,noreferrer");
    }, 700);
    return;
  }

  // desktop / browser normal
  window.open(BOT_LINK, "_blank", "noopener,noreferrer");
}

export default function ProfileBar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isTelegramMiniApp()) return;

    try {
      const u = window.Telegram?.WebApp?.initDataUnsafe?.user || null;
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  const fullName = useMemo(() => {
    if (!user) return "Guest";
    return [user.first_name, user.last_name].filter(Boolean).join(" ") || "User";
  }, [user]);

  const username = user?.username ? `@${user.username}` : null;
  const photoUrl = user?.photo_url || null;
  const initials = initialsFromName(fullName);

  const showOpenInTG = !isTelegramMiniApp();

  return (
    <div className="profile-bar">
      <div className="profile-bar__left">
        <div className="profile-bar__avatar">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={fullName}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div className="profile-bar__meta">
          <div className="profile-bar__name">{fullName}</div>
          <div className="profile-bar__username">{username || "—"}</div>
        </div>
      </div>

      {showOpenInTG && (
        <button
          type="button"
          className="profile-bar__badge"
          onClick={openBotLink}
          aria-label="Open in Telegram"
          title="Open in Telegram"
        >
          Open in TG
        </button>
      )}
    </div>
  );
}
