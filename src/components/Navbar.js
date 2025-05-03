import React from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import ThemeToggle from "./ThemeToggle";

function NavigationBar() {
  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="#">TravelMate</Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav className="ms-auto">
            <Nav.Link href="#">Start</Nav.Link>
            <Nav.Link href="#">O nas</Nav.Link>
            <Nav.Link href="#">Logowanie</Nav.Link>
            <ThemeToggle />
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar;
