import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom"; // ✅ Add navigation
import { useAuth } from "../contexts/AuthContext"; // ✅ Use AuthContext
import ThemeToggle from "./ThemeToggle";
import logo from "../assets/logo.png";

function NavigationBar({ onLoginClick }) {
  const { isAuthenticated, logout } = useAuth(); // ✅ Use AuthContext
  const navigate = useNavigate(); // ✅ For navigation
  const location = useLocation(); // ✅ For active link highlighting

  // Helper to check if current page is active
  const isActive = (path) => location.pathname === path;

  // ✅ PROPER LOGOUT HANDLER
  const handleLogout = () => {
    logout(); // Use AuthContext logout
    navigate("/"); // Navigate to home
  };

  return (
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand
              onClick={() => navigate("/dashboard")} // ✅ Make clickable
              style={{ cursor: "pointer" }} // ✅ Show it's clickable
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

              {/* ✅ USEFUL NAVIGATION FOR LOGGED-IN USERS */}
              {isAuthenticated ? (
                  <>
                    <Nav.Link
                        onClick={() => navigate("/dashboard")}
                        className={`text-light ${isActive("/dashboard") ? "fw-bold" : ""}`}
                        style={{ cursor: "pointer" }}
                    >
                      Dashboard
                    </Nav.Link>

                    <Nav.Link
                        onClick={() => navigate("/trips")}
                        className={`text-light ${isActive("/trips") ? "fw-bold" : ""}`}
                        style={{ cursor: "pointer" }}
                    >
                      Wycieczki
                    </Nav.Link>

                    <Nav.Link
                        onClick={() => navigate("/budget")}
                        className={`text-light ${isActive("/budget") ? "fw-bold" : ""}`}
                        style={{ cursor: "pointer" }}
                    >
                      Budżet
                    </Nav.Link>

                    <Nav.Link
                        onClick={() => navigate("/participants")}
                        className={`text-light ${isActive("/participants") ? "fw-bold" : ""}`}
                        style={{ cursor: "pointer" }}
                    >
                      Uczestnicy
                    </Nav.Link>

                    <Nav.Link
                        as="button"
                        onClick={handleLogout}
                        className="text-light"
                    >
                      Wyloguj
                    </Nav.Link>
                  </>
              ) : (
                  <>
                    <Nav.Link
                        as="button"
                        onClick={onLoginClick}
                        className="text-light"
                    >
                      Logowanie
                    </Nav.Link>
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