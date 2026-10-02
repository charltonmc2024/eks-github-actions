"use client";
import React from "react";
import { motion } from "framer-motion";
import { FiTarget, FiTrendingUp, FiAward } from "react-icons/fi";
import Breadcrumb from "@/components/Common/Breadcrumb";

const highlights = [
  {
    title: "Personalized Learning",
    description:
      "Adaptive pathways tailor question difficulty to each learner for focused growth.",
    Icon: FiTarget,
  },
  {
    title: "Real-time Analytics",
    description:
      "Instant insights empower teachers to adjust instruction and track progress.",
    Icon: FiTrendingUp,
  },
  {
    title: "Equity & Accessibility",
    description:
      "Effective for all ability levels with fair measurement and inclusive design.",
    Icon: FiAward,
  },
];

const MissionStatement = () => (
  <>
    <Breadcrumb
      pageName="Mission Statement"
      description="Discover our mission to empower students and educators with adaptive, innovative test preparation tools for a brighter academic future."
    />
    <section className="relative min-h-screen bg-primary py-28 px-4 flex items-center justify-center">
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse z-0" />
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-primary-dark/10 rounded-full blur-2xl animate-pulse delay-1000 z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl z-0" />

      <main className="relative z-10 w-full max-w-5xl rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl p-8 md:p-12 transition-all duration-500">
        <motion.h1
          className="text-4xl md:text-5xl font-extrabold text-primary dark:text-primary mb-4 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          Our Mission
        </motion.h1>
        <motion.h2
          className="text-xl md:text-2xl font-semibold text-primary dark:text-gray-200 mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        >
          Making Test Prep more Adaptable
        </motion.h2>

        <motion.div
          className="space-y-5 text-lg text-primary dark:text-gray-300 leading-relaxed"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.15 },
            },
          }}
        >
          <motion.p
            variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            At Erudition Solutions, our mission is to empower students and educators with innovative, adaptive testing tools that personalize learning, optimize test preparation, and unlock academic potential.
          </motion.p>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            Through intelligent question generation, real-time analytics, and dynamic difficulty adjustment, we strive to make standardized test prep more effective, engaging, and equitable—enabling every student to achieve their best and every teacher to inspire with actionable insights.
          </motion.p>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            Erudition Solutions supports a shift from “teaching to the test” to coaching for understanding and long-term skill development, aligning with best practices that emphasize purposeful practice and student empowerment.
          </motion.p>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            In summary, Erudition Solutions transforms standardized test coaching by personalizing learning, empowering teachers with actionable data, automating routine tasks, and fostering a growth-oriented, engaging environment for both teachers and students. This approach not only improves test outcomes but also enhances the overall educational experience.
          </motion.p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {highlights.map(({ title, description, Icon }) => (
            <motion.div
              key={title}
              className="group rounded-2xl bg-[#0A688C] text-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                <Icon size={24} />
              </div>
              <h3 className="text-lg font-bold mb-2">
                {title}
              </h3>
              <p className="text-white/85">
                {description}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-10 flex justify-center"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <a
            href="/contact"
            className="group relative inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-8 py-4 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            <span className="relative z-10">Contact Support & Request a Demo</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-secondary to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          </a>
        </motion.div>
      </main>
    </section>
  </>
);

export default MissionStatement;
