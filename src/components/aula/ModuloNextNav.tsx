import { Link } from "react-router-dom";
import { ArrowRight, LayoutList } from "lucide-react";

/**
 * Navigazione diretta tra moduli nella vista aula.
 * Posizionato in assoluto in basso nell'ultima schermata di ogni modulo.
 * Il wrapper è pointer-events-none per non interferire con i contenuti.
 */
export const ModuloNextNav = ({
  to,
  label,
  backToIndex = false,
}: {
  to: string;
  label: string;
  backToIndex?: boolean;
}) => (
  <div className="absolute bottom-5 inset-x-0 z-20 flex justify-center pointer-events-none">
    <Link
      to={to}
      data-modulo-next={backToIndex ? undefined : ""}
      className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/70 px-5 py-2 font-mono text-xs uppercase tracking-widest text-primary backdrop-blur-sm transition-colors hover:bg-primary hover:text-primary-foreground"
    >
      {label}
      {backToIndex ? (
        <LayoutList className="w-4 h-4" />
      ) : (
        <ArrowRight className="w-4 h-4" />
      )}
    </Link>
  </div>
);
