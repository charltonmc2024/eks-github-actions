import Link from "next/link";
import Breadcrumb from "@/components/Common/Breadcrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learn More | Erudition Solutions",
  description:
    "Compare Free, Basic, Intermediate, and Premium subscription plans for STAAR Algebra I, TSIA 2, SAT, and ACT math testing.",
};

const plans = [
  {
    name: "Free Plan",
    items: [
      "Provides one complete math test each for STAAR Algebra I, TSIA 2, SAT, and ACT.",
      "Entry-level access with a single test set per exam and a Contact Us option.",
    ],
    cta: { label: "Contact Us", href: "/contact-support" },
  },
  {
    name: "Basic Plan",
    items: [
      "Provides two complete math test sets for each exam: STAAR Algebra I, TSIA 2, SAT, and ACT.",
      "Includes Detailed Item Analysis to break down student performance.",
      "Requires contacting for a quote.",
    ],
    cta: { label: "Request A Quote", href: "/contact-support" },
  },
  {
    name: "Intermediate Plan",
    items: [
      "Provides four complete math test sets for STAAR Algebra I and TSIA 2.",
      "Provides three complete math test sets for SAT and ACT.",
      "Adds Detailed Item Analysis plus Teacher-Made Test support.",
      "Quote-based pricing.",
    ],
    cta: { label: "Request A Quote", href: "/contact-support" },
  },
  {
    name: "Premium Plan",
    items: [
      "Provides six complete math test sets for STAAR Algebra I and TSIA 2.",
      "Provides four complete math test sets for SAT and ACT.",
      "Includes Detailed Item Analysis, Teacher-Made Test, and a Data Dashboard for analytics.",
      "Highest tier with the most test sets and reporting features, also quote-based.",
    ],
    cta: { label: "Request A Quote", href: "/contact-support" },
  },
];

export default function LearnMorePage() {
  return (
    <>
      <Breadcrumb
        pageName="Learn More"
        description="An overview of Erudition Solutions subscription plans."
      />

      <section className="relative min-h-screen bg-primary py-28 md:py-32 overflow-hidden">
        <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 -right-32 w-[30rem] h-[30rem] rounded-full bg-primary-light/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
              Subscription Plans Overview
            </h1>
            <p className="mt-5 text-lg text-white leading-relaxed">
              Choose the tier that fits your school or district—from a free entry point to full analytics and teacher-made testing.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-10 md:space-y-12">
            {plans.map((plan, index) => (
              <article
                key={plan.name}
                className="relative animate-fade-in"
                style={{ animationDelay: `${150 + index * 100}ms` }}
              >
                <div
                  className="relative rounded-[24px] border border-white/10 px-6 py-8 sm:px-10 sm:py-10 overflow-hidden"
                  style={{
                    background: `
                      radial-gradient(120% 80% at 50% -10%, rgba(14,165,233,0.18) 0%, transparent 55%),
                      linear-gradient(180deg, rgba(15,122,163,0.55) 0%, rgba(10,104,140,0.45) 45%, rgba(8,88,117,0.4) 100%)
                    `,
                  }}
                >
                  <div
                    className="absolute top-0 left-[12%] right-[12%] h-px pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
                    }}
                  />

                  <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4">
                    {plan.name}
                  </h2>
                  <ul className="mb-7 space-y-3">
                    {plan.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-[15px] md:text-base leading-relaxed text-white"
                        style={{ color: "#ffffff" }}
                      >
                        <span className="mt-0.5 shrink-0 font-bold" aria-hidden="true">
                          &#x2713;
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.cta.href}
                    className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#0A688C] transition-all duration-300 hover:bg-white/95 hover:scale-[1.02]"
                  >
                    {plan.cta.label}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div
            className="mt-16 md:mt-20 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
            style={{ animationDelay: "700ms" }}
          >
            <Link
              href="/subscription-plans"
              className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-transparent px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:border-white/60 hover:bg-white/5"
            >
              View Full Plan Comparison
            </Link>
            <Link
              href="/contact-support"
              className="inline-flex items-center justify-center rounded-xl bg-[#0A688C] px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#0A688C]/90 hover:shadow-xl"
            >
              Request Demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
