import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import HeroPercheUnCorso from "@/components/moduloUno/HeroPercheUnCorso";
import TreLeve from "@/components/moduloUno/TreLeve";
import NumeriOggi from "@/components/moduloUno/NumeriOggi";

const PercheUnCorso = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-background text-foreground">
      {/* Fixed nav */}
      <div
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/30"
        style={{
          backgroundColor: "hsl(var(--background) / 0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="container mx-auto flex items-center h-14 px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Torna alla home</span>
          </Link>
        </div>
      </div>

      <main>
        <HeroPercheUnCorso />
        <TreLeve />
        <NumeriOggi />
      </main>

      {/* Footer minimo */}
      <div className="border-t border-border/30 py-8 px-6" style={{ backgroundColor: "hsl(var(--card))" }}>
        <div className="container mx-auto max-w-3xl flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Modulo 01 — Perché un corso
          </p>
          <Link to="/" className="text-xs text-primary hover:underline">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PercheUnCorso;
