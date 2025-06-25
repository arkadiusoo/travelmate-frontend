import React, { useState, useContext } from "react";
import { Form, Button, Alert, Card } from "react-bootstrap";
import { ThemeContext } from "../styles/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

function ForgotPasswordForm() {
    const { darkMode } = useContext(ThemeContext);
    const { forgotPassword } = useAuth();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {
        setEmail(e.target.value);
        if (error) setError(""); // Clear error when user types
        if (success) setSuccess(""); // Clear success when user types
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const result = await forgotPassword(email);

            if (result.success) {
                setSuccess(result.message || "Link do resetowania hasła został wysłany na Twój email.");
                setEmail(""); // Clear form on success
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
        <div className="d-flex justify-content-center align-items-center min-vh-100">
            <div className="w-100" style={{ maxWidth: "400px" }}>
                <Card className={darkMode ? "bg-dark text-light" : "bg-light text-dark"}>
                    <Card.Body className="p-4">
                        <div className="text-center mb-4">
                            <h2>Resetuj hasło</h2>
                            <p className="text-muted">
                                Podaj adres email, a wyślemy Ci link do resetowania hasła
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
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Wpisz swój adres email"
                                    value={email}
                                    onChange={handleChange}
                                    required
                                    disabled={loading || success}
                                />
                            </Form.Group>

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-100 mb-3"
                                disabled={loading || success}
                            >
                                {loading ? "Wysyłanie..." : "Wyślij link resetujący"}
                            </Button>

                            <div className="text-center">
                                <small>
                                    Pamiętasz hasło?{" "}
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

export default ForgotPasswordForm;