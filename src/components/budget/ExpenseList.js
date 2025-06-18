import React, { useState, useEffect } from "react";
import { Table, Button, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";

function ExpenseList({ tripId }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const [participants, setParticipants] = useState([]);
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  useEffect(() => {
    if (!tripId || !token) {
      setParticipants([]);
      return;
    }

    fetch(`${API_BASE}/trips/${tripId}/participants`, {
      headers: getAuthHeaders()
    })
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch participants`);
          }
          return res.json();
        })
        .then(data => setParticipants(data || []))
        .catch(err => {
          console.error('Error fetching participants:', err);
          // Don't show error for participants, just log it
          setParticipants([]);
        });
  }, [tripId, token, API_BASE]);

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

  // Fetch expenses for selected trip
  useEffect(() => {
    if (!tripId || !token) {
      setExpenses([]);
      return;
    }

    setLoading(true);
    setError('');

    fetch(`${API_BASE}/trips/${tripId}/expenses`, {
      headers: getAuthHeaders()
    })
        .then(res => {
          if (!res.ok) {
            if (res.status === 404) {
              setExpenses([]);
              return [];
            }
            throw new Error(`HTTP ${res.status}: Failed to fetch expenses`);
          }
          return res.json();
        })
        .then(data => setExpenses(data || []))
        .catch(err => {
          console.error('Error fetching expenses:', err);
          setError('Błąd ładowania wydatków: ' + err.message);
          setExpenses([]);
        })
        .finally(() => setLoading(false));
  }, [tripId, token, API_BASE]);

  const togglePaid = async (expenseId, participantId) => {
    try {
      // Find current paid status
      const expense = expenses.find(e => e.id === expenseId);
      const participant = expense?.participants?.find(p => p.userId === participantId);
      const newPaidStatus = !participant?.isPaid;

      // Update via PATCH endpoint
      const updates = {
        participantPaidStatus: {
          [participantId]: newPaidStatus
        }
      };

      const response = await fetch(`${API_BASE}/trips/${tripId}/expenses/${expenseId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to update paid status`);
      }

      const updatedExpense = await response.json();

      // Update local state with response from server
      setExpenses(prev =>
          prev.map(expense =>
              expense.id === expenseId ? updatedExpense : expense
          )
      );
    } catch (err) {
      console.error('Error toggling paid status:', err);
      setError('Błąd aktualizacji statusu płatności: ' + err.message);
    }
  };

  const deleteExpense = async (expenseId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten wydatek?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/trips/${tripId}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to delete expense`);
      }

      // Remove from local state
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Błąd usuwania wydatku: ' + err.message);
    }
  };

  if (!tripId) {
    return (
        <div className="text-center text-muted">
          <p>Wybierz wycieczkę aby zobaczyć wydatki</p>
        </div>
    );
  }

  if (loading) {
    return (
        <div className="text-center">
          <Spinner animation="border" />
          <p className="mt-2">Ładowanie wydatków...</p>
        </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (expenses.length === 0) {
    return (
        <div className="text-center text-muted">
          <p>Brak wydatków dla tej wycieczki</p>
          <small>Dodaj pierwszy wydatek używając przycisku "Dodaj wydatek"</small>
        </div>
    );
  }

  return (
      <>
        {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

        <Table bordered hover responsive>
          <thead>
          <tr>
            <th>Nazwa</th>
            <th>Kwota</th>
            <th>Opłacone przez</th>
            <th>Uczestnicy</th>
            <th>Akcje</th>
          </tr>
          </thead>
          <tbody>
          {expenses.map((expense) => (
              <tr key={expense.id}>
                <td>
                  <strong>{expense.title}</strong>
                  {expense.description && (
                      <div className="text-muted small">{expense.description}</div>
                  )}
                </td>
                <td>
                  <strong>{expense.amount?.toFixed(2)} zł</strong>
                </td>
                <td>{getParticipantName(expense.payerId)}</td>
                <td>
                  <div className="d-flex flex-column gap-2">
                    {expense.participants?.map((participant) => {
                      const shareAmount = (expense.amount * participant.share) / 100;
                      return (
                          <Button
                              key={participant.userId}
                              variant={participant.isPaid ? "success" : "outline-secondary"}
                              size="sm"
                              className="text-start"
                              onClick={() => togglePaid(expense.id, participant.userId)}
                          >
                            <div className="d-flex justify-content-between align-items-center w-100">
                          <span>
                            {participant.userName || participant.userId} ({participant.share}%)
                          </span>
                              <span className="ms-2">
                            {shareAmount.toFixed(2)} zł
                          </span>
                            </div>
                            <small className="d-block">
                              {participant.isPaid ? "✓ Opłacone" : "⏳ Do opłaty"}
                            </small>
                          </Button>
                      );
                    }) || <small className="text-muted">Brak uczestników</small>}
                  </div>
                </td>
                <td>
                  <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => deleteExpense(expense.id)}
                  >
                    Usuń
                  </Button>
                </td>
              </tr>
          ))}
          </tbody>
        </Table>
      </>
  );
}

export default ExpenseList;