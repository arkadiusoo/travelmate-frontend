import React from "react";
import { Table, Button } from "react-bootstrap";

function ExpenseList() {
  const sampleExpenses = [
    { id: 1, name: "Nocleg", amount: 200, paidBy: "Adam" },
    { id: 2, name: "Transport", amount: 150, paidBy: "Kasia" },
  ];

  return (
    <Table striped bordered hover>
      <thead>
        <tr>
          <th>Nazwa</th>
          <th>Kwota (zł)</th>
          <th>Opłacone przez</th>
          <th>Akcje</th>
        </tr>
      </thead>
      <tbody>
        {sampleExpenses.map((exp) => (
          <tr key={exp.id}>
            <td>{exp.name}</td>
            <td>{exp.amount}</td>
            <td>{exp.paidBy}</td>
            <td>
              <Button variant="outline-danger" size="sm">
                Usuń
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default ExpenseList;
