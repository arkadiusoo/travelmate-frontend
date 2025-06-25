// ================================
// UPDATED: src/pages/ParticipantsPage.js - Better Role Permissions
// ================================

import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Alert, Spinner, Button, Badge, Table } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../layouts/MainLayout';
import ParticipantList from '../components/participants/ParticipantList';
import InviteParticipant from '../components/participants/InviteParticipant';

function ParticipantsPage() {
    const [trips, setTrips] = useState([]);
    const [selectedTripId, setSelectedTripId] = useState('');
    const [participants, setParticipants] = useState([]);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [pendingInvitations, setPendingInvitations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [invitationsLoading, setInvitationsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showInviteForm, setShowInviteForm] = useState(false);

    const { token, user } = useAuth();
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

    // Fix React warning by using useCallback
    const getAuthHeaders = useCallback(() => ({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }), [token]);

    // Fetch trips that user participates in
    useEffect(() => {
        if (!token) return;

        setLoading(true);
        fetch(`${API_BASE}/trips`, { headers: getAuthHeaders() })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch trips');
                return res.json();
            })
            .then(data => {
                setTrips(data || []);
                // Auto-select first trip if available
                if (data && data.length > 0) {
                    setSelectedTripId(data[0].id);
                }
            })
            .catch(err => {
                console.error('Error fetching trips:', err);
                setError('Błąd ładowania wycieczek: ' + err.message);
            })
            .finally(() => setLoading(false));
    }, [token, API_BASE, getAuthHeaders]);

    // Fetch pending invitations by checking all trips user has PENDING status in
    useEffect(() => {
        if (!token) return;

        setInvitationsLoading(true);

        // We need to check each trip's participants to find pending invitations for current user
        fetch(`${API_BASE}/trips`, { headers: getAuthHeaders() })
            .then(res => res.ok ? res.json() : [])
            .then(async (allTrips) => {
                const currentUserId = user?.id || user?.userId;
                const invitations = [];

                // Check each trip for pending invitations for current user
                for (const trip of allTrips || []) {
                    try {
                        const participantsRes = await fetch(`${API_BASE}/trips/${trip.id}/participants`, {
                            headers: getAuthHeaders()
                        });

                        if (participantsRes.ok) {
                            const participants = await participantsRes.json();
                            const pendingInvitation = participants.find(p =>
                                p.userId === currentUserId && p.status === 'PENDING'
                            );

                            if (pendingInvitation) {
                                invitations.push({
                                    ...pendingInvitation,
                                    tripName: trip.name,
                                    tripId: trip.id
                                });
                            }
                        }
                    } catch (err) {
                        console.log(`Could not check participants for trip ${trip.id}:`, err);
                    }
                }

                setPendingInvitations(invitations);
            })
            .catch(err => {
                console.error('Error fetching invitations:', err);
            })
            .finally(() => setInvitationsLoading(false));
    }, [token, API_BASE, user?.id, user?.userId, getAuthHeaders]);

    // Fetch participants when trip is selected
    useEffect(() => {
        if (!selectedTripId || !token) {
            setParticipants([]);
            setCurrentUserRole(null);
            return;
        }

        fetch(`${API_BASE}/trips/${selectedTripId}/participants`, {
            headers: getAuthHeaders()
        })
            .then(res => {
                if (!res.ok) {
                    if (res.status === 403) {
                        throw new Error('Nie masz dostępu do tej wycieczki');
                    }
                    throw new Error('Failed to fetch participants');
                }
                return res.json();
            })
            .then(data => {
                setParticipants(data || []);
                const currentUserId = user?.id || user?.userId;
                const currentUserParticipant = data.find(p => p.userId === currentUserId);
                setCurrentUserRole(currentUserParticipant?.role || null);
            })
            .catch(err => {
                console.error('Error fetching participants:', err);
                setError(err.message);
                setParticipants([]);
                setCurrentUserRole(null);
            });
    }, [selectedTripId, token, API_BASE, user?.id, user?.userId, getAuthHeaders]);

    const handleTripChange = (e) => {
        setSelectedTripId(e.target.value);
        setShowInviteForm(false);
    };

    const handleParticipantUpdate = useCallback(() => {
        if (selectedTripId) {
            fetch(`${API_BASE}/trips/${selectedTripId}/participants`, {
                headers: getAuthHeaders()
            })
                .then(res => res.ok ? res.json() : [])
                .then(data => setParticipants(data || []))
                .catch(err => console.error('Error refreshing participants:', err));
        }
    }, [selectedTripId, API_BASE, getAuthHeaders]);

    // Handle invitation response - TRY EMAIL-BASED ENDPOINT FIRST
    const handleInvitationResponse = async (invitation, action) => {
        try {
            const status = action === 'accept' ? 'ACCEPTED' : 'DECLINED';
            const currentUserEmail = user?.email;

            if (!currentUserEmail) {
                throw new Error('Nie można określić emaila użytkownika');
            }

            console.log('🔍 Debug - User object:', user);
            console.log('🔍 Debug - Invitation object:', invitation);
            console.log('🔍 Debug - Action:', action, 'Status:', status);

            // Try email-based endpoint first (more reliable)
            let url = `${API_BASE}/trips/${invitation.tripId}/participants/email/${encodeURIComponent(currentUserEmail)}/respond`;
            console.log('🌐 Trying email-based URL:', url);

            let response = await fetch(url, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status })
            });

            // If email endpoint fails, try ID-based endpoint
            if (!response.ok) {
                console.log('❌ Email endpoint failed, trying ID-based endpoint...');
                url = `${API_BASE}/trips/${invitation.tripId}/participants/${invitation.id}/respond`;
                console.log('🌐 Trying ID-based URL:', url);

                response = await fetch(url, {
                    method: 'PATCH',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ status })
                });
            }

            console.log('📊 Response status:', response.status);
            console.log('📊 Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error response:', errorText);

                // Check if it's a network error
                if (response.status === 0) {
                    throw new Error('Nie można połączyć się z serwerem. Sprawdź czy backend działa na porcie 8081.');
                }

                throw new Error(`HTTP ${response.status}: ${errorText || 'Błąd serwera'}`);
            }

            const result = await response.json();
            console.log('✅ Success result:', result);

            // Remove invitation from list
            setPendingInvitations(prev => prev.filter(inv => inv.id !== invitation.id));

            // Refresh trips list if accepted
            if (action === 'accept') {
                fetch(`${API_BASE}/trips`, { headers: getAuthHeaders() })
                    .then(res => res.ok ? res.json() : [])
                    .then(data => setTrips(data || []))
                    .catch(err => console.error('Error refreshing trips:', err));
            }

            alert(`Zaproszenie zostało ${action === 'accept' ? 'zaakceptowane' : 'odrzucone'}!`);

        } catch (error) {
            console.error(`❌ Error ${action}ing invitation:`, error);

            // More specific error messages
            let errorMessage = error.message;
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Nie można połączyć się z serwerem. Sprawdź czy backend działa na http://localhost:8081';
            }

            alert(`❌ Błąd podczas ${action === 'accept' ? 'akceptowania' : 'odrzucania'} zaproszenia:\n\n${errorMessage}`);
        }
    };

    const getRoleDisplay = (role) => {
        const roleMap = {
            'ORGANIZER': { text: 'Organizator', variant: 'primary' },
            'MEMBER': { text: 'Członek', variant: 'success' },
            'GUEST': { text: 'Gość', variant: 'secondary' }
        };
        return roleMap[role] || { text: role, variant: 'secondary' };
    };

    // ✅ NEW GRANULAR PERMISSIONS
    const canInviteParticipants = ['ORGANIZER', 'MEMBER'].includes(currentUserRole); // Organizer + Member can invite
    const canManageParticipants = currentUserRole === 'ORGANIZER'; // Only Organizer can change roles/remove
    const canViewParticipants = ['ORGANIZER', 'MEMBER', 'GUEST'].includes(currentUserRole); // All can view
    const isReadOnly = currentUserRole === 'GUEST'; // Guest is read-only

    if (loading) {
        return (
            <MainLayout>
                <Container className="mt-4">
                    <div className="text-center">
                        <Spinner animation="border" />
                        <p className="mt-2">Ładowanie...</p>
                    </div>
                </Container>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Container className="mt-4">
                <h1 className="mb-4 text-center">👥 Zarządzanie uczestnikami</h1>

                <Row>
                    <Col>
                        {/* Pending Invitations Section */}
                        {pendingInvitations.length > 0 && (
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5>📨 Oczekujące zaproszenia ({pendingInvitations.length})</h5>
                                </Card.Header>
                                <Card.Body>
                                    {invitationsLoading ? (
                                        <div className="text-center">
                                            <Spinner animation="border" size="sm" />
                                            <span className="ms-2">Ładowanie zaproszeń...</span>
                                        </div>
                                    ) : (
                                        <Table striped bordered hover responsive>
                                            <thead>
                                            <tr>
                                                <th>Wycieczka</th>
                                                <th>Rola</th>
                                                <th>Akcje</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {pendingInvitations.map(invitation => {
                                                const roleDisplay = getRoleDisplay(invitation.role);
                                                return (
                                                    <tr key={invitation.id}>
                                                        <td>
                                                            <strong>{invitation.tripName}</strong>
                                                        </td>
                                                        <td>
                                                            <Badge bg={roleDisplay.variant}>
                                                                {roleDisplay.text}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <Button
                                                                size="sm"
                                                                variant="success"
                                                                className="me-2"
                                                                onClick={() => handleInvitationResponse(invitation, 'accept')}
                                                            >
                                                                ✅ Akceptuj
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="danger"
                                                                onClick={() => handleInvitationResponse(invitation, 'decline')}
                                                            >
                                                                ❌ Odrzuć
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </Table>
                                    )}
                                </Card.Body>
                            </Card>
                        )}

                        {/* Main Participants Management */}
                        <Card>
                            <Card.Header>
                                <div className="d-flex justify-content-between align-items-center">
                                    <h3>👥 Zarządzanie uczestnikami</h3>
                                    {/* ✅ SHOW PERMISSION LEVEL */}
                                    {currentUserRole && (
                                        <div className="text-end">
                                            <Badge bg={getRoleDisplay(currentUserRole).variant} className="mb-1">
                                                {getRoleDisplay(currentUserRole).text}
                                            </Badge>
                                            <br />
                                            <small className="text-muted">
                                            </small>
                                        </div>
                                    )}
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {error && <Alert variant="danger">{error}</Alert>}

                                {/* ✅ READ-ONLY NOTICE FOR GUESTS */}
                                {isReadOnly && (
                                    <Alert variant="info" className="mb-4">
                                        <h6>👁️ Tryb tylko do odczytu</h6>
                                    </Alert>
                                )}

                                {/* Trip Selection */}
                                <Row className="mb-4">
                                    <Col>
                                        <Form.Group>
                                            <Form.Label>Wybierz wycieczkę:</Form.Label>
                                            <Form.Select
                                                value={selectedTripId}
                                                onChange={handleTripChange}
                                                disabled={trips.length === 0}
                                            >
                                                <option value="">-- Wybierz wycieczkę --</option>
                                                {trips.map(trip => (
                                                    <option key={trip.id} value={trip.id}>
                                                        {trip.name}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                {trips.length === 0 && pendingInvitations.length === 0 && !invitationsLoading && (
                                    <Alert variant="info">
                                        <h5>Brak wycieczek i zaproszeń</h5>
                                        <p>Nie uczestniczysz jeszcze w żadnych wycieczkach i nie masz oczekujących zaproszeń.</p>
                                        <p>Stwórz nową wycieczkę lub poproś kogoś o zaproszenie.</p>
                                    </Alert>
                                )}

                                {selectedTripId && canViewParticipants && (
                                    <>
                                        {/* ✅ INVITE BUTTON - Now available for both ORGANIZER and MEMBER */}
                                        {canInviteParticipants && (
                                            <Row className="mb-3">
                                                <Col>
                                                    <Button
                                                        variant="primary"
                                                        onClick={() => setShowInviteForm(!showInviteForm)}
                                                        className="me-2"
                                                    >
                                                        {showInviteForm ? 'Anuluj' : '➕ Zaproś uczestnika'}
                                                    </Button>
                                                    {currentUserRole === 'MEMBER'}
                                                </Col>
                                            </Row>
                                        )}

                                        {showInviteForm && (
                                            <Row className="mb-4">
                                                <Col>
                                                    <InviteParticipant
                                                        tripId={selectedTripId}
                                                        onSuccess={() => {
                                                            setShowInviteForm(false);
                                                            handleParticipantUpdate();
                                                        }}
                                                        onCancel={() => setShowInviteForm(false)}
                                                    />
                                                </Col>
                                            </Row>
                                        )}

                                        <Row>
                                            <Col>
                                                <ParticipantList
                                                    participants={participants}
                                                    currentUserRole={currentUserRole}
                                                    currentUserId={user?.id || user?.userId}
                                                    tripId={selectedTripId}
                                                    onParticipantUpdate={handleParticipantUpdate}
                                                    canManageParticipants={canManageParticipants} // ✅ Pass the permission
                                                />
                                            </Col>
                                        </Row>
                                    </>
                                )}

                                {selectedTripId && !canViewParticipants && (
                                    <Alert variant="warning">
                                        Nie masz uprawnień do przeglądania uczestników tej wycieczki.
                                    </Alert>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </MainLayout>
    );
}

export default ParticipantsPage;