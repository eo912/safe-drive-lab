/**
 * Riferimento SINGLETON alla finestra Aula.
 *
 * Vive fuori dal ciclo di vita dei componenti React: cambiando modulo in Regia
 * (`/istruttore/:slug` → altro slug) la pagina viene smontata, ma il riferimento
 * alla finestra già proiettata deve sopravvivere, altrimenti `window.open`
 * finirebbe per aprire una seconda finestra invece di riusare quella esistente.
 */

export const AULA_WINDOW_NAME = "aula-safedrivelab";

let aulaWindow: Window | null = null;

const windowFeatures = () =>
  [
    "popup=yes",
    "noopener=no", // serve per mantenere il riferimento e poter chiamare focus()
    `width=${Math.min(window.screen.availWidth, 1920)}`,
    `height=${Math.min(window.screen.availHeight, 1080)}`,
    "left=0",
    "top=0",
    "menubar=no",
    "toolbar=no",
    "location=no",
    "status=no",
  ].join(",");

/** Finestra Aula attualmente aperta, se ancora viva. */
export const getAulaWindow = (): Window | null => {
  if (aulaWindow && !aulaWindow.closed) return aulaWindow;
  aulaWindow = null;
  return null;
};

/**
 * Apre la finestra Aula, oppure porta in focus quella già aperta.
 * Con `navigate: true` la finestra esistente viene portata sull'URL indicato
 * (usato per il passaggio al modulo successivo).
 */
export const openAulaWindow = (url: string, navigate = false): Window | null => {
  const existing = getAulaWindow();
  if (existing) {
    if (navigate) {
      try {
        existing.location.href = url;
      } catch {
        /* cross-origin improbabile: ignoriamo */
      }
    }
    existing.focus();
    return existing;
  }
  aulaWindow = window.open(url, AULA_WINDOW_NAME, windowFeatures());
  return aulaWindow;
};
