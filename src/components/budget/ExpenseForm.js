import React, { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";

const allParticipants = ["Adam", "Ola", "Bartek", "Kasia", "Darek"];

function ExpenseForm() {
  const [customSplit, setCustomSplit] = useState(false);
  const [activeParticipants, setActiveParticipants] = useState(
    Object.fromEntries(allParticipants.map((name) => [name, true]))
  );
  const [shares, setShares] = useState(() => {
    const defaultShare = 100 / allParticipants.length;
    return Object.fromEntries(
      allParticipants.map((name) => [name, defaultShare])
    );
  });

  const updateAutoShares = (updatedParticipants) => {
    const active = Object.entries(updatedParticipants)
      .filter(([_, isActive]) => isActive)
      .map(([name]) => name);

    const newShare = active.length > 0 ? 100 / active.length : 0;
    const newShares = { ...shares };
    allParticipants.forEach((name) => {
      newShares[name] = active.includes(name) ? newShare : 0;
    });
    setShares(newShares);
  };

  const handleToggleParticipant = (name) => {
    const updated = {
      ...activeParticipants,
      [name]: !activeParticipants[name],
    };
    setActiveParticipants(updated);

    if (!customSplit) {
      updateAutoShares(updated);
    } else {
      setShares((prev) => ({ ...prev, [name]: 0 }));
    }
  };

  const handleShareChange = (name, value) => {
    const numericValue = parseFloat(value) || 0;
    const updatedActive = { ...activeParticipants };

    if (numericValue === 0) {
      updatedActive[name] = false;
    } else {
      updatedActive[name] = true;
    }
    setActiveParticipants(updatedActive);
    setShares((prev) => ({ ...prev, [name]: numericValue }));
  };

  const handleCustomSplitToggle = () => {
    if (!customSplit) {
      updateAutoShares(activeParticipants);
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
            <Col xs={1}>
              <Form.Check
                type="checkbox"
                checked={activeParticipants[name]}
                onChange={() => handleToggleParticipant(name)}
              />
            </Col>
            <Col>{name}</Col>
            <Col>
              <Form.Control
                type="number"
                value={shares[name].toFixed(2)}
                disabled={!customSplit || !activeParticipants[name]}
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
