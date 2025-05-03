import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ExpenseList from "../components/budget/ExpenseList";
import ExpenseForm from "../components/budget/ExpenseForm";
import BudgetSummary from "../components/budget/BudgetSummary";

function BudgetPage() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="text-center flex-grow-1 mb-0">💰 Budżet podróży</h1>
          <Button variant="secondary" onClick={() => navigate("/dashboard")}>
            ← Powrót
          </Button>
        </div>

        <Row className="mb-4">
          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Body>
                <h5 className="mb-3">📋 Lista wydatków</h5>
                <ExpenseList />
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">➕ Dodaj wydatek</h5>
                <ExpenseForm />
              </Card.Body>
            </Card>
            <Card className="shadow-sm">
              <Card.Body>
                <h5 className="mb-3">📊 Podsumowanie budżetu</h5>
                <BudgetSummary />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </MainLayout>
  );
}

export default BudgetPage;
