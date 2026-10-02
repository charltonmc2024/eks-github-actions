import Breadcrumb from "@/components/Common/Breadcrumb";
import ContactSupport from "@/components/ContactSupport";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Erudition Solutions",
  description: "Contact Erudition Solutions for support and inquiries.",
  // other metadata
};

const ContactSupportPage = () => {
  return (
    <>
      <Breadcrumb
        pageName="Contact Us"
        description=""
      />

      <ContactSupport />
    </>
  );
};

export default ContactSupportPage;
