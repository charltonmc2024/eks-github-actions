'use client';
import React, { useState } from "react";
import Breadcrumb from "@/components/Common/Breadcrumb";
import DarkCard from "@/components/Common/DarkCard";
import LabelChip from "@/components/Common/LabelChip";
import { motion } from "framer-motion";
import { FiSearch, FiMapPin } from "react-icons/fi";

const SchoolDistrictsPage = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const districts = [
    "Arlington",
    "Dallas",
    "Fort Worth",
    "Frisco",
    "McAllen",
    "Houston",
    "Austin",
    "San Antonio",
    "El Paso",
    "Plano",
  ];
  const filtered = districts.filter((d) => d.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <Breadcrumb
        pageName="School Districts"
        description="Select your Texas Independent School District to see how we make test practice more adaptable for your community."
      />
      <section className="relative min-h-screen bg-primary py-24 px-4 flex items-center justify-center">
        <div className="relative z-10 max-w-4xl w-full">
          <div className="mb-6 flex items-center justify-center gap-3">
            <LabelChip text="Texas ISD" variant="primary" size="sm" />
            <LabelChip text="Selection" variant="primary" size="sm" />
          </div>
          <DarkCard
            title="Select your School District"
            description="Texas Independent School Districts"
            className="group backdrop-blur-md"
            darkness={0.18}
            strategy="overlay"
          >
            <div className="mb-6">
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-white">
                  <FiSearch className="opacity-70" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search districts..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {filtered.map((name) => {
                const active = selected === name;
                return (
                  <motion.li
                    key={name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(active ? null : name)}
                      aria-pressed={active}
                      className={`group relative w-full px-4 py-3 rounded-xl border text-center font-semibold transition-all duration-300 shadow
                        ${active ? "border-primary/50 ring-2 ring-primary/40 bg-gradient-to-br from-primary/40 via-primary/50 to-secondary/40 text-white" : "border-white/20 bg-gradient-to-br from-primary-dark/80 to-secondary-dark/70 text-white hover:border-white/30 hover:-translate-y-0.5"}
                      `}
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        <FiMapPin className={`${active ? "text-primary-light" : "text-white/80"}`} />
                        <span>{name}</span>
                      </span>
                      <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] rotate-12 animate-gloss-move bg-gradient-to-r from-white/20 via-white/10 to-transparent" />
                      </span>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
            <div className="mt-2 text-center">
              <span className="inline-block text-lg md:text-xl font-semibold text-[var(--color-on-primary)]">
                {selected ? `Selected: ${selected}` : "Making Test Practice more Adaptable"}
              </span>
            </div>
          </DarkCard>
        </div>
      </section>
    </>
  );
};

export default SchoolDistrictsPage; 
