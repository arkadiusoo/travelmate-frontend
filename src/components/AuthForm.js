import React, { useRef, useLayoutEffect, useState, useContext } from "react";
import { Form, Button } from "react-bootstrap";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { ThemeContext } from "../styles/ThemeContext";
import { useNavigate } from "react-router-dom";
import "../styles/authTransition.css";

function AuthForm({ isLogin, onSwitchMode }) {
  const { darkMode } = useContext(ThemeContext);
  const nodeRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isLogin) {
      navigate("/");
    } else {
      console.log("Register flow not implemented");
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
              {!isLogin && (
                <Form.Group className="mb-3">
                  <Form.Label>Imię</Form.Label>
                  <Form.Control type="text" placeholder="Wpisz swoje imię" />
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Wpisz email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Hasło</Form.Label>
                <Form.Control type="password" placeholder="Hasło" />
              </Form.Group>
              <Button
                type="submit"
                variant="primary"
                className="w-100 mb-2"
                onClick={(e) => {
                  e.preventDefault();
                  const finalEmail =
                    email.trim() !== "" ? email : "Adam@gmail.com";
                  localStorage.setItem("userEmail", finalEmail);
                  localStorage.setItem("isLoggedIn", "true");
                  window.location.href = "/dashboard";
                }}
              >
                {isLogin ? "Zaloguj" : "Zarejestruj"}
              </Button>
              <div className="text-center">
                <small>
                  {isLogin ? "Nie masz konta jeszcze?" : "Masz już konto?"}{" "}
                  <Button variant="link" onClick={onSwitchMode}>
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
