import React from 'react';
import StockCard from './StockCard';

/**
 * A component that displays a list of stock holdings.
 * It maps over the portfolio array and renders a StockCard for each holding.
 * 
 * @param {object} props - The component props.
 * @param {Array<object>} props.portfolio - An array of stock objects from the user's profile.
 */
function HoldingsList({ portfolio }) {
  const hasHoldings = portfolio && portfolio.length > 0;

  return (
    <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/10">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Your Holdings</h2>
      {hasHoldings ? (
        <div className="space-y-4">
          {portfolio.map(stock => (
            <StockCard key={stock.symbol} stock={stock} />
          ))}
        </div>
      ) : (
        <p className="text-gray-600 dark:text-gray-400">
          Do not have any holdings in portfolio yet.
        </p>
      )}
    </div>
  );
}

export default HoldingsList; 