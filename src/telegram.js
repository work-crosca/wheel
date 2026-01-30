// src/telegram.js
import WebApp from "@twa-dev/sdk";

export function isTelegramMiniApp() {
  // în browser normal: false
  return typeof window !== "undefined" && !!window.Telegram?.WebApp;
}

export function getTg() {
  try {
    return WebApp;
  } catch {
    return null;
  }
}

export function initTelegramMiniApp() {
  const tg = getTg();
  if (!tg) return null;

  tg.ready();
  tg.expand(); // full-height

  // opțional: confirm la închidere (de obicei NU, ca să fie ca Telegram)
  // tg.enableClosingConfirmation();

  return tg;
}
