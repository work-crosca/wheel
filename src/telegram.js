// src/telegram.js
import WebApp from "@twa-dev/sdk";

export function isTelegramMiniApp() {
  if (typeof window === "undefined") return false;

  const tg = window.Telegram?.WebApp;
  if (!tg) return false;

  if (tg?.initDataUnsafe?.user) return true;

  const initData = tg?.initData;
  return typeof initData === "string" && initData.length > 0;
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



