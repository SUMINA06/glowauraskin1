import React from 'react';

const Confirm = ({ show, message, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="modal show" style={{ display: 'block' }}>
      <div className="modal-content small">
        <div className="modal-header">
          <h3>Confirm</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default Confirm;
