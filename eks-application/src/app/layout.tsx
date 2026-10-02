import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import { Inter } from "next/font/google";
import "../styles/index.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import PageBackground from "@/components/Common/PageBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Erudition Solutions - Adaptive Testing Platform",
  description: "Erudition Platform combines adaptive mechanics, real-time data, and teacher's active assistance to fill critical gaps in assessment ecosystems while improving outcomes for millions of high school students.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className="dark" suppressHydrationWarning lang="en">
      {/*
        <head /> will contain the components returned by the nearest parent
        head.js. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var ALL_COLOR_THEMES = [
                    "blue", "green", "purple", "orange", "red", "teal", "pink", "indigo", "yellow", "slate", "rose", "violet", "amber"
                  ];
                  var savedColorTheme = localStorage.getItem('colorTheme') || 'blue';
                  document.documentElement.classList.add('dark');
                  localStorage.setItem('theme', 'dark');
                  ALL_COLOR_THEMES.forEach(function(t) {
                    document.documentElement.classList.remove('theme-' + t);
                  });
                  document.documentElement.classList.add('theme-' + savedColorTheme);
                } catch (e) {
                  console.log('Theme initialization failed:', e);
                }
              })();
            `,
          }}
        />
      </head>

      <body className={`bg-black ${inter.className}`}>
        <Providers>
          <Header />
          <PageBackground>{children}</PageBackground>
          <Footer />
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}

