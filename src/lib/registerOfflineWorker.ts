/**
 * Registrazione del service worker usato per la modalità offline in aula.
 *
 * Attivo SOLO nell'app pubblicata: mai in sviluppo, mai nelle anteprime
 * Lovable, mai dentro un iframe. Con `?sw=off` la registrazione viene
 * rimossa (via di fuga in caso di contenuti bloccati).
 */

const SW_URL = "/sw.js";

const isPreviewHost = (host: string) =>
  host.startsWith("id-preview--") ||
  host.startsWith("preview--") ||
  host === "lovableproject.com" ||
  host.endsWith(".lovableproject.com") ||
  host === "lovableproject-dev.com" ||
  host.endsWith(".lovableproject-dev.com") ||
  host === "beta.lovable.dev" ||
  host.endsWith(".beta.lovable.dev");

const refused = () => {
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  if (isPreviewHost(window.location.hostname)) return true;
  return new URLSearchParams(window.location.search).get("sw") === "off";
};

const unregisterAll = async () => {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => (r.active ?? r.waiting ?? r.installing)?.scriptURL.endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
};

export const registerOfflineWorker = () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  if (refused()) {
    void unregisterAll();
    return;
  }

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(SW_URL).catch(() => {
      /* offline o non supportato: l'app funziona comunque */
    });
  });
};
