// Tipi condivisi per il pannello istruttore: note, archivio, contenuti collegati, media.

export type ResourceKind = "video" | "image" | "document" | "link" | "pdf";

export type Resource = {
  id: string;
  kind: ResourceKind;
  title: string;
  description?: string;
  url: string;
  createdAt: number;
};

// Media inviabile in Aula su una specifica slide.
export type SlideMedia = {
  // payload effettivamente proiettato. null = nessun media in aula.
  resource: Resource | null;
};
