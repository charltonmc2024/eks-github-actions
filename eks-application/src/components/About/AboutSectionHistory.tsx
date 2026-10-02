"use client";

import { useState, useEffect } from "react";
import SectionTitle from "../Common/SectionTitle";

const AboutSectionHistory = () => {
  const [showHistory, setShowHistory] = useState(false);
  const [animatedItems, setAnimatedItems] = useState<number[]>([]);

  useEffect(() => {
    if (showHistory) {
      const timer = setTimeout(() => {
        setAnimatedItems([0, 1, 2, 3]);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedItems([]);
    }
  }, [showHistory]);

  const historyData = [
    {
      year: "2022 Journey",
      color: "from-primary to-primary-light",
      events: [
        {
          month: "January",
          content: "Professor Arnold & Yshmael was approached by a colleague of Yshmael to develop a Virtual Webinar Platform for their business whereby they could hosted webinars to other business and government entities."
        },
        {
          month: "April",
          content: "With Professor Arnold's connections, Professor Arnold and Yshmael collaborated to formulate a comprehensive internship program designed for college students. They successfully presented their proposal to Cor Jesu College in Digos City, The Philippines, leading to the formation of a dedicated team of Computer Science students."
        },
        {
          month: "May",
          content: "To develop a Virtual Webinar Platform, Arnold and Yshmael initiated training for the intern team, focusing on Software Development principles using Python and the Agile Software Development process. A high number of students demonstrate their abilities to grasped and applied great potentials in area of Full Stack Development, Software Developers Engineer in Test and Quality Assurance Engineers."
        },
        {
          month: "June",
          content: "All students that completed the internship, received certificates of completions and recommendations from Erudition Solutions, LLC. Several of the newly graduated student received employment offers. Paul Vincent Jor,earned the position of Front-end Developer, hybrid role that combines the visual and interactive aspects of User Experience (UX) design with the technical implementation of Front-end Development. Paul lead the team in translating design concepts into functional, user-friendly web interfaces."
        },
        {
          month: "June",
          content: "Mark Rey Ronolo, earned the position of Back-end Developer. Mark was instrumental in designing and developing a suite of Application Programming Interfaces (APIs) that allow the front-end and other services to communicate with the back-end. He also took on the role of database engineer by designing, implementing and managing database resources."
        }
      ]
    },
    {
      year: "2023 The Journey Continued ...",
      color: "from-secondary to-secondary-light",
      events: [
        {
          month: "January",
          content: "After several intern cycles, Arnold became increasingly frustrated with the Texas high school testing system called the State of Texas Assessments of Academic Readiness (STAAR), and begin to sketch out his idea for improving a student abilities to prepare for the STAAR test for math and science"
        },
        {
          month: "April",
          content: "When Professor Arnold shared a rough sketch of his \"Adaptive Testing Platform\" idea, Yshmael, drawing on his past experience with software startups (like Sun Ray Systems, LLC and New Style Source, LLC), immediately saw its potential. After a brief consideration, both Yshmael and Professor Arnold quickly rallied the team, and our new focus was on formulating a company and fully focusing on developing Professor Arnold's vision."
        },
        {
          month: "June",
          content: "The software development journey continued for Professor Arnold and Yshmael as they strengthened their team. They extended offers to several already-graduated interns, bringing them aboard as part-time Full Stack Developers and Software Development Engineers in Test. This expansion coincided with a complete pivot: their efforts were now fully dedicated to Professor Arnold's Adaptive Testing Platform, moving beyond the Virtual Webinar Platform."
        },
        {
          month: "July",
          content: "Initially, Professor Arnold and Yshmael were overly ambitious, planning over 400 features, services, and functionalities for various school district stakeholders. However, based on their research, they identified a critical need within the standardized testing arena. Their revised goal became to provide teachers with a platform specifically designed to better prepare students for standardized tests in Texas."
        },
        {
          month: "September",
          content: "Jimrie Perez joined the team as a Quality Assurance Engineer immediately become responsible for ensuring that software products meet defined quality standards. He has been instrumental in catching and preventing defects, identify and resolve errors, & verify that the final product aligns with both technical & user requirements. Over a sho Mr. Perepened his development skills and begin to designing, developing, and maintaining automated testing frameworks & scripts to verify software functionality."
        },
        {
          month: "October",
          content: "Khyn Harold Antoque, joined the team as a Full Stack Developer, immediately applying his expertise to build and maintain server-side logic, databases, front-end interfaces, graphics, and APIs. Utilizing languages like Node.js, React, Vue, and Python. Mr. Antoque was instrumental in creating robust and scale-able server-side code and seamlessly integrating it with front-end components. He also laid the essential groundwork and framework for one of EruditionTX's standout features."
        },
        {
          month: "September",
          content: "The team created a road-map to develop a feature rich adaptive testing platform that contained an array of features for a variety of positions in education."
        }
      ]
    },
    {
      year: "2024 The Journey Intensifies ...",
      color: "from-accent to-accent-light",
      events: [
        {
          month: "March",
          content: "Florabelle Ammonraheem, joints the senior leadership team as Director of Quality Assurance and Director of Product Delivery. She is dedicated to ensuring that Erudition Solutions, LLC products and/or services consistently meet high-quality standards, regulatory requirements, and customer expectations. Florabelle Ammonraheem duties span strategic planning, operational oversight, compliance, and continuous improvement."
        },
        {
          month: "April",
          content: "Jessel Gelbolingo Rendon, joined the team as a Financial Officer and took over the roles of handling financial planning, budgeting, payroll, financial reporting and manages company finances. Ms. Jessel has been instrumental in ensuring the accuracy, integrity, and timeliness of all financial reports (e.g., balance sheets, income statements, cash flow statements) and ensuring compliance with accounting standards."
        },
        {
          month: "June",
          content: "The team had marked a milestone by developing a feature reach monolithic platform that was bulky, heavy, rich with features and slow. We needed another pivot, we needed a \"Minimum Viable Product\" that focused on a smaller feature set specifically for core Actors in education. So we pivoted."
        },
        {
          month: "July",
          content: "Dr Billy Uzaka joined the senior leadership team as Chief Security Officer, to give us traction on researching funding, identifying educational compliance and to keep an eye on what was coming out of Austin, Texas. Dr. Billy Uzaka is our Chief Security and Compliance Officer assuring that Erudition Solutions, LLC remains up to date with the current state and local government changes in education."
        },
        {
          month: "August",
          content: "Allan Ninal, joined the team as a Senior Full Stack Developer and immediately assumed responsibility for directing the development team through the entire software development life-cycle. He oversaw design, development, coding, testing, and debugging, ensuring the delivery of high-quality solutions that precisely aligned with project goals and requirements. As lead developer, Mr. Ninal works closely with the Product Owner and business stakeholders to translate business requirements into technic"
        },
        {
          month: "August",
          content: "Paul Vincent Jor transitioned into the pivotal role of our first full-time Full Stack Developer. In this capacity, he was instrumental in the design, development, and maintenance of both the front-end (user interface) and back-end (server, database, business logic) components of the EruditionTx platform. Mr. Jor's comprehensive proficiency in technologies such as React, Vue.js, Node.js, and Python ensured the adherence to the highest standards for code quality and application design."
        },
        {
          month: "September",
          content: "The new road-map was developed to reduced the number of features into a Minimum Viable Product and to re-brand the product from Mathmatters into Erudition. The team also experimented with new technology in an effort to optimize the product platform."
        },
        {
          month: "October",
          content: "Trishia Mae Cagigas, joined the team as a Quality Assurance Engineer to assist in establish and maintain testing standards, procedures, and best practices for developers and other team members to follow. Ms. Cagigas has been instrumental in suggesting enhancements to product features and testing processes, aiming for greater efficiency and user satisfaction."
        }
      ]
    },
    {
      year: "2025 The Journey Settles ...",
      color: "from-primary-dark to-primary",
      events: [
        {
          month: "January",
          content: "Carol Wu, was appointed to the executive team as Director of Information Technology, where she assumed responsibility for designing, developing, and maintaining automated testing frameworks and scripts crucial for verifying software functionality and performance. Ms. Wu collaborative efforts with developers in code review and issue identification have ensured comprehensive test coverage, leading to a substantial improvement in the organization's technology infrastructure"
        },
        {
          month: "March",
          content: "The team had marked a milestone by redeveloping over sixty percent of the proposed features for the Erudition Solutions MVP."
        }
      ]
    }
  ];

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Modern Background with Gradient */}
      <div className="absolute inset-0 bg-primary">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-primary/70"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-primary/70"></div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-accent/10 to-primary-light/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-r from-primary-light/10 to-accent/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="container relative z-10">
        <div className="mx-auto max-w-6xl text-center">
        <div className="flex justify-center">
          <SectionTitle
            title="Our History"
            paragraph="Discover the journey of Erudition Solutions from its inception to becoming a leading educational technology platform."
            mb="44px"
          />
          </div>
          <div className="mb-16">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="group relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/80 py-5 px-10 text-center text-lg font-bold text-white shadow-2xl transition-all duration-500 hover:shadow-primary/25 hover:scale-105 lg:px-12 overflow-hidden"
            >
              {/* Button Background Animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <span className="relative mr-3">
                {showHistory ? (
                  <svg className="h-6 w-6 transition-all duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 transition-all duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </span>
              <span className="relative">
                {showHistory ? "Hide Our History" : "View Our History"}
              </span>
            </button>
          </div>

          {showHistory && (
            <div className="space-y-24">
              {historyData.map((yearData, yearIndex) => (
                <div 
                  key={yearIndex} 
                  className={`relative transition-all duration-1000 ${
                    animatedItems.includes(yearIndex) 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${yearIndex * 200}ms` }}
                >
                  {/* Year Badge with Glassmorphism */}
                  <div className="mb-16 flex justify-center">
                    <div className="relative group">
                      {/* Glow Effect */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${yearData.color} rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500`}></div>
                      
                      {/* Glassmorphism Badge */}
                      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl px-12 py-6 shadow-2xl group-hover:shadow-3xl transition-all duration-500">
                        <h3 className="text-3xl font-bold text-white drop-shadow-lg">
                          {yearData.year}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Modern Timeline */}
                  <div className="relative">
                    {/* Timeline Line with Gradient */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-primary/50 via-primary/30 to-primary/10 h-full rounded-full shadow-lg"></div>
                    
                    <div className="space-y-16">
                      {yearData.events.map((event, eventIndex) => (
                        <div 
                          key={eventIndex} 
                          className={`relative flex items-center ${
                            eventIndex % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                          }`}
                        >
                          {/* Timeline Dot with Pulse */}
                          <div className="absolute left-1/2 transform -translate-x-1/2 z-20">
                            <div className="relative">
                              <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-75"></div>
                              <div className="relative w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full border-4 border-white shadow-2xl dark:border-gray-800"></div>
                            </div>
                          </div>

                          {/* Content Card with Glassmorphism */}
                          <div className={`w-5/12 ${eventIndex % 2 === 0 ? 'pr-12 text-right' : 'pl-12 text-left'}`}>
                            <div className="group relative">
                              {/* Card Glow */}
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                              
                              <div className="relative bg-[#0A688C] text-white rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 border border-[#0A688C]/40 group-hover:scale-105">
                                <div className="flex items-center mb-6">
                                  <div className="bg-white/10 p-4 rounded-2xl mr-4 shadow-lg">
                                    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <h4 className="text-2xl font-bold">
                                    {event.month}
                                  </h4>
                                </div>
                                <p className="text-lg leading-relaxed text-white/90">
                                  {event.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
        
        .backdrop-blur-xl {
          backdrop-filter: blur(24px);
        }
      `}</style>
    </section>
  );
};

export default AboutSectionHistory; 
