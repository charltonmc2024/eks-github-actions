import SharePost from "@/components/Our-teams/SharePost";
import TagButton from "@/components/Our-teams/TagButton";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dr. Austin Umezurike, Ph.D | EruditionSolution",
  description: "Learn more about Dr. Austin Umezurike, Professor of Information Technology and IT Project Consultant at Erudition Solutions",
};

const AustinDetailsPage = () => {
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
                  <Image src="/images/members/austin.jpg" alt="Dr. Austin Umezurike" fill className="object-cover" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl font-extrabold text-primary dark:text-primary mb-2">Dr. Austin Umezurike, Ph.D</h1>
                  <h2 className="text-xl font-semibold text-primary dark:text-gray-200 mb-4">Professor - Information Technology / IT Project Consultant / IT Professor</h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                    Dr. Austin provides insights into long-term trends in education, including shifts in teaching methodologies, assessment paradigms, and the evolving needs of high school students and educators.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                    <TagButton text="Education" />
                    <TagButton text="Research" />
                    <TagButton text="Teaching" />
                    <TagButton text="Information Technology" />
                    <TagButton text="Project Consulting" />
                    <TagButton text="Academic Leadership" />
                  </div>
                </div>
              </div>

              <div className="my-8 h-1 w-24 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse"></div>

              <div className="space-y-6 text-body-color dark:text-body-color-dark leading-relaxed">
                <h3 className="text-2xl font-bold text-primary dark:text-white mb-2">About Dr. Austin Umezurike</h3>
                <p>
                  As a Board Advisor at Erudition Solutions, Dr. Austin provides invaluable insights into long-term trends in education, helping us understand the evolving landscape of teaching methodologies and student needs.
                </p>
                <p>
                  Austin&apos;s insights into education trends are unmatched, providing us with the knowledge needed to develop educational technology solutions that truly meet the needs of students and educators.
                </p>
              </div>

              
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default AustinDetailsPage; 
