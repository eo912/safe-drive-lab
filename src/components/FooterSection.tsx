import { Shield } from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="border-t border-border/50 py-16 px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center gap-6">
          {/* Primary brand */}
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold tracking-widest uppercase text-foreground">
              Guida Sicura VDA
            </span>
          </div>

          <div className="glow-line max-w-[120px]" />

          {/* Method */}
          <p className="font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground">
            Safe Drive Lab
          </p>

          {/* Partner */}
          <p className="text-[10px] tracking-widest uppercase text-text-dim">
            Partner: DriveXperience
          </p>

          <p className="text-xs text-text-dim mt-4">
            © {new Date().getFullYear()} Guida Sicura VDA. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
