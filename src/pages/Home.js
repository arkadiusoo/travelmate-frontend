import React from "react";
import { Button, Row, Col, Card } from "react-bootstrap";
import MainLayout from "../layouts/MainLayout";

function Home() {
  return (
    <MainLayout>
      <section className="text-center mb-5">
        <h1 className="display-4">TravelMate 🌍</h1>
        <p className="lead">
          Twój asystent podróży po Polsce – planuj, zarządzaj i dziel koszty.
        </p>
        <Button variant="primary" size="lg">
          Rozpocznij
        </Button>
      </section>

      <section>
        <h2 className="mb-4 text-center">Dlaczego TravelMate?</h2>
        <Row>
          <Col md={4}>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <Card.Title>Planowanie podróży</Card.Title>
                <Card.Text>
                  Twórz trasy, wybieraj punkty i planuj dzień po dniu.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <Card.Title>Budżet i koszty</Card.Title>
                <Card.Text>
                  Śledź wydatki i rozliczaj się wygodnie między uczestnikami.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <Card.Title>Współpraca</Card.Title>
                <Card.Text>
                  Zapraszaj znajomych, współpracuj na żywo i synchronizuj z
                  kalendarzem.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </section>
    </MainLayout>
  );
}

export default Home;
