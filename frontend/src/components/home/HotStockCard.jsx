import React from 'react';
import { Link } from 'react-router-dom';

function HotStockCard({ stock }) {
  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const formatPercentage = (value) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

  return (
    <Link to={`/stock/${stock.symbol}`} className="block">
      <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/10 hover:border-pink-500 transition-all">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{stock.symbol}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stock.companyName}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-800 dark:text-white">
              {formatCurrency(stock.currentPrice)}
            </p>
            <p className={`text-sm font-semibold ${stock.dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatPercentage(stock.dailyChange)}
            </p>
          </div>
        </div>
        {stock.logo && (
          <div className="mt-4 flex justify-center">
            <img 
              src={stock.logo} 
              alt={`${stock.companyName} logo`} 
              className="h-12 w-auto object-contain"
            />
          </div>
        )}
      </div>
    </Link>
  );
}

export default HotStockCard;