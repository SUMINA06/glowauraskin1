import React from 'react';

const Modal = ({ id, title, children, onClose, show }) => {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      id={id}
      className={`modal ${show ? 'show' : ''}`}
      style={{ display: show ? 'flex' : 'none' }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal={show}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
