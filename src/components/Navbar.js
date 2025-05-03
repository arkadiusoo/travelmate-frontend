import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import ThemeToggle from "./ThemeToggle";

function NavigationBar({ onLoginClick }) {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="#">TravelMate</Navbar.Brand>
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
