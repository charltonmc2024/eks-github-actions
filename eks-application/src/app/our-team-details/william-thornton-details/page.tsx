import SharePost from "@/components/Our-teams/SharePost";
import TagButton from "@/components/Our-teams/TagButton";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "William Thornton | EruditionSolution",
  description: "Learn more about William Thornton, Security Specialist and Certified Information System Security Professional at Erudition Solutions",
};

const WilliamThorntonDetailsPage = () => {
  return (
    <>
      <section className="pt-[120px] pb-[80px] min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Link href="/our-team" className="inline-flex items-center text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80 transition-colors duration-300">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Team
              </Link>
            </div>

            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-4xl shadow-2xl p-10 transition-all duration-500">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-40 h-40 rounded-full overflow-hidden shadow-lg border-4 border-primary">
                  <Image src="/images/members/william.jpg" alt="William Thornton" fill className="object-cover" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl font-extrabold text-primary dark:text-primary mb-2">William Thornton</h1>
                  <h2 className="text-xl font-semibold text-primary dark:text-gray-200 mb-4">Security Specialist / Cert. Information System Security Professional</h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                    William provides Erudition Solutions advice on proactively managing its security posture, mitigating risks, complying with regulations, and building trust with customers by ensuring our products and operations are secure from end to end.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                    <TagButton text="Security" />
                    <TagButton text="Compliance" />
                    <TagButton text="Risk Management" />
                    <TagButton text="Cybersecurity" />
                    <TagButton text="Trust Building" />
                    <TagButton text="Information Security" />
                  </div>
                
                </div>
              </div>

              <div className="my-8 h-1 w-24 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse"></div>

              <div className="space-y-6 text-body-color dark:text-body-color-dark leading-relaxed">
                <h3 className="text-2xl font-bold text-primary dark:text-white mb-2">About William Thornton</h3>
                <p>
                  As a Board Advisor at Erudition Solutions, William serves as a Security Specialist and Certified Information System Security Professional, providing comprehensive security guidance to ensure our products and operations maintain the highest security standards.
                </p>
                <p>
                  William&apos;s security expertise gave us peace of mind, ensuring our educational platforms are secure from end to end and compliant with all relevant regulations.
                </p>
              </div>

              
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default WilliamThorntonDetailsPage; 
