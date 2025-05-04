import React from "react";
import { ListGroup, Badge } from "react-bootstrap";

const participantNames = {
  "33333333-3333-3333-3333-333333333333": "Adam",
  "22222222-2222-2222-2222-222222222222": "Ola",
  "dddddddd-dddd-dddd-dddd-dddddddddddd": "Darek",
  "cccccccc-cccc-cccc-cccc-cccccccccccc": "Kasia",
  "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb": "Bartek",
};

const data = {
  totalTripCost: 680.0,
  participantShare: {
    "33333333-3333-3333-3333-333333333333": 75.0,
    "22222222-2222-2222-2222-222222222222": 75.0,
    "dddddddd-dddd-dddd-dddd-dddddddddddd": 175.0,
    "cccccccc-cccc-cccc-cccc-cccccccccccc": 177.5,
    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb": 177.5,
  },
  actualPaid: {
    "22222222-2222-2222-2222-222222222222": 150.0,
    "cccccccc-cccc-cccc-cccc-cccccccccccc": 350.0,
    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb": 180.0,
  },
  balance: {
    "33333333-3333-3333-3333-333333333333": -75.0,
    "22222222-2222-2222-2222-222222222222": 75.0,
    "dddddddd-dddd-dddd-dddd-dddddddddddd": -175.0,
    "cccccccc-cccc-cccc-cccc-cccccccccccc": 172.5,
    "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb": 2.5,
  },
};

function BudgetSummary() {
  return (
    <>
      <h5 className="text-center mb-3">Podsumowanie</h5>
      <ListGroup className="mb-3">
        <ListGroup.Item>
          <strong>Całkowity koszt podróży:</strong>{" "}
          {data.totalTripCost.toFixed(2)} zł
        </ListGroup.Item>
      </ListGroup>

      <h6>Rozliczenia indywidualne:</h6>
      <ListGroup>
        {Object.entries(data.balance).map(([id, amount]) => (
          <ListGroup.Item key={id} className="d-flex justify-content-between">
            <span>{participantNames[id] || id}</span>
            <Badge bg={amount >= 0 ? "success" : "danger"}>
              {amount >= 0
                ? `+${amount.toFixed(2)} zł`
                : `${amount.toFixed(2)} zł`}
            </Badge>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </>
  );
}

export default BudgetSummary;
