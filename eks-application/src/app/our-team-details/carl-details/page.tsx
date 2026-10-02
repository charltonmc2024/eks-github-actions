import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carl Brown | EruditionSolution",
  description: "Learn more about Carl Brown, CEO and Owner of Brownstone Enterprise Solutions, LLC and Artificial Intelligence Software Engineer at Erudition Solutions",
};

const CarlDetailsPage = () => {
  return (
    <>
      <section className="pt-[120px] pb-[80px] min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-8">
              <Link
                href="/our-team"
                className="inline-flex items-center text-primary hover:text-primary/80 dark:text-primary dark:hover:text-primary/80 transition-colors duration-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Team
              </Link>
            </div>

            {/* Profile Card */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-4xl shadow-2xl p-10 transition-all duration-500">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative w-40 h-40 rounded-full overflow-hidden shadow-lg border-4 border-primary">
                  <Image
                    src="/images/members/carl.jpg"
                    alt="Carl Brown"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl font-extrabold text-primary dark:text-primary mb-2">Carl Brown</h1>
                  <h2 className="text-xl font-semibold text-primary dark:text-gray-200 mb-4">Chief Executive Officer / Owner of Brownstone Enterprise Solutions, LLC / Artificial Intelligence Software Engineer</h2>
                  
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                    Carl provides expert advice and guidance on where and how AI can be strategically integrated into the Erudition Solutions products, services, and internal operations.
                  </p>
                  
                </div>
              </div>

              {/* Divider */}
              <div className="my-8 h-1 w-24 mx-auto bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse"></div>

              {/* Details Section */}
              <div className="space-y-6 text-body-color dark:text-body-color-dark leading-relaxed">
                <h3 className="text-2xl font-bold text-primary dark:text-white mb-2">About Carl Brown</h3>
                <p>
                  As a Board Advisor at Erudition Solutions, Carl provides expert guidance on artificial intelligence integration, helping us strategically incorporate AI into our products and services.
                </p>
                <p>
                  Carl&apos;s AI guidance has been transformative for our products, enabling us to leverage cutting-edge artificial intelligence technologies to enhance our educational solutions.
                </p>
              </div>

            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default CarlDetailsPage; 
