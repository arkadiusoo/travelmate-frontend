import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Container, Alert } from "react-bootstrap";

const mockTrips = [
  {
    id: "b7c308ff-4906-4c63-bc8a-27a3ac0aa8f3",
    name: "Wycieczka do Zakopanego",
  },
  { id: "c8d408ff-5906-4c63-bc8a-27a3ac0aa8f4", name: "Weekend w Gdańsku" },
  { id: "d9e508ff-6906-4c63-bc8a-27a3ac0aa8f5", name: "Wyprawa na Mazury" },
];

const mockParticipants = [
  {
    id: "f1a8e0a2-345b-4c99-99ab-bc3f2b97cd1f",
    tripId: "b7c308ff-4906-4c63-bc8a-27a3ac0aa8f3",
    email: "adam@example.com",
    name: "Adam",
    role: "MEMBER",
    status: "PENDING",
  },
  {
    id: "b2a8e0a2-345b-4c99-99ab-bc3f2b97cd1f",
    tripId: "b7c308ff-4906-4c63-bc8a-27a3ac0aa8f3",
    email: "ola@example.com",
    name: "Ola",
    role: "MEMBER",
    status: "PENDING",
  },
  {
    id: "c3a8e0a2-345b-4c99-99ab-bc3f2b97cd1f",
    tripId: "c8d408ff-5906-4c63-bc8a-27a3ac0aa8f4",
    email: "bartek@example.com",
    name: "Bartek",
    role: "MEMBER",
    status: "PENDING",
  },
  {
    id: "d4a8e0a2-345b-4c99-99ab-bc3f2b97cd1f",
    tripId: "c8d408ff-5906-4c63-bc8a-27a3ac0aa8f4",
    email: "kasia@example.com",
    name: "Kasia",
    role: "MEMBER",
    status: "PENDING",
  },
  {
    id: "e5a8e0a2-345b-4c99-99ab-bc3f2b97cd1f",
    tripId: "d9e508ff-6906-4c63-bc8a-27a3ac0aa8f5",
    email: "darek@example.com",
    name: "Darek",
    role: "MEMBER",
    status: "PENDING",
  },
];

function ExpenseForm() {
  const [participants, setParticipants] = useState([]);
  const [customSplit, setCustomSplit] = useState(false);
  const [activeParticipants, setActiveParticipants] = useState({});
  const [shares, setShares] = useState({});
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    payer: "",
    description: "",
    tripId: "",
  });
  const [error, setError] = useState("");
  const [trips, setTrips] = useState(mockTrips);

  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail) {
      console.log("Fetching trips for user:", userEmail);
      fetch(`http://localhost:8081/api/trips/${userEmail}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => setTrips(data))
        .catch((error) => {
          console.log("Caught error:", error);
          console.error("Error fetching trips:", error);
          setTrips(mockTrips);
        });
    }

    if (formData.tripId) {
      fetch(`http://localhost:8081/api/trips/${formData.tripId}/participants`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          setParticipants(data);
          const initialActive = {};
          const initialShares = {};
          data.forEach((participant) => {
            initialActive[participant.email] = true;
          });
          const shareValue = data.length > 0 ? 100 / data.length : 0;
          data.forEach((participant) => {
            initialShares[participant.email] = shareValue;
          });
          setActiveParticipants(initialActive);
          setShares(initialShares);
        })
        .catch((error) => {
          console.log("Caught error fetching participants:", error);
          console.error("Error fetching participants:", error);
          setParticipants(mockParticipants);
          const initialActive = {};
          const initialShares = {};
          mockParticipants.forEach((participant) => {
            initialActive[participant.email] = true;
          });
          const shareValue =
            mockParticipants.length > 0 ? 100 / mockParticipants.length : 0;
          mockParticipants.forEach((participant) => {
            initialShares[participant.email] = shareValue;
          });
          setActiveParticipants(initialActive);
          setShares(initialShares);
        });
    } else {
      setParticipants([]);
      setActiveParticipants({});
      setShares({});
    }
  }, [formData.tripId]);

  const updateAutoShares = (updatedParticipants) => {
    const active = Object.entries(updatedParticipants)
      .filter(([_, isActive]) => isActive)
      .map(([email]) => email);

    const newShare = active.length > 0 ? 100 / active.length : 0;
    const newShares = { ...shares };
    participants.forEach((participant) => {
      newShares[participant.email] = active.includes(participant.email)
        ? newShare
        : 0;
    });
    setShares(newShares);
  };

  const handleToggleParticipant = (email) => {
    const updated = {
      ...activeParticipants,
      [email]: !activeParticipants[email],
    };
    setActiveParticipants(updated);

    if (!customSplit) {
      updateAutoShares(updated);
    } else {
      setShares((prev) => ({ ...prev, [email]: 0 }));
    }
  };

  const handleShareChange = (email, value) => {
    const numericValue = parseFloat(value) || 0;
    const updatedActive = { ...activeParticipants };

    if (numericValue === 0) {
      updatedActive[email] = false;
    } else {
      updatedActive[email] = true;
    }
    setActiveParticipants(updatedActive);
    setShares((prev) => ({ ...prev, [email]: numericValue }));
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
      .filter(([email]) => activeParticipants[email])
      .reduce((sum, [_, val]) => sum + val, 0);

    if (Math.round(totalShare) !== 100) {
      setError("Udziały uczestników muszą sumować się do 100%");
      return;
    }

    console.log("Dane wydatku:", {
      ...formData,
      shares: Object.fromEntries(
        Object.entries(shares).filter(([email]) => activeParticipants[email])
      ),
    });
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Container fluid>
        <Row>
          <Col md={6}>
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
                className="mt-3"
              />
              <div>
                {participants
                  .filter(
                    (participant) => participant.tripId === formData.tripId
                  )
                  .map((participant) => (
                    <Row
                      key={participant.id}
                      className="align-items-center mb-2"
                    >
                      <Col xs={1}>
                        <Form.Check
                          type="checkbox"
                          checked={
                            activeParticipants[participant.email] || false
                          }
                          onChange={() =>
                            handleToggleParticipant(participant.email)
                          }
                        />
                      </Col>
                      <Col>{participant.name}</Col>
                      <Col>
                        <Form.Control
                          type="number"
                          value={shares[participant.email]?.toFixed(2) || 0}
                          disabled={
                            !customSplit ||
                            !activeParticipants[participant.email]
                          }
                          onChange={(e) =>
                            handleShareChange(participant.email, e.target.value)
                          }
                        />
                      </Col>
                      <Col>%</Col>
                    </Row>
                  ))}
              </div>
            </Form.Group>
          </Col>
        </Row>
      </Container>
    </Form>
  );
}

export default ExpenseForm;
