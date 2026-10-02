import SingleBlog from "@/components/Our-teams/SingleBlog";
import SingleProgrammer from "@/components/Our-teams/SingleProgrammer";
import teamData from "@/components/Our-teams/blogData";
import Link from "next/link";
import SingleAdvisor from "@/components/Our-teams/SingleAdvisor";
import boardAdvisorsData from "@/components/Our-teams/boardAdvisorsData";
import TestimonialCard from "@/components/Our-teams/TestimonialCard";
import React, { useState } from "react";
import LeadershipCarousel from "./LeadershipCarousel";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Team | EruditionSolution",
  description: "Meet the visionary leaders and contributors at Erudition Solutions.",
};

const Blog = () => {
  const contributors = teamData.filter((blog) => blog.id === 6 || blog.id === 7 || blog.id === 8 || blog.id === 9 || blog.id === 10 || blog.id === 11 || blog.id === 12);
  const others = teamData.filter((blog) => blog.id !== 6 && blog.id !== 7 && blog.id !== 8 && blog.id !== 9 && blog.id !== 10 && blog.id !== 11 && blog.id !== 12 && blog.id !== 13);

  return (
    <>
      {/* Premium Hero Section */}
      <section className="relative pt-[120px] pb-[60px] min-h-[40vh] bg-primary/90 overflow-hidden">
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 z-0 animate-gradient-x bg-gradient-to-r from-primary/20 via-white/60 to-primary/30 dark:from-primary/40 dark:via-gray-900/60 dark:to-primary/30" />
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
              Erudition <span className="text-[#096799]">Team</span>
            </h1>
          </div>
        </div>
        {/* Decorative floating elements */}
        <div className="absolute top-20 left-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute top-40 right-20 w-40 h-40 bg-secondary/10 rounded-full blur-2xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/4 w-32 h-32 bg-accent/10 rounded-full blur-2xl animate-pulse delay-2000" />
        {/* Premium Divider */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-2/3 h-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-full opacity-60 shadow-lg" />
      </section>

      {/* Leadership Team Section */}
      <section className="relative pt-[60px] pb-[80px] bg-primary/90">
        <div className="container">
          <LeadershipCarousel others={others} />
        </div>
      </section>

      {/* Honorable Individual Contributors Section */}
      <section className="relative pt-[60px] pb-[80px] bg-primary/70">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              Off-Shore <span className="text-[#096799]">Team</span>
            </h2>
          </div>
          {(() => {
            const firstRow = contributors.slice(0, 4);
            const secondRow = contributors.slice(4, 7);
            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 items-stretch text-white">
                  {firstRow.map((blog) => (
                    <TestimonialCard
                      key={blog.id}
                      image={blog.image}
                      name={blog.author.name}
                      badgeText="CONTRIBUTOR"
                    />
                  ))}
                </div>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 items-stretch text-white">
                  {secondRow.map((blog) => (
                    <TestimonialCard
                      key={blog.id}
                      image={blog.image}
                      name={blog.author.name}
                      badgeText="CONTRIBUTOR"
                    />
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      </section>

      {/* Board of Advisors Section */}
      {/* <section className="relative pt-[60px] pb-[80px] bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:via-primary/40 dark:to-accent/10">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              Board of <span className="text-[#096799]">Advisors</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experienced advisors providing strategic guidance and industry expertise
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 items-stretch">
            {boardAdvisorsData.map((advisor) => (
              <TestimonialCard
                key={advisor.id}
                image={advisor.image}
                name={advisor.author.name}
                badgeText="ADVISOR"
              />
            ))}
          </div>
        </div>
      </section> */}
    </>
  );
};

export default Blog;
