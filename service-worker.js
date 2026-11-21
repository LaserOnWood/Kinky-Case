// Incrémente cette version à chaque mise à jour du shell précaché.
const CACHE_NAME = "kinky-case-v1.5.6";
const CACHE_PREFIX = "kinky-case-";
const APP_BASE_URL = new URL("./", self.registration.scope);

// Tous les chemins sont relatifs au scope du service worker : fonctionne aussi
// lorsque l'application est publiée dans un sous-répertoire.
const APP_SHELL_PATHS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./js/main.js",
  "./js/odds.js",
  "./js/pwa.js",
  "./assets/data/cases.js",
  "./assets/icons/favicon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/img/cases/mystere.webp",
  "./assets/img/cases/royale.webp",
  "./assets/img/cases/sentence.webp",
  "./assets/img/cases/bonusmalus.webp",
  "./assets/img/cases/enfer.webp",
  "./assets/img/cases/angelique.webp",
  "./assets/img/cases/mobilier.webp",
  "./assets/img/cases/tech.webp",
  "./assets/img/cases/boisclassique.webp",
  "./assets/img/cases/mythique.webp",
  "./assets/img/cases/rainbow.webp",
  "./vendor/bootstrap-5.3.3/bootstrap.min.css",
  "./vendor/bootstrap-5.3.3/bootstrap.bundle.min.js"
];
const APP_SHELL = APP_SHELL_PATHS.map((path) => new URL(path, APP_BASE_URL).href);
const INDEX_URL = new URL("./index.html", APP_BASE_URL).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Ne pas intercepter des requêtes externes ni des chemins hors de ce scope.
  if (url.origin !== APP_BASE_URL.origin || !url.pathname.startsWith(APP_BASE_URL.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) {
          try { await cache.put(request, response.clone()); } catch (_) { /* cache best-effort */ }
        }
        return response;
      } catch (_) {
        return (await cache.match(request)) ||
          (await cache.match(INDEX_URL)) ||
          new Response("Cette page n'est pas disponible hors ligne.", {
            status: 503,
            statusText: "Offline",
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
      }
    })());
    return;
  }

  // Ressources : privilégier le cache local, puis mettre en cache toute réponse
  // réseau valide afin de rendre disponibles hors ligne les ressources découvertes.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
      const response = await fetch(request);
      if (response.ok) {
        try { await cache.put(request, response.clone()); } catch (_) { /* cache best-effort */ }
      }
      return response;
    } catch (_) {
      return new Response("Cette ressource n'est pas disponible hors ligne.", {
        status: 503,
        statusText: "Offline",
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
  })());
});
