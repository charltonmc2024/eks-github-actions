import SharePost from "@/components/Our-teams/SharePost";
import TagButton from "@/components/Our-teams/TagButton";
import LabelChip from "@/components/Common/LabelChip";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yshmael Ammonraheem | EruditionSolution",
  description: "Learn more about Yshmael Ammonraheem, a key leader at Erudition Solutions",
};

const YshDetailsPage = () => {
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
                  name: "Yshmael Ammonraheem",
                  jobTitle: "Chief Technology Officer",
                  worksFor: { "@type": "Organization", name: "Erudition Solutions" },
                  image: "/images/members/ysh.png",
                }),
              }}
            />

            <div className="group relative bg-white/10 text-white border border-white/10 backdrop-blur-xl rounded-4xl shadow-2xl p-10 transition-all duration-500">
              <div className="mb-4 flex items-center gap-3">
              </div>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-48 h-48 rounded-full overflow-hidden shadow-lg border-4 border-white/20 ring-4 ring-primary/30 ring-offset-2 ring-offset-transparent">
                  <Image
                    src="/images/members/ysh.png"
                    alt="Yshmael Ammonraheem"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl font-extrabold text-white mb-2">Yshmael Ammonraheem</h1>
                  <h2 className="text-xl font-semibold text-white/90 mb-4">Chief Technology Officer</h2>
                  <p className="text-lg text-white/80 mb-4">
                    Yshmael is a visionary technology leader with over 30 years of experience in the design and development of enterprise systems. As CTO, he sets the technological direction for the company, overseeing the research, design, and development of all Erudition Solutions products and services.
                  </p>
                  {/* <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                    <TagButton text="CTO" />
                    <TagButton text="Technology Strategy" />
                    <TagButton text="Systems Design" />
                    <TagButton text="Team Leadership" />
                    <TagButton text="Innovation" />
                  </div> */}
                </div>
              </div>

              <div className="my-8 h-1 w-24 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full opacity-80"></div>

              <div className="space-y-6 leading-relaxed">
                <h3 className="text-2xl font-bold text-white mb-2">About Yshmael Ammonraheem</h3>
                <p>
                  Yshmael leads and inspires high-performing engineering teams, ensuring the delivery of innovative, reliable, and scalable solutions that meet the evolving needs of educators and learners.
                </p>
                <p>
                  Known for his hands-on approach to product development and innovation, Yshmael is committed to excellence at every stage of the process.
                </p>
              </div>

              
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default YshDetailsPage; 
