import React from 'react';


 //@param {object} props - The component props.
 //@param {string} props.label - The title of the statistic (e.g., "Cash Balance").
 //@param {string | number} props.value - The value of the statistic.
 //@param {React.ReactNode} [props.icon] - An optional SVG icon to display.

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white/10 dark:bg-gray-800/30 p-4 rounded-lg shadow-md flex items-center space-x-4 border border-white/10">
      {icon && <div className="text-pink-500">{icon}</div>}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

export default StatCard; 