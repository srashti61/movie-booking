import React from 'react';

const ErrorMessage = ({ message }) => {
  return (
    <div style={styles.error}>
      ❌ {message || 'Something went wrong'}
    </div>
  );
};

const styles = {
  error: {
    background: '#ffe5e5',
    color: '#cc0000',
    padding: '10px',
    borderRadius: '5px',
    textAlign: 'center'
  }
};

export default ErrorMessage;
