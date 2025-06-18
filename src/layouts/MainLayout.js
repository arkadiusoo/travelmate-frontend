import React from "react";
import { Container } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import NavigationBar from "../components/Navbar";
import Footer from "../components/Footer";

function MainLayout({ children, onLoginClick }) {
    const { isAuthenticated } = useAuth();

    // For authenticated users, we don't need onLoginClick
    // For non-authenticated users, onLoginClick should be provided
    const handleLoginClick = onLoginClick || (() => {
        console.log("Login click handler not provided");
    });

    return (
        <>
            <NavigationBar
                onLoginClick={handleLoginClick}
                isAuthenticated={isAuthenticated}
            />
            <Container className="my-5">{children}</Container>
            <Footer />
        </>
    );
}

export default MainLayout;