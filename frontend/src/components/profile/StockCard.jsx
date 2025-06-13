import React, { useState, useEffect } from 'react';
import { getStockQuote } from '../../services/stockService';
import Spinner from '../Spinner';

// Helper to format currency
const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

// Helper to determine text color based on profit/loss
const getProfitColor = (value) => {
  if (value > 0) return 'text-green-500';
  if (value < 0) return 'text-red-500';
  return 'text-gray-400';
};

//this is the stock card that displays the stock information.
function StockCard({ stock }) {
  const [marketData, setMarketData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      setIsLoading(true);
      const quote = await getStockQuote(stock.symbol);
      setMarketData(quote);
      setIsLoading(false);
    };

    fetchMarketData();
  }, [stock.symbol]); // Refetch if the symbol changes

  if (isLoading) {
    return (
      <div className="bg-white/5 dark:bg-gray-800/20 p-4 rounded-lg shadow-md flex justify-center items-center h-24">
        <Spinner />
      </div>
    );
  }
  
  const totalCost = stock.quantity * stock.avg_price;
  const marketValue = stock.quantity * (marketData?.c || 0);
  const unrealizedPnl = marketValue - totalCost;
  const pnlColor = getProfitColor(unrealizedPnl);

  return (
    <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/10">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">{stock.symbol}</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">Qty: {stock.quantity}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-600 dark:text-gray-400">Avg. Cost</p>
          <p className="font-semibold dark:text-white">{formatCurrency(stock.avg_price)}</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400">Market Price</p>
          <p className="font-semibold dark:text-white">{formatCurrency(marketData?.c || 0)}</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400">Total Cost</p>
          <p className="font-semibold dark:text-white">{formatCurrency(totalCost)}</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400">Market Value</p>
          <p className="font-semibold dark:text-white">{formatCurrency(marketValue)}</p>
        </div>
        <div className="col-span-2 md:col-span-1">
          <p className="text-gray-600 dark:text-gray-400">Unrealized P/L</p>
          <p className={`font-bold text-lg ${pnlColor}`}>{formatCurrency(unrealizedPnl)}</p>
        </div>
      </div>
      {marketData?.error && <p className="text-xs text-red-500 mt-2">{marketData.error}</p>}
    </div>
  );
}

export default StockCard; 