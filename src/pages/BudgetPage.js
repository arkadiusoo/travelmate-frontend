import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ExpenseList from "../components/budget/ExpenseList";
import BudgetSummary from "../components/budget/BudgetSummary";
import ExpenseForm from "../components/budget/ExpenseForm";
import WideModalWrapper from "../components/WideModalWrapper";

function BudgetPage() {
  const [showModal, setShowModal] = useState(false);
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { token } = useAuth();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
  }, [token, navigate]);

  // Fetch user's trips
  useEffect(() => {
    if (!token) return;

    setLoading(true);
    fetch(`${API_BASE}/trips`, {
      headers: getAuthHeaders()
    })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch trips');
          return res.json();
        })
        .then(data => {
          setTrips(data);
          if (data.length > 0 && !selectedTripId) {
            setSelectedTripId(data[0].id);
          }
        })
        .catch(err => {
          console.error('Error fetching trips:', err);
          setError('Błąd ładowania wycieczek');
        })
        .finally(() => setLoading(false));
  }, [token, API_BASE, selectedTripId]);

  // Fetch selected trip details
  useEffect(() => {
    if (!selectedTripId || !token) {
      setSelectedTrip(null);
      return;
    }

    fetch(`${API_BASE}/trips/${selectedTripId}`, {
      headers: getAuthHeaders()
    })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch trip details');
          return res.json();
        })
        .then(data => setSelectedTrip(data))
        .catch(err => {
          console.error('Error fetching trip details:', err);
          setError('Błąd ładowania szczegółów wycieczki');
        });
  }, [selectedTripId, token, API_BASE]);

  const handleTripSelect = (tripId) => {
    setSelectedTripId(tripId);
    setError('');
  };

  const handleExpenseAdded = () => {
    setShowModal(false);
    setRefreshTrigger(prev => prev + 1);
  };

  if (!token) {
    return (
        <MainLayout>
          <div className="text-center">
            <h2>Musisz się zalogować</h2>
            <p>Aby zarządzać budżetem, musisz się najpierw zalogować.</p>
            <Button variant="primary" onClick={() => navigate('/')}>
              Przejdź do logowania
            </Button>
          </div>
        </MainLayout>
    );
  }

  return (
      <MainLayout>
        <Container>
          <h1 className="mb-4 text-center">💰 Budżet podróży</h1>

          {/* Trip Selection */}
          <Row className="mb-4">
            <Col md={8} className="mx-auto">
              <Card className="shadow-sm">
                <Card.Body>
                  <h5 className="mb-3">📍 Wybierz wycieczkę</h5>
                  {error && <Alert variant="danger">{error}</Alert>}

                  <Form.Group>
                    <Form.Label>Wycieczka</Form.Label>
                    <Form.Select
                        value={selectedTripId}
                        onChange={(e) => handleTripSelect(e.target.value)}
                        disabled={loading}
                    >
                      <option value="">
                        {loading ? 'Ładowanie...' : 'Wybierz wycieczkę'}
                      </option>
                      {trips.map(trip => (
                          <option key={trip.id} value={trip.id}>
                            {trip.name}
                          </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  {trips.length === 0 && !loading && (
                      <div className="text-center mt-3">
                        <p>Nie masz jeszcze żadnych wycieczek.</p>
                        <Button
                            variant="outline-primary"
                            onClick={() => navigate('/trips')}
                        >
                          Utwórz pierwszą wycieczkę
                        </Button>
                      </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Budget Content */}
          {selectedTrip && (
              <>
                <div className="text-center mb-4">
                  <h3 className="text-primary">📋 {selectedTrip.name}</h3>
                </div>

                <Row className="mb-4">
                  <Col md={4}>
                    <Card className="shadow-sm mb-4">
                      <Card.Body>
                        <h5 className="mb-3">📊 Podsumowanie budżetu</h5>
                        <BudgetSummary tripId={selectedTripId} key={`summary-${refreshTrigger}`} />
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
                        <ExpenseList tripId={selectedTripId} key={`list-${refreshTrigger}`} />
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </>
          )}

          <WideModalWrapper
              show={showModal}
              onClose={() => setShowModal(false)}
              title="Dodaj wydatek"
          >
            <ExpenseForm
                tripId={selectedTripId}
                onSuccess={handleExpenseAdded}
            />
          </WideModalWrapper>
        </Container>
      </MainLayout>
  );
}

export default BudgetPage;