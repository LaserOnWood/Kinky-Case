// Enregistrement du service worker pour l'installation et le mode hors ligne.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .catch((error) => console.error("Enregistrement PWA impossible :", error));
  });
}
