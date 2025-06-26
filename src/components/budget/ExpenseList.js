import React, { useState, useEffect } from "react";
import { Table, Button, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";

function ExpenseList({ tripId }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState({});
  const [userRole, setUserRole] = useState(null); // ✅ NEW: Track user role in trip
  const { token, user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  // ✅ NEW: Check user's role in the trip
  useEffect(() => {
    if (!tripId || !token || !user?.email) {
      setUserRole(null);
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
        .then(data => {
          setParticipants(data || []);

          // Find current user's role
          const currentUserParticipant = data.find(p =>
              p.email === user.email && p.status === 'ACCEPTED'
          );

          if (currentUserParticipant) {
            setUserRole(currentUserParticipant.role);
            console.log('👤 User role in this trip:', currentUserParticipant.role);
          } else {
            setUserRole(null);
            console.log('👤 User is not a participant in this trip');
          }
        })
        .catch(err => {
          console.error('Error fetching participants:', err);
          setParticipants([]);
          setUserRole(null);
        });
  }, [tripId, token, user?.email, API_BASE]);

  const getParticipantName = (userId) => {
    const participant = participants.find(p => p.userId === userId);
    if (participant) {
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

  // ✅ NEW: Check permissions
  const canDeleteExpenses = () => {
    return userRole === 'ORGANIZER';
  };

  const canManagePayments = () => {
    return userRole === 'ORGANIZER' || userRole === 'MEMBER';
  };

  // ✅ NEW: Create participants from expense data
  const createParticipantsFromExpense = (expense) => {
    if (!expense.participantShares) return [];

    return Object.entries(expense.participantShares).map(([userId, share]) => {
      const sharePercentage = share * 100;
      const shareAmount = expense.amount * share;
      const participantName = getParticipantName(userId);

      return {
        userId,
        userName: participantName,
        share: sharePercentage,
        shareAmount: shareAmount,
        isPaid: paymentStatus[`${expense.id}-${userId}`] || false
      };
    });
  };

  // ✅ NEW: Toggle payment status and update server
  const togglePaid = (expenseId, participantId) => {

    if (!canManagePayments()) {
      alert('Nie masz uprawnień do zarządzania płatnościami. Tylko członkowie i organizatorzy mogą to robić.');
      return;
    }

    const key = `${expenseId}-${participantId}`;
    setPaymentStatus(prev => {
      const updated = { ...prev, [key]: true }; // Always mark as paid
      return updated;
    });

    // Prepare the PATCH request data
    const updates = {
      participantPaymentStatus: {
        [participantId]: true // Remove participant's share from the expense
      }
    };

    // Send PATCH request to update on the server
    fetch(`${API_BASE}/trips/${tripId}/expenses/${expenseId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Nie udało się zaktualizować wydatku');
        }
        return res.json();
      })
      .then(updatedExpense => {
        console.log('Expense updated:', updatedExpense);
        // Optionally update local state if needed
      })
      .catch(err => {
        console.error('Error updating expense:', err);
        setError('Błąd podczas aktualizacji wydatku: ' + err.message);
      });
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
        .then(data => {
          console.log('📊 Fetched expenses with participants:', data);
          setExpenses(data || []);
        })
        .catch(err => {
          console.error('Error fetching expenses:', err);
          setError('Błąd ładowania wydatków: ' + err.message);
          setExpenses([]);
        })
        .finally(() => setLoading(false));
  }, [tripId, token, API_BASE]);

  const deleteExpense = async (expenseId) => {
    if (!canDeleteExpenses()) {
      alert('Nie masz uprawnień do usuwania wydatków. Tylko organizatorzy mogą usuwać wydatki.');
      return;
    }

    if (!window.confirm('Czy na pewno chcesz usunąć ten wydatek?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/trips/${tripId}/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Nie masz uprawnień do usuwania wydatków');
        }
        throw new Error(`HTTP ${response.status}: Failed to delete expense`);
      }

      // Remove from local state
      setExpenses(prev => prev.filter(expense => expense.id !== expenseId));

      // Clean up payment status for deleted expense
      setPaymentStatus(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (key.startsWith(expenseId)) {
            delete updated[key];
          }
        });
        return updated;
      });
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Błąd usuwania wydatku: ' + err.message);
    }
  };

  // ✅ NEW: Get category display
  const getCategoryDisplay = (category) => {
    const categoryMap = {
      'TRANSPORT': 'Transport',
      'FOOD': 'Jedzenie',
      'ACCOMMODATION': 'Noclegi',
      'ACTIVITIES': 'Atrakcje',
      'OTHER': 'Inne'
    };
    return categoryMap[category] || category;
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
            <th>Kategoria</th>
            <th>Kwota</th>
            <th>Płatnik</th>
            <th>Uczestnicy</th>
            {canDeleteExpenses() && <th>Akcje</th>} {/* ✅ Only show for ORGANIZER */}
          </tr>
          </thead>
          <tbody>
          {expenses.map((expense) => {
            const expenseParticipants = createParticipantsFromExpense(expense);

            return (
                <tr key={expense.id}>
                  <td>
                    <div>
                      <strong>{expense.name}</strong>
                    </div>
                    {expense.description && (
                        <div className="text-muted small mt-1">{expense.description}</div>
                    )}
                    <div className="text-muted small">
                      {new Date(expense.date).toLocaleDateString('pl-PL')}
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{getCategoryDisplay(expense.category)}</strong>
                    </div>
                  </td>
                  <td>
                    <strong>{expense.amount?.toFixed(2)} zł</strong>
                  </td>
                  <td>{getParticipantName(expense.payerId)}</td>
                  <td>
                    <div className="d-flex flex-column gap-2">
                      {expenseParticipants.length > 0 ? (
                          expenseParticipants.map((participant) => (
                              <Button
                                  key={participant.userId}
                                  variant={participant.isPaid ? "success" : "outline-secondary"}
                                  size="sm"
                                  className="text-start"
                                  onClick={() => togglePaid(expense.id, participant.userId)}
                                  disabled={!canManagePayments()} // ✅ Disable for GUEST
                                  title={!canManagePayments() ? "Nie masz uprawnień do zarządzania płatnościami" : ""}
                              >
                                <div className="d-flex justify-content-between align-items-center w-100">
                              <span>
                                {participant.userName} ({participant.share.toFixed(0)}%)
                              </span>
                                  <span className="ms-2">
                                {participant.shareAmount.toFixed(2)} zł
                              </span>
                                </div>
                                <small className="d-block">
                                  {participant.isPaid ? "✓ Opłacone" : "⏳ Do opłaty"}
                                </small>
                              </Button>
                          ))
                      ) : (
                          <small className="text-muted">Brak uczestników</small>
                      )}
                    </div>
                  </td>
                  {canDeleteExpenses() && ( // ✅ Only show delete button for ORGANIZER
                      <td>
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => deleteExpense(expense.id)}
                            title="Usuń wydatek"
                        >
                          🗑️ Usuń
                        </Button>
                      </td>
                  )}
                </tr>
            );
          })}
          </tbody>
        </Table>

        <div className="mt-3 p-2 bg-light rounded small">
          <div className="d-flex justify-content-between">
            <span>Łączna liczba wydatków:</span>
            <span><strong>{expenses.length}</strong></span>
          </div>
          <div className="d-flex justify-content-between">
            <span>Łączna kwota:</span>
            <span><strong>
              {expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0).toFixed(2)} zł
            </strong></span>
          </div>
        </div>
      </>
  );
}

export default ExpenseList;