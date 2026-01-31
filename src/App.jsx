// src/App.jsx (adaptat: adaugă ProfileBar sus)
import React, { useEffect, useMemo, useState } from "react";
import PrizeWheel from "./PrizeWheel";
import Preloader from "./components/Preloader";
import WinModal from "./components/WinModal";
import ProfileBar from "./components/ProfileBar";
import OpenInTelegramModal from "./components/OpenInTelegramModal";
import { preloadAll } from "./utils/preloadAssets";
import { initTelegramMiniApp, getTg, isTelegramMiniApp } from "./telegram";
import "./styles/App.css";

export default function App() {
  const [ready, setReady] = useState(false);
  const [winPrize, setWinPrize] = useState(null);
  const [showOpenInTelegram, setShowOpenInTelegram] = useState(false);
  const isTg = isTelegramMiniApp();

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

  const assets = useMemo(
    () => ({
      images: [],
      audio: [],
    }),
    []
  );

  useEffect(() => {
    if (!isTg) return;

    const tg = initTelegramMiniApp();
    if (!tg) return;

    const applyTheme = () => {
      const bg = tg.themeParams?.bg_color || "#0b1220";
      document.body.style.background = bg;
    };

    applyTheme();

    tg.BackButton.show();
    const handleBack = () => {
      if (winPrize) setWinPrize(null);
      else tg.close();
    };

    tg.BackButton.onClick(handleBack);
    tg.onEvent("themeChanged", applyTheme);

    return () => {
      tg.BackButton.offClick(handleBack);
      tg.offEvent("themeChanged", applyTheme);
    };
  }, [winPrize, isTg]);

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
      <div className="app__content">
        {isTg && <ProfileBar />}

        <div className="app__stack">
          <PrizeWheel
            prizes={prizes}
            isTelegram={isTg}
            onRequireTelegram={() => setShowOpenInTelegram(true)}
            onWin={({ prize }) => {
              if (prize?.value === 0) {
                try {
                  const tg = getTg();
                  tg?.HapticFeedback?.notificationOccurred?.("warning");
                } catch {}
                return;
              }

              setWinPrize(prize);

              try {
                const tg = getTg();
                tg?.HapticFeedback?.notificationOccurred?.("success");
              } catch {}
            }}
          />

          <WinModal prize={winPrize} onClose={() => setWinPrize(null)} />
          <OpenInTelegramModal
            open={showOpenInTelegram}
            onClose={() => setShowOpenInTelegram(false)}
          />
        </div>
      </div>
    </div>
  );
}
