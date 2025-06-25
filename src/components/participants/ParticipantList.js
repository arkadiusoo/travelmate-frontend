import React from 'react';
import { Table, Badge, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

function ParticipantList({
                             participants,
                             currentUserRole,
                             currentUserId,
                             tripId,
                             onParticipantUpdate,
                             canManageParticipants = false // ✅ Receive permission from parent
                         }) {
    const { token } = useAuth();
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    const getRoleDisplay = (role) => {
        const roleMap = {
            'ORGANIZER': { text: 'Organizator', variant: 'primary' },
            'MEMBER': { text: 'Członek', variant: 'success' },
            'GUEST': { text: 'Gość', variant: 'secondary' }
        };
        return roleMap[role] || { text: role, variant: 'secondary' };
    };

    const getStatusDisplay = (status) => {
        const statusMap = {
            'ACCEPTED': { text: 'Zaakceptowane', variant: 'success' },
            'PENDING': { text: 'Oczekuje', variant: 'warning' },
            'DECLINED': { text: 'Odrzucone', variant: 'danger' }
        };
        return statusMap[status] || { text: status, variant: 'secondary' };
    };

    // ✅ NEW: Improved date display function
    const getDateDisplay = (participant) => {
        if (participant.status === 'ACCEPTED' && participant.joinedAt) {
            return new Date(participant.joinedAt).toLocaleDateString('pl-PL');
        }

        if (participant.status === 'PENDING' && participant.createdAt) {
            return `Zaproszony: ${new Date(participant.createdAt).toLocaleDateString('pl-PL')}`;
        }

        if (participant.status === 'DECLINED') {
            return 'Odrzucono zaproszenie';
        }

        // Fallback to createdAt if available
        if (participant.createdAt) {
            return new Date(participant.createdAt).toLocaleDateString('pl-PL');
        }

        return 'Nie określono';
    };

    const handleRemoveParticipant = async (participantId) => {
        if (!window.confirm('Czy na pewno chcesz usunąć tego uczestnika?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/trips/${tripId}/participants/${participantId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Nie udało się usunąć uczestnika');
            }

            onParticipantUpdate();
        } catch (error) {
            console.error('Error removing participant:', error);
            alert('Błąd podczas usuwania uczestnika: ' + error.message);
        }
    };

    const handleChangeRole = async (participantId, newRole) => {
        try {
            const response = await fetch(`${API_BASE}/trips/${tripId}/participants/${participantId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ role: newRole })
            });

            if (!response.ok) {
                throw new Error('Nie udało się zmienić roli');
            }

            onParticipantUpdate();
        } catch (error) {
            console.error('Error changing role:', error);
            alert('Błąd podczas zmiany roli: ' + error.message);
        }
    };

    // ✅ PERMISSION CHECKS
    const isReadOnly = currentUserRole === 'GUEST';
    const showActions = canManageParticipants || !isReadOnly; // Show actions column if user has any permissions

    if (!participants || participants.length === 0) {
        return (
            <Alert variant="info">
                <h5>Brak uczestników</h5>
                <p>Ta wycieczka nie ma jeszcze żadnych uczestników.</p>
            </Alert>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Uczestnicy wycieczki ({participants.length})</h5>

                {/* ✅ PERMISSION INDICATOR */}
                {isReadOnly && (
                    <Badge bg="secondary" className="ms-2">
                    </Badge>
                )}
            </div>

            <Table striped bordered hover responsive>
                <thead>
                <tr>
                    <th>Email</th>
                    <th>Rola</th>
                    <th>Status</th>
                    <th>Data dołączenia</th>
                    {showActions && <th>Akcje</th>}
                </tr>
                </thead>
                <tbody>
                {participants.map(participant => {
                    const roleDisplay = getRoleDisplay(participant.role);
                    const statusDisplay = getStatusDisplay(participant.status);
                    const isCurrentUser = participant.userId === currentUserId;

                    return (
                        <tr key={participant.id} className={isCurrentUser ? 'table-info' : ''}>
                            <td>
                                {participant.email}
                                {isCurrentUser && <span className="text-muted"> (Ty)</span>}
                            </td>
                            <td>
                                <Badge bg={roleDisplay.variant}>
                                    {roleDisplay.text}
                                </Badge>
                            </td>
                            <td>
                                <Badge bg={statusDisplay.variant}>
                                    {statusDisplay.text}
                                </Badge>
                            </td>
                            <td>
                                {/* ✅ UPDATED: Improved date display */}
                                {getDateDisplay(participant)}
                            </td>

                            {/* ✅ ACTIONS COLUMN - Only for non-guests and if permissions allow */}
                            {showActions && (
                                <td>
                                    {isCurrentUser ? (
                                        <small className="text-muted">Twoje konto</small>
                                    ) : isReadOnly ? (
                                        <small className="text-muted">Brak uprawnień</small>
                                    ) : canManageParticipants ? (
                                        /* ✅ FULL MANAGEMENT - Only for ORGANIZER */
                                        <div className="d-flex gap-1 flex-wrap">
                                            {participant.role !== 'ORGANIZER' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline-primary"
                                                    onClick={() => handleChangeRole(participant.id, 'ORGANIZER')}
                                                    title="Ustaw jako organizatora"
                                                >
                                                    ⬆️
                                                </Button>
                                            )}
                                            {participant.role !== 'MEMBER' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline-success"
                                                    onClick={() => handleChangeRole(participant.id, 'MEMBER')}
                                                    title="Ustaw jako członka"
                                                >
                                                    👤
                                                </Button>
                                            )}
                                            {participant.role !== 'GUEST' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline-secondary"
                                                    onClick={() => handleChangeRole(participant.id, 'GUEST')}
                                                    title="Ustaw jako gościa"
                                                >
                                                    👁️
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                onClick={() => handleRemoveParticipant(participant.id)}
                                                title="Usuń uczestnika"
                                            >
                                                ❌
                                            </Button>
                                        </div>
                                    ) : (
                                        /* ✅ LIMITED ACTIONS - For MEMBER (currently none, but ready for future) */
                                        <small className="text-muted">
                                        </small>
                                    )}
                                </td>
                            )}
                        </tr>
                    );
                })}
                </tbody>
            </Table>
        </div>
    );
}

export default ParticipantList;