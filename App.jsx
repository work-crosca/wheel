import React from "react";
import PrizeWheel from "./PrizeWheel";

export default function App() {
  const prizes = [
    { label: "10 coins", value: 10, color: "#22C55E" },
    { label: "20 coins", value: 20, color: "#3B82F6" },
    { label: "50 coins", value: 50, color: "#A855F7" },
    { label: "1 ticket", value: 1, color: "#F59E0B" },
    { label: "Try again", value: 0, color: "#EF4444" },
    { label: "Mystery", value: "mystery", color: "#06B6D4" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0b1220", display: "grid", placeItems: "center" }}>
      <PrizeWheel
        prizes={prizes}
        onWin={({ index, prize }) => {
          console.log("WIN:", index, prize);
          // aici: call la backend, update balance, etc.
        }}
      />
    </div>
  );
}
