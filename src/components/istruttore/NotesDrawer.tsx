import { useState } from "react";
import { Lock, Unlock, StickyNote, Pencil } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useNotes } from "@/lib/instructorStorage";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  modulo: string;
  blocco: string;
  blockTitle: string;
};

/**
 * Drawer Note istruttore.
 * - lucchetto APERTO  → nota libera (modulo)
 * - lucchetto CHIUSO  → nota legata alla slide selezionata
 * Salvataggio automatico in localStorage.
 * MAI visibile in Aula.
 */
export const NotesDrawer = ({
  open,
  onOpenChange,
  modulo,
  blocco,
  blockTitle,
}: Props) => {
  const [locked, setLocked] = useState(false);
  const { freeNote, slideNote, updateFree, updateSlide } = useNotes(
    modulo,
    blocco,
  );

  const value = locked ? slideNote : freeNote;
  const onChange = locked ? updateSlide : updateFree;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="p-0 w-[360px] sm:w-[440px] flex flex-col"
      >
        <SheetHeader className="p-4 border-b border-border/60 text-left space-y-3">
          <div className="flex items-center gap-2">
            <StickyNote className="w-3.5 h-3.5 text-primary" />
            <SheetTitle className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground font-normal">
              Note istruttore
            </SheetTitle>
          </div>

          {/* Toggle lucchetto */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLocked((v) => !v)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                locked
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={locked}
              title={locked ? "Nota legata alla slide" : "Nota libera del modulo"}
            >
              {locked ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Slide
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  Libera
                </>
              )}
            </button>
            <p className="text-[11px] text-muted-foreground truncate">
              {locked ? blockTitle : "Appunti generali del modulo"}
            </p>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={
              locked
                ? "Appunti per questa slide…"
                : "Appunti generali per tutto il modulo…"
            }
            // touch-action consente scrittura con penna/Surface senza scroll
            style={{ touchAction: "manipulation" }}
            className="min-h-[60vh] resize-none text-sm leading-relaxed"
          />
          <p className="mt-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
            <Pencil className="w-3 h-3" />
            Salvataggio automatico · mai visibile in Aula
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
