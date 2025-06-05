import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Container, Alert } from "react-bootstrap";

const allParticipants = ["Adam", "Ola", "Bartek", "Kasia", "Darek"];

// Mock Data for Trips
const mockTrips = [
  { id: 1, name: "Wycieczka do Zakopanego" },
  { id: 2, name: "Weekend w Gdańsku" },
  { id: 3, name: "Wyprawa na Mazury" },
];

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
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    payer: "",
    description: "",
    tripId: "", // Added for the trip selection
  });
  const [error, setError] = useState("");
  const [trips, setTrips] = useState(mockTrips); // Initially set mock data for trips

  // Simulate fetching trips from the backend
  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
      fetch(`http://localhost:8081/api/trips/${userEmail}`)
        .then((response) => response.json())
        .then((data) => setTrips(data)) // Set real trip data here
        .catch((error) => {
          console.error("Error fetching trips:", error);
          setTrips(mockTrips); // Fallback to mock data on error
        });
    }
  }, []);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTripChange = (event) => {
    setFormData({
      ...formData,
      tripId: event.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const { title, amount, payer } = formData;
    if (!title || !amount || !payer) {
      setError(
        "Uzupełnij wszystkie wymagane pola (nazwa, kwota, kto zapłacił)"
      );
      return;
    }

    const totalShare = Object.entries(shares)
      .filter(([name]) => activeParticipants[name])
      .reduce((sum, [_, val]) => sum + val, 0);

    if (Math.round(totalShare) !== 100) {
      setError("Udziały uczestników muszą sumować się do 100%");
      return;
    }

    console.log("Dane wydatku:", {
      ...formData,
      shares: Object.fromEntries(
        Object.entries(shares).filter(([name]) => activeParticipants[name])
      ),
    });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Container fluid>
        <Row>
          <Col md={6}>
            {/* Trip selection */}
            <Form.Group className="mb-3">
              <Form.Label>Wybierz wycieczkę</Form.Label>
              <Form.Control
                as="select"
                name="tripId"
                value={formData.tripId}
                onChange={handleTripChange}
              >
                <option value="">Wybierz wycieczkę</option>
                {Array.isArray(trips) &&
                  trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.name}
                    </option>
                  ))}
              </Form.Control>
            </Form.Group>

            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>Nazwa wydatku</Form.Label>
              <Form.Control
                type="text"
                name="title"
                placeholder="np. Hotel"
                value={formData.title}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Kwota (zł)</Form.Label>
              <Form.Control
                type="number"
                name="amount"
                placeholder="np. 200"
                value={formData.amount}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Kto zapłacił</Form.Label>
              <Form.Control
                type="text"
                name="payer"
                placeholder="np. Adam"
                value={formData.payer}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Opis (opcjonalnie)</Form.Label>
              <Form.Control
                type="text"
                name="description"
                placeholder="np. 2 noce w hotelu XYZ"
                value={formData.description}
                onChange={handleInputChange}
              />
            </Form.Group>

            <Button type="submit" variant="primary" className="w-100">
              Dodaj
            </Button>
          </Col>

          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Uczestnicy i udziały</Form.Label>
              <Form.Check
                type="checkbox"
                label="Własny podział kosztów"
                checked={customSplit}
                onChange={handleCustomSplitToggle}
                className="mb-3"
              />
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
          </Col>
        </Row>
      </Container>
    </Form>
  );
}

export default ExpenseForm;
