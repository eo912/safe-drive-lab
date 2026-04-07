import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import HeroPerche from "@/components/perche/HeroPerche";
import StatsBlock from "@/components/perche/StatsBlock";
import InfographicBlock from "@/components/perche/InfographicBlock";
import MeaningBlock from "@/components/perche/MeaningBlock";
import CausesBlock from "@/components/perche/CausesBlock";
import ClosingBlock from "@/components/perche/ClosingBlock";

const PercheLaGuidaSicura = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Back nav */}
      <div
        className="fixed top-0 left-0 right-0 z-50 border-b border-border/30"
        style={{
          backgroundColor: "hsl(var(--background) / 0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="container mx-auto flex items-center h-16 px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Torna alla home</span>
          </Link>
        </div>
      </div>

      <HeroPerche />

      <div className="glow-line" />

      <StatsBlock />

      <InfographicBlock />

      <MeaningBlock />

      <div className="glow-line" />

      <CausesBlock />

      <ClosingBlock />

      {/* Footer minimo */}
      <div className="border-t border-border/30 py-8 px-6">
        <div className="container mx-auto max-w-3xl flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Modulo 01 — Perché la guida sicura
          </p>
          <Link to="/" className="text-xs text-primary hover:underline">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PercheLaGuidaSicura;
