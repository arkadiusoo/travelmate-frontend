import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Container, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";

function ExpenseForm({ tripId, onSuccess }) {
  const [customSplit, setCustomSplit] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [activeParticipants, setActiveParticipants] = useState({});
  const [shares, setShares] = useState({});
  const [formData, setFormData] = useState({
    amount: "",
    category: "OTHER",
    description: "",
    date: new Date().toISOString().split('T')[0],
    payerId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const { token, user } = useAuth();
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const expenseCategories = [
    { value: "TRANSPORT", label: "Transport" },
    { value: "FOOD", label: "Jedzenie" },
    { value: "ACCOMMODATION", label: "Noclegi" },
    { value: "ACTIVITIES", label: "Atrakcje" },
    { value: "OTHER", label: "Inne" }
  ];

  // Helper function to get display name from participant
  const getParticipantDisplayName = (participant) => {
    if (participant.firstName && participant.lastName) {
      return `${participant.firstName} ${participant.lastName}`.trim();
    }

    if (participant.firstName) {
      return participant.firstName;
    }

    if (participant.email) {
      return participant.email.split('@')[0];
    }

    return 'Unknown User';
  };

  // Fetch trip participants
  useEffect(() => {
    if (!tripId || !token) return;

    setLoadingParticipants(true);
    setError('');

    fetch(`${API_BASE}/trips/${tripId}/participants`, {
      headers: getAuthHeaders()
    })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch participants`);
          }
          return res.json();
        })
        .then(data => {
          console.log('Fetched participants:', data);
          // Filter only accepted participants for expense sharing
          const acceptedParticipants = data.filter(p => p.status === 'ACCEPTED');
          setParticipants(acceptedParticipants);
          initializeParticipantStates(acceptedParticipants);
        })
        .catch(err => {
          console.error('Error fetching participants:', err);
          setError('Błąd ładowania uczestników: ' + err.message);
          setParticipants([]);
        })
        .finally(() => setLoadingParticipants(false));
  }, [tripId, token]);

  const initializeParticipantStates = (participantList) => {
    if (!participantList || participantList.length === 0) return;

    const activeState = {};
    const shareState = {};
    const defaultShare = 100 / participantList.length;

    participantList.forEach(participant => {
      const userId = participant.userId;
      activeState[userId] = true;
      shareState[userId] = defaultShare;
    });

    setActiveParticipants(activeState);
    setShares(shareState);

    // Set current user as default payer if they are a participant
    const currentUser = participantList.find(p => p.email === user?.email);
    if (currentUser) {
      setFormData(prev => ({ ...prev, payerId: currentUser.userId }));
    }
  };

  const updateAutoShares = (updatedParticipants) => {
    const activeUserIds = Object.entries(updatedParticipants)
        .filter(([_, isActive]) => isActive)
        .map(([userId]) => userId);

    const newShare = activeUserIds.length > 0 ? 100 / activeUserIds.length : 0;
    const newShares = { ...shares };

    participants.forEach(participant => {
      const userId = participant.userId;
      newShares[userId] = activeUserIds.includes(userId) ? newShare : 0;
    });

    setShares(newShares);
  };

  const handleToggleParticipant = (userId) => {
    const updated = {
      ...activeParticipants,
      [userId]: !activeParticipants[userId],
    };
    setActiveParticipants(updated);

    if (!customSplit) {
      updateAutoShares(updated);
    } else {
      setShares(prev => ({ ...prev, [userId]: 0 }));
    }
  };

  const handleShareChange = (userId, value) => {
    const numericValue = parseFloat(value) || 0;
    const updatedActive = { ...activeParticipants };

    if (numericValue === 0) {
      updatedActive[userId] = false;
    } else {
      updatedActive[userId] = true;
    }

    setActiveParticipants(updatedActive);
    setShares(prev => ({ ...prev, [userId]: numericValue }));
  };

  const handleCustomSplitToggle = () => {
    if (!customSplit) {
      updateAutoShares(activeParticipants);
    }
    setCustomSplit(!customSplit);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { amount, payerId, category, date } = formData;
    if (!amount || !payerId || !category || !date) {
      setError("Uzupełnij wszystkie wymagane pola");
      setLoading(false);
      return;
    }

    // Validate amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Kwota musi być liczbą większą od 0");
      setLoading(false);
      return;
    }

    // Convert percentage shares to decimal shares (0.0 to 1.0)
    const activeSharesInDecimal = {};
    const activeUserIds = Object.entries(activeParticipants)
        .filter(([_, isActive]) => isActive)
        .map(([userId]) => userId);

    for (const userId of activeUserIds) {
      activeSharesInDecimal[userId] = (shares[userId] || 0) / 100;
    }

    // Validate shares sum to 100%
    const totalShare = Object.values(shares)
        .filter((_, index) => activeParticipants[Object.keys(shares)[index]])
        .reduce((sum, val) => sum + val, 0);

    if (Math.abs(totalShare - 100) > 0.01) {
      setError("Udziały uczestników muszą sumować się do 100%");
      setLoading(false);
      return;
    }

    // Create expense data matching ExpenseDTO structure
    const expenseData = {
      name: formData.name,
      amount: numericAmount,
      category: formData.category,
      description: formData.description || "",
      date: formData.date,
      payerId: formData.payerId,
      participantShares: activeSharesInDecimal,
      tripId: tripId,
      creatorId: user.userId,
    };

    console.log('Sending expense data:', expenseData);

    try {
      const response = await fetch(`${API_BASE}/trips/${tripId}/expenses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(expenseData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to create expense'}`);
      }

      const newExpense = await response.json();
      console.log('Expense created successfully:', newExpense);

      // Reset form
      setFormData({
        amount: "",
        category: "OTHER",
        description: "",
        date: new Date().toISOString().split('T')[0],
        payerId: "",
      });

      // Reset participants to initial state
      if (participants.length > 0) {
        initializeParticipantStates(participants);
      }

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      console.error('Error creating expense:', err);
      setError('Błąd dodawania wydatku: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!tripId) {
    return (
        <Alert variant="warning">
          Wybierz wycieczkę aby dodać wydatek
        </Alert>
    );
  }

  if (loadingParticipants) {
    return (
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Ładowanie uczestników...</p>
        </div>
    );
  }

  if (participants.length === 0) {
    return (
        <Alert variant="info">
          <h6>Brak uczestników</h6>
          <p>Ta wycieczka nie ma jeszcze zaakceptowanych uczestników. Zaproś uczestników do wycieczki aby móc tworzyć wydatki.</p>
        </Alert>
    );
  }

  return (
      <Form onSubmit={handleSubmit}>
        <Container fluid>
          <Row>
            <Col md={6}>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form.Group className="mb-3">
                <Form.Label>Nazwa wydatku *</Form.Label>
                <Form.Control
                    type="text"
                    name="name"
                    placeholder="np. Hotel XYZ"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Kwota (zł) *</Form.Label>
                <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    name="amount"
                    placeholder="np. 200"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Kategoria *</Form.Label>
                <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                >
                  {expenseCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Data *</Form.Label>
                <Form.Control
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Kto zapłacił *</Form.Label>
                <Form.Select
                    name="payerId"
                    value={formData.payerId}
                    onChange={handleInputChange}
                    required
                >
                  <option value="">Wybierz osobę</option>
                  {participants.map(participant => (
                      <option key={participant.userId} value={participant.userId}>
                        {getParticipantDisplayName(participant)}
                      </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Opis (opcjonalnie)</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    placeholder="np. 2 noce w hotelu XYZ"
                    value={formData.description}
                    onChange={handleInputChange}
                />
              </Form.Group>

              <Button
                  type="submit"
                  variant="primary"
                  className="w-100"
                  disabled={loading}
              >
                {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Dodawanie...
                    </>
                ) : (
                    'Dodaj wydatek'
                )}
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

                {participants.map((participant) => {
                  const userId = participant.userId;
                  const displayName = getParticipantDisplayName(participant);

                  return (
                      <Row key={userId} className="align-items-center mb-2">
                        <Col xs={1}>
                          <Form.Check
                              type="checkbox"
                              checked={activeParticipants[userId] || false}
                              onChange={() => handleToggleParticipant(userId)}
                          />
                        </Col>
                        <Col xs={4}>
                          <span title={participant.email}>{displayName}</span>
                        </Col>
                        <Col xs={4}>
                          <Form.Control
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={(shares[userId] || 0).toFixed(2)}
                              disabled={!customSplit || !activeParticipants[userId]}
                              onChange={(e) => handleShareChange(userId, e.target.value)}
                          />
                        </Col>
                        <Col xs={1}>%</Col>
                        <Col xs={2} className="text-end">
                          {formData.amount && (
                              <small className="text-muted">
                                {((parseFloat(formData.amount) || 0) * (shares[userId] || 0) / 100).toFixed(2)} zł
                              </small>
                          )}
                        </Col>
                      </Row>
                  );
                })}

                <div className="mt-3 p-2 bg-light rounded">
                  <strong>
                    Suma udziałów: {Object.values(shares).reduce((sum, val) => sum + (val || 0), 0).toFixed(1)}%
                  </strong>
                  {Math.abs(Object.values(shares).reduce((sum, val) => sum + (val || 0), 0) - 100) > 0.1 && (
                      <div className="text-danger small">
                        Udziały muszą sumować się do 100%
                      </div>
                  )}
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Container>
      </Form>
  );
}

export default ExpenseForm;