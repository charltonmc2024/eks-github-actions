import SharePost from "@/components/Our-teams/SharePost";
import TagButton from "@/components/Our-teams/TagButton";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Team | EruditionSolution",
  description: "Meet the visionary leaders driving innovation in educational technology at Erudition Solutions",
};

const TeamOverviewPage = () => {
  const teamMembers = [
    {
      id: "arnold",
      name: "Arnulfo Ninal ",
      role: "Chief Executive Officer / Chief Product Owner",
      shortRole: "CEO",
      image: "/images/members/arnold.png",
      description: "Over 32 years of distinguished experience in mathematics and science education at both the secondary and collegiate levels.",
      link: "/our-team-details/arnold-details"
    },
    {
      id: "billy",
      name: "Biddolph Billy Uzaka Ph.D",
      role: "Chief Operating Officer / Co-Owner",
      shortRole: "COO",
      image: "/images/members/billy.png",
      description: "Distinguished technology leader with over 15 years of experience in software engineering, artificial intelligence, and educational technology platforms.",
      link: "/our-team-details/billy-details"
    },

    {
      id: "ysh",
      name: "Yshmael Ammonraheem",
      role: "Chief Executive Officer / Chief Executive Officer / Chief Technical Officer / Co-Owner / Co-Owner",
      shortRole: "CEO",
      image: "/images/members/ysh.png",
      description: "Yshmael is a visionary technology leader with over 30 years of experience in the design and development of enterprise systems.",
      link: "/our-team-details/ysh-details"
    },
    {
      id: "flo",
      name: "Florabelle Ammonraheem",
      role: "Director of QA - Software Delivery/Co-Owner",
      shortRole: "DoQA",
      image: "/images/members/flo.png",
      description: "Yshmael is a visionary technology leader with over 30 years of experience in the design and development of enterprise systems.",
      link: "/our-team-details/flo-details"
    }
  ];

  return (
    <>
      {/* Hero Section with Animated Background */}
      <section className="relative pt-[120px] pb-[80px] min-h-screen overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
          <div className="absolute inset-0 opacity-50" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-blue-400/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-blue-600/10 rounded-full blur-xl animate-pulse delay-2000"></div>

        <div className="container relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Enhanced Header */}
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-primary dark:text-primary rounded-full text-sm font-medium mb-6">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Leadership Team
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
                Meet Our
                <span className="block text-primary">
                  Visionary Leaders
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
                Driving innovation in educational technology with decades of combined expertise and passion for transforming learning experiences.
              </p>
              
              {/* Stats */}
              <div className="flex justify-center items-center gap-8 mt-12">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary dark:text-primary">32+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Years Experience</div>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary dark:text-primary">15+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tech Leadership</div>
                </div>
                <div className="w-px h-8 bg-gray-300 dark:bg-gray-600"></div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary dark:text-primary">100%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Dedication</div>
                </div>
              </div>
            </div>

            {/* Enhanced Team Members Grid */}
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {teamMembers.map((member, index) => (
                <div 
                  key={member.id}
                  className="group relative"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  {/* Card */}
                  <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-0 shadow-2xl hover:shadow-3xl dark:shadow-gray-900/50 transition-all duration-500 flex flex-col h-full group-hover:-translate-y-2 border border-gray-100 dark:border-gray-700 overflow-hidden">
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Image Section */}
                    <div className="relative aspect-[4/5] overflow-hidden rounded-t-3xl">
                      <Image 
                        src={member.image} 
                        alt={`${member.name} - ${member.role}`}
                        fill
                        className="object-cover object-top w-full h-full transition-transform duration-700 group-hover:scale-110" 
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      
                      {/* Overlay Gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Role Badge */}
                      <div className="absolute bottom-4 left-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg tracking-wide transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        {member.shortRole}
                      </div>
                      
                      {/* Social Links (appear on hover) */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                        <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                          </svg>
                        </button>
                        <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Content Section */}
                    <div className="relative flex-1 flex flex-col px-8 py-8">
                      <h2 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-3 leading-tight">
                        {member.name.split(' ').map((part, i) => (
                          <span key={i} className={i === member.name.split(' ').length - 1 ? "text-primary" : ""}>
                            {part}{' '}
                          </span>
                        ))}
                      </h2>
                      
                      {/* Animated Divider */}
                      <div className="w-16 h-1 bg-gradient-to-r from-primary to-secondary rounded-full mb-6 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                      
                      <p className="text-sm md:text-base text-primary dark:text-primary font-semibold uppercase tracking-widest mb-4 flex items-center justify-center gap-2 text-center">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 01-8 0m8 0a4 4 0 00-8 0m8 0V5a4 4 0 00-8 0v2m8 0a4 4 0 01-8 0" />
                        </svg>
                        {member.role}
                      </p>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-6 flex-1 leading-relaxed">
                        {member.description}
                      </p>
                      
                      {/* Enhanced CTA Button */}
                      <Link 
                        href={member.link}
                        className="group/btn inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-lg text-white font-bold rounded-xl shadow-md transition-all duration-300 w-full mt-auto overflow-hidden relative"
                      >
                        <span className="relative z-10 flex items-center">
                          View Full Profile
                          <svg className="w-5 h-5 ml-2 transform group-hover/btn:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                        <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                      </Link>
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full opacity-0 group-hover:opacity-20 blur-sm transition-all duration-500"></div>
                  <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full opacity-0 group-hover:opacity-20 blur-sm transition-all duration-500 delay-200"></div>
                </div>
              ))}
            </div>
            
            {/* Call to Action Section */}
            <div className="text-center mt-20">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl p-12 border border-gray-100 dark:border-gray-700">
                <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Ready to Transform Education?
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                  Join our team of innovators and help shape the future of educational technology.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link 
                    href="/contact"
                    className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Get in Touch
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </Link>
                  <Link 
                    href="/careers"
                    className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-primary dark:text-gray-300 hover:border-primary hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 font-bold rounded-xl transition-all duration-300"
                  >
                    View Careers
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default TeamOverviewPage; 
