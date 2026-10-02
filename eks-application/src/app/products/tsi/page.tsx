import { Metadata } from "next";
import ProductDetail from "@/components/ProductDetail";

export const metadata: Metadata = {
  title: "TSI Math | Erudition Solutions",
  description:
    "Learn about the Texas Success Initiative Assessment (TSIA2) Math test and how Erudition Solutions supports practice, item analysis, and step-by-step explanations.",
};

export default function TsiProductPage() {
  return (
    <ProductDetail
      title="TSI Math"
      subtitle="Texas Success Initiative Assessment 2.0 (TSIA2)—college-readiness math placement for Texas students."
      overview={[
        "The Texas Success Initiative Assessment 2.0 (TSIA2) is Texas’s college-readiness placement exam. Colleges and universities use TSIA2 results to determine whether students are ready for college-level coursework or need developmental support. The mathematics portion evaluates quantitative skills that matter for success in credit-bearing college math courses.",
        "TSIA2 Mathematics covers four content categories: Quantitative Reasoning (ratios, proportions, percentages, and linear relationships), Algebraic Reasoning (expressions, equations, inequalities, and functions), Geometric and Spatial Reasoning (shapes, measurement, and coordinate geometry), and Probabilistic and Statistical Reasoning (data, probability, and statistical measures).",
        "Erudition Solutions focuses on TSI Math practice so students can build confidence across those four tested components before sitting for the official assessment.",
      ]}
      sections={[
        {
          title: "Ten Full Tests for TSI Math Practice",
          body: "Erudition provides ten complete TSI Math practice tests. Full-length sets help students rehearse pacing, question variety, and the range of skills assessed across Quantitative Reasoning, Algebraic Reasoning, Geometric and Spatial Reasoning, and Probabilistic and Statistical Reasoning.",
        },
        {
          title: "Item Analysis by the Four TSI Tested Components",
          body: "Item analysis maps student responses to the four TSIA2 math content categories. Teachers and students can see which component areas are strong and which need targeted review—so practice time goes to the skills that most affect college-readiness placement outcomes.",
        },
        {
          title: "Detailed Step-by-Step Explanations",
          body: "For major concepts tested on TSI Math, Erudition includes detailed step-by-step explanations that show how to approach and solve problems. These walkthroughs reinforce reasoning, reduce guesswork, and help students learn from mistakes instead of only seeing a right or wrong mark.",
        },
      ]}
    />
  );
}
