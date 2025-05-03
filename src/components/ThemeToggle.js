import React, { useContext } from "react";
import { Button } from "react-bootstrap";
import { BsSun, BsMoon } from "react-icons/bs";
import { ThemeContext } from "../styles/ThemeContext";

function ThemeToggle() {
  const { darkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <Button variant={darkMode ? "light" : "dark"} onClick={toggleTheme}>
      {darkMode ? <BsSun /> : <BsMoon />}
    </Button>
  );
}

export default ThemeToggle;
