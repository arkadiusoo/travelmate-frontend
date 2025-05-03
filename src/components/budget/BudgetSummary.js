import React from "react";
import { ListGroup } from "react-bootstrap";

function BudgetSummary() {
  return (
    <ListGroup>
      <ListGroup.Item>Dostępny budżet: 500 zł</ListGroup.Item>
      <ListGroup.Item>Wydano: 350 zł</ListGroup.Item>
      <ListGroup.Item>Pozostało: 150 zł</ListGroup.Item>
    </ListGroup>
  );
}

export default BudgetSummary;
