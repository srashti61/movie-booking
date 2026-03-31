import React from 'react';

const RevenueChart = () => {
  return (
    <div style={styles.card}>
      <h4>Monthly Revenue</h4>
      <p>₹ 1,25,000 (Demo Data)</p>
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

export default RevenueChart;
