import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const ClosingBlock = () => (
  <section className="py-40 px-6">
    <div className="container mx-auto max-w-3xl text-center">
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9 }}
        className="text-2xl md:text-4xl lg:text-5xl font-bold leading-snug mb-16"
      >
        <span className="text-foreground/70">Se il problema è umano,</span>
        <br />
        <span className="text-primary">la soluzione parte da chi guida.</span>
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >
        <Link
          to="/il-conducente"
          className="btn-primary-lab text-base md:text-lg px-10 py-4 uppercase tracking-widest font-semibold"
        >
          Scopri il fattore umano
        </Link>
      </motion.div>
    </div>
  </section>
);

export default ClosingBlock;
