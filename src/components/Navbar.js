import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import ThemeToggle from "./ThemeToggle";
import logo from "../assets/logo.png";

function NavigationBar({ onLoginClick }) {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="#" className="d-flex align-items-center gap-2">
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
            <Nav.Link href="#" className="text-light">
              Start
            </Nav.Link>
            <Nav.Link href="#" className="text-light">
              O nas
            </Nav.Link>
            <Nav.Link as="button" onClick={onLoginClick} className="text-light">
              Logowanie
            </Nav.Link>
            <ThemeToggle />
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;
