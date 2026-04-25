import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { GraduationCap, UserCog } from "lucide-react";
import heroRoad from "@/assets/hero-road.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={heroRoad}
          alt="Strada di montagna in Valle d'Aosta"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />
      </div>

      {/* Content */}
      <main className="relative z-10 min-h-screen flex flex-col">
        <header className="px-6 pt-8">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Safe Drive Lab
          </p>
        </header>

        <div className="flex-1 flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl text-center"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4">
              <span className="text-gradient">Guida Sicura</span>{" "}
              <span className="text-foreground">VDA</span>
            </h1>

            <p className="font-mono text-sm tracking-[0.25em] uppercase text-primary/80 mb-8">
              Safe Drive Lab
            </p>

            <div className="glow-line max-w-xs mx-auto mb-8" />

            <p className="text-lg md:text-2xl font-light text-foreground/90 mb-12 max-w-xl mx-auto leading-relaxed">
              Ogni strada è un viaggio.
              <br />
              Ogni viaggio è una scelta.
            </p>

            {/* Two access points */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto"
            >
              <Link
                to="/aula"
                className="group flex items-center justify-center gap-3 px-8 py-6 rounded-md bg-primary text-primary-foreground font-medium tracking-wider uppercase text-sm transition-all hover:shadow-[0_0_25px_hsl(var(--primary)/0.35)] hover:-translate-y-0.5"
              >
                <GraduationCap className="w-5 h-5" />
                Aula
              </Link>
              <Link
                to="/istruttore"
                className="group flex items-center justify-center gap-3 px-8 py-6 rounded-md border border-primary/40 text-primary font-medium tracking-wider uppercase text-sm transition-all hover:bg-primary/10 hover:border-primary"
              >
                <UserCog className="w-5 h-5" />
                Istruttore
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <footer className="px-6 pb-6 text-center">
          <p className="text-[10px] tracking-widest uppercase text-text-dim">
            Partner: DriveXperience
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
