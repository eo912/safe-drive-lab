import type { EmbedPayload } from "@/lib/sceneMedia";

type Props = {
  embeds: EmbedPayload[];
};

/**
 * Renderizza gli embed inline (immagini/video/pdf/link) sopra la scena Aula.
 * Posizioni e dimensioni espresse in % rispetto al viewport Aula.
 * Niente controlli di drag in Aula: la regia decide tutto.
 */
export const AulaEmbedLayer = ({ embeds }: Props) => {
  if (!embeds.length) return null;
  return (
    <div className="fixed inset-0 z-[70] pointer-events-none">
      {embeds.map((e) => {
        const r = e.resource;
        const style: React.CSSProperties = {
          position: "absolute",
          left: `${e.x}%`,
          top: `${e.y}%`,
          width: `${e.w}%`,
          height: `${e.h}%`,
        };
        return (
          <div
            key={e.id}
            style={style}
            className="pointer-events-auto rounded-md overflow-hidden border border-border/40 bg-background/90 shadow-2xl"
          >
            {r.kind === "image" && (
              <img
                src={r.url}
                alt={r.title}
                className="w-full h-full object-contain bg-black"
              />
            )}
            {r.kind === "video" && (
              <video
                src={r.url}
                controls
                playsInline
                autoPlay={e.autoplay}
                muted={e.autoplay}
                className="w-full h-full bg-black"
              />
            )}
            {r.kind === "pdf" && (
              <iframe
                src={r.url}
                title={r.title}
                className="w-full h-full border-0 bg-white"
              />
            )}
            {(r.kind === "link" || r.kind === "document") && (
              <iframe
                src={r.url}
                title={r.title}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
