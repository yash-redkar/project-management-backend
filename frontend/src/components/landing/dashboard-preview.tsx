"use client";

import { motion } from "framer-motion";

export function DashboardPreview() {
  return (
    <section id="product" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        animate={{ y: [0, -6, 0] }}
        className="overflow-hidden rounded-4xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-indigo-950/30"
      ></motion.div>
    </section>
  );
}