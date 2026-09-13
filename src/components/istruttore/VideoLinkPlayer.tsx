import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize, Minimize, X } from "lucide-react";
import { youtubeId } from "@/lib/placeholderImages";

type VideoKind =
  | { kind: "youtube"; embedUrl: string }
  | { kind: "vimeo"; embedUrl: string }
  | { kind: "file"; url: string };

const DIRECT_VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i;

const vimeoId = (url: string): string | null => {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d{6,})/);
  return m ? m[1] : null;
};

/** Riconosce un link video (YouTube, Vimeo o file diretto). Null = link generico. */
export const detectVideoLink = (url: string): VideoKind | null => {
  const yt = youtubeId(url);
  if (yt) return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${yt}?autoplay=1&rel=0` };
  const vm = vimeoId(url);
  if (vm) return { kind: "vimeo", embedUrl: `https://player.vimeo.com/video/${vm}?autoplay=1` };
  if (DIRECT_VIDEO_EXT.test(url)) return { kind: "file", url };
  return null;
};

type Props = {
  url: string;
  video: Exclude<VideoKind, null>;
  onClose: () => void;
};

/**
 * Player modale per i link video dei "Suggerimenti" (solo Regia).
 * Pulsante fullscreen nativo sul contenitore, chiusura con X o Esc.
 */
export const VideoLinkPlayer = ({ url, video, onClose }: Props) => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else if (frameRef.current) {
      void frameRef.current.requestFullscreen();
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("fullscreenchange", onFsChange);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      window.removeEventListener("keydown", onKey);
      if (document.fullscreenElement) void document.exitFullscreen();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Player video di riferimento"
    >
      <div
        ref={frameRef}
        className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden border border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superiore */}
        <div className="flex items-center justify-between gap-3 px-3 py-2 bg-card/90 border-b border-border">
          <p className="min-w-0 truncate font-mono text-[10px] text-muted-foreground">{url}</p>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Esci da schermo intero" : "Schermo intero"}
              className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi il player"
              className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Player */}
        <div className="aspect-video w-full bg-black">
          {video.kind === "file" ? (
            <video src={video.url} controls autoPlay className="h-full w-full" />
          ) : (
            <iframe
              src={video.embedUrl}
              title="Video di riferimento"
              className="h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );
};
