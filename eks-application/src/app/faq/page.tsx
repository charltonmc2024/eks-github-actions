'use client';
import React, { useState } from "react";
import Breadcrumb from "@/components/Common/Breadcrumb";
import LabelChip from "@/components/Common/LabelChip";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiMinus, FiSearch, FiHelpCircle } from "react-icons/fi";

const faqs = [
  {
    question: "What subjects and tests does Erudition cover?",
    answer:
      "Erudition offers practice test for STAAR Algebra 1, TSI Math, and SAT/ACT Math. Teachers under the Intermediate or Premium Plan may also construct their own tests.",
  },
  {
    question: "Is Erudition Tess aligned with official test standards and TEKS?",
    answer:
      "Yes. All of our STAAR and TSI questions are rigorously mapped to the Texas Essential Knowledge and Skills (TEKS) guidelines, while our SAT and ACT materials reflect the latest digital adaptive frameworks officially used by the College Board and ACT.",
  },
  {
    question: "Can parents purchase an account directly?",
    answer:
      "Yes! While we partner directly with school districts, we also offer individual subscription plans for families. Parents can purchase a dedicated account directly through our website to give their students a competitive edge at home.",
  },
  {
    question: "How do I get started?",
    answer:
      "Contact us by email to set up your account or request a demo.",
  },
  {
    question: "What type of questions are included in Eruditions Test?",
    answer:
      "Erudition tests includes multiple choice, graphing, drag-and-drop, drop-down-menu, check-box and free-response type of questions.",
  },
  {
    question: "Is calculator allowed in Erudition Test?",
    answer:
      "In all STAAR Algebra I questions, calculators are allowed. However, all questions can be answered without a calculator. For TSI, SAT and ACT practice tests, in some questions calculators are prohibited.",
  },
  {
    question: "Can teachers and students get immediate feedback?",
    answer:
      "Yes. Students will get immediate feedback of their performance and teachers may view item analysis and class analytics.",
  },
  {
    question: "Are Erudition tests timed?",
    answer:
      "Yes. Teachers may set the time to open and closed the test. Teacher may also set the time given to students to finish the test.",
  },
];

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(search.toLowerCase()) ||
    faq.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Breadcrumb
        pageName="FAQ"
        description="Find answers to common questions about Erudition Solution, LLC and our adaptive testing platform."
      />
      <section className="relative min-h-screen py-32 px-4 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-20 -right-32 w-[500px] h-[500px] rounded-full bg-primary-light/15 blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-secondary/5 blur-[160px] pointer-events-none" />

        <main className="relative z-10 max-w-5xl w-full">
          <div
            className="relative rounded-[28px] border border-white/10 shadow-2xl overflow-hidden"
            style={{
              background: `
                radial-gradient(120% 80% at 50% -10%, rgba(14,165,233,0.2) 0%, transparent 55%),
                linear-gradient(180deg, rgba(15,122,163,0.65) 0%, rgba(10,104,140,0.55) 45%, rgba(8,88,117,0.5) 100%)
              `,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 28%, transparent 55%)',
            }} />
            <div className="absolute inset-0 pointer-events-none rounded-[28px] p-px" style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 35%, rgba(255,255,255,0.0) 70%)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }} />
            <div className="absolute top-0 left-[12%] right-[12%] h-px pointer-events-none" style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
              opacity: 0.9,
            }} />

            <div className="relative z-10 p-8 md:p-12">
              <div
                className="mb-10 rounded-3xl p-8 text-center relative overflow-hidden"
                style={{
                  background: `
                    radial-gradient(120% 80% at 50% -10%, rgba(56,189,248,0.25) 0%, transparent 60%),
                    linear-gradient(180deg, #0f7aa3 0%, #0A688C 100%)
                  `,
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: `
                    0 1px 0 rgba(255,255,255,0.1) inset,
                    0 12px 35px -12px rgba(0,0,0,0.4),
                    0 6px 18px -8px rgba(10,104,140,0.6)
                  `,
                }}
              >
                <div className="flex justify-center mb-4">
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{
                      background: 'rgba(255,255,255,0.12)',
                      border: '1px solid rgba(255,255,255,0.18)',
                      boxShadow: '0 1px 0 rgba(255,255,255,0.15) inset',
                    }}
                  >
                    <FiHelpCircle size={32} className="text-white/95" />
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3 drop-shadow-sm tracking-tight">
                  Erudition Solution, LLC
                </h2>
                <p className="text-white/85 mb-5 max-w-2xl mx-auto leading-relaxed text-[15px]">
                  There&apos;s much to see here. So, take your time, look around, and learn all there is to know about us. We hope you enjoy our site and take a moment to drop us a line.
                </p>
                <a
                  href="/contact-support"
                  className="inline-flex items-center justify-center px-7 py-3 rounded-xl text-[#0A688C] font-bold bg-white hover:bg-white/95 transition-all duration-250"
                  style={{
                    transition: 'all 0.25s cubic-bezier(.2,.8,.2,1)',
                    boxShadow: `
                      0 1px 0 rgba(255,255,255,0.8) inset,
                      0 -1px 0 rgba(0,0,0,0.04) inset,
                      0 5px 16px -4px rgba(0,0,0,0.25)
                    `,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1.5px)';
                    e.currentTarget.style.boxShadow = `
                      0 1px 0 rgba(255,255,255,0.9) inset,
                      0 -1px 0 rgba(0,0,0,0.04) inset,
                      0 10px 25px -6px rgba(0,0,0,0.32)
                    `;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `
                      0 1px 0 rgba(255,255,255,0.8) inset,
                      0 -1px 0 rgba(0,0,0,0.04) inset,
                      0 5px 16px -4px rgba(0,0,0,0.25)
                    `;
                  }}
                >
                  Contact Us
                </a>
              </div>

              <div className="mb-10">
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-white/60 pointer-events-none z-10">
                    <FiSearch size={18} />
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search FAQs..."
                    className="w-full pl-12 pr-5 py-4 rounded-2xl text-white placeholder-white/50 focus:outline-none transition-all duration-250"
                    style={{
                      background: `
                        radial-gradient(120% 150% at 50% -10%, rgba(255,255,255,0.08) 0%, transparent 60%),
                        linear-gradient(180deg, rgba(15,122,163,0.7) 0%, rgba(10,104,140,0.75) 100%)
                      `,
                      border: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: `
                        0 1px 0 rgba(255,255,255,0.08) inset,
                        0 8px 24px -12px rgba(0,0,0,0.35)
                      `,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                      e.currentTarget.style.boxShadow = `
                        0 1px 0 rgba(255,255,255,0.12) inset,
                        0 0 0 3px rgba(56,189,248,0.15),
                        0 10px 30px -14px rgba(0,0,0,0.45)
                      `;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                      e.currentTarget.style.boxShadow = `
                        0 1px 0 rgba(255,255,255,0.08) inset,
                        0 8px 24px -12px rgba(0,0,0,0.35)
                      `;
                    }}
                  />
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-10 text-center tracking-tight drop-shadow-md">
                FREQUENTLY ASKED QUESTIONS
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                {filteredFaqs.length === 0 ? (
                  <div className="col-span-2 text-center text-white/70 py-12 rounded-2xl" style={{
                    background: 'rgba(10,104,140,0.4)',
                    border: '1px dashed rgba(255,255,255,0.15)',
                  }}>
                    No FAQs found.
                  </div>
                ) : (
                  filteredFaqs.map((faq, idx) => {
                    const isOpen = openIndex === idx;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: idx * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
                        className="group relative rounded-2xl overflow-hidden transition-all duration-300"
                        style={{
                          transform: 'translateY(0)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isOpen) e.currentTarget.style.transform = 'translateY(-3px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, transparent 80%)',
                            opacity: isOpen ? 1 : 0.6,
                            transition: 'opacity 0.3s ease',
                          }}
                        />
                        <div
                          className="relative h-full rounded-2xl p-5 md:p-6"
                          style={{
                            background: isOpen
                              ? `
                                radial-gradient(120% 100% at 50% -10%, rgba(56,189,248,0.22) 0%, transparent 60%),
                                linear-gradient(180deg, #0f7aa3 0%, #0A688C 55%, #085875 100%)
                              `
                              : `
                                linear-gradient(180deg, rgba(15,122,163,0.55) 0%, rgba(10,104,140,0.6) 55%, rgba(8,88,117,0.55) 100%)
                              `,
                            border: isOpen
                              ? '1px solid rgba(56,189,248,0.28)'
                              : '1px solid rgba(255,255,255,0.1)',
                            boxShadow: isOpen
                              ? `
                                0 1px 0 rgba(255,255,255,0.14) inset,
                                0 0 0 1px rgba(56,189,248,0.08),
                                0 18px 45px -14px rgba(14,165,233,0.35),
                                0 8px 24px -10px rgba(10,104,140,0.6)
                              `
                              : `
                                0 1px 0 rgba(255,255,255,0.08) inset,
                                0 10px 28px -12px rgba(0,0,0,0.35),
                                0 5px 14px -6px rgba(10,104,140,0.5)
                              `,
                            transition: 'all 0.3s cubic-bezier(.2,.8,.2,1)',
                          }}
                        >
                          <div
                            className="absolute inset-0 rounded-2xl p-px pointer-events-none"
                            style={{
                              background: 'linear-gradient(145deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.0) 70%)',
                              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                              WebkitMaskComposite: 'xor',
                              maskComposite: 'exclude',
                              opacity: isOpen ? 1 : 0.7,
                            }}
                          />

                          <button
                            className="relative z-10 w-full text-left flex justify-between items-start gap-4 focus:outline-none"
                            onClick={() => setOpenIndex(isOpen ? null : idx)}
                            aria-expanded={isOpen}
                          >
                            <span className="font-semibold text-white text-[15px] md:text-base leading-snug tracking-tight">
                              {faq.question}
                            </span>
                            <span
                              className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-xl text-white transition-all duration-300"
                              style={{
                                background: isOpen
                                  ? 'rgba(255,255,255,0.18)'
                                  : 'rgba(255,255,255,0.08)',
                                border: isOpen
                                  ? '1px solid rgba(255,255,255,0.25)'
                                  : '1px solid rgba(255,255,255,0.12)',
                                transform: isOpen ? 'rotate(45deg) scale(1.05)' : 'rotate(0deg) scale(1)',
                                boxShadow: isOpen
                                  ? '0 1px 0 rgba(255,255,255,0.15) inset'
                                  : '0 1px 0 rgba(255,255,255,0.08) inset',
                              }}
                            >
                              {isOpen ? <FiMinus size={15} /> : <FiPlus size={15} />}
                            </span>
                          </button>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                key="answer"
                                initial={{ opacity: 0, height: 0, y: 4 }}
                                animate={{ opacity: 1, height: "auto", y: 0 }}
                                exit={{ opacity: 0, height: 0, y: 4 }}
                                transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                                className="relative z-10 overflow-hidden"
                              >
                                <div className="mt-4 h-px w-full" style={{
                                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.16), rgba(255,255,255,0.22), rgba(255,255,255,0.16), transparent)',
                                }} />
                                <p className="mt-4 text-white/88 text-[14.5px] md:text-[15px] leading-relaxed font-medium">
                                  {faq.answer}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              <div
                className="mt-14 rounded-3xl p-8 text-center relative overflow-hidden"
                style={{
                  background: `
                    radial-gradient(120% 80% at 50% -10%, rgba(96,165,250,0.25) 0%, transparent 60%),
                    linear-gradient(180deg, #0f7aa3 0%, #0A688C 55%, #085875 100%)
                  `,
                  border: '1px solid rgba(96,165,250,0.18)',
                  boxShadow: `
                    0 1px 0 rgba(255,255,255,0.1) inset,
                    0 0 0 1px rgba(96,165,250,0.06),
                    0 16px 45px -16px rgba(37,99,235,0.3),
                    0 8px 22px -10px rgba(10,104,140,0.55)
                  `,
                }}
              >
                <h3 className="text-xl md:text-2xl font-extrabold text-white mb-3 tracking-tight drop-shadow-sm">
                  Still have questions?
                </h3>
                <p className="text-white/85 mb-6 max-w-2xl mx-auto leading-relaxed text-[15px]">
                  If you can&apos;t find the answer you&apos;re looking for, please contact our support team.
                </p>
                <a
                  href="/contact-support"
                  className="inline-flex items-center justify-center px-7 py-3 rounded-xl text-[#0A688C] font-bold bg-white hover:bg-white/95 transition-all duration-250"
                  style={{
                    transition: 'all 0.25s cubic-bezier(.2,.8,.2,1)',
                    boxShadow: `
                      0 1px 0 rgba(255,255,255,0.8) inset,
                      0 -1px 0 rgba(0,0,0,0.04) inset,
                      0 5px 16px -4px rgba(0,0,0,0.25)
                    `,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1.5px)';
                    e.currentTarget.style.boxShadow = `
                      0 1px 0 rgba(255,255,255,0.9) inset,
                      0 -1px 0 rgba(0,0,0,0.04) inset,
                      0 10px 25px -6px rgba(0,0,0,0.32)
                    `;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = `
                      0 1px 0 rgba(255,255,255,0.8) inset,
                      0 -1px 0 rgba(0,0,0,0.04) inset,
                      0 5px 16px -4px rgba(0,0,0,0.25)
                    `;
                  }}
                >
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </main>
      </section>
    </>
  );
};

export default FAQPage;
