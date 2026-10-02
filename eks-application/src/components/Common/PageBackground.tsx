"use client";
import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function PageBackground({ children }: Props) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-primary">
      <div className="absolute inset-0 bg-primary pointer-events-none" />
      <div className="absolute right-0 top-0 z-[-1] opacity-20 lg:opacity-30">
        <svg
          width="364"
          height="201"
          viewBox="0 0 364 201"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.88928 72.3303C33.6599 66.4798 101.397 64.9086 150.178 105.427C211.155 156.076 229.59 162.093 264.333 166.607C299.076 171.12 337.718 183.657 362.889 212.24"
            stroke="url(#paint0_linear_bg)"
          />
          <path
            d="M-22.1107 72.3303C5.65989 66.4798 73.3965 64.9086 122.178 105.427C183.155 156.076 201.59 162.093 236.333 166.607C271.076 171.12 309.718 183.657 334.889 212.24"
            stroke="url(#paint1_linear_bg)"
          />
          <path
            d="M-53.1107 72.3303C-25.3401 66.4798 42.3965 64.9086 91.1783 105.427C152.155 156.076 170.59 162.093 205.333 166.607C240.076 171.12 278.718 183.657 303.889 212.24"
            stroke="url(#paint2_linear_bg)"
          />
          <defs>
            <linearGradient
              id="paint0_linear_bg"
              x1="184.389"
              y1="69.2405"
              x2="184.389"
              y2="212.24"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#96DCF8" stopOpacity="0" />
              <stop offset="1" stopColor="#96DCF8" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_bg"
              x1="156.389"
              y1="69.2405"
              x2="156.389"
              y2="212.24"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#0A6B91" stopOpacity="0" />
              <stop offset="1" stopColor="#0A6B91" />
            </linearGradient>
            <linearGradient
              id="paint2_linear_bg"
              x1="125.389"
              y1="69.2405"
              x2="125.389"
              y2="212.24"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#0A6B91" stopOpacity="0" />
              <stop offset="1" stopColor="#0A6B91" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="absolute bottom-0 left-0 z-[-1] opacity-20 lg:opacity-30">
        <svg
          width="450"
          height="556"
          viewBox="0 0 450 556"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="277" cy="63" r="225" fill="url(#paint0_linear_bg2)" />
          <circle cx="18" cy="182" r="18" fill="url(#paint1_radial_bg2)" />
          <circle cx="77" cy="288" r="34" fill="url(#paint2_radial_bg2)" />
          <defs>
            <linearGradient
              id="paint0_linear_bg2"
              x1="-54.5"
              y1="-178"
              x2="222"
              y2="288"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#96DCF8" />
              <stop offset="1" stopColor="#0A6B91" stopOpacity="0" />
            </linearGradient>
            <radialGradient
              id="paint1_radial_bg2"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(18 182) rotate(90) scale(18)"
            >
              <stop offset="0.145833" stopColor="#96DCF8" stopOpacity="0" />
              <stop offset="1" stopColor="#96DCF8" stopOpacity="0.08" />
            </radialGradient>
            <radialGradient
              id="paint2_radial_bg2"
              cx="0"
              cy="0"
              r="1"
              gradientUnits="userSpaceOnUse"
              gradientTransform="translate(77 288) rotate(90) scale(34)"
            >
              <stop offset="0.145833" stopColor="#0A6B91" stopOpacity="0" />
              <stop offset="1" stopColor="#0A6B91" stopOpacity="0.08" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      <div className="relative z-10">{children}</div>
    </main>
  );
}
