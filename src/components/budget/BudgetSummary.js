import React, { useState, useEffect } from "react";
import { ListGroup, Badge, Spinner, Alert } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";

function BudgetSummary({ tripId }) {
    const [budgetSummary, setBudgetSummary] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { token } = useAuth();
    const [trip, setTrip] = useState(null);
    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    const getParticipantName = (userId) => {
        const participant = participants.find(p => p.userId === userId);
        if (participant) {
            // Now we have firstName and lastName from the enhanced DTO
            if (participant.firstName && participant.lastName) {
                return `${participant.firstName} ${participant.lastName}`.trim();
            }

            if (participant.firstName) {
                return participant.firstName;
            }

            if (participant.email) {
                return participant.email.split('@')[0];
            }
        }
        return userId?.toString()?.substring(0, 8) || 'Unknown';
    };

    // Fetch participants and budget summary
    useEffect(() => {
        if (!tripId || !token) {
            setBudgetSummary(null);
            setParticipants([]);
            setTrip(null);
            return;
        }

        setLoading(true);
        setError('');

        // Fetch trip details
        fetch(`${API_BASE}/trips/${tripId}`, {
            headers: getAuthHeaders()
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: Failed to fetch trip details`);
            }
            return res.json();
        })
        .then(data => {setTrip(data) })
            .catch(err => console.log('Error fetching trip details:', err))
        // Fetch both participants and budget summary
        Promise.all([
            fetch(`${API_BASE}/trips/${tripId}/participants`, {
                headers: getAuthHeaders()
            }),
            fetch(`${API_BASE}/trips/${tripId}/expenses/budget-summary`, {
                headers: getAuthHeaders()
            })
        ])
            .then(async ([participantsRes, budgetRes]) => {
                // Handle participants response
                if (participantsRes.ok) {
                    const participantsData = await participantsRes.json();
                    setParticipants(participantsData || []);
                } else {
                    console.warn('Failed to fetch participants:', participantsRes.status);
                    setParticipants([]);
                }

                // Handle budget response
                if (budgetRes.ok) {
                    const budgetData = await budgetRes.json();
                    setBudgetSummary(budgetData);
                } else if (budgetRes.status === 404) {
                    // No expenses yet
                    setBudgetSummary({
                        totalTripCost: 0,
                        participantShare: {},
                        actualPaid: {},
                        balance: {}
                    });
                } else {
                    throw new Error(`HTTP ${budgetRes.status}: Failed to fetch budget summary`);
                }
            })
            .catch(err => {
                console.error('Error fetching budget data:', err);
                setError('Błąd ładowania podsumowania budżetu: ' + err.message);
            })
            .finally(() => setLoading(false));
    }, [tripId, token]);

    if (!tripId) {
        return (
            <div className="text-center text-muted">
                <p>Wybierz wycieczkę aby zobaczyć budżet</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="text-center">
                <Spinner animation="border" size="sm" />
                <p className="mt-2 small">Ładowanie budżetu...</p>
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger" className="mb-0">{error}</Alert>;
    }

    if (!budgetSummary || (budgetSummary.totalTripCost === 0 && Object.keys(budgetSummary.balance || {}).length === 0)) {
        return (
            <div className="text-center text-muted">
                <p>Brak wydatków</p>
                <small>Dodaj pierwszy wydatek aby zobaczyć podsumowanie budżetu</small>
            </div>
        );
    }

    return (
        <>
            <ListGroup className="mb-3">
                <ListGroup.Item>
                    <strong>Planowany budżet:</strong>{" "}
                    <span className="float-end">
                        {trip && trip.tripBudget ? trip.tripBudget.toFixed(2) : 'Brak danych'} zł
                    </span>
                </ListGroup.Item>
            </ListGroup>
            <h6 className="text-center mb-3">Podsumowanie</h6>

            <ListGroup className="mb-3">
                <ListGroup.Item>
                    <strong>Całkowity koszt podróży:</strong>{" "}
                    <span className="float-end">
            {budgetSummary.totalTripCost?.toFixed(2) || '0.00'} zł
          </span>
                </ListGroup.Item>
            </ListGroup>

            {budgetSummary.balance && Object.keys(budgetSummary.balance).length > 0 && (
                <>
                    <h6>Rozliczenia indywidualne:</h6>
                    <ListGroup className="mb-3">
                        {Object.entries(budgetSummary.balance)
                            .sort(([,a], [,b]) => b - a)
                            .map(([userId, balance]) => (
                                <ListGroup.Item key={userId} className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <div><strong>{getParticipantName(userId)}</strong></div>
                                        <small className="text-muted">
                                            Należy się: {budgetSummary.participantShare?.[userId]?.toFixed(2) || '0.00'} zł |
                                            Zapłacił: {budgetSummary.actualPaid?.[userId]?.toFixed(2) || '0.00'} zł
                                        </small>
                                    </div>
                                    <Badge bg={balance >= 0 ? "success" : "danger"}>
                                        {balance >= 0
                                            ? `+${balance.toFixed(2)} zł`
                                            : `${balance.toFixed(2)} zł`}
                                    </Badge>
                                </ListGroup.Item>
                            ))}
                    </ListGroup>
                </>
            )}

            {/* Detailed breakdown if there are multiple participants */}
            {budgetSummary.participantShare && Object.keys(budgetSummary.participantShare).length > 1 && (
                <>
                    <h6 className="mt-4">Szczegółowe rozliczenie:</h6>
                    <ListGroup className="mb-3">
                        {Object.entries(budgetSummary.participantShare).map(([userId, shareAmount]) => {
                            const paidAmount = budgetSummary.actualPaid?.[userId] || 0;
                            const balanceAmount = budgetSummary.balance?.[userId] || 0;

                            return (
                                <ListGroup.Item key={userId}>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <strong>{getParticipantName(userId)}</strong>
                                        <Badge bg={balanceAmount >= 0 ? "success" : "danger"}>
                                            {balanceAmount >= 0 ? "Do zwrotu" : "Do dopłaty"}
                                        </Badge>
                                    </div>
                                    <div className="small text-muted mt-1">
                                        <div>Powinien zapłacić: <strong>{shareAmount.toFixed(2)} zł</strong></div>
                                        <div>Rzeczywiście zapłacił: <strong>{paidAmount.toFixed(2)} zł</strong></div>
                                        <div className={balanceAmount >= 0 ? "text-success" : "text-danger"}>
                                            Bilans: <strong>{balanceAmount >= 0 ? '+' : ''}{balanceAmount.toFixed(2)} zł</strong>
                                        </div>
                                    </div>
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>
                </>
            )}

            <div className="mt-3 p-2 rounded small">
                <div className="d-flex justify-content-between">
                    <span>Całkowity koszt:</span>
                    <span>{budgetSummary.totalTripCost?.toFixed(2) || '0.00'} zł</span>
                </div>
                <div className="text-muted mt-1">
                    <div>✅ Dodatni bilans = należy się zwrot</div>
                    <div>❌ Ujemny bilans = do dopłaty</div>
                </div>
            </div>
        </>
    );
}

export default BudgetSummary;