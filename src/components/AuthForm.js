import React from "react";
import { Form, Button } from "react-bootstrap";

function AuthForm({ isLogin = true, onSwitchMode }) {
  return (
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
  );
}

export default AuthForm;
