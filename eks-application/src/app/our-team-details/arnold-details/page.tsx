import SharePost from "@/components/Our-teams/SharePost";
import TagButton from "@/components/Our-teams/TagButton";
import LabelChip from "@/components/Common/LabelChip";
import Image from "next/image";
import Link from "next/link";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arnulfo Ninal  | EruditionSolution",
  description: "Learn more about Arnulfo Ninal , CEO and Chief Product Owner at Erudition Solutions",
};

const ArnoldDetailsPage = () => {
  return (
    <>
      <section data-leader="true" className="pt-[120px] pb-[80px] min-h-screen bg-primary">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <Link
                href="/our-team"
                className="inline-flex items-center text-white hover:text-primary-light transition-colors duration-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Team
              </Link>
            </div>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Person",
                  name: "Arnulfo Ninal ",
                  jobTitle: "Chief Executive Officer / Chief Product Owner",
                  worksFor: { "@type": "Organization", name: "Erudition Solutions" },
                  image: "/images/members/arnold.png",
                }),
              }}
            />

            <div className="group relative bg-white/10 text-white border border-white/10 backdrop-blur-xl rounded-4xl shadow-2xl p-10 transition-all duration-500">
              <div className="mb-4 flex items-center gap-3">
              </div>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-48 h-48 rounded-full overflow-hidden shadow-lg border-4 border-white/20 ring-4 ring-primary/30 ring-offset-2 ring-offset-transparent">
                  <Image
                    src="/images/members/arnold.png"
                    alt="Arnulfo Ninal "
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl font-extrabold text-white mb-2">Arnulfo Ninal </h1>
                  <h2 className="text-xl font-semibold text-white/90 mb-4">Chief Executive Officer / Chief Product Owner</h2>
                  <p className="text-lg text-white/80 mb-4">
                    Arnulfo Ninal  brings over 32 years of distinguished experience in mathematics and science education at both the secondary and collegiate levels. He is recognized for his commitment to academic excellence, educational innovation, and leadership in curriculum development and assessment.
                  </p>
                </div>
              </div>

              <div className="my-8 h-1 w-24 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full opacity-80"></div>

              <div className="space-y-6 leading-relaxed">
                <h3 className="text-2xl font-bold text-white mb-2">About Arnulfo Ninal </h3>
                <p>
                  As CEO and Chief Product Owner of Erudition Solutions, Professor Ninal defines the company&apos;s mission, vision, and long-term strategy. He ensures the organization remains aligned with market demands, educational standards, and the latest technological trends.
                </p>
                <p>
                  Renowned for his hands-on approach, Professor Ninal is actively involved in product development and innovation, driving the company forward in the rapidly evolving field of educational technology. His leadership has been pivotal in developing adaptive learning platforms that cater to diverse student needs.
                </p>
              </div>

              
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ArnoldDetailsPage; 
