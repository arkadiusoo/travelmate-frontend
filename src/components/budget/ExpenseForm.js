import React from "react";
import { Form, Button } from "react-bootstrap";

function ExpenseForm() {
  return (
    <Form>
      <Form.Group className="mb-3">
        <Form.Label>Nazwa wydatku</Form.Label>
        <Form.Control type="text" placeholder="np. Hotel" />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Kwota (zł)</Form.Label>
        <Form.Control type="number" placeholder="np. 200" />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Kto zapłacił</Form.Label>
        <Form.Control type="text" placeholder="np. Adam" />
      </Form.Group>
      <Button type="submit" variant="primary" className="w-100">
        Dodaj
      </Button>
    </Form>
  );
}

export default ExpenseForm;
