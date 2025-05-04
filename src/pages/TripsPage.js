import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Modal, Form, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '' });
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

  // Fetch trips from backend
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/trips`)
      .then(res => res.json())
      .then(data => setTrips(data))
      .catch(() => setError('Błąd ładowania wycieczek'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAdd = e => {
    e.preventDefault();
    setLoading(true);
    fetch(`${API_BASE}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name }),
    })
      .then(res => res.json())
      .then(newTrip => {
        setTrips(prev => [...prev, newTrip]);
        setShowModal(false);
        navigate(`/trips/${newTrip.id}`);
      })
      .catch(() => setError('Nie udało się utworzyć wycieczki'))
      .finally(() => setLoading(false));
  };

  return (
    <MainLayout>
      <section className="text-center mb-5">
        <h1 className="display-4">Twoje wycieczki</h1>
        <p className="lead">Zarządzaj swoimi wycieczkami i planuj szczegóły.</p>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Utwórz nową wycieczkę
        </Button>
      </section>

      {loading && <Spinner animation="border" className="d-block mx-auto my-4" />}
      {error && <p className="text-danger text-center">{error}</p>}

      <Row>
        {trips.map(trip => (
          <Col md={4} key={trip.id} className="mb-4">
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title>{trip.name}</Card.Title>
                <Button as={Link} to={`/trips/${trip.id}`} variant="outline-primary">
                  Zobacz plan
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Nowa wycieczka</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAdd}>
          <Modal.Body>
            <Form.Group controlId="tripName" className="mb-3">
              <Form.Label>Nazwa wycieczki</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="np. Weekend w górach"
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loading}>
              Anuluj
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              Utwórz
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </MainLayout>
  );
}
