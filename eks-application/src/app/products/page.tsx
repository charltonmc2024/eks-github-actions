import React from "react";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Products | EruditionSolution",
  description: "Explore Erudition Solutions products aligned to STAAR, TSI, and SAT/ACT, plus teacher-created classroom testing tools.",
};

const Products = () => {
  return (
    <>
      {/* Hero: Teacher-Created Classroom Test */}
      <section className="relative pt-[120px] pb-[60px] min-h-[40vh] bg-primary/90 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-white/25 blur-3xl" />
        </div>
        <div className="container relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
              Teacher-Created Classroom Test
            </h1>
            <p className="text-xl md:text-2xl text-black/70 dark:text-gray-300 font-semibold text-left flex items-start gap-3">
              <span className="shrink-0" aria-hidden="true">&bull;</span>
              <span>Erudition trust that teachers are the most qualified individuals to test their student’s knowledge and skills.</span>
            </p>
            <p className="mt-2 text-xl md:text-2xl text-black/70 dark:text-gray-300 font-semibold text-left flex items-start gap-3">
              <span className="shrink-0" aria-hidden="true">&bull;</span>
              <span>We put in their finger-tips, the ability to create their own questions and tests for classroom use.</span>
            </p>
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-2/3 h-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-full opacity-60 shadow-lg" />
      </section>

      {/* Product Cards: STAAR, TSI, SAT/ACT */}
      <section className="relative pt-[60px] pb-[80px] bg-primary/90">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 items-stretch">
            <div className="product-card">
              <div className="product-card-body">
                <h3 className="product-title">STAAR</h3>
                <div className="product-features">
                  <div className="product-feature">
                    <span className="check">
                      <svg viewBox="0 0 12 12">
                        <path d="M10.28 2.28L4.5 8.06L1.72 5.28A.75.75 0 00.66 6.34L3.97 9.65C4.26 9.94 4.74 9.94 5.03 9.65L11.34 3.34A.75.75 0 0010.28 2.28Z" />
                      </svg>
                    </span>
                    <span>Six Full Test for Algebra 1</span>
                  </div>
                  <div className="product-feature">
                    <span className="check">
                      <svg viewBox="0 0 12 12">
                        <path d="M10.28 2.28L4.5 8.06L1.72 5.28A.75.75 0 00.66 6.34L3.97 9.65C4.26 9.94 4.74 9.94 5.03 9.65L11.34 3.34A.75.75 0 0010.28 2.28Z" />
                      </svg>
                    </span>
                    <span>Item Analysis to identify student’s strength and Weaknesses</span>
                  </div>
                  <div className="product-feature">
                    <span className="check">
                      <svg viewBox="0 0 12 12">
                        <path d="M10.28 2.28L4.5 8.06L1.72 5.28A.75.75 0 00.66 6.34L3.97 9.65C4.26 9.94 4.74 9.94 5.03 9.65L11.34 3.34A.75.75 0 0010.28 2.28Z" />
                      </svg>
                    </span>
                    <span>Data dashboard for progress monitoring</span>
                  </div>
                </div>
              </div>
              <div className="product-card-footer">
                <Link href="/products/staar" className="product-cta">Learn More</Link>
              </div>
            </div>
            <div className="product-card">
              <div className="product-card-body">
                <h3 className="product-title">TSI</h3>
                <div className="product-features">
                  <div className="product-feature">
                    <span className="check">
                      <svg viewBox="0 0 12 12">
                        <path d="M10.28 2.28L4.5 8.06L1.72 5.28A.75.75 0 00.66 6.34L3.97 9.65C4.26 9.94 4.74 9.94 5.03 9.65L11.34 3.34A.75.75 0 0010.28 2.28Z" />
                      </svg>
                    </span>
                    <span>Ten Full Test for TSI Math Practice</span>
                  </div>
                  <div className="product-feature">
                    <span className="check">
                      <svg viewBox="0 0 12 12">
                        <path d="M10.28 2.28L4.5 8.06L1.72 5.28A.75.75 0 00.66 6.34L3.97 9.65C4.26 9.94 4.74 9.94 5.03 9.65L11.34 3.34A.75.75 0 0010.28 2.28Z" />
                      </svg>
                    </span>
                    <span>Item Analysis to identify students need according to the four TSI tested component</span>
                  </div>
                  <div className="product-feature">
                    <span className="check">
                      <svg viewBox="0 0 12 12">
                        <path d="M10.28 2.28L4.5 8.06L1.72 5.28A.75.75 0 00.66 6.34L3.97 9.65C4.26 9.94 4.74 9.94 5.03 9.65L11.34 3.34A.75.75 0 0010.28 2.28Z" />
                      </svg>
                    </span>
                    <span>Detailed step-by-step explanation for each major concepts tested.</span>
                  </div>
                </div>
              </div>
              <div className="product-card-footer">
                <Link href="/products/tsi" className="product-cta">Learn More</Link>
              </div>
            </div>
            <div className="product-card">
              <div className="product-card-body">
                <h3 className="product-title">SAT/ACT</h3>
                <div className="product-features">
                  <div className="product-feature">
                    <span className="check">
                      <svg viewBox="0 0 12 12">
                        <path d="M10.28 2.28L4.5 8.06L1.72 5.28A.75.75 0 00.66 6.34L3.97 9.65C4.26 9.94 4.74 9.94 5.03 9.65L11.34 3.34A.75.75 0 0010.28 2.28Z" />
                      </svg>
                    </span>
                    <span>Four Full Test for SAT/ACT Practice</span>
                  </div>
                  <div className="product-feature">
                    <span className="check">
                      <svg viewBox="0 0 12 12">
                        <path d="M10.28 2.28L4.5 8.06L1.72 5.28A.75.75 0 00.66 6.34L3.97 9.65C4.26 9.94 4.74 9.94 5.03 9.65L11.34 3.34A.75.75 0 0010.28 2.28Z" />
                      </svg>
                    </span>
                    <span>Detailed step-by-step explanation for each major concepts tested.</span>
                  </div>
                </div>
              </div>
              <div className="product-card-footer">
                <Link href="/products/sat-act" className="product-cta">Learn More</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Products;
