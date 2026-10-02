import React from "react";

const Solution = () => {
  return (
    <section id="solution" className="relative py-24 md:py-28 lg:py-32 bg-gradient-to-b from-primary to-primary">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl animate-fade-in">
            Testing Students Knowledge and Skills the Erudition Way
          </h2>
          <p className="mb-8 text-xl leading-relaxed text-white/90 animate-fade-in" style={{ animationDelay: "200ms" }}>
            Test-creation is only one of the many responsibilities that a classroom teacher faced in the classroom. As such it demands sufficient amount of teacher’s time and effort.
          </p>
          <p className="text-3xl font-extrabold text-white animate-fade-in" style={{ animationDelay: "400ms" }}>
            We’ll do it for you!
          </p>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20 blur-3xl"></div>
      </div>
    </section>
  );
};

export default Solution; 
