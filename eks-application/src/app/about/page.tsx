import AboutSectionOne from "@/components/About/AboutSectionOne";
import AboutSectionTwo from "@/components/About/AboutSectionTwo";
import AboutSectionHistory from "@/components/About/AboutSectionHistory";
import Breadcrumb from "@/components/Common/Breadcrumb";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Page",
  description: "This is About Page for EruditionSolution Nextjs Template",
  // other metadata
};

const AboutPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="About Page"
        description=""
      />
      {/* <AboutSectionOne /> */}
      {/* <AboutSectionTwo /> */}
      <AboutSectionHistory />
    </>
  );
};

export default AboutPage;
