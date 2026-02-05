// src/App.jsx (adaptat: adaugă ProfileBar sus)
import React, { useEffect, useMemo, useState } from "react";
import PrizeWheel from "./PrizeWheel";
import Preloader from "./components/Preloader";
import WinModal from "./components/WinModal";
import ProfileBar from "./components/ProfileBar";
import OpenInTelegramModal from "./components/OpenInTelegramModal";
import SubscribeModal from "./components/SubscribeModal";
import { preloadAll } from "./utils/preloadAssets";
import { initTelegramMiniApp, getTg, getInitData, isTelegramMiniApp } from "./telegram";
import { fetchAvailability, fetchHealth, fetchPrizes, spinWheel } from "./utils/api";
import "./styles/App.css";

export default function App() {
  const [ready, setReady] = useState(false);
  const [winPrize, setWinPrize] = useState(null);
  const [winPromoCode, setWinPromoCode] = useState(null);
  const [showOpenInTelegram, setShowOpenInTelegram] = useState(false);
  const isTg = isTelegramMiniApp();

  const [prizes, setPrizes] = useState([]);
  const [prizesLoading, setPrizesLoading] = useState(true);
  const [prizesError, setPrizesError] = useState("");
  const [spinError, setSpinError] = useState("");
  const [spinChannel, setSpinChannel] = useState("");
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [nextEligibleAt, setNextEligibleAt] = useState(null);
  const [cooldownNoticeReady, setCooldownNoticeReady] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const loadingStickerSrc = import.meta.env?.VITE_LOADING_STICKER || "";

  const assets = useMemo(
    () => ({
      images: [],
      audio: [],
    }),
    []
  );

  const cooldownActive = useMemo(() => {
    if (!nextEligibleAt) return false;
    const ts = new Date(nextEligibleAt).getTime();
    return Number.isFinite(ts) && ts > Date.now();
  }, [nextEligibleAt]);

  const cooldownInfo = useMemo(() => {
    if (!cooldownActive) return null;
    const ts = new Date(nextEligibleAt);
    if (Number.isNaN(ts.getTime())) {
      return { title: "Revino mai târziu ⏳", detail: "Cooldown activ." };
    }

    return {
      title: "Revino mai târziu ⏳",
      detail: "Poți încerca din nou la",
      time: ts.toLocaleString("ro-RO", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    };
  }, [cooldownActive, nextEligibleAt]);

  const spinDisabled =
    prizesLoading || prizesError.length > 0 || prizes.length < 2 || cooldownActive;

  const disabledLabel = useMemo(() => {
    if (prizesLoading) return "Se încarcă...";
    if (cooldownActive) return "Revino mai târziu ⏳";
    if (prizes.length < 2) return "Premii indisponibile";
    if (prizesError) return "Indisponibil";
    return "Indisponibil";
  }, [prizesLoading, cooldownActive, prizes.length, prizesError]);

  const handleRetry = () => setReloadToken((value) => value + 1);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setPrizesLoading(true);
      setPrizesError("");
      try {
        const data = await fetchPrizes();
        if (!cancelled) setPrizes(data);
      } catch {
        if (!cancelled) {
          setPrizes([]);
          setPrizesError("Nu am putut încărca premiile.");
        }
      } finally {
        if (!cancelled) setPrizesLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

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

  useEffect(() => {
    if (!isTg) return;
    const initData = getInitData();
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    const authDate = params.get("auth_date");
    console.info("[telegram] initData debug", {
      hasInitData: Boolean(initData),
      length: initData?.length || 0,
      hasHash: Boolean(hash),
      authDate,
    });
  }, [isTg]);

  const handleSpinRequest = async () => {
    setSpinError("");
    setSpinChannel("");
    setShowSubscribe(false);
    setCooldownNoticeReady(false);

    try {
      const initData = getInitData();
      const result = await spinWheel(initData);

      setNextEligibleAt(result?.nextEligibleAt || null);

      const prize = result?.prize || null;
      if (!prize) {
        setSpinError("Răspuns invalid de la server.");
        return null;
      }

      let index = prizes.findIndex((item) => item.id === prize.id);
      if (index === -1 && prize.label) {
        index = prizes.findIndex((item) => item.label === prize.label);
      }

      if (index === -1) {
        setSpinError("Premiul primit nu există în roată.");
        return null;
      }

      return { index, prize, promoCode: result?.promoCode || null };
    } catch (err) {
      const code = err?.code || err?.message || "SERVER_ERROR";
      const channel = err?.channel;
      const nextDate = err?.nextEligibleAt || null;

      if (code === "WEEKLY_LIMIT") setNextEligibleAt(nextDate);

      if (code === "UNAUTHORIZED") {
        setSpinError("Autentificare Telegram invalidă. Redeschide mini-app-ul.");
      } else if (code === "MEMBERSHIP_CHECK_FAILED") {
        setSpinError("Nu am putut verifica abonarea. Încearcă din nou.");
      } else if (code === "NOT_SUBSCRIBED") {
        setSpinChannel(channel || "");
        setShowSubscribe(true);
      } else if (code === "WEEKLY_LIMIT") {
        if (nextDate) {
          const ts = new Date(nextDate);
          if (!Number.isNaN(ts.getTime())) {
            setSpinError(
              `Poți încerca din nou la ${ts.toLocaleString("ro-RO", {
                dateStyle: "medium",
                timeStyle: "short",
              })}.`
            );
          } else {
            setSpinError("Ai atins limita săptămânală.");
          }
        } else {
          setSpinError("Ai atins limita săptămânală.");
        }
      } else if (code === "NO_PRIZES_CONFIGURED") {
        setSpinError("Nu sunt premii configurate.");
      } else {
        setSpinError("Eroare server. Încearcă mai târziu.");
      }

      return null;
    }
  };

  if (!ready) {
    return (
      <Preloader
        title="Roata Premiilor"
        subtitle="Încărcăm resursele… ⏳"
        minDurationMs={0}
        animatedStickerSrc={loadingStickerSrc}
        run={async () => {
          const availabilityTask = async () => {
            if (!isTg) return;
            try {
              initTelegramMiniApp();
              const initData = getInitData();
              const result = await fetchAvailability(initData);
              setNextEligibleAt(result?.nextEligibleAt || null);
              setCooldownNoticeReady(result?.eligible === false);
              if (result?.eligible) setCooldownNoticeReady(false);
            } catch (err) {
              const code = err?.code || err?.message || "SERVER_ERROR";
              const channel = err?.channel;

              if (code === "UNAUTHORIZED") {
                setSpinError("Autentificare Telegram invalidă. Redeschide mini-app-ul.");
              } else if (code === "MEMBERSHIP_CHECK_FAILED") {
                setSpinError("Nu am putut verifica abonarea. Încearcă din nou.");
              } else if (code === "NOT_SUBSCRIBED") {
                setSpinChannel(channel || "");
                setShowSubscribe(true);
              }
            }
          };

          await availabilityTask().catch(() => null);
          await Promise.all([preloadAll(assets), fetchHealth().catch(() => null)]);
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
          {(prizesLoading ||
            prizesError ||
            spinError ||
            (cooldownActive && cooldownNoticeReady)) && (
            <div
              className={`app__notice${
                prizesError || spinError ? " is-error" : ""
              }`}
            >
              {prizesLoading && <div>Încărcăm premiile…</div>}
              {!prizesLoading && prizesError && (
                <div className="app__notice-row">
                  <span>{prizesError}</span>
                  <button type="button" onClick={handleRetry}>
                    Reîncearcă 🔁
                  </button>
                </div>
              )}
              {!prizesLoading && !prizesError && spinError && (
                <div>
                  {spinError}{" "}
                  {spinChannel ? (
                    <a
                      href={`https://t.me/${spinChannel.replace("@", "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {spinChannel}
                    </a>
                  ) : null}
                </div>
              )}
              {!prizesLoading &&
                !prizesError &&
                !spinError &&
                cooldownActive &&
                cooldownNoticeReady &&
                cooldownInfo && (
                  <div className="app__notice-cooldown">
                    <div className="app__notice-title">
                      <span className="app__notice-badge">Pauză ⏳</span>
                      <span>{cooldownInfo.title}</span>
                    </div>
                    {cooldownInfo.time ? (
                      <div className="app__notice-detail">
                        {cooldownInfo.detail}{" "}
                        <span className="app__notice-time">
                          {cooldownInfo.time}
                        </span>
                        .
                      </div>
                    ) : (
                      <div className="app__notice-detail">{cooldownInfo.detail}</div>
                    )}
                  </div>
                )}
            </div>
          )}

          <PrizeWheel
            prizes={prizes}
            isTelegram={isTg}
            onRequireTelegram={() => setShowOpenInTelegram(true)}
            onSpinRequest={handleSpinRequest}
            disabled={spinDisabled}
            loadingLabel="Se încarcă..."
            disabledLabel={disabledLabel}
            onWin={({ prize, promoCode }) => {
              if (prize?.value === 0) {
                try {
                  const tg = getTg();
                  tg?.HapticFeedback?.notificationOccurred?.("warning");
                } catch {}
                return;
              }

              setWinPrize(prize);
              setWinPromoCode(promoCode || null);
              setCooldownNoticeReady(true);

              try {
                const tg = getTg();
                tg?.HapticFeedback?.notificationOccurred?.("success");
              } catch {}
            }}
          />

          <WinModal
            prize={winPrize}
            promoCode={winPromoCode}
            onClose={() => {
              setWinPrize(null);
              setWinPromoCode(null);
            }}
          />
          <SubscribeModal
            open={showSubscribe}
            channel={spinChannel}
            onClose={() => setShowSubscribe(false)}
          />
          <OpenInTelegramModal
            open={showOpenInTelegram}
            onClose={() => setShowOpenInTelegram(false)}
          />
        </div>
      </div>
    </div>
  );
}
