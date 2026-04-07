import { motion } from "framer-motion";
import officeImg from "@/assets/meaning-office.jpg";
import hospitalImg from "@/assets/stat-hospital.jpg";
import familyImg from "@/assets/meaning-family.jpg";
import legalImg from "@/assets/meaning-legal.jpg";

const impacts = [
  { title: "Perdita della capacità lavorativa", img: officeImg, alt: "Scrivania vuota in ufficio" },
  { title: "Costi sanitari a lungo termine", img: hospitalImg, alt: "Corridoio ospedaliero" },
  { title: "Impatto sulle famiglie", img: familyImg, alt: "Tavolo familiare con sedia vuota" },
  { title: "Conseguenze legali e gestionali", img: legalImg, alt: "Documenti legali su scrivania" },
];

const MeaningBlock = () => (
  <section className="py-32 px-6">
    <div className="container mx-auto max-w-4xl">
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-3xl md:text-4xl font-bold text-foreground mb-20 text-center"
      >
        Un incidente non è solo un numero
      </motion.h2>

      <div className="grid sm:grid-cols-2 gap-10 md:gap-14 mb-20">
        {impacts.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
          >
            <div className="rounded-lg overflow-hidden mb-5 aspect-[16/10]">
              <img
                src={item.img}
                alt={item.alt}
                loading="lazy"
                width={800}
                height={600}
                className="w-full h-full object-cover grayscale-[40%] opacity-70"
              />
            </div>
            <p className="text-foreground font-medium text-lg">{item.title}</p>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
        className="text-center text-xl md:text-2xl text-foreground/80 font-light italic"
      >
        "Un incidente continua anche dopo che è finito."
      </motion.p>
    </div>
  </section>
);

export default MeaningBlock;
