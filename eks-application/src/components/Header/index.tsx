"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggler from "./ThemeToggler";
import menuData from "./menuData";
import ThemePreview from "../Common/ThemePreview";

const Header = () => {
  // Navbar toggle
  const [navbarOpen, setNavbarOpen] = useState(false);
  const navbarToggleHandler = () => {
    setNavbarOpen(!navbarOpen);
  };

  // Sticky Navbar
  const [sticky, setSticky] = useState(false);
  const handleStickyNavbar = () => {
    if (window.scrollY >= 80) {
      setSticky(true);
    } else {
      setSticky(false);
    }
  };
  useEffect(() => {
    window.addEventListener("scroll", handleStickyNavbar);
  });

  // submenu handler
  const [openIndex, setOpenIndex] = useState(-1);
  const handleSubmenu = (index) => {
    if (openIndex === index) {
      setOpenIndex(-1);
    } else {
      setOpenIndex(index);
    }
  };

  const usePathName = usePathname();

  return (
    <>
      <header
        className={`bg-[#0A688C] dark:bg-gray-900/80 shadow-lg fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          sticky ? "border-b border-gray-200 dark:border-gray-700" : ""
        }`}
      >
        <div className="container mx-auto flex items-center justify-between py-2 px-4">
          {/* Logo with wordmark */}
          <Link href="/" className="flex items-center gap-3 sm:gap-4 shrink-0 min-w-0">
            <Image
              src="/images/logo/logo.png"
              alt="EruditionSys Platform"
              width={1183}
              height={896}
              priority
              quality={100}
              sizes="(max-width: 640px) 56px, (max-width: 1024px) 72px, 80px"
              className="h-12 w-auto sm:h-14 md:h-16 lg:h-[4.5rem] object-contain shrink-0"
            />
            <span className="flex min-w-0 flex-col justify-center text-white">
              <span className="w-fit max-w-full">
                <span className="block text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-tight tracking-tight truncate">
                  <span className="text-sky-300">E</span>rudition<span className="text-sky-300">S</span>ys{" "}
                  <span className="text-sky-300">P</span>latform
                </span>
                <span className="mt-0.5 block h-px w-full bg-white/90" aria-hidden="true" />
              </span>
              <span className="mt-0.5 text-[9px] sm:text-[10px] md:text-xs font-semibold leading-snug tracking-wide text-white/95">
                Teacher-Designed Student-Centered
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-8">
            {menuData.map((menuItem, index) => (
              <div key={index} className="relative group">
                <Link
                  href={menuItem.path || "#"}
                  aria-current={usePathName === menuItem.path ? "page" : undefined}
                  className={`relative inline-flex items-center px-4 py-2 rounded-xl text-base font-medium transition-all duration-200 ${
                    usePathName === menuItem.path
                      ? "bg-primary text-white shadow-md ring-1 ring-secondary/30"
                      : "text-white dark:text-gray-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {menuItem.title}
                </Link>
                
                {/* Desktop Submenu */}
                {menuItem.submenu && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      {menuItem.submenu.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          href={subItem.path}
                          className="block px-4 py-2 text-sm text-primary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Theme Toggle */}
          <div className="flex items-center space-x-2">
            {/* <ThemeToggler /> */}
            {/* <div className="hidden lg:block">
              <ThemePreview />
            </div> */}

            <button
              onClick={navbarToggleHandler}
              className="lg:hidden p-2 rounded-md text-white dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {navbarOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out ${
            navbarOpen
              ? "max-h-screen opacity-100 visible"
              : "max-h-0 opacity-0 invisible"
          }`}
        >
          <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg max-h-[80vh] overflow-y-auto">
            <nav className="container mx-auto px-4 py-4">
              <div className="space-y-2">
                {menuData.map((menuItem, index) => (
                  <div key={index}>
                    <Link
                      href={menuItem.path || "#"}
                      onClick={() => setNavbarOpen(false)}
                      aria-current={usePathName === menuItem.path ? "page" : undefined}
                      className={`block py-3 px-4 rounded-xl text-base font-medium transition-all ${
                        usePathName === menuItem.path
                          ? "bg-secondary text-white shadow-md ring-1 ring-secondary/30"
                          : "text-secondary dark:text-gray-200 hover:bg-secondary/10"
                      }`}
                    >
                      {menuItem.title}
                    </Link>
                    
                    {/* Mobile Submenu */}
                    {menuItem.submenu && (
                      <div className="ml-4 mt-2 space-y-1">
                        {menuItem.submenu.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            href={subItem.path}
                            onClick={() => setNavbarOpen(false)}
                            className="block py-2 px-4 text-sm text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                          >
                            {subItem.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </header>
      
      {/* Overlay for mobile menu */}
      {navbarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setNavbarOpen(false)}
        />
      )}
    </>
  );
};

export default Header;
