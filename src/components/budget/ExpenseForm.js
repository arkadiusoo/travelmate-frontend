import React, { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";

const allParticipants = ["Adam", "Ola", "Bartek", "Kasia", "Darek"];

function ExpenseForm() {
  const [customSplit, setCustomSplit] = useState(false);
  const [shares, setShares] = useState(() => {
    const defaultShare = 100 / allParticipants.length;
    return Object.fromEntries(
      allParticipants.map((name) => [name, defaultShare])
    );
  });

  const handleShareChange = (name, value) => {
    setShares((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleCustomSplitToggle = () => {
    if (!customSplit) {
      const defaultShare = 100 / allParticipants.length;
      setShares(
        Object.fromEntries(allParticipants.map((name) => [name, defaultShare]))
      );
    }
    setCustomSplit(!customSplit);
  };

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

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="Własny podział kosztów"
          checked={customSplit}
          onChange={handleCustomSplitToggle}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Uczestnicy i udziały</Form.Label>
        {allParticipants.map((name) => (
          <Row key={name} className="align-items-center mb-2">
            <Col>{name}</Col>
            <Col>
              <Form.Control
                type="number"
                value={shares[name].toFixed(2)}
                disabled={!customSplit}
                onChange={(e) => handleShareChange(name, e.target.value)}
              />
            </Col>
            <Col>%</Col>
          </Row>
        ))}
      </Form.Group>

      <Button type="submit" variant="primary" className="w-100">
        Dodaj
      </Button>
    </Form>
  );
}

export default ExpenseForm;
