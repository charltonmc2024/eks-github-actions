import { Metadata } from "next";
import ProductDetail from "@/components/ProductDetail";

export const metadata: Metadata = {
  title: "STAAR Algebra I | Erudition Solutions",
  description:
    "Learn about the Texas STAAR Algebra I assessment and how Erudition Solutions supports practice tests, item analysis, and progress monitoring.",
};

export default function StaarProductPage() {
  return (
    <ProductDetail
      title="STAAR Algebra I"
      subtitle="Texas State of Texas Assessments of Academic Readiness—built to measure Algebra I readiness for high school students."
      overview={[
        "STAAR (State of Texas Assessments of Academic Readiness) is Texas’s statewide standardized testing program, administered by the Texas Education Agency (TEA). For high school mathematics, Algebra I is an end-of-course (EOC) assessment that measures how well students have mastered the Texas Essential Knowledge and Skills (TEKS) for Algebra I.",
        "Students typically take STAAR Algebra I after completing the Algebra I course. Results help schools, teachers, and families understand whether students are prepared for the next level of math coursework and contribute to state accountability reporting. The assessment includes a mix of question types designed to evaluate conceptual understanding, procedural skill, and problem solving—not just memorization.",
        "Erudition Solutions aligns practice experiences to STAAR Algebra I expectations so teachers can prepare students with realistic, classroom-ready assessments.",
      ]}
      sections={[
        {
          title: "Six Full Tests for Algebra I",
          body: "Erudition provides six complete Algebra I practice tests modeled on STAAR expectations. Each full test set gives students multiple opportunities to experience exam-length practice, build stamina, and strengthen the skills measured on the Algebra I EOC.",
        },
        {
          title: "Item Analysis to Identify Strengths and Weaknesses",
          body: "Item analysis breaks performance down by question and skill area so teachers can see which TEKS-aligned concepts students have mastered and where they need more support. Instead of only seeing a total score, educators can target instruction to the specific Algebra I topics that matter most.",
        },
        {
          title: "Data Dashboard for Progress Monitoring",
          body: "A data dashboard is a visual reporting view that brings student and class performance together in one place. For progress monitoring, it helps teachers track how scores and skill mastery change over time across practice tests—highlighting growth, persistent gaps, and trends at the student or group level so instructional decisions stay timely and evidence-based.",
        },
      ]}
    />
  );
}
