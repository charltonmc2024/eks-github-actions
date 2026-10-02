import React from "react";
import Link from "next/link";
import Image from "next/image";

interface TestimonialCardProps {
  image: string;
  name: string;
  link?: string;
  badgeText?: string; // "CONTRIBUTOR" or "ADVISOR"
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  image,
  name,
  link,
  badgeText,
}) => {
  const CardContent = () => (
    <div className="group relative text-white rounded-2xl shadow-lg border border-[#0A688C]/40 overflow-hidden transition-all duration-300 flex flex-col h-full cursor-pointer items-center justify-center p-6 hover:-translate-y-1">
      {/* Subtle Sparkle/Icon */}
      <div className="absolute top-4 right-4 z-20">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-30">
          <circle cx="9" cy="9" r="8" stroke="#7C3AED" strokeWidth="1.2" />
          <circle cx="9" cy="9" r="2" fill="#7C3AED" />
        </svg>
      </div>
      {/* Badge removed per request */}
      {/* Avatar with soft ring */}
      <div className="relative w-20 h-20 mb-3 flex items-center justify-center z-20">
        <Image src={image} alt={name} width={80} height={80} className="object-cover w-20 h-20 rounded-full border-2 border-white shadow-md ring-2 ring-white/20" />
      </div>
      <div className="text-lg font-semibold text-white text-center mb-1 z-20">{name}</div>
      {/* Action Button: Info Icon, appears on hover */}
      <button
        type="button"
        className="absolute bottom-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-[#0A688C] rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/40"
        aria-label="More Info"
        tabIndex={-1}
      >
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01" />
        </svg>
      </button>
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block">
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
};

// Add the gloss animation to global styles if not present
// @layer utilities {
//   @keyframes gloss-move {
//     0% { transform: translateX(-100%) rotate(12deg); }
//     100% { transform: translateX(100%) rotate(12deg); }
//   }
//   .animate-gloss-move {
//     animation: gloss-move 1.2s linear forwards;
//   }
// }

export default TestimonialCard; 
