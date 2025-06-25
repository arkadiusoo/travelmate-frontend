import React from "react";
import { Navbar, Nav, Container, Button } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";
import logo from "../assets/logo.png";

function NavigationBar({ onLoginClick }) {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to check if current page is active
  const isActive = (path) => location.pathname === path;

  // ✅ PROPER LOGOUT HANDLER
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // ✅ FIXED NAVIGATION HANDLERS
  const handleNavigation = (path, event) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(path);
  };

  return (
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand
              onClick={(e) => handleNavigation("/dashboard", e)}
              style={{ cursor: "pointer" }}
              className="d-flex align-items-center gap-2"
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

              {isAuthenticated ? (
                  <>
                    {/* ✅ FIXED: Use Button instead of Nav.Link */}
                    <Button
                        variant="link"
                        onClick={(e) => handleNavigation("/dashboard", e)}
                        className={`text-light p-2 text-decoration-none ${isActive("/dashboard") ? "fw-bold" : ""}`}
                        style={{ border: 'none' }}
                    >
                      Dashboard
                    </Button>

                    <Button
                        variant="link"
                        onClick={(e) => handleNavigation("/trips", e)}
                        className={`text-light p-2 text-decoration-none ${isActive("/trips") ? "fw-bold" : ""}`}
                        style={{ border: 'none' }}
                    >
                      Wycieczki
                    </Button>

                    <Button
                        variant="link"
                        onClick={(e) => handleNavigation("/budget", e)}
                        className={`text-light p-2 text-decoration-none ${isActive("/budget") ? "fw-bold" : ""}`}
                        style={{ border: 'none' }}
                    >
                      Budżet
                    </Button>

                    <Button
                        variant="link"
                        onClick={(e) => handleNavigation("/participants", e)}
                        className={`text-light p-2 text-decoration-none ${isActive("/participants") ? "fw-bold" : ""}`}
                        style={{ border: 'none' }}
                    >
                      Uczestnicy
                    </Button>

                    <Button
                        variant="link"
                        onClick={handleLogout}
                        className="text-light p-2 text-decoration-none"
                        style={{ border: 'none' }}
                    >
                      Wyloguj
                    </Button>
                  </>
              ) : (
                  <>
                    <Button
                        variant="link"
                        onClick={onLoginClick}
                        className="text-light p-2 text-decoration-none"
                        style={{ border: 'none' }}
                    >
                      Logowanie
                    </Button>
                  </>
              )}

              <ThemeToggle />
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
  );
}

export default NavigationBar;