import React, { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    updateBodyClass(saved);
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode);
    updateBodyClass(newMode);
  };

  const updateBodyClass = (isDark) => {
    const body = document.body;
    body.classList.toggle("bg-dark", isDark);
    body.classList.toggle("text-light", isDark);
    body.classList.toggle("bg-light", !isDark);
    body.classList.toggle("text-dark", !isDark);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
