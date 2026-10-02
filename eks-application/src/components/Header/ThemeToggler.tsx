"use client";

import { useEffect, useState } from "react";

const ALL_COLOR_THEMES = [
  "blue", "green", "purple", "orange", "red", "teal", "pink", "indigo", "yellow", "slate", "rose", "violet", "amber"
];

const ThemeToggler = () => {
  const [theme, setTheme] = useState("dark");
  const [colorTheme, setColorTheme] = useState("blue");

  useEffect(() => {
    const savedTheme = "dark";
    const savedColorTheme = localStorage.getItem("colorTheme") || "blue";
    setTheme(savedTheme);
    setColorTheme(savedColorTheme);

    ALL_COLOR_THEMES.forEach((t) => {
      document.documentElement.classList.remove(`theme-${t}`);
    });
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
    document.documentElement.classList.add(`theme-${savedColorTheme}`);
  }, []);

  const toggleTheme = () => {
    const newTheme = "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.add("dark");
  };

  const toggleColorTheme = () => {
    // Cycle through all color themes
    const currentIdx = ALL_COLOR_THEMES.indexOf(colorTheme);
    const newColorTheme = ALL_COLOR_THEMES[(currentIdx + 1) % ALL_COLOR_THEMES.length];
    setColorTheme(newColorTheme);
    localStorage.setItem("colorTheme", newColorTheme);
    // Remove all color theme classes
    ALL_COLOR_THEMES.forEach((t) => {
      document.documentElement.classList.remove(`theme-${t}`);
    });
    // Add new theme class
    document.documentElement.classList.add(`theme-${newColorTheme}`);
  };

  return (
    <div className="flex items-center space-x-1 sm:space-x-2">
      {/* Color Theme Toggle */}
      {/* <button
        onClick={toggleColorTheme}
        className="group relative p-1.5 sm:p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:scale-110 transition-transform shadow"
        title={`Switch to ${colorTheme === "blue" ? "green" : "blue"} theme`}
      >
        <div className="relative w-5 h-5 sm:w-6 sm:h-6">
      
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            colorTheme === "blue" ? "opacity-100" : "opacity-40"
          }`}>
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          
       
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            colorTheme === "green" ? "opacity-100" : "opacity-40"
          }`}>
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" />
      </svg>
          </div>
        </div>
      </button> */}

      {/* Dark/Light Mode Toggle */}
      <button
        onClick={toggleTheme}
        className="group relative p-1.5 sm:p-2 rounded-full bg-gray-100 dark:bg-primary-300 hover:scale-110 transition-transform shadow"
        title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        <div className="relative w-5 h-5 sm:w-6 sm:h-6">
          {/* Sun Icon */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            theme === "light" ? "opacity-100" : "opacity-40"
          }`}>
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          
          {/* Moon Icon */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            theme === "dark" ? "opacity-100" : "opacity-40"
          }`}>
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" />
      </svg>
          </div>
        </div>
    </button>
    </div>
  );
};

export default ThemeToggler;
