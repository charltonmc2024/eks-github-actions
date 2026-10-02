import ScrollUp from "@/components/Common/ScrollUp";
import ContactSupport from "@/components/Support";
import Features from "@/components/Features";
import Hero from "@/components/Hero";
import Pricing from "@/components/Pricing";
import Problem from "@/components/Problem";
import Solution from "@/components/Solution";
import ThemePreview from "@/components/Common/ThemePreview";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Erudition Platform - Adaptive Testing Solutions for Education",
  description: "Making test prep more adaptable with AI-powered adaptive testing, real-time feedback, and personalized learning experiences for students and teachers.",
  // other metadata
};

export default function Home() {
  return (
    <>
      {/* <ScrollUp /> */}
      <Hero />
      <Features />
      <Solution />
      <Pricing />
      <ContactSupport />
      <ThemePreview />
    </>
  );
}
