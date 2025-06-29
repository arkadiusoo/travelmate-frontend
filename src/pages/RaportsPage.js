import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Modal, Form, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../layouts/MainLayout';

export default function RaportsPage() {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [generatedReport, setGeneratedReport] = useState('');
    const [showReportModal, setShowReportModal] = useState(false);

    const [form, setForm] = useState({ name: '', budget: '' });
    const navigate = useNavigate();
    const { token } = useAuth();
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

    const handleGenerateReport = (tripId) => {
        setLoading(true);
        fetch(`${API_BASE}/chat/note`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ tripId })
          })
            .then(res => res.blob())
            .then(blob => {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'raport-wycieczki.pdf';
              a.click();
              window.URL.revokeObjectURL(url);
            })
            .catch(err => {
                console.error('Błąd generowania raportu:', err);
                setError('Nie udało się wygenerować raportu');
            })
            .finally(() => setLoading(false));
    };

    if (!token) {
        return (
            <MainLayout>
                <div className="text-center">
                    <h2>Musisz się zalogować</h2>
                    <p>Aby generować raporty z wycieczek, musisz się najpierw zalogować.</p>
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
                <p className="lead">Generuj raporty ze swoich wycieczek na podstawie stworzonych notatek</p>
            </section>

            {loading && <Spinner animation="border" className="d-block mx-auto my-4" />}
            {error && (
                <div className="alert alert-danger text-center" role="alert">
                    {error}
                </div>
            )}

            <Row>
                {trips.map(trip => (
                    <Col md={4} key={trip.id} className="mb-4">
                        <Card className="shadow-sm h-100">
                            <Card.Body>
                                <Card.Title>{trip.name}</Card.Title>
                                <Button
                                    variant="outline-primary"
                                    onClick={() => handleGenerateReport(trip.id, trip.name)}
                                >
                                    Generuj
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </MainLayout>
    );
}