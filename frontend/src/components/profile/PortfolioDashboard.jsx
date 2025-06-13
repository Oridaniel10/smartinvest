import React from 'react';
import StatCard from './StatCard';

// A simple function to format numbers as currency
const formatCurrency = (amount) => {
  // Ensure we don't format null or undefined, return a default value
  if (amount === null || typeof amount === 'undefined') {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};


function PortfolioDashboard({ stats }) {
  if (!stats) return null;

  return (
    <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/10">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Portfolio Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          label="Cash Balance" 
          value={formatCurrency(stats.balance)} 
        />
        <StatCard 
          label="Total Invested (Cost)" 
          value={formatCurrency(stats.invested_amount)} 
        />
        <StatCard 
          label="Portfolio Market Value" 
          value={formatCurrency(stats.total_portfolio_value)} 
          description="Current value of your holdings"
        />
      </div>
    </div>
  );
}

export default PortfolioDashboard; 