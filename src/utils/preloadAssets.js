export function preloadImages(urls = []) {
  const tasks = urls.map(
    (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ src, ok: true, type: "image" });
        img.onerror = () => resolve({ src, ok: false, type: "image" });
        img.src = src;
      })
  );
  return Promise.all(tasks);
}

export function preloadAudio(urls = []) {
  const tasks = urls.map(
    (src) =>
      new Promise((resolve) => {
        const a = new Audio();
        a.preload = "auto";
        const done = (ok) => resolve({ src, ok, type: "audio" });

        a.addEventListener("canplaythrough", () => done(true), { once: true });
        a.addEventListener("error", () => done(false), { once: true });

        a.src = src;
        // unele browsere au nevoie de load() explicit
        a.load();
      })
  );
  return Promise.all(tasks);
}

export async function preloadAll({ images = [], audio = [] } = {}) {
  const [imgRes, audRes] = await Promise.all([
    preloadImages(images),
    preloadAudio(audio),
  ]);

  const all = [...imgRes, ...audRes];
  const ok = all.filter((x) => x.ok).length;
  return { results: all, okCount: ok, total: all.length };
}
