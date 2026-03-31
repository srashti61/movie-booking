import React from 'react';
import { Spinner } from 'react-bootstrap';

const LoadingSpinner = ({ size = 'md', message = 'Loading...', fullScreen = false }) => {
  const spinner = (
    <div className={`d-flex flex-column align-items-center justify-content-center ${fullScreen ? 'vh-100' : 'py-5'}`}>
      <Spinner 
        animation="border" 
        role="status"
        size={size}
        variant="primary"
      >
        <span className="visually-hidden">{message}</span>
      </Spinner>
      {message && (
        <p className="mt-3 text-muted">{message}</p>
      )}
    </div>
  );

  return spinner;
};

export const InlineSpinner = ({ size = 'sm', message }) => (
  <div className="d-inline-flex align-items-center">
    <Spinner animation="border" size={size} className="me-2" />
    {message && <span>{message}</span>}
  </div>
);

export default LoadingSpinner;