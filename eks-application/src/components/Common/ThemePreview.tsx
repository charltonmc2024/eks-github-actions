"use client";

import { useState, useEffect, useRef } from "react";

const ThemePreview = () => {
  const [currentTheme, setCurrentTheme] = useState("blue");
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedColorTheme = localStorage.getItem("colorTheme") || "blue";
    setCurrentTheme(savedColorTheme);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setShowPanel(false);
      }
    }
    if (showPanel) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPanel]);

  const themes = [
    {
      name: "Blue",
      value: "blue",
      primary: "#003754",
      secondary: "#1e40af",
      accent: "#0ea5e9",
      description: "Professional blue theme - perfect for corporate and educational platforms",
      icon: "🎨"
    },
    {
      name: "Green",
      value: "green", 
      primary: "#059669",
      secondary: "#065f46",
      accent: "#10b981",
      description: "Fresh green theme - great for growth and nature-focused applications",
      icon: "🌱"
    },
    {
      name: "Purple",
      value: "purple",
      primary: "#8b5cf6",
      secondary: "#6d28d9",
      accent: "#d946ef",
      description: "Elegant purple theme - creative and modern for standout designs",
      icon: "✨"
    },
    {
      name: "Orange",
      value: "orange",
      primary: "#f59e42",
      secondary: "#f97316",
      accent: "#fbbf24",
      description: "Energetic orange theme - vibrant and friendly for dynamic brands",
      icon: "🔥"
    },
    {
      name: "Red",
      value: "red",
      primary: "#ef4444",
      secondary: "#dc2626",
      accent: "#fb7185",
      description: "Bold red theme - passionate and attention-grabbing for impact",
      icon: "❤️"
    },
    {
      name: "Teal",
      value: "teal",
      primary: "#0d9488",
      secondary: "#0f766e",
      accent: "#06b6d4",
      description: "Modern teal theme - tech-focused and sophisticated for digital platforms",
      icon: "💻"
    },
    {
      name: "Pink",
      value: "pink",
      primary: "#ec4899",
      secondary: "#be185d",
      accent: "#f472b6",
      description: "Soft pink theme - friendly and approachable for community-focused apps",
      icon: "🌸"
    },
    {
      name: "Indigo",
      value: "indigo",
      primary: "#4f46e5",
      secondary: "#3730a3",
      accent: "#6366f1",
      description: "Trustworthy indigo theme - professional and reliable for business platforms",
      icon: "🏢"
    },
    {
      name: "Yellow",
      value: "yellow",
      primary: "#eab308",
      secondary: "#ca8a04",
      accent: "#facc15",
      description: "Bright yellow theme - optimistic and energetic for creative projects",
      icon: "⭐"
    },
    {
      name: "Slate",
      value: "slate",
      primary: "#475569",
      secondary: "#334155",
      accent: "#64748b",
      description: "Minimal slate theme - clean and sophisticated for modern interfaces",
      icon: "⚡"
    },
    {
      name: "Rose",
      value: "rose",
      primary: "#f43f5e",
      secondary: "#be123c",
      accent: "#fb7185",
      description: "Warm rose theme - inviting and passionate for lifestyle applications",
      icon: "🌹"
    },
    {
      name: "Violet",
      value: "violet",
      primary: "#7c3aed",
      secondary: "#5b21b6",
      accent: "#a78bfa",
      description: "Creative violet theme - artistic and innovative for design-focused platforms",
      icon: "🎭"
    },
    {
      name: "Amber",
      value: "amber",
      primary: "#f59e0b",
      secondary: "#d97706",
      accent: "#fbbf24",
      description: "Energetic amber theme - warm and dynamic for engaging user experiences",
      icon: "🌟"
    }
  ];

  const applyTheme = (themeValue: string) => {
    setCurrentTheme(themeValue);
    localStorage.setItem("colorTheme", themeValue);
    document.documentElement.classList.remove("theme-blue", "theme-green", "theme-purple", "theme-orange", "theme-red", "theme-teal", "theme-pink", "theme-indigo", "theme-yellow", "theme-slate", "theme-rose", "theme-violet", "theme-amber");
    document.documentElement.classList.add(`theme-${themeValue}`);
    setShowPanel(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* <button
        className="group flex items-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-sm font-semibold text-primary dark:text-gray-200 hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-300 shadow-sm hover:shadow-md border border-gray-200/50 dark:border-gray-600/50"
        onClick={() => setShowPanel((v) => !v)}
        title="Change Theme"
        type="button"
      >
        <div className="relative mr-3">
          <svg className="w-5 h-5 text-primary transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" />
            <circle cx="15.5" cy="10.5" r="1.5" fill="currentColor" />
            <circle cx="12" cy="15.5" r="1.5" fill="currentColor" />
          </svg>
        </div>
    
        <svg className={`w-4 h-4 transition-transform duration-300 ${showPanel ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button> */}
      
      {showPanel && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 z-50 overflow-hidden max-h-[80vh]">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-4 sm:px-6 py-4 border-b border-gray-200/50 dark:border-gray-600/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Choose Your Theme
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Customize your experience with our beautiful color themes
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <div className="w-3 h-3 rounded-full bg-secondary"></div>
                <div className="w-3 h-3 rounded-full bg-accent"></div>
              </div>
            </div>
          </div>

          {/* Themes Grid */}
          <div className="max-h-96 overflow-y-auto p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => applyTheme(theme.value)}
                  className={`group relative p-3 sm:p-4 rounded-xl transition-all duration-300 text-left border-2 hover:scale-[1.02] ${
                    currentTheme === theme.value
                      ? "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/50 shadow-lg shadow-primary/20"
                      : "bg-gray-50/50 dark:bg-gray-800/50 border-transparent hover:border-primary/30 hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
                  }`}
                >
                  {/* Active indicator */}
                  {/* {currentTheme === theme.value && (
                    <div className="absolute top-2 sm:top-3 right-2 sm:right-3 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  )} */}
                  
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    {/* Theme Icon */}
                    <div className="text-xl sm:text-2xl">{theme.icon}</div>
                    
                    {/* Theme Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          {theme.name}
                        </h4>
                        {currentTheme === theme.value && (
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                        {theme.description}
                      </p>
                      
                      {/* Color Palette */}
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div 
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg shadow-sm border border-white/20"
                            style={{ backgroundColor: theme.primary }}
                            title="Primary"
                          ></div>
                          <div 
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg shadow-sm border border-white/20"
                            style={{ backgroundColor: theme.secondary }}
                            title="Secondary"
                          ></div>
                          <div 
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg shadow-sm border border-white/20"
                            style={{ backgroundColor: theme.accent }}
                            title="Accent"
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                          Color palette
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-t border-gray-200/50 dark:border-gray-600/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="hidden sm:block">13 beautiful themes available</span>
              <span className="sm:hidden">13 themes</span>
              <span>Click to apply</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemePreview; 
