import Image from "next/image";
import SectionTitle from "../Common/SectionTitle";

const checkIcon = (
  <svg width="16" height="13" viewBox="0 0 16 13" className="fill-current">
    <path d="M5.8535 12.6631C5.65824 12.8584 5.34166 12.8584 5.1464 12.6631L0.678505 8.1952C0.483242 7.99994 0.483242 7.68336 0.678505 7.4881L2.32921 5.83739C2.52467 5.64193 2.84166 5.64216 3.03684 5.83791L5.14622 7.95354C5.34147 8.14936 5.65859 8.14952 5.85403 7.95388L13.3797 0.420561C13.575 0.22513 13.8917 0.225051 14.087 0.420383L15.7381 2.07143C15.9333 2.26669 15.9333 2.58327 15.7381 2.77854L5.8535 12.6631Z" />
  </svg>
);

const AboutSectionOne = () => {
  const List = ({ text }) => (
    <div className="group flex items-center space-x-4 p-4 rounded-xl bg-[#0A688C] text-white border border-[#0A688C]/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex-shrink-0">
        <div className="bg-white/10 p-2 rounded-lg shadow-lg">
          {checkIcon}
        </div>
      </div>
      <span className="text-base font-medium">
        {text}
      </span>
    </div>
  );

  return (
    <section id="about" className="relative py-20 lg:py-32 overflow-hidden">
      {/* Modern Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-primary/5 to-secondary/5 dark:from-gray-900 dark:via-primary/10 dark:to-secondary/10">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.08),transparent_50%)]"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_80%,rgba(30,64,175,0.08),transparent_50%)]"></div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-accent/10 to-primary-light/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container relative z-10">
        <div className="border-b border-gray-200/50 dark:border-gray-700/50 pb-20 lg:pb-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <SectionTitle
                title="Crafted for EruditionSolution, SaaS and Business Sites."
                paragraph="The main 'thrust' is to focus on educating attendees on how to best protect highly vulnerable business applications with interactive panel discussions and roundtables."
                mb="0"
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <List text="Premium quality" />
                  <List text="Tailwind CSS" />
                  <List text="Use for lifetime" />
                </div>
                <div className="space-y-4">
                  <List text="Next.js" />
                  <List text="Rich documentation" />
                  <List text="Developer friendly" />
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative mx-auto aspect-square max-w-[500px]">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-2xl"></div>
                
                {/* Image Container */}
                <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/50">
                  <Image
                    src="/images/about/about-image.svg"
                    alt="about-image"
                    fill
                    className="mx-auto max-w-full drop-shadow-lg dark:hidden lg:mr-0"
                  />
                  <Image
                    src="/images/about/about-image-dark.svg"
                    alt="about-image"
                    fill
                    className="mx-auto hidden max-w-full drop-shadow-lg dark:block lg:mr-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSectionOne;
