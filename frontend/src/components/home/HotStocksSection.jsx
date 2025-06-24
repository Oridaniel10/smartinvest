import React, { useState, useEffect } from 'react';
import { getHotStocks } from '../../services/stockService';
import HotStockCard from './HotStockCard';

function HotStocksSection() {
  const [hotStocks, setHotStocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // fetches the hot stocks every 5 minutes
  useEffect(() => {
    const fetchHotStocks = async () => {
      try {
        setIsLoading(true);
        const stocks = await getHotStocks();
        console.log('Fetched stocks:', stocks);
        setHotStocks(stocks);
      } catch (err) {
        console.error('Error fetching stocks:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotStocks();
    const interval = setInterval(fetchHotStocks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        Error loading stocks: {error}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Top Gainers</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hotStocks.map((stock) => (
          <HotStockCard key={stock.symbol} stock={stock} />
        ))}
      </div>
    </div>
  );
}

export default HotStocksSection; 