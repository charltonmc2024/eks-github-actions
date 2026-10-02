import Link from "next/link";

const PricingBox = (props: {
  price?: string;
  duration?: string;
  packageName: string;
  subtitle: string;
  children: React.ReactNode;
  featured?: boolean;
  badgeText?: string;
  buttonText?: string;
  buttonHref?: string;
  hideButton?: boolean;
  tier?: "free" | "basic" | "intermediate" | "premium";
  largeTitle?: boolean;
  largeFeatures?: boolean;
  variant?: "dark" | "glass" | "themeDark";
  tone?: "standard" | "premium";
  popAnimation?: "1" | "2" | "3" | "4";
  floatAnimation?: "0" | "1" | "2" | "3";
}) => {
  const {
    price,
    duration,
    packageName,
    subtitle,
    children,
    featured = false,
    badgeText,
    buttonText = "Choose Plan",
    buttonHref,
    hideButton = false,
    tier,
    largeTitle = false,
    largeFeatures = false,
    variant = "dark",
    tone = "standard",
    popAnimation,
    floatAnimation,
  } = props;
  const isPremium = featured && tone === "premium";

  const tierClass = tier === "free" ? "tier-free"
    : tier === "basic" ? "tier-basic"
    : tier === "intermediate" ? "tier-intermediate"
    : tier === "premium" ? "tier-premium"
    : "";

  const popClass = popAnimation === "1" ? "animate-tier-pop-1"
    : popAnimation === "2" ? "animate-tier-pop-2"
    : popAnimation === "3" ? "animate-tier-pop-3"
    : popAnimation === "4" ? "animate-tier-pop-4"
    : "";

  const floatClass = floatAnimation === "0" ? "animate-tier-float"
    : floatAnimation === "1" ? "animate-tier-float-delay-1"
    : floatAnimation === "2" ? "animate-tier-float-delay-2"
    : floatAnimation === "3" ? "animate-tier-float-delay-3"
    : "";

  const useTierDesign = !!tier;

  return (
    <div className={`relative w-full h-full ${popClass}`}>
      {useTierDesign ? (
        <div className={`tier-card ${tierClass} ${floatClass} ${isPremium ? "animate-tier-glow" : ""}`}>
          <div className="tier-card-top-glow" />
          <div className="tier-card-inner">
            <div className="mb-8">
              <div className="flex flex-col items-center mb-6">
                <h3
                  className={`font-extrabold text-white tracking-tight text-center ${
                    largeTitle ? "text-3xl md:text-4xl" : "text-2xl"
                  }`}
                >
                  {packageName}
                </h3>
              </div>

              <div className="tier-divider" />

              {badgeText && (
                <div className="flex justify-center mb-5">
                  <span className="tier-badge">
                    {badgeText}
                  </span>
                </div>
              )}

              {price && duration && (
                <div className="flex items-baseline justify-center gap-1 mb-3">
                  <span className="text-4xl font-bold text-white">${price}</span>
                  <span className="text-sm text-white/80">/{duration}</span>
                </div>
              )}

              {subtitle && (
                <p className="text-sm leading-relaxed text-white/85 text-center mb-2">
                  {subtitle}
                </p>
              )}
            </div>

            <div
              className={`flex-1 space-y-5 ${
                largeFeatures ? "[&_p]:text-base [&_p]:md:text-lg" : ""
              }`}
            >
              {children}
            </div>

            {!hideButton && (
              <div className="mt-10 flex justify-center">
                {buttonHref ? (
                  <Link
                    href={buttonHref}
                    className={`tier-cta`}
                    aria-label={buttonText}
                  >
                    {buttonText}
                  </Link>
                ) : (
                  <button
                    className={`tier-cta`}
                    aria-label={buttonText}
                  >
                    {buttonText}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {isPremium && (
            <>
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-b from-primary/40 via-primary/20 to-transparent opacity-50 blur-lg animate-gradient-move" />
              <div className="absolute inset-0 rounded-3xl pointer-events-none mix-blend-soft-light bg-[radial-gradient(120%_120%_at_50%_0%,_var(--color-primary)_0%,_transparent_65%)] opacity-35 blur-md" />
              <div className="absolute -inset-[3px] rounded-3xl pointer-events-none opacity-30 blur-sm bg-[conic-gradient(from_0deg,_var(--color-primary)_0deg,_rgba(255,255,255,0.12)_90deg,_var(--color-primary)_180deg,_rgba(255,255,255,0.12)_270deg,_var(--color-primary)_360deg)] animate-conic-rotate" />
              <div className="absolute top-8 right-10 w-24 h-24 rounded-full bg-[radial-gradient(circle,_var(--color-primary)_0%,_transparent_65%)] opacity-30 blur-lg animate-ring-pulse" />
              <div className="absolute bottom-6 left-8 w-20 h-20 rounded-full bg-[radial-gradient(circle,_var(--color-primary)_0%,_transparent_65%)] opacity-25 blur-lg animate-ring-pulse" />
            </>
          )}
          <div
            className={`group pricing-card relative z-10 h-full overflow-hidden rounded-3xl border border-[#0A688C]/40 bg-[#0A688C] text-white transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] ${isPremium ? "ring-2 ring-primary shadow-[0_0_45px_rgba(10,104,140,0.45)]" : ""}`}
          >


            <div className="relative grid h-full grid-rows-[auto_1fr_auto] p-8">
              {isPremium && (
                <div className="hover-gloss absolute inset-y-0 left-0 w-1/3 rounded-3xl bg-gradient-to-r from-white/25 via-white/10 to-transparent pointer-events-none" />
              )}
              <div className="mb-8">
                <div className={`flex items-center mb-4 ${badgeText ? "justify-between" : "justify-center"}`}>
                  <h3
                    className={`font-bold text-white text-center ${
                      largeTitle ? "text-3xl md:text-4xl" : "text-2xl"
                    }`}
                  >
                    {packageName}
                  </h3>


                  {badgeText && (
                    <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border border-white/30 bg-white/10 text-white`}>
                      {badgeText}
                    </span>
                  )}
                </div>

                {price && duration && (
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold text-white`}>${price}</span>
                    <span className="text-sm text-white/70">/{duration}</span>
                  </div>
                )}

                <p className="mt-4 text-sm leading-relaxed text-white/80">
                  {subtitle}
                </p>
              </div>

              <div
                className={`space-y-4 pricing-features ${
                  largeFeatures ? "[&_p]:text-base [&_p]:md:text-lg [&_p]:leading-snug" : ""
                }`}
              >
                {children}
              </div>

              {!hideButton && (
                buttonHref ? (
                  <Link
                    href={buttonHref}
                    className={`product-cta mt-8`}
                    aria-label={buttonText}
                  >
                    {buttonText}
                  </Link>
                ) : (
                  <button
                    className={`product-cta mt-8`}
                    aria-label={buttonText}
                  >
                    {buttonText}
                  </button>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PricingBox;
