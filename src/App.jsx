import React, { useMemo, useState } from "react";
import PrizeWheel from "./PrizeWheel";
import Preloader from "./components/Preloader";
import WinModal from "./components/WinModal";
import { preloadAll } from "./utils/preloadAssets";
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
  // Exemplu:
  //  - public/img/bg.jpg  => "/img/bg.jpg"
  //  - public/sounds/tick.wav => "/sounds/tick.wav"
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

            // dacă nu vrei confetti la "Try again", filtrează aici:
            setWinPrize(prize);

            // aici: call la backend, update balance, etc.
          }}
        />

        <WinModal prize={winPrize} onClose={() => setWinPrize(null)} />
      </div>
    </div>
  );
}
