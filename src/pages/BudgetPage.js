import React, { useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import MainLayout from "../layouts/MainLayout";
import ExpenseList from "../components/budget/ExpenseList";
import BudgetSummary from "../components/budget/BudgetSummary";
import ModalWrapper from "../components/ModalWrapper";
import ExpenseForm from "../components/budget/ExpenseForm";
import WideModalWrapper from "../components/WideModalWrapper";

function BudgetPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <MainLayout>
      <Container>
        <h1 className="mb-4 text-center">💰 Budżet podróży</h1>

        <Row className="mb-4">
          <Col md={4}>
            <Card className="shadow-sm mb-4">
              <Card.Body>
                <h5 className="mb-3">📊 Podsumowanie budżetu</h5>
                <BudgetSummary />
              </Card.Body>
            </Card>

            <Button
              variant="primary"
              className="w-100"
              onClick={() => setShowModal(true)}
            >
              ➕ Dodaj wydatek
            </Button>
          </Col>

          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Body>
                <h5 className="mb-3">📋 Lista wydatków</h5>
                <ExpenseList />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <WideModalWrapper
          show={showModal}
          onClose={() => setShowModal(false)}
          title="Dodaj wydatek"
        >
          <ExpenseForm />
        </WideModalWrapper>
      </Container>
    </MainLayout>
  );
}

export default BudgetPage;
