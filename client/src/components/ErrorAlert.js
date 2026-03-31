import React from 'react';
import { Alert, Button } from 'react-bootstrap';

const ErrorAlert = ({ 
  error, 
  onRetry, 
  onClose,
  title = 'Error',
  retryText = 'Try Again',
  showRetry = true
}) => {
  if (!error) return null;

  return (
    <Alert variant="danger" className="mb-4">
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <Alert.Heading>{title}</Alert.Heading>
          <p className="mb-0">{error}</p>
        </div>
        {onClose && (
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={onClose}
            className="ms-3"
          >
            &times;
          </Button>
        )}
      </div>
      {showRetry && onRetry && (
        <div className="mt-3">
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={onRetry}
          >
            {retryText}
          </Button>
        </div>
      )}
    </Alert>
  );
};

export default ErrorAlert;