import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * A component to display portfolio-related charts.
 * Currently includes a Pie Chart for asset allocation.
 * 
 * @param {object} props - The component props.
 * @param {Array<object>} props.portfolio - The user's portfolio data.
 */
function ChartsSection({ portfolio }) {
  // Data for the allocation pie chart. We map the portfolio to the format Recharts expects.
  const pieChartData = portfolio.map(stock => ({
    name: stock.symbol,
    value: stock.current_value, // Using current_value for market-based allocation
  }));

  // Colors for the pie chart slices
  const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];

  return (
    <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/10 pb-10">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Visualizations</h2>
      <div style={{ width: '100%', height: 300 }}>
        <h3 className="text-lg font-semibold text-center mb-2 dark:text-gray-300">Asset Allocation with current prices</h3>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieChartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label={(entry) => entry.name}
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default ChartsSection; 