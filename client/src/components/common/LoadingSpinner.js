import React from 'react';

const LoadingSpinner = () => {
  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <p>Loading...</p>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #ddd',
    borderTop: '5px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
};

export default LoadingSpinner;
