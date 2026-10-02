"use client";
import Link from "next/link";
import Image from "next/image";
import React from "react";

const LeadershipCarousel = ({ others }: { others: any[] }) => {
  if (!others?.length) return null;

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4">
      <div className="relative rounded-[24px] p-4 sm:p-6 md:p-10 bg-primary">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-white/20 blur-3xl"></div>
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-10 items-start">
          {others.map((leader) => (
            <div key={leader.id} className="flex flex-col items-center text-center text-white px-2 sm:px-4 py-3 rounded-2xl transition-colors">
              <div className="relative group w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44">
                <span className="leader-ring"></span>
                <span className="leader-ring-inner"></span>
                <span className="leader-texture"></span>
                <span className="leader-gloss"></span>
                <span className="leader-shadow"></span>
                <div className="relative z-10 w-full h-full rounded-full overflow-hidden shadow-2xl">
                  <Image
                    src={leader.image || leader.author?.image || "/images/members/placeholder.png"}
                    alt={leader.author?.name || "Team member"}
                    width={176}
                    height={176}
                    className="object-cover w-full h-full transition-transform duration-300"
                  />
                </div>
              </div>
              <Link
                href={
                  leader.id === 1 ? "/our-team-details/arnold-details" :
                  leader.id === 2 ? "/our-team-details/ysh-details" :
                  leader.id === 3 ? "/our-team-details/flo-details" :
                  leader.id === 4 ? "/our-team-details/billy-details " :
                  `/our-team-details/${leader.id}-details`
                }
                className="mt-4 text-lg md:text-xl font-extrabold tracking-tight text-white/95 leading-snug"
              >
                {leader.author.name}
              </Link>
              <div className="mt-1 h-0.5 w-14 bg-gradient-to-r from-secondary via-white/40 to-secondary/60 rounded-full opacity-80"></div>
              <p className="mt-2 text-sm md:text-base text-white/85 tracking-normal max-w-[260px]">
                {leader.author.designation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeadershipCarousel;
