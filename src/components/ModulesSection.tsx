import { motion } from "framer-motion";
import { HelpCircle, User, Car, Atom, CloudRain, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";

const modules = [
  {
    icon: HelpCircle,
    title: "Perché la guida sicura",
    desc: "Dati, statistiche e consapevolezza. Il punto di partenza.",
  },
  {
    icon: User,
    title: "Il conducente",
    desc: "Percezione, reazione, limiti umani. Conosci il fattore più importante.",
  },
  {
    icon: Car,
    title: "Il veicolo",
    desc: "Come risponde l'auto. Freni, aderenza, elettronica di bordo.",
  },
  {
    icon: Atom,
    title: "La fisica della guida",
    desc: "Forze, inerzia, traiettorie. La scienza dietro ogni manovra.",
  },
  {
    icon: CloudRain,
    title: "Le condizioni reali",
    desc: "Pioggia, neve, notte, stanchezza. Guidare quando tutto cambia.",
  },
  {
    icon: Wrench,
    title: "La tecnica",
    desc: "Frenata, curva, sorpasso. Le azioni che fanno la differenza.",
  },
];

const ModulesSection = () => {
  const navigate = useNavigate();
  return (
    <section id="moduli" className="section-full py-24 px-6">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <p className="font-mono text-xs tracking-[0.3em] uppercase text-primary mb-4">
            I moduli
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Scegli da dove iniziare
          </h2>
          <p className="text-muted-foreground">
            Sei percorsi. Un obiettivo: capire prima di agire.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((m, i) => (
            <motion.button
              key={m.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="card-lab text-left cursor-pointer group"
              onClick={() => {
                if (m.title === "Perché la guida sicura") {
                  navigate("/perche-la-guida-sicura");
                }
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <m.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-14"
        >
          <a href="#moduli" className="btn-primary-lab">
            Entra nel corso
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default ModulesSection;
