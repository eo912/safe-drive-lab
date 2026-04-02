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
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold tracking-widest uppercase text-foreground">
            Guida Sicura VDA
          </span>
        </div>
        <a href="#moduli" className="btn-outline-lab text-xs py-2 px-5">
          Esplora i moduli
        </a>
      </div>
    </motion.header>
  );
};

export default Header;
