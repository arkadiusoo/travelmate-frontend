import React, { useRef, useLayoutEffect, useState } from "react";
import { Form, Button } from "react-bootstrap";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import "../styles/authTransition.css";

function AuthForm({ isLogin, onSwitchMode }) {
  const nodeRef = useRef(null);
  const containerRef = useRef(null);
  const [height, setHeight] = useState("auto");

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
          <div ref={nodeRef}>
            <Form>
              {!isLogin && (
                <Form.Group className="mb-3">
                  <Form.Label>Imię</Form.Label>
                  <Form.Control type="text" placeholder="Wprowadź swoje imię" />
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Wprowadź swój adres email"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Hasło</Form.Label>
                <Form.Control type="password" placeholder="Hasło" />
              </Form.Group>
              <Button type="submit" variant="primary" className="w-100 mb-2">
                {isLogin ? "Zaloguj" : "Zarejestruj"}
              </Button>
              <div className="text-center">
                <small>
                  {isLogin ? "Nie masz konta?" : "Posiadasz już konto?"}{" "}
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
