import React, { useState, useEffect } from 'react';
import { Alert, Table, Button, Badge, Spinner } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

function MyInvitations() {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState({});

    const { token } = useAuth();
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    useEffect(() => {
        if (!token) return;

        setLoading(true);
        fetch(`${API_BASE}/participants/my-invitations`, {
            headers: getAuthHeaders()
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch invitations');
                return res.json();
            })
            .then(data => {
                setInvitations(data || []);
            })
            .catch(err => {
                console.error('Error fetching invitations:', err);
                setError('Błąd ładowania zaproszeń: ' + err.message);
            })
            .finally(() => setLoading(false));
    }, [token, API_BASE]);

    const handleInvitationResponse = async (participantId, action) => {
        setActionLoading(prev => ({ ...prev, [participantId]: action }));

        try {
            const response = await fetch(`${API_BASE}/participants/${participantId}/${action}`, {
                method: 'PUT',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Nie udało się ${action === 'accept' ? 'zaakceptować' : 'odrzucić'} zaproszenia`);
            }

            setInvitations(prev => prev.filter(inv => inv.id !== participantId));

        } catch (error) {
            console.error(`Error ${action}ing invitation:`, error);
            setError(`Błąd podczas ${action === 'accept' ? 'akceptowania' : 'odrzucania'} zaproszenia: ` + error.message);
        } finally {
            setActionLoading(prev => ({ ...prev, [participantId]: null }));
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

    if (loading) {
        return (
            <div className="text-center">
                <Spinner animation="border" />
                <p className="mt-2">Ładowanie zaproszeń...</p>
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    if (invitations.length === 0) {
        return (
            <Alert variant="info">
                <h5>📭 Brak zaproszeń</h5>
                <p>Nie masz żadnych oczekujących zaproszeń do wycieczek.</p>
                <p>Zaproszenia pojawią się tutaj, gdy ktoś Cię zaprosi do swojej wycieczki.</p>
            </Alert>
        );
    }

    return (
        <div>
            <h5>📨 Twoje zaproszenia ({invitations.length})</h5>
            <Table striped bordered hover responsive>
                <thead>
                <tr>
                    <th>Nazwa wycieczki</th>
                    <th>Zapraszający</th>
                    <th>Proponowana rola</th>
                    <th>Data zaproszenia</th>
                    <th>Akcje</th>
                </tr>
                </thead>
                <tbody>
                {invitations.map(invitation => {
                    const roleDisplay = getRoleDisplay(invitation.role);
                    const isProcessing = actionLoading[invitation.id];

                    return (
                        <tr key={invitation.id}>
                            <td>
                                <strong>{invitation.tripName}</strong>
                                {invitation.tripDestination && (
                                    <div className="text-muted small">
                                        📍 {invitation.tripDestination}
                                    </div>
                                )}
                            </td>
                            <td>{invitation.inviterEmail}</td>
                            <td>
                                <Badge bg={roleDisplay.variant}>
                                    {roleDisplay.text}
                                </Badge>
                            </td>
                            <td>
                                {invitation.createdAt ?
                                    new Date(invitation.createdAt).toLocaleDateString('pl-PL') :
                                    'Nie określono'
                                }
                            </td>
                            <td>
                                <div className="d-flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="success"
                                        onClick={() => handleInvitationResponse(invitation.id, 'accept')}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing === 'accept' ? (
                                            <>
                                                <Spinner size="sm" animation="border" className="me-1" />
                                                Akceptuję...
                                            </>
                                        ) : (
                                            '✅ Akceptuj'
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => handleInvitationResponse(invitation.id, 'decline')}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing === 'decline' ? (
                                            <>
                                                <Spinner size="sm" animation="border" className="me-1" />
                                                Odrzucam...
                                            </>
                                        ) : (
                                            '❌ Odrzuć'
                                        )}
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </Table>
        </div>
    );
}

export default MyInvitations;