import axios from 'axios';

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';


export const getMarketNews = async () => {
  if (!FINNHUB_API_KEY) {
    throw new Error('Finnhub API key is not configured. Please add VITE_FINNHUB_API_KEY to your .env file.');
  }

  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}/news`, {
      params: {
        category: 'general',
        token: FINNHUB_API_KEY,
      },
    });
    // The Finnhub API returns a lot of news, let's just take the first 15.
    // We also filter out any articles that don't have an image, as it's required by our design.
    return response.data
      .filter(article => article.image)
      .slice(0, 15);
  } catch (error) {
    console.error("Error fetching market news from Finnhub:", error);
    // Provide a more user-friendly error message
    if (error.response && error.response.status === 401) {
       throw new Error('Invalid Finnhub API key.');
    }
    throw new Error('Failed to fetch market news.');
  }
}; 