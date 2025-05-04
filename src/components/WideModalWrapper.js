import React, { useContext } from "react";
import { Modal, Button } from "react-bootstrap";
import { ThemeContext } from "../styles/ThemeContext";

function WideModalWrapper({ show, onClose, title, children }) {
  const { darkMode } = useContext(ThemeContext);
  const themeClass = darkMode ? "bg-dark text-light" : "bg-light text-dark";

  return (
    <Modal show={show} onHide={onClose} centered size="xl">
      <Modal.Header className={themeClass}>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className={themeClass}>{children}</Modal.Body>
      <Modal.Footer className={themeClass}>
        <Button variant={darkMode ? "light" : "secondary"} onClick={onClose}>
          Zamknij
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default WideModalWrapper;
