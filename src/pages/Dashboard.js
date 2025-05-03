import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import MainLayout from "../layouts/MainLayout";
import { handleLogout } from "../utils/logout";
import { useNavigate } from "react-router-dom";

function Dashboard({ onLogout }) {
  const email = localStorage.getItem("userEmail") || "Adam@gmail.com";
  const nameFromEmail = email.split("@")[0];
  const capitalizedName =
    nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
  const navigate = useNavigate();
  return (
    <MainLayout>
      <Container fluid className="py-4">
        <h1 className="mb-4 text-center">👋 Witaj, {capitalizedName}!</h1>

        <Row className="mb-4">
          <Col md={6} lg={4}>
            <Card className="mb-3 shadow-sm h-100">
              <Card.Body>
                <Card.Title>📍 Moje podróże</Card.Title>
                <Card.Text>
                  Zarządzaj zaplanowanymi i ukończonymi wyjazdami.
                </Card.Text>
                <Button variant="primary" className="w-100">
                  Przejdź do podróży
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={4}>
            <Card className="mb-3 shadow-sm h-100">
              <Card.Body>
                <Card.Title>💰 Budżet i wydatki</Card.Title>
                <Card.Text>
                  Sprawdź bilans i rozlicz się z uczestnikami wyjazdu.
                </Card.Text>
                <Button
                  variant="success"
                  className="w-100"
                  onClick={() => navigate("/budget")}
                >
                  Zarządzaj budżetem
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={4}>
            <Card className="mb-3 shadow-sm h-100">
              <Card.Body>
                <Card.Title>🧑‍🤝‍🧑 Uczestnicy</Card.Title>
                <Card.Text>
                  Zapraszaj znajomych i zarządzaj rolami uczestników.
                </Card.Text>
                <Button variant="info" className="w-100">
                  Zarządzaj uczestnikami
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="mt-5">
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>🗺️ Podgląd trasy (mapa)</Card.Title>
                <Card.Text>Widok mapy planowanej podróży – wkrótce!</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>📅 Synchronizacja z kalendarzem</Card.Title>
                <Card.Text>Integracja z Google Calendar – wkrótce!</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <div className="text-center mt-5">
          <Button variant="outline-danger" onClick={handleLogout}>
            Wyloguj się
          </Button>
        </div>
      </Container>
    </MainLayout>
  );
}

export default Dashboard;
