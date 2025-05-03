import React from "react";
import { Container } from "react-bootstrap";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      <Container className="my-5">{children}</Container>
      <Footer />
    </>
  );
}

export default MainLayout;
