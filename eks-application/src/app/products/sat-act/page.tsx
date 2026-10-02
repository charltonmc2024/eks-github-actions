import { Metadata } from "next";
import ProductDetail from "@/components/ProductDetail";

export const metadata: Metadata = {
  title: "SAT/ACT Math | Erudition Solutions",
  description:
    "Learn about SAT and ACT math assessments and how Erudition Solutions supports full practice tests and step-by-step concept explanations.",
};

export default function SatActProductPage() {
  return (
    <ProductDetail
      title="SAT / ACT Math"
      subtitle="College admissions math preparation for the SAT and ACT—focused practice that builds speed, accuracy, and concept mastery."
      overview={[
        "The SAT and ACT are widely used college admissions exams. Both include substantial mathematics sections that assess algebra, problem solving, data analysis, and advanced math topics students encounter in high school. Strong math performance can expand college options and scholarship opportunities.",
        "SAT Math emphasizes algebra, advanced math, problem-solving, and data analysis, with questions that often reward clear reasoning and efficient strategies. ACT Math covers a broad range of high school math—pre-algebra through trigonometry—with a faster pacing expectation across more question types.",
        "Erudition Solutions helps students prepare for both exams with full practice tests and explanations that clarify the major concepts behind each problem type.",
      ]}
      sections={[
        {
          title: "Four Full Tests for SAT/ACT Practice",
          body: "Erudition provides four complete SAT/ACT math practice tests. Full-length practice helps students experience realistic timing and question difficulty, compare growth across attempts, and build the stamina needed for exam day.",
        },
        {
          title: "Detailed Step-by-Step Explanations",
          body: "For each major concept tested on SAT and ACT math, Erudition includes detailed step-by-step explanations. These walkthroughs show the reasoning and methods behind correct answers so students learn transferable strategies—not just isolated solutions—and can apply the same approaches to new problems.",
        },
      ]}
    />
  );
}
