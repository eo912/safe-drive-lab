import { blocksBySlug } from "@/lib/moduleBlocks";
import { modules } from "@/lib/modules";

/**
 * Catalogo statico dei segnaposto immagine presenti nelle schermate Aula.
 * Serve alla pagina Studio (/studio) per elencare ogni schermata con i suoi
 * segnaposto, senza dover aprire le slide reali.
 *
 * La chiave di persistenza è la stessa usata in aula:
 *   `${moduleFolder}::${slugify(label)}`
 */
export type StudioPlaceholder = {
  label: string;
  /** Cartella storage alternativa (es. loghi di marchio). */
  folder?: string;
};

export type StudioBlock = {
  blockId: string;
  title: string;
  notes: string;
  placeholders: StudioPlaceholder[];
  /** Etichette delle tessere che usano un'icona invece di una foto. */
  icons: StudioPlaceholder[];
};

export type StudioModule = {
  slug: string;
  folder: string;
  title: string;
  aulaPath: string;
  blocks: StudioBlock[];
};

/** Segnaposto per cartella modulo e id blocco. */
const PLACEHOLDERS: Record<string, Record<string, string[]>> = {
  "modulo-1": {
    copertina: [],
    hook: [],
    "tre-leve": [],
    "numeri-2001-2024": [],
    "costi-stato": [],
  },
  "modulo-2": {
    "sicurezza-rischio": [
      "Strada ampia italiana/alpina con incrocio poco visibile in lontananza",
      "Strada di montagna tortuosa alpina con buona visibilità",
    ],
    "catena-incidente": [
      "Abitacolo auto vista conducente, buio, luci cruscotto, strada notturna",
      "Occhi socchiusi alla guida oppure area di sosta di notte",
      "Telefono illuminato sul sedile passeggero con chiamata in arrivo",
      "Parabrezza con pioggia, tergicristalli in movimento",
      "Curva di notte, ostacolo o auto ferma sul bordo",
      "Porta di casa, luce accesa, sera",
      "Luci di emergenza sfocate in lontananza, sobrio",
    ],
    "fattore-umano": [
      "Mano sul volante in primo piano o cruscotto con spia elettronica accesa, contesto europeo",
    ],
  },
  "modulo-3": {
    "posizione-guida": [
      "Conducente visto di profilo / tre quarti seduto in abitacolo (illustrazione 3D-style — placeholder)",
    ],
    visione: [
      "Visuale frontale del conducente attraverso il parabrezza, prospettiva soggettiva, con specchietto retrovisore (placeholder)",
      "Vista dagli specchietti retrovisori",
    ],
    distrazione: ["Foto conducente (placeholder generico — verrà sostituita)"],
  },
  "modulo-4": {
    pneumatici: [
      "Pneumatico visto lateralmente e dall'alto, con area di contatto evidenziata (placeholder generico)",
    ],
    freni: ["Disco freno e pinza in primo piano (placeholder generico)"],
    "sterzo-sospensioni": [
      "Schema semplice di una sospensione, o auto su fondo sconnesso (placeholder generico)",
    ],
    "sistemi-elettronici": [
      "Cruscotto con spia ESP/ABS, o schema ruota che perde e mantiene aderenza (placeholder generico)",
    ],
    "prima-di-partire": [
      "Conducente che fa il giro esterno dell'auto (placeholder generico)",
    ],
  },
  "modulo-5": {
    "peso-trasferimenti": [
      "Schema auto vista laterale/dall'alto con frecce che mostrano lo spostamento del peso (placeholder generico)",
    ],
    "budget-aderenza": [
      "Schema visivo del «budget»: barra che si riempie tra frenata e sterzata, o pneumatico con frecce di forze in direzioni diverse (placeholder generico)",
    ],
    "sottosterzo-sovrasterzo": [
      "Schema auto in curva con traiettoria allargata (sottosterzo) vs stretta/rotante (sovrasterzo) (placeholder generico)",
    ],
    "spazio-arresto": [
      "Grafico/schema semplice della crescita non lineare dello spazio di frenata con la velocità (placeholder generico)",
    ],
    "aderenza-condizioni": [
      "Strada con transizione visibile (asciutto/bagnato o imbocco tunnel), o auto su fondo innevato (placeholder generico)",
    ],
  },
  "modulo-6": {
    anticipare: ["Schema visivo dei secondi di distanza tra due veicoli"],
    "comandi-progressivi": ["Schema comparativo: guida a scatti vs guida fluida"],
    "sequenza-curva": [
      "Schema traiettoria di curva con le tre fasi segnate (predisposto per il futuro simulatore)",
    ],
    "margini-diversi": ["Specchietto retrovisore o condizioni meteo avverse"],
  },
  "modulo-7": {
    "ore-al-volante": [
      "Conducente che consulta il percorso prima di partire, o vista dall'alto di un percorso/mappa (placeholder generico)",
    ],
    "pausa-prevedibilita": [
      "Area di sosta/autogrill, o traffico stradale con più veicoli (placeholder generico)",
    ],
    "veicolo-allestito": [
      "Veicolo commerciale/allestito, o cruscotto con indicatore di carico (placeholder generico)",
    ],
    "riepilogo-professionale": [
      "Veicolo aziendale con logo/livrea generica (placeholder generico)",
    ],
  },
  "modulo-8": {
    "consegna-vst": [
      "Foto/video: VST (veicolo di servizio), checklist pre-turno (placeholder generico)",
    ],
    "catena-traforo": [
      "Foto/video: imbocco galleria (transizione luce/buio), convoglio di veicoli (placeholder generico)",
    ],
    "urgenza-non-fretta": [
      "Foto/video: lampeggianti blu attivi, abitacolo VST in intervento (placeholder generico)",
    ],
    "essere-visti": [
      "Foto/video: veicolo con lampeggianti in traffico, punto di vista da dietro il parabrezza (placeholder generico)",
    ],
    "margine-stretto": [
      "Foto/video: interno galleria con traffico, veicoli fermi/ostacolo (placeholder generico)",
    ],
  },
};

/**
 * Tessere con icona (niente foto): per ciascuna si può assegnare
 * un'icona caricata nella libreria icone.
 */
const ICONS: Record<string, Record<string, string[]>> = {
  "modulo-2": {
    "sicurezza-rischio": [
      "La velocità che scegli",
      "La distanza che mantieni",
      "Quanto osservi davvero la strada",
      "Le condizioni del tuo veicolo",
      "Come ti adatti al meteo",
      "Il tuo stato psicofisico",
    ],
  },
};

/**
 * Loghi di marchio: gestiti dalla libreria come i segnaposto, ma con
 * cartella dedicata "brand" così restano validi ovunque nell'app.
 */
const BRAND_PLACEHOLDERS: StudioPlaceholder[] = [
  { label: "Logo SafeDriveLabs (homepage)", folder: "brand" },
  { label: "Logo 1 — copertina Modulo 1a", folder: "brand" },
  { label: "Logo 2 — copertina Modulo 1a", folder: "brand" },
  { label: "Logo Guida Sicura VDA (marchio schermate)", folder: "brand" },
];

/** Cartella storage/prefisso id ricavata dallo slug del modulo. */
export const folderForSlug = (slug: string) => {
  const m = slug.match(/modulo-(\d+[a-z]?)/i);
  return m ? `modulo-${m[1]}` : "generico";
};

export const studioCatalog: StudioModule[] = modules.map((mod) => {
  const folder = folderForSlug(mod.slug);
  const byBlock = PLACEHOLDERS[folder] ?? {};
  const iconsByBlock = ICONS[folder] ?? {};
  const blocks = (blocksBySlug[mod.slug] ?? []).map((b) => ({
    blockId: b.id,
    title: b.title,
    notes: b.notes,
    placeholders: [
      ...(byBlock[b.id] ?? []).map((label) => ({ label })),
      ...(mod.slug === modules[0]?.slug && b.id === (blocksBySlug[mod.slug] ?? [])[0]?.id
        ? BRAND_PLACEHOLDERS
        : []),
    ],
    icons: (iconsByBlock[b.id] ?? []).map((label) => ({ label })),
  }));
  return {
    slug: mod.slug,
    folder,
    title: mod.title,
    aulaPath: `/aula/${mod.slug}`,
    blocks,
  };
});
