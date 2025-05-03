import React, { useRef, useLayoutEffect, useState, useContext } from "react";
import { Form, Button } from "react-bootstrap";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { ThemeContext } from "../styles/ThemeContext"; // 👈 import kontekstu
import "../styles/authTransition.css";

function AuthForm({ isLogin, onSwitchMode }) {
  const { darkMode } = useContext(ThemeContext); // 👈 odczyt trybu
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
          <div
            ref={nodeRef}
            className={`p-3 rounded ${
              darkMode ? "bg-dark text-light" : "bg-light text-dark"
            }`}
          >
            <Form>
              {!isLogin && (
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control type="text" placeholder="Enter your name" />
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" placeholder="Enter email" />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" placeholder="Password" />
              </Form.Group>
              <Button type="submit" variant="primary" className="w-100 mb-2">
                {isLogin ? "Log in" : "Register"}
              </Button>
              <div className="text-center">
                <small>
                  {isLogin ? "Don't have an account?" : "Already have one?"}{" "}
                  <Button variant="link" onClick={onSwitchMode}>
                    {isLogin ? "Register" : "Log in"}
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
