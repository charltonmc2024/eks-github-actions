import Breadcrumb from "@/components/Common/Breadcrumb";
import ContactSupport from "@/components/Support";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Page",
  description: "This is Support Page for EruditionSolution Nextjs Template",
  // other metadata
};

const SupportPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="Support Page"
        description=""
      />

      <ContactSupport />
    </>
  );
};

export default SupportPage;
