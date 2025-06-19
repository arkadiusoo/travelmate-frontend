import React, { useRef, useLayoutEffect, useState, useContext } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { ThemeContext } from "../styles/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "../styles/authTransition.css";

function AuthForm({ isLogin, onSwitchMode }) {
  const { darkMode } = useContext(ThemeContext);
  const { login, register } = useAuth();
  const nodeRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Form state - added lastName
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useLayoutEffect(() => {
    if (nodeRef.current && containerRef.current) {
      const newHeight = nodeRef.current.scrollHeight;
      containerRef.current.style.height = `${newHeight}px`;
    }
  }, [isLogin]);

  const handleEnter = () => {
    if (nodeRef.current && containerRef.current) {
      const newHeight = nodeRef.current.scrollHeight;
      containerRef.current.style.height = `${newHeight}px`;
    }
  };

  const handleExit = () => {
    if (nodeRef.current && containerRef.current) {
      const currentHeight = nodeRef.current.scrollHeight;
      containerRef.current.style.height = `${currentHeight}px`;
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let result;

      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        // Pass both firstName and lastName for registration
        result = await register(formData.email, formData.password, formData.firstName, formData.lastName);
      }

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Wystąpił nieoczekiwany błąd");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div
          ref={containerRef}
          style={{
            overflow: "hidden",
            transition: "height 500ms ease-in-out",
          }}
      >
        <SwitchTransition mode="out-in">
          <CSSTransition
              key={isLogin ? "login" : "register"}
              timeout={300}
              classNames="fade"
              nodeRef={nodeRef}
              onEnter={handleEnter}
              onExit={handleExit}
          >
            <div
                ref={nodeRef}
                className={`p-3 rounded ${
                    darkMode ? "bg-dark text-light" : "bg-light text-dark"
                }`}
            >
              <Form onSubmit={handleSubmit}>
                {error && (
                    <Alert variant="danger" className="mb-3">
                      {error}
                    </Alert>
                )}

                {!isLogin && (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label>Imię</Form.Label>
                        <Form.Control
                            type="text"
                            name="firstName"
                            placeholder="Wpisz swoje imię"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Nazwisko</Form.Label>
                        <Form.Control
                            type="text"
                            name="lastName"
                            placeholder="Wpisz swoje nazwisko"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                      </Form.Group>
                    </>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                      type="email"
                      name="email"
                      placeholder="Wpisz email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Hasło</Form.Label>
                  <Form.Control
                      type="password"
                      name="password"
                      placeholder="Hasło"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                  />
                  {!isLogin && (
                      <Form.Text className="text-muted">
                        Minimum 6 znaków
                      </Form.Text>
                  )}
                </Form.Group>

                {/* ✨ NEW: Forgot Password Link - Only show on login form */}
                {isLogin && (
                    <div className="d-flex justify-content-end mb-3">
                      <Link
                          to="/forgot-password"
                          className={`text-decoration-none ${darkMode ? "text-light" : "text-primary"}`}
                          style={{ fontSize: "0.9rem" }}
                      >
                        Zapomniałeś hasła?
                      </Link>
                    </div>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    className="w-100 mb-2"
                    disabled={loading}
                >
                  {loading
                      ? (isLogin ? "Logowanie..." : "Rejestracja...")
                      : (isLogin ? "Zaloguj" : "Zarejestruj")
                  }
                </Button>

                <div className="text-center">
                  <small>
                    {isLogin ? "Nie masz konta jeszcze?" : "Masz już konto?"}{" "}
                    <Button variant="link" onClick={onSwitchMode} disabled={loading}>
                      {isLogin ? "Zarejestruj się" : "Zaloguj się"}
                    </Button>
                  </small>
                </div>
              </Form>
            </div>
          </CSSTransition>
        </SwitchTransition>
      </div>
  );
}

export default AuthForm;