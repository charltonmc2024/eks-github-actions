"use client";
import SectionTitle from "../Common/SectionTitle";
import OfferList from "./OfferList";
import PricingBox from "./PricingBox";

const Pricing = () => {
  const tiers = [
    {
      name: "FREE PLAN",
      subtitle: "",
      items: [
        "One set of complete test for STAAR Algebra I",
        "One set of complete test for TSIA 2 - Math",
        "One set of complete test for SAT - Math",
        "One set of complete test for ACT - Math",
      ],
      featured: false,
      buttonText: "Contact Us",
      largeFeatures: true,
    },
    {
      name: "BASIC PLAN",
      subtitle: "",
      items: [
        "Two sets of complete test for STAAR Algebra I",
        "Two sets of complete test for TSIA 2 - Math",
        "Two sets of complete test for SAT - Math",
        "Two sets of complete test for ACT - Math",
        "Detailed Item Analysis",
      ],
      featured: false,
      buttonText: "Request A Quote",
      largeFeatures: true,
    },
    {
      name: "INTERMEDIATE PLAN",
      subtitle: "",
      items: [
        "Four sets of complete test for STAAR Algebra I",
        "Four sets of complete test for TSIA 2 - Math",
        "Three sets of complete test for SAT - Math",
        "Three sets of complete test for ACT - Math",
        "Detailed Item Analysis",
        "Teacher-Made Test",
      ],
      featured: true,
      buttonText: "Request A Quote",
      largeTitle: true,
    },
    {
      name: "PREMIUM PLAN",
      subtitle: "",
      items: [
        "Six sets of complete test for STAAR Algebra I",
        "Six sets of complete test for TSIA 2 - Math",
        "Four sets of complete test for SAT - Math",
        "Four sets of complete test for ACT - Math",
        "Detailed Item Analysis",
        "Teacher-Made Test",
        "Data Dashboard",
      ],
      featured: true,
      buttonText: "Request A Quote",
      largeTitle: true,
    },
  ];

  return (
    <section id="pricing" className="relative z-10 py-16 md:py-20 lg:py-28 bg-primary">
      <div className="container px-4 text-white">
        <SectionTitle
          title="Subscription Plans"
          paragraph="Business Models: Tiered Subscription Plans tailored for districts and schools."
          center
          width="665px"
        />

        <div className="w-full" />

        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr items-stretch justify-items-center">
          {tiers.map((tier, index) => (
            <PricingBox
              key={tier.name}
              packageName={tier.name}
              subtitle={tier.subtitle}
              tier={
                tier.name === "FREE PLAN"
                  ? "free"
                  : tier.name === "BASIC PLAN"
                    ? "basic"
                    : tier.name === "INTERMEDIATE PLAN"
                      ? "intermediate"
                      : "premium"
              }
              popAnimation={String(index + 1) as "1" | "2" | "3" | "4"}
              floatAnimation={String(index) as "0" | "1" | "2" | "3"}
              featured={tier.featured}
              buttonText={tier.buttonText}
              buttonHref="/contact-support"
              largeTitle={tier.largeTitle}
              largeFeatures={tier.largeFeatures}
              variant="themeDark"
              tone={tier.featured ? "premium" : "standard"}
            >
              {tier.items.map((item, idx) => (
                <OfferList key={idx} text={item} status="active" />
              ))}
            </PricingBox>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 z-[-1]">
        <svg
          width="239"
          height="601"
          viewBox="0 0 239 601"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            opacity="0.3"
            x="-184.451"
            y="600.973"
            width="196"
            height="541.607"
            rx="2"
            transform="rotate(-128.7 -184.451 600.973)"
            fill="url(#paint0_linear_93:235)"
          />
          <rect
            opacity="0.3"
            x="-188.201"
            y="385.272"
            width="59.7544"
            height="541.607"
            rx="2"
            transform="rotate(-128.7 -188.201 385.272)"
            fill="url(#paint1_linear_93:235)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_93:235"
              x1="-90.1184"
              y1="420.414"
              x2="-90.1184"
              y2="1131.65"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#096799" />
              <stop offset="1" stopColor="#096799" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_93:235"
              x1="-159.441"
              y1="204.714"
              x2="-159.441"
              y2="915.952"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#096799" />
              <stop offset="1" stopColor="#096799" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-r from-[#096799]/10 via-transparent to-[#096799]/10 pointer-events-none"></div>
    </section>
  );
};

export default Pricing;
