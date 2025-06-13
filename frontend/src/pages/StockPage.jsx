import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getStockDetails } from '../services/stockService';

function StockPage() {
  const { symbol } = useParams();
  const [stockData, setStockData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching data for symbol:', symbol);
        
        if (!symbol || symbol.trim() === '') {
          throw new Error('Invalid stock symbol');
        }

        const data = await getStockDetails(symbol);
        console.log('Received data in StockPage:', data);
        
        if (!data) {
          throw new Error('Invalid data received from API');
        }

        setStockData(data);
        console.log('Stock data set to state:', data);
      } catch (err) {
        console.error('Error in StockPage:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStockData();
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading stock data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Error Loading Stock Data</h2>
          <p className="text-red-500 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">No Data Available</h2>
          <p className="text-yellow-500 dark:text-yellow-300">Could not find data for this stock symbol.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const formatPercentage = (value) => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        {/* Basic Info */}
        <div className="mb-6 flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{stockData.symbol}</h1>
            <p className="text-gray-600 dark:text-gray-400">{stockData.companyName}</p>
          </div>
          {stockData.logo && (
            <img 
              src={stockData.logo} 
              alt={`${stockData.companyName} logo`} 
              className="h-16 w-auto object-contain"
            />
          )}
        </div>

        {/* Price Info */}
        <div className="mb-6">
          <p className="text-2xl font-bold text-gray-800 dark:text-white">
            Current Price: {formatCurrency(stockData.currentPrice)}
          </p>
          <p className={`text-lg font-semibold ${stockData.dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            Daily Change: {formatPercentage(stockData.dailyChange)}
          </p>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500">Open</p>
            <p className="text-xl font-bold">{formatCurrency(stockData.open)}</p>
          </div>
          <div>
            <p className="text-gray-500">High</p>
            <p className="text-xl font-bold">{formatCurrency(stockData.high)}</p>
          </div>
          <div>
            <p className="text-gray-500">Low</p>
            <p className="text-xl font-bold">{formatCurrency(stockData.low)}</p>
          </div>
          <div>
            <p className="text-gray-500">Industry</p>
            <p className="text-xl font-bold">{stockData.industry}</p>
          </div>
        </div>

        {/* Company Info */}
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">Company Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500">Market Cap</p>
              <p className="text-xl font-bold">{formatCurrency(stockData.marketCap)}</p>
            </div>
            <div>
              <p className="text-gray-500">Website</p>
              <a href={stockData.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                {stockData.website}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockPage; 