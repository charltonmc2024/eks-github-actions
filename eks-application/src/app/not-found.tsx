import Link from "next/link";
import Breadcrumb from "@/components/Common/Breadcrumb";
import React from "react";

export default function NotFound() {
  return (
    <>
      <Breadcrumb
        pageName="Page Not Found"
        description="We couldn’t find that page. Try exploring our school-focused resources below."
      />

      <section className="relative min-h-screen bg-primary py-16 px-4 flex items-center justify-center">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-16 left-10 w-24 h-24 rounded-full bg-primary/10 blur-2xl" />
          <div className="absolute bottom-24 right-20 w-32 h-32 rounded-full bg-secondary/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <main className="relative z-10 max-w-2xl w-full bg-[#0A688C]/80 backdrop-blur-md rounded-4xl shadow-2xl p-10 transition-all duration-500">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex items-center justify-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 dark:bg-primary/20">
                <svg
                  className="h-10 w-10 text-primary"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 3L1 8l11 5 9-4.09V15h2V8L12 3z" />
                  <path d="M11 12.44L4 9.5v4.75C4 16.99 7.58 19 12 19s8-2.01 8-4.75V10l-7 3.33V17h-2v-4.56z" />
                </svg>
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">
              404 — Page Not Found
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-xl">
              We couldn’t find that page in our school directory. Use the links below to return home or explore school districts supported by Erudition Solutions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:justify-center">
  

              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#0A688C]/90 font-semibold transition-all text-white"
                aria-label="Return to Home"
              >
                Back to Home
              </Link>
            </div>

            {/* <div className="mt-8 text-sm text-gray-600 dark:text-gray-400">
              <span>Need help? Visit our </span>
              <Link href="/faq" className="text-secondary hover:underline">
                FAQ
              </Link>
              <span> or </span>
              <a
                href="/contact"
                className="text-secondary hover:underline"
              >
                Contact Support
              </a>
              <span>.</span>
            </div> */}
          </div>
        </main>
      </section>
    </>
  );
}
