import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";
import logo from "../assets/logo.png";

function NavigationBar({ onLoginClick }) {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleStartClick = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else if (onLoginClick) {
      onLoginClick();
    }
  };

  const handleAboutClick = () => {
    // You can implement an "About" page later
    // For now, just scroll to top or show alert
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
              className="d-flex align-items-center gap-2"
              style={{ cursor: "pointer" }}
          >
            <img
                src={logo}
                alt="Logo"
                height="30"
                style={{ objectFit: "contain" }}
            />
            TravelMate
          </Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse>
            <Nav className="ms-auto d-flex align-items-center gap-2">
              <Nav.Link
                  as="button"
                  onClick={handleStartClick}
                  className="text-light"
              >
                {isAuthenticated ? "Dashboard" : "Start"}
              </Nav.Link>

              <Nav.Link
                  as="button"
                  onClick={handleAboutClick}
                  className="text-light"
              >
                O nas
              </Nav.Link>

              {isAuthenticated ? (
                  <Nav.Link
                      as="button"
                      onClick={handleLogout}
                      className="text-light"
                  >
                    Wyloguj
                  </Nav.Link>
              ) : (
                  <Nav.Link
                      as="button"
                      onClick={onLoginClick}
                      className="text-light"
                  >
                    Logowanie
                  </Nav.Link>
              )}

              <ThemeToggle />
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
  );
}

export default NavigationBar;