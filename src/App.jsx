// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import PrizeWheel from "./PrizeWheel";
import Preloader from "./components/Preloader";
import WinModal from "./components/WinModal";
import { preloadAll } from "./utils/preloadAssets";
import { initTelegramMiniApp, getTg, isTelegramMiniApp } from "./telegram";
import "./styles/App.css";

export default function App() {
  const [ready, setReady] = useState(false);
  const [winPrize, setWinPrize] = useState(null);

  const prizes = useMemo(
    () => [
      { label: "10 coins", value: 10, color: "#22C55E" },
      { label: "20 coins", value: 20, color: "#3B82F6" },
      { label: "50 coins", value: 50, color: "#A855F7" },
      { label: "1 ticket", value: 1, color: "#F59E0B" },
      { label: "Try again", value: 0, color: "#EF4444" },
      { label: "Mystery", value: "mystery", color: "#06B6D4" },
    ],
    []
  );

  // Pune aici resursele reale când le ai (din /public).
  // Ex:
  //  - public/img/bg.jpg        => "/img/bg.jpg"
  //  - public/sounds/tick.wav   => "/sounds/tick.wav"
  const assets = useMemo(
    () => ({
      images: [
        // "/img/bg.jpg",
      ],
      audio: [
        // "/sounds/tick.wav",
      ],
    }),
    []
  );

  // ✅ Telegram Mini App init (safe în browser normal)
  useEffect(() => {
    if (!isTelegramMiniApp()) return;

    const tg = initTelegramMiniApp();

    // aplicăm theme Telegram în UI (fallback pe culoarea ta)
    const bg = tg.themeParams?.bg_color || "#0b1220";
    document.body.style.background = bg;

    // BackButton: închide modalul sau mini app
    tg.BackButton.show();

    const handleBack = () => {
      if (winPrize) setWinPrize(null);
      else tg.close();
    };

    tg.BackButton.onClick(handleBack);

    // când se schimbă tema (dark/light) în Telegram
    const handleTheme = () => {
      const nextBg = tg.themeParams?.bg_color || "#0b1220";
      document.body.style.background = nextBg;
    };

    tg.onEvent("themeChanged", handleTheme);

    return () => {
      tg.BackButton.offClick(handleBack);
      tg.offEvent("themeChanged", handleTheme);
    };
  }, [winPrize]);

  // ✅ când se deschide modalul, arătăm/ascundem BackButton (opțional)
  useEffect(() => {
    if (!isTelegramMiniApp()) return;
    const tg = getTg();
    if (!tg) return;

    if (winPrize) tg.BackButton.show();
    else tg.BackButton.show();
  }, [winPrize]);

  if (!ready) {
    return (
      <Preloader
        title="Prize Wheel"
        subtitle="Încărcăm resursele…"
        minDurationMs={900}
        run={async () => {
          await preloadAll(assets);
        }}
        onDone={() => setReady(true)}
      />
    );
  }

  return (
    <div className="app">
      <div style={{ minHeight: "100dvh" }}>
        <PrizeWheel
          prizes={prizes}
          onWin={({ index, prize }) => {
            console.log("WIN:", index, prize);

            // dacă nu vrei confetti la "Try again"
            if (prize?.value === 0) {
              try {
                const tg = getTg();
                tg?.HapticFeedback?.notificationOccurred?.("warning");
              } catch {}
              return;
            }

            setWinPrize(prize);

            // haptic success (Telegram feel)
            try {
              const tg = getTg();
              tg?.HapticFeedback?.notificationOccurred?.("success");
            } catch {}

            // aici: call la backend, update balance, etc.
          }}
        />

        <WinModal
          prize={winPrize}
          onClose={() => {
            setWinPrize(null);
            try {
              const tg = getTg();
              tg?.HapticFeedback?.impactOccurred?.("light");
            } catch {}
          }}
        />
      </div>
    </div>
  );
}
