import Link from "next/link";

export type ProductSection = {
  title: string;
  body: string;
};

type ProductDetailProps = {
  title: string;
  subtitle: string;
  overview: string[];
  sections: ProductSection[];
};

export default function ProductDetail({
  title,
  subtitle,
  overview,
  sections,
}: ProductDetailProps) {
  return (
    <section className="relative min-h-screen bg-primary py-28 md:py-32 overflow-hidden">
      <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -right-32 w-[30rem] h-[30rem] rounded-full bg-primary-light/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-14 md:mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
            {title}
          </h1>
          <p className="mt-5 text-lg md:text-xl text-white leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
          <article
            className="relative rounded-[24px] border border-white/10 px-6 py-8 sm:px-10 sm:py-10 overflow-hidden animate-fade-in"
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
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-5">
              About the Assessment
            </h2>
            <div className="space-y-4">
              {overview.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-[15px] md:text-base leading-relaxed text-white"
                  style={{ color: "#ffffff" }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </article>

          {sections.map((section, index) => (
            <article
              key={section.title}
              className="relative rounded-[24px] border border-white/10 px-6 py-8 sm:px-10 sm:py-10 overflow-hidden animate-fade-in"
              style={{
                animationDelay: `${150 + index * 80}ms`,
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
              <h2 className="flex items-start gap-3 text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-4">
                <span className="mt-1 shrink-0 text-[#7dd3fc]" aria-hidden="true">
                  &#x2713;
                </span>
                <span>{section.title}</span>
              </h2>
              <p
                className="text-[15px] md:text-base leading-relaxed text-white pl-8"
                style={{ color: "#ffffff" }}
              >
                {section.body}
              </p>
            </article>
          ))}
        </div>

        <div
          className="mt-14 md:mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
          style={{ animationDelay: "500ms" }}
        >
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-transparent px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:border-white/60 hover:bg-white/5"
          >
            Back to Products
          </Link>
          <Link
            href="/contact-support"
            className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-bold text-[#0A688C] shadow-lg transition-all duration-300 hover:bg-white/95 hover:shadow-xl"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
