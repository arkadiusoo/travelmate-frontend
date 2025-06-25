import React, { useState, useContext, useEffect } from "react";
import { Form, Button, Alert, Card } from "react-bootstrap";
import { ThemeContext } from "../styles/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

function ResetPasswordForm() {
    const { darkMode } = useContext(ThemeContext);
    const { resetPassword, validateResetToken } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        newPassword: "",
        confirmPassword: ""
    });
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [tokenValid, setTokenValid] = useState(false);

    // Validate token on component mount
    useEffect(() => {
        const checkToken = async () => {
            if (!token) {
                setError("Brak tokenu resetowania hasła");
                setValidating(false);
                return;
            }

            try {
                const result = await validateResetToken(token);
                if (result.success) {
                    setTokenValid(true);
                } else {
                    setError("Token resetowania hasła jest nieprawidłowy lub wygasł");
                }
            } catch (err) {
                setError("Wystąpił błąd podczas sprawdzania tokenu");
            } finally {
                setValidating(false);
            }
        };

        checkToken();
    }, [token, validateResetToken]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (error) setError(""); // Clear error when user types
        if (success) setSuccess(""); // Clear success when user types
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        // Validate passwords match
        if (formData.newPassword !== formData.confirmPassword) {
            setError("Hasła nie są identyczne");
            setLoading(false);
            return;
        }

        // Validate password length
        if (formData.newPassword.length < 6) {
            setError("Hasło musi mieć co najmniej 6 znaków");
            setLoading(false);
            return;
        }

        try {
            const result = await resetPassword(token, formData.newPassword);

            if (result.success) {
                setSuccess("Hasło zostało pomyślnie zresetowane! Przekierowujemy do logowania...");
                setFormData({ newPassword: "", confirmPassword: "" });

                // Redirect to login page after 3 seconds
                setTimeout(() => {
                    navigate("/");
                }, 3000);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError("Wystąpił nieoczekiwany błąd");
        } finally {
            setLoading(false);
        }
    };

    // Show loading spinner while validating token
    if (validating) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Sprawdzanie tokenu...</span>
                    </div>
                    <p className="mt-2">Sprawdzanie tokenu...</p>
                </div>
            </div>
        );
    }

    // Show error if token is invalid
    if (!tokenValid) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="w-100" style={{ maxWidth: "400px" }}>
                    <Card className={darkMode ? "bg-dark text-light" : "bg-light text-dark"}>
                        <Card.Body className="p-4 text-center">
                            <h2 className="mb-3">Nieprawidłowy token</h2>
                            <Alert variant="danger" className="mb-3">
                                {error}
                            </Alert>
                            <p className="text-muted mb-3">
                                Token resetowania hasła jest nieprawidłowy lub wygasł.
                                Spróbuj ponownie zresetować hasło.
                            </p>
                            <Link to="/forgot-password" className="btn btn-primary me-2">
                                Resetuj hasło ponownie
                            </Link>
                            <Link to="/" className="btn btn-outline-secondary">
                                Wróć do logowania
                            </Link>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex justify-content-center align-items-center min-vh-100">
            <div className="w-100" style={{ maxWidth: "400px" }}>
                <Card className={darkMode ? "bg-dark text-light" : "bg-light text-dark"}>
                    <Card.Body className="p-4">
                        <div className="text-center mb-4">
                            <h2>Ustaw nowe hasło</h2>
                            <p className="text-muted">
                                Wprowadź nowe hasło dla Twojego konta
                            </p>
                        </div>

                        <Form onSubmit={handleSubmit}>
                            {error && (
                                <Alert variant="danger" className="mb-3">
                                    {error}
                                </Alert>
                            )}

                            {success && (
                                <Alert variant="success" className="mb-3">
                                    {success}
                                </Alert>
                            )}

                            <Form.Group className="mb-3">
                                <Form.Label>Nowe hasło</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="newPassword"
                                    placeholder="Wpisz nowe hasło"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    disabled={loading || success}
                                />
                                <Form.Text className="text-muted">
                                    Minimum 6 znaków
                                </Form.Text>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Potwierdź nowe hasło</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Potwierdź nowe hasło"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    disabled={loading || success}
                                />
                            </Form.Group>

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-100 mb-3"
                                disabled={loading || success}
                            >
                                {loading ? "Resetowanie..." : "Resetuj hasło"}
                            </Button>

                            <div className="text-center">
                                <small>
                                    <Link
                                        to="/"
                                        className={darkMode ? "text-light" : "text-primary"}
                                    >
                                        Wróć do logowania
                                    </Link>
                                </small>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </div>
        </div>
    );
}

export default ResetPasswordForm;