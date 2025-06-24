import React, { useState, useEffect, useCallback } from 'react';
import { buyStock, sellStock } from '../../services/transactionService';
import { getStockQuote, searchSymbols } from '../../services/stockService';
import Spinner from '../Spinner';
import { useDebounce } from '../../hooks/useDebounce';


function TradeForm({ onTransactionSuccess }) {
  const [tradeType, setTradeType] = useState('buy');
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [commission, setCommission] = useState('');
  const [price, setPrice] = useState('');
  
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  //send less api calls by debouncing the symbol input
  //everytime the symbol change so the debouncedSymbol changed that trigger the useEffect
  const debouncedSymbol = useDebounce(symbol, 300);

  useEffect(() => {
    if (debouncedSymbol) {
      const fetchSymbolData = async () => {
        setIsSearching(true);
        const [quote, searchResults] = await Promise.all([
            getStockQuote(debouncedSymbol),
            searchSymbols(debouncedSymbol)
        ]);
        
        if (quote && quote.c) {
          setPrice(quote.c.toFixed(2));
        }
        setSuggestions(searchResults || []);
        setIsSearching(false);
      };
      fetchSymbolData();
    } else {
      setSuggestions([]);
      setPrice('');
    }
  }, [debouncedSymbol]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symbol || !amount || amount <= 0 || !price || price <= 0) {
      setError('Please fill all fields with valid values.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentPrice = parseFloat(price);
      const parsedAmount = parseFloat(amount);
      const parsedCommission = parseFloat(commission || 0);
      let quantityToTrade;

      if (tradeType === 'buy') {
        const amountForShares = parsedAmount - parsedCommission;
        if (amountForShares <= 0) {
          throw new Error('Total amount must be greater than the commission.');
        }
        quantityToTrade = amountForShares / currentPrice;
      } else {
        const valueFromShares = parsedAmount + parsedCommission;
        quantityToTrade = valueFromShares / currentPrice;
      }

      if (quantityToTrade <= 0) {
          throw new Error('Calculated quantity is not valid. Please check amount and commission.');
      }

      const tradeData = {
        symbol: symbol.toUpperCase(),
        quantity: quantityToTrade,
        price: currentPrice,
        commission: parsedCommission,
      };

      if (tradeType === 'buy') {
        await buyStock(tradeData);
      } else {
        await sellStock(tradeData);
      }

      alert(`Successfully executed ${tradeType} for ${quantityToTrade.toFixed(4)} shares of ${symbol.toUpperCase()}!`);
      onTransactionSuccess();
      
      setSymbol('');
      setAmount('');
      setCommission('');
      setPrice('');
      setSuggestions([]);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (selectedSymbol) => {
    setSymbol(selectedSymbol.symbol);
    setSuggestions([]);
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-center space-x-4 mb-4">
        <button type="button" onClick={() => setTradeType('buy')} className={`px-4 py-2 rounded-full font-semibold ${tradeType === 'buy' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}>Buy</button>
        <button type="button" onClick={() => setTradeType('sell')} className={`px-4 py-2 rounded-full font-semibold ${tradeType === 'sell' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'}`}>Sell</button>
      </div>

      <div className="relative">
        <label htmlFor="symbol" className="block text-sm font-medium text-gray-400">Stock Symbol</label>
        <input
          id="symbol"
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="e.g., AAPL"
          className="form-input mt-1 uppercase"
          required
          autoComplete="off"
        />
        {isSearching && <div className="absolute right-3 top-9"><Spinner /></div>}
        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-gray-900 border border-gray-700 rounded-md mt-1 shadow-lg">
            {suggestions.map((s) => (
              <li
                key={s.symbol}
                onClick={() => handleSuggestionClick(s)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-800"
              >
                <span className="font-bold">{s.symbol}</span>
                <span className="text-sm text-gray-400 ml-2">{s.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

       <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-400">Price per Share ($)</label>
        <input
          id="price"
          type="number"
          value={price}
          onChange={(e) => {
            setPrice(e.target.value);
            setCommission(e.target.value * 0.005);
          }}
          placeholder="Price is fetched automatically"
          className="form-input mt-1"
          required
          min="0.01"
          step="any"
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-400">
          Amount to {tradeType === 'buy' ? 'Invest' : 'Receive'} ($) 
        </label>
        <input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g., 1000"
          className="form-input mt-1"
          required
          min="0.01"
          step="any"
        />
      </div>
      <div>
        <label htmlFor="commission" className="block text-sm font-medium text-gray-400">Commission ($)</label>
        <input
          id="commission"
          type="number"
          value={commission}
          onChange={(e) => setCommission(e.target.value)}
          placeholder="e.g., 5.95 (optional)"
          className="form-input mt-1"
          min="0"
          step="any"
        />
      </div>

      <button type="submit" disabled={isLoading || isSearching} className="btn-primary w-full pt-2 pb-2">
        {isLoading ? <Spinner /> : `Execute ${tradeType.charAt(0).toUpperCase() + tradeType.slice(1)}`}
      </button>

      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
    </form>
  );
}

export default TradeForm; 