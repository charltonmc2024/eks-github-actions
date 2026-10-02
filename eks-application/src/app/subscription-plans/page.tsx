import Breadcrumb from "@/components/Common/Breadcrumb";
import { Metadata } from "next";
import PricingBox from "@/components/Pricing/PricingBox";
import OfferList from "@/components/Pricing/OfferList";

export const metadata: Metadata = {
  title: "Subscription Plans | Erudition Solutions",
  description: "Tiered yearly subscription plans for school districts including Free, Basic, Intermediate, and Premium tiers.",
};

const tiers = [
  {
    name: "FREE PLAN",
    subtitle: "",
    tier: "free" as const,
    popAnimation: "1" as const,
    floatAnimation: "0" as const,
    items: [
      "One set of complete test for STAAR Algebra I",
      "One set of complete test for TSIA 2 - Math",
      "One set of complete test for SAT - Math",
      "One set of complete test for ACT - Math",
    ],
    featured: false,
    buttonText: "Contact Us",
    largeFeatures: true,
    largeTitle: true,
  },
  {
    name: "BASIC PLAN",
    subtitle: "",
    tier: "basic" as const,
    popAnimation: "2" as const,
    floatAnimation: "1" as const,
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
    largeTitle: true,
  },
  {
    name: "INTERMEDIATE PLAN",
    subtitle: "",
    tier: "intermediate" as const,
    popAnimation: "3" as const,
    floatAnimation: "2" as const,
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
    tier: "premium" as const,
    popAnimation: "4" as const,
    floatAnimation: "3" as const,
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

export default function SubscriptionPlansPage() {
  return (
    <>
      <Breadcrumb
        pageName="Subscription Plans"
        description="Tiered Yearly Subscription Plans for schools and districts."
      />

      <section className="relative min-h-screen bg-primary py-32 overflow-hidden">
        <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 -right-32 w-[30rem] h-[30rem] rounded-full bg-primary-light/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] rounded-full bg-secondary/5 blur-3xl pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-6xl mx-auto text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white dark:text-white tracking-tight drop-shadow-md">
              SUBSCRIPTION PLANS FOR SCHOOL DISTRICTS
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr items-stretch">
            {tiers.map((tier) => (
              <PricingBox
                key={tier.name}
                packageName={tier.name}
                subtitle={tier.subtitle}
                tier={tier.tier}
                popAnimation={tier.popAnimation}
                floatAnimation={tier.floatAnimation}
                featured={tier.featured}
                buttonText={tier.buttonText}
                buttonHref="/contact-support"
                hideButton={false}
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
      </section>
    </>
  );
}
