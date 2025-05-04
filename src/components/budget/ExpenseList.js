import React, { useState } from "react";
import { Table, Button } from "react-bootstrap";

const mockExpenses = [
  {
    id: 1,
    description: "Hotel 2 noce",
    amount: 350,
    payer: "Kasia",
    participants: {
      Bartek: 0.25,
      Kasia: 0.25,
      Darek: 0.5,
    },
    paidBy: [],
  },
  {
    id: 2,
    description: "Lunch w Krakowie",
    amount: 150,
    payer: "Ola",
    participants: {
      Ola: 0.5,
      Adam: 0.5,
    },
    paidBy: [],
  },
];

function ExpenseList() {
  const [expenses, setExpenses] = useState(mockExpenses);

  const togglePaid = (expenseId, participant) => {
    setExpenses((prev) =>
      prev.map((exp) => {
        if (exp.id === expenseId) {
          const isPaid = exp.paidBy.includes(participant);
          const updatedPaidBy = isPaid
            ? exp.paidBy.filter((p) => p !== participant)
            : [...exp.paidBy, participant];
          return { ...exp, paidBy: updatedPaidBy };
        }
        return exp;
      })
    );
  };

  return (
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
            <td>{expense.description}</td>
            <td>{expense.amount} zł</td>
            <td>{expense.payer}</td>
            <td>
              <div className="d-flex flex-column gap-2">
                {Object.entries(expense.participants).map(([name, share]) => {
                  const isPaid = expense.paidBy.includes(name);
                  return (
                    <Button
                      key={name}
                      variant={isPaid ? "success" : "outline-secondary"}
                      size="sm"
                      className="text-start"
                      onClick={() => togglePaid(expense.id, name)}
                    >
                      {name} ({(share * 100).toFixed(0)}%) –{" "}
                      {isPaid ? "Opłacono" : "Oznacz jako opłacone"}
                    </Button>
                  );
                })}
              </div>
            </td>
            <td>
              <button className="btn btn-outline-danger btn-sm">Usuń</button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default ExpenseList;
