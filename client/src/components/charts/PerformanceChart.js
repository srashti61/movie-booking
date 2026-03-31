import React from 'react';

const PerformanceChart = () => {
  return (
    <div style={styles.card}>
      <h4>System Performance</h4>
      <p>98% Uptime (Demo)</p>
    </div>
  );
};

const styles = {
  card: {
    padding: '15px',
    background: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center'
  }
};

export default PerformanceChart;
