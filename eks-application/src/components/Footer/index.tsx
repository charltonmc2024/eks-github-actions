import { readFileSync } from "fs";
import { join } from "path";
import Link from "next/link";

const version = readFileSync(join(process.cwd(), "version.txt"), "utf8").trim();

const Footer = () => {
  return (
    <>
      <footer className="dark:bg-primary/60 relative z-3 bg-white py-6">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 text-primary dark:text-white">
            <div className="hidden md:block" aria-hidden="true" />
            <p className="m-0 text-sm font-medium text-center opacity-90">
              &copy; 2026 Erudition Sys, LLC. All rights reserved
            </p>
            <div className="flex items-center justify-center md:justify-end gap-6">
              <Link href="/our-team" className="hover:underline">Erudition Team</Link>
              <Link href="/faq" className="hover:underline">FAQ</Link>
              <span className="text-sm font-medium opacity-90">version: {version}</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
