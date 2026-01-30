// src/components/ProfileBar.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getTg, isTelegramMiniApp } from "../telegram";
import "../styles/ProfileBar.css";

function initialsFromName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "U";
}

export default function ProfileBar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!isTelegramMiniApp()) return;

    try {
      const tg = getTg();
      const u = tg?.initDataUnsafe?.user || null;
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

      <div className="profile-bar__badge">TG</div>
    </div>
  );
}
