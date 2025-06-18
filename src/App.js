import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./styles/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import TripsPage from "./pages/TripsPage";
import PlanTrip from "./pages/PlanTrip";
import BudgetPage from "./pages/BudgetPage";
import 'bootstrap/dist/css/bootstrap.min.css';

// This component handles the routing logic based on authentication
function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
    );
  }

  return (
      <Routes>
        {!isAuthenticated ? (
            // Not logged in - show Home page for all routes
            <Route
                path="*"
                element={<Home />}
            />
        ) : (
            // Logged in - show protected routes
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/trips" element={<TripsPage />} />
              <Route path="/trips/:id" element={<PlanTrip />} />
              <Route path="/budget" element={<BudgetPage />} />
              {/* <Route path="/participants" element={<ParticipantsPage />} /> */}

              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" />} />

              {/* Catch all other routes */}
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </>
        )}
      </Routes>
  );
}

function App() {
  return (
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <AppRoutes />
          </Router>
        </ThemeProvider>
      </AuthProvider>
  );
}

export default App;