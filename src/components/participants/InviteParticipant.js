import React, { useState } from 'react';
import { Form, Button, Alert, Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

function InviteParticipant({ tripId, onSuccess, onCancel }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('MEMBER');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { token } = useAuth();
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            setError('Email jest wymagany');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE}/trips/${tripId}/participants`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    email: email.trim(),
                    role: role
                })
            });

            if (!response.ok) {
                // Parse JSON error response
                const errorData = await response.json();
                // Extract the message field
                const errorMessage = errorData.message || 'Nie udało się wysłać zaproszenia';
                throw new Error(errorMessage);
            }

            setSuccess('Zaproszenie zostało wysłane pomyślnie!');
            setEmail('');
            setRole('MEMBER');

            // Call success callback after a short delay
            setTimeout(() => {
                onSuccess();
            }, 1500);

        } catch (error) {
            console.error('Error inviting participant:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <Card.Header>
                <h5>📨 Zaproś nowego uczestnika</h5>
            </Card.Header>
            <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Email uczestnika:</Form.Label>
                                <Form.Control
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="np. jan.kowalski@example.com"
                                    required
                                    disabled={loading}
                                />
                                <Form.Text className="text-muted">
                                    Użytkownik musi być już zarejestrowany w systemie
                                </Form.Text>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Rola:</Form.Label>
                                <Form.Select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="MEMBER">Członek</option>
                                    <option value="GUEST">Gość</option>
                                    <option value="ORGANIZER">Organizator</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex gap-2">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading || !email.trim()}
                        >
                            {loading ? 'Wysyłanie...' : '📨 Wyślij zaproszenie'}
                        </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Anuluj
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default InviteParticipant;