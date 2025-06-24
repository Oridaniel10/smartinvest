import axios from 'axios';

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
console.log('API Key loaded:', FINNHUB_API_KEY ? 'Yes' : 'No');

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// helper function to check if the API key is valid
const checkApiKey = () => {
  if (!FINNHUB_API_KEY) {
    console.error('API Key is missing!');
    throw new Error('Finnhub API key is missing. Please set VITE_FINNHUB_API_KEY in your .env file.');
  }
  return FINNHUB_API_KEY;
};

// get stock quote from finnhub
export const getStockQuote = async (symbol) => {
  const token = checkApiKey();
  try {
    console.log('Using API key for quote:', token ? 'Yes' : 'No');
    const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
      params: {
        symbol: symbol,
        token: token,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error.response?.data || error.message);
    return { c: 0, pc: 0, error: `Failed to fetch data for ${symbol}` };
  }
};

// search for symbols in finnhub
export const searchSymbols = async (query) => {
  if (!FINNHUB_API_KEY) {
    throw new Error('Finnhub API key is missing.');
  }
  if (!query) {
    return [];
  }

  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}/search`, {
      params: {
        q: query,
        token: FINNHUB_API_KEY,
      },
    });
    return response.data.result
      .filter(item => !item.symbol.includes('.')) // Filter out non-primary US stocks
      .slice(0, 7); // Limit to 7 results
  } catch (error) {
    console.error(`Error searching for symbol "${query}":`, error.message);
    return []; // Return empty array on error to prevent UI crash
  }
};

// get hot stocks from finnhub
export const getHotStocks = async () => {
  // Check cache first
  const cachedData = sessionStorage.getItem('hotStocks');
  if (cachedData) {
    const { stocks, timestamp } = JSON.parse(cachedData);
    // Cache is valid for 5 minutes
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      console.log('Returning cached hot stocks');
      return stocks;
    }
  }

  const token = checkApiKey();
  try {
    const popularSymbols = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'ADBE', 'CRM', 'INTC',
      'JPM', 'BAC', 'WFC', 'GS', 'MS', 'V', 'MA',
      'JNJ', 'UNH', 'PFE', 'MRK', 'ABBV',
      'HD', 'MCD', 'NKE', 'SBUX', 'WMT', 'COST',
      'BA', 'CAT', 'XOM', 'CVX', 'DIS'
    ]; 

    const stockPromises = popularSymbols.map(async (symbol) => {
      try {
        const quoteResponse = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
          params: { symbol, token }
        });
        const companyResponse = await axios.get(`${FINNHUB_BASE_URL}/stock/profile2`, {
          params: { symbol, token }
        });

        if (quoteResponse.data && companyResponse.data && quoteResponse.data.pc !== 0) {
          return {
            symbol: symbol,
            currentPrice: quoteResponse.data.c,
            // Calculate percentage change
            dailyChange: ((quoteResponse.data.c - quoteResponse.data.pc) / quoteResponse.data.pc) * 100,
            companyName: companyResponse.data.name || symbol,
            logo: companyResponse.data.logo
          };
        }
        return null;
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        return null; // Return null if a single stock fails
      }
    });

    const allStocks = await Promise.all(stockPromises);
    
    const top6 = allStocks
      .filter(stock => stock && stock.dailyChange !== null && !isNaN(stock.dailyChange))
      .sort((a, b) => b.dailyChange - a.dailyChange)
      .slice(0, 6);
      
    // Save to cache
    sessionStorage.setItem('hotStocks', JSON.stringify({ stocks: top6, timestamp: Date.now() }));

    return top6;

  } catch (error) {
    console.error('Error fetching hot stocks:', error);
    // If we hit the rate limit, try to return stale cache data if available
    if (cachedData) {
        const { stocks } = JSON.parse(cachedData);
        console.warn('API limit reached, returning stale cached data.');
        return stocks;
    }
    return [];
  }
};

// get stock details from finnhub
export const getStockDetails = async (symbol) => {
  const token = checkApiKey();
  try {
    // clean the symbol
    const cleanSymbol = symbol.replace(/[^\w]/g, '').toUpperCase();
    console.log('Fetching data for cleaned symbol:', cleanSymbol);

    // Get current quote
    const quoteResponse = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
      params: {
        symbol: cleanSymbol,
        token: token
      }
    });

    console.log('Quote response:', quoteResponse.data);

    if (!quoteResponse.data || quoteResponse.data.c === 0) {
      throw new Error(`No data available for ${cleanSymbol}`);
    }

    // Get company info
    const companyResponse = await axios.get(`${FINNHUB_BASE_URL}/stock/profile2`, {
      params: {
        symbol: cleanSymbol,
        token: token
      }
    });

    console.log('Company response:', companyResponse.data);

    // instead of using candle, we use quote data
    const chartData = {
      labels: [new Date(Date.now() - 24 * 60 * 60 * 1000), new Date()],
      datasets: [{
        label: `${cleanSymbol} Price`,
        data: [
          { x: new Date(Date.now() - 24 * 60 * 60 * 1000), y: quoteResponse.data.pc },
          { x: new Date(), y: quoteResponse.data.c }
        ],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      }]
    };

    const data = {
      symbol: cleanSymbol,
      currentPrice: quoteResponse.data.c,
      dailyChange: ((quoteResponse.data.c - quoteResponse.data.pc) / quoteResponse.data.pc) * 100,
      companyName: companyResponse.data.name || cleanSymbol,
      open: quoteResponse.data.o,
      high: quoteResponse.data.h,
      low: quoteResponse.data.l,
      volume: quoteResponse.data.v,
      chartData: chartData,
      // Add additional company info
      industry: companyResponse.data.finnhubIndustry,
      marketCap: companyResponse.data.marketCapitalization,
      website: companyResponse.data.weburl,
      logo: companyResponse.data.logo
    };

    console.log('Processed data:', data);
    return data;
  } catch (error) {
    console.error(`Error fetching details for ${symbol}:`, error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    if (error.response?.status === 403) {
      throw new Error('Invalid API key. Please check your Finnhub API key.');
    } else if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    throw new Error(`Failed to fetch data for ${symbol}: ${error.message}`);
  }
}; 