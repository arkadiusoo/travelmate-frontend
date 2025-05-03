import React, { useContext } from "react";
import { ThemeContext } from "../styles/ThemeContext";

function Footer() {
  const { darkMode } = useContext(ThemeContext);

  return (
    <footer
      className={`text-center py-4 mt-5 border-top ${
        darkMode ? "bg-dark text-light" : "bg-light text-dark"
      }`}
    >
      <p className="mb-0">
        &copy; 2025 TravelMate. Wszystkie prawa zastrzeżone.
      </p>
    </footer>
  );
}

export default Footer;
