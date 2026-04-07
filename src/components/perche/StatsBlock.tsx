import { motion } from "framer-motion";
import urbanRoad from "@/assets/stat-urban-road.jpg";
import traffic from "@/assets/stat-traffic.jpg";
import hospital from "@/assets/stat-hospital.jpg";
import intersection from "@/assets/stat-intersection.jpg";

const stats = [
  { value: "173.364", label: "incidenti", img: urbanRoad, alt: "Strada urbana con auto parcheggiate" },
  { value: "3.030", label: "morti", img: traffic, alt: "Traffico autostradale dall'alto" },
  { value: "233.853", label: "feriti", img: hospital, alt: "Corridoio ospedaliero" },
  { value: "475", label: "al giorno", img: intersection, alt: "Incrocio urbano con semafori" },
];

const StatsBlock = () => (
  <section className="py-32 px-6">
    <div className="container mx-auto max-w-5xl">
      <div className="grid md:grid-cols-2 gap-x-12 gap-y-20">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: i * 0.12 }}
            className={i % 2 === 1 ? "md:mt-16" : ""}
          >
            <div className="rounded-lg overflow-hidden mb-6 aspect-[4/3]">
              <img
                src={s.img}
                alt={s.alt}
                loading="lazy"
                width={800}
                height={600}
                className="w-full h-full object-cover grayscale-[30%] opacity-80"
              />
            </div>
            <p className="font-mono text-4xl md:text-5xl font-bold text-foreground mb-2">
              {s.value}
            </p>
            <p className="text-muted-foreground text-lg">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.3 }}
        className="text-center text-2xl md:text-3xl font-semibold text-foreground mt-28"
      >
        Ogni <span className="text-primary">3 minuti</span>. Sempre.
      </motion.p>
    </div>
  </section>
);

export default StatsBlock;
