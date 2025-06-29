import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import MainLayout from "../layouts/MainLayout";

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Get user name from auth context or fallback to email
  const getUserName = () => {
    if (user && user.firstName) {
      return user.firstName;
    }

    // Fallback to email-based name
    const email = localStorage.getItem("userEmail") || "";
    if (email) {
      const nameFromEmail = email.split("@")[0];
      return nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
    }

    return "User"; // Final fallback
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
      <MainLayout>
        <Container fluid className="py-4">
          <h1 className="mb-4 text-center">👋 Witaj, {getUserName()}!</h1>

          <Row className="mb-4">
            <Col md={6} lg={4}>
              <Card className="mb-3 shadow-sm h-100">
                <Card.Body>
                  <Card.Title>📍 Moje podróże</Card.Title>
                  <Card.Text>
                    Zarządzaj zaplanowanymi i ukończonymi wyjazdami.
                  </Card.Text>
                  <Button
                      variant="primary"
                      className="w-100"
                      onClick={() => navigate("/trips")}
                  >
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
                    Sprawdź bilans i rozlicz się ze wszystkimi uczestnikami wyjazdu.
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
                  <Button
                      variant="info"
                      className="w-100"
                      onClick={() => navigate('/participants')}
                  >
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
                  <Card.Title>Raporty z wycieczek</Card.Title>
                  <Card.Text>Wygenerowane raporty z wycieczek</Card.Text>
                  <Button
                      variant="info"
                      size="sm"
                      className="w-100"
                      onClick={() => navigate('/raports')}
                  >
                    Przejdź do raportów
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="shadow-sm">


                <Card.Body>
                  <Card.Title>📅 Synchronizacja z kalendarzem</Card.Title>
                  <Card.Text>Integracja z Google Calendar.</Card.Text>
                  <Button
                      variant="info"
                      className="w-100"
                      onClick={() => navigate('/calendar')}
                  >
                    Zarządzaj kalendarzem
                  </Button>
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