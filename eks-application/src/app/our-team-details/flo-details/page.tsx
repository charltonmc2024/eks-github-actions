import SharePost from "@/components/Our-teams/SharePost";
import TagButton from "@/components/Our-teams/TagButton";
import Image from "next/image";
import LabelChip from "@/components/Common/LabelChip";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Florabelle Ammonraheem | EruditionSolution",
  description: "Learn more about Florabelle Ammonraheem, a key leader at Erudition Solutions",
};

const FloDetailsPage = () => {
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
                  name: "Florabelle Ammonraheem",
                  jobTitle: "Director of QA - Software Delivery/Co-Owner",
                  worksFor: { "@type": "Organization", name: "Erudition Solutions" },
                  image: "/images/members/flo.png",
                }),
              }}
            />

            <div className="group relative bg-white/10 text-white border border-white/10 backdrop-blur-xl rounded-4xl shadow-2xl p-10 transition-all duration-500">
              <div className="mb-4 flex items-center gap-3">
 
              </div>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-48 h-48 rounded-full overflow-hidden shadow-lg border-4 border-white/20 ring-4 ring-primary/30 ring-offset-2 ring-offset-transparent">
                  <Image
                    src="/images/members/flo.png"
                    alt="Florabelle Ammonraheem"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl font-extrabold text-white mb-2">Florabelle Ammonraheem</h1>
                  <h2 className="text-xl font-semibold text-white/90 mb-4">Director of QA - Software Delivery/Co-Owner</h2>
                  <p className="text-lg text-white/80 mb-4">
                    Florabelle brings a wealth of expertise to Erudition Solutions, with 12 years of experience as a high school IT teacher and over 20 years of leadership in Product Development, Quality Assurance Engineering, and as a Scrum Master. She bridges the gap between educational needs and technology solutions.
                  </p>
                </div>
              </div>

              <div className="my-8 h-1 w-24 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full opacity-80"></div>

              <div className="space-y-6 leading-relaxed">
                <h3 className="text-2xl font-bold text-white mb-2">About Florabelle Ammonraheem</h3>
                <p>
                  As Director of Quality Assurance and Product Delivery, Florabelle ensures that every Erudition product and service meets the highest standards of quality, reliability, and compliance before reaching customers. She is dedicated to establishing robust quality systems and driving a culture of continuous improvement.
                </p>
                <p>
                  Florabelle is known for her hands-on approach to product development and innovation, working closely with cross-functional teams to deliver exceptional results.
                </p>
              </div>

              
            </div>
          </div>
        </div>
      </section>
      </>
  );
};

export default FloDetailsPage; 
