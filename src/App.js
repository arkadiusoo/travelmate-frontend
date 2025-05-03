import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
// import TripsPage from "./pages/TripsPage";
// import BudgetPage from "./pages/BudgetPage";
// import ParticipantsPage from "./pages/ParticipantsPage";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(stored);
    } catch (err) {
      console.warn("localStorage unavailable:", err);
    }
  }, []);

  return (
    <Router>
      <Routes>
        {!isLoggedIn ? (
          <Route
            path="*"
            element={<Home onLogin={() => setIsLoggedIn(true)} />}
          />
        ) : (
          <>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* <Route path="/trips" element={<TripsPage />} /> */}
            {/* <Route path="/budget" element={<BudgetPage />} /> */}
            {/* <Route path="/participants" element={<ParticipantsPage />} /> */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </>
        )}
      </Routes>
    </Router>
  );
}

export default App;
