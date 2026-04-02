import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const Header = () => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50"
      style={{ backgroundColor: "hsl(220 20% 7% / 0.9)", backdropFilter: "blur(12px)" }}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-widest uppercase text-foreground leading-tight">
              Guida Sicura VDA
            </span>
            <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">
              Safe Drive Lab
            </span>
          </div>
        </div>
        <a href="#moduli" className="btn-outline-lab text-xs py-2 px-5">
          Esplora i moduli
        </a>
      </div>
    </motion.header>
  );
};

export default Header;
