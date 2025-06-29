import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Modal, Form, Spinner, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../layouts/MainLayout';

export default function Trips() {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', budget: '' });
    const [tripStatuses, setTripStatuses] = useState({});
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

    // Helper function to create authenticated headers
    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    // Fetch trips from backend
    useEffect(() => {
        if (!token) {
            setError('Nie jesteś zalogowany');
            return;
        }

        setLoading(true);
        setError(null);

        fetch(`${API_BASE}/trips`, {
            headers: getAuthHeaders()
        })
            .then(res => {
                if (res.status === 401 || res.status === 403) {
                    throw new Error('Brak autoryzacji');
                }
                if (!res.ok) {
                    throw new Error(`Server error: ${res.status}`);
                }
                return res.json();
            })
            .then(data => setTrips(data))
            .catch(err => {
                console.error('Error fetching trips:', err);
                setError('Błąd ładowania wycieczek: ' + err.message);
            })
            .finally(() => setLoading(false));
    }, [token, API_BASE]);

    useEffect(() => {
        if (!trips.length || !token || !user?.email) return;

        // Check user status for each trip
        const statusPromises = trips.map(trip =>
            fetch(`${API_BASE}/trips/${trip.id}/participants`, {
                headers: getAuthHeaders()
            })
                .then(res => res.json())
                .then(data => {
                    const currentUser = data.find(p => p.email === user.email);
                    return {
                        tripId: trip.id,
                        status: currentUser?.status || null,
                        role: currentUser?.role || null
                    };
                })
                .catch(() => ({
                    tripId: trip.id,
                    status: null,
                    role: null
                }))
        );

        Promise.all(statusPromises).then(statuses => {
            const statusMap = {};
            statuses.forEach(({ tripId, status, role }) => {
                statusMap[tripId] = { status, role };
            });
            setTripStatuses(statusMap);
        });
    }, [trips, token, user?.email]);

    const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleAdd = e => {
        e.preventDefault();
        if (!token) {
            setError('Nie jesteś zalogowany');
            return;
        }

        setLoading(true);
        setError(null);

        fetch(`${API_BASE}/trips`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name: form.name, tripBudget: form.budget }),

        })

            .then(res => {
                if (res.status === 401 || res.status === 403) {
                    throw new Error('Brak autoryzacji');
                }
                if (!res.ok) {
                    throw new Error(`Server error: ${res.status}`);
                }
                return res.json();
            })
            .then(newTrip => {
                setTrips(prev => [...prev, newTrip]);
                setForm({ name: '', budget: '' });
                setShowModal(false);
                navigate(`/trips/${newTrip.id}`);
            })
            .catch(err => {
                console.error('Error creating trip:', err);
                setError('Nie udało się utworzyć wycieczki: ' + err.message);
            })
            .finally(() => setLoading(false));
    };

    if (!token) {
        return (
            <MainLayout>
                <div className="text-center">
                    <h2>Musisz się zalogować</h2>
                    <p>Aby zarządzać wycieczkami, musisz się najpierw zalogować.</p>
                    <Button variant="primary" onClick={() => navigate('/')}>
                        Przejdź do logowania
                    </Button>
                </div>
            </MainLayout>
        );
    }

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
            {error && (
                <div className="alert alert-danger text-center" role="alert">
                    {error}
                </div>
            )}

            <Row>
                {trips.map(trip => {
                    const tripStatus = tripStatuses[trip.id];
                    const canViewTrip = tripStatus?.status === 'ACCEPTED';
                    const isPending = tripStatus?.status === 'PENDING';

                    return (
                        <Col md={4} key={trip.id} className="mb-4">
                            <Card className="shadow-sm h-100">
                                <Card.Body>
                                    <Card.Title>{trip.name}</Card.Title>

                                    {isPending && (
                                        <div className="mb-2">
                                            <Badge bg="warning">⏳ Oczekuje na akceptację</Badge>
                                        </div>
                                    )}

                                    {canViewTrip ? (
                                        <Button as={Link} to={`/trips/${trip.id}`} variant="outline-primary">
                                            Zobacz plan
                                        </Button>
                                    ) : isPending ? (
                                        <Button variant="outline-secondary" disabled title="Musisz zaakceptować zaproszenie">
                                            Zobacz plan (oczekuje akceptacji)
                                        </Button>
                                    ) : (
                                        <Button as={Link} to={`/trips/${trip.id}`} variant="outline-primary">
                                            Zobacz plan
                                        </Button>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {trips.length === 0 && !loading && !error && (
                <div className="text-center mt-5">
                    <h4>Nie masz jeszcze żadnych wycieczek</h4>
                    <p>Utwórz swoją pierwszą wycieczkę!</p>
                </div>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Nowa wycieczka</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleAdd}>
                    <Modal.Body>
                        <Form.Group controlId="tripName" className="mb-3">
                            <Form.Label>Nazwa wycieczki*</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="np. Weekend w górach"
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="tripBudget" className="mb-3">
                            <Form.Label>Planowany budżet*</Form.Label>
                            <Form.Control
                                type="number"
                                name="budget"
                                value={form.budget}
                                onChange={handleChange}
                                placeholder="np. 3000"
                                required
                                min="0"
                                step="0.01"
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loading}>
                            Anuluj
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading || !form.name.trim() || !form.budget.trim()}>
                            {loading ? 'Tworzenie...' : 'Utwórz'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </MainLayout>
    );
}