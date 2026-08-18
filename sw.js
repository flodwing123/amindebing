/* 啊敏的兵 · Service Worker
   策略：网络优先，失败回退缓存 —— 保证每次更新及时生效，离线也能用 */
const CACHE = "amindebing-v9";
const STATIC = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/style.css",
  "./js/quotes.js",
  "./js/data.js",
  "./js/modules.js",
  "./js/meeting.js",
  "./js/parentmeet.js",
  "./js/modules2.js",
  "./js/grade-analysis.js",
  "./js/discipline.js",
  "./js/leave.js",
  "./js/cloud-sync.js",
  "./js/voice-record.js",
  "./js/sb-config.js",
  "./js/supabase.js",
  "./js/sync.js",
  "./js/vault.js",
  "./js/ideas.js",
  "./js/study.js",
  "./js/monthly.js",
  "./js/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 只缓存本站资源（CDN 的 pptxgenjs 不缓存）
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("./index.html")))
  );
});
