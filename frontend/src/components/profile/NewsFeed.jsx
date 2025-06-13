import React, { useState, useEffect } from 'react';
import { getMarketNews } from '../../services/newsService';
import Spinner from '../Spinner';

/**
 * Truncates a string to a specified number of words.
 * @param {string} text The text to truncate.
 * @param {number} limit The word limit.
 * @returns {string} The truncated text.
 */
const truncateWords = (text, limit) => {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= limit) {
    return text;
  }
  return words.slice(0, limit).join(' ') + '...';
};


/**
 * A component that displays a feed of financial news articles fetched from Finnhub.
 * Its visibility is controlled by the parent component.
 * 
 * @param {object} props - The component props.
 * @param {boolean} props.isVisible - Whether the feed should be visible.
 * @param {Function} props.onVisibilityChange - Callback to notify the parent of visibility changes.
 */
function NewsFeed({ isVisible, onVisibilityChange }) {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // We only want to fetch news when the component is intended to be visible
    if (isVisible) {
      const fetchNews = async () => {
        try {
          setIsLoading(true);
          const articles = await getMarketNews();
          setNews(articles);
          setError(null);
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchNews();
    }
  }, [isVisible]); // Refetch when visibility changes to true

  if (!isVisible) {
    return (
      <div className="fixed top-20 right-0 z-20">
        <button 
          onClick={() => onVisibilityChange(true)}
          className="bg-pink-600 text-white p-2 rounded-l-lg shadow-lg hover:bg-pink-700"
          aria-label="Show News"
        >
          &laquo;
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 dark:bg-gray-800/20 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/10 h-full relative">
      <button 
        onClick={() => onVisibilityChange(false)}
        className="absolute top-2 right-2 text-gray-500 hover:text-white z-10"
        aria-label="Hide News"
      >
        &times;
      </button>
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Live News</h2>
      
      {isLoading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
      
      {error && <div className="text-red-500 text-center">{error}</div>}
      
      {!isLoading && !error && (
        <div className="space-y-4 overflow-y-auto h-[calc(100%-40px)] pr-2">
          {/* map over the news articles and display them until 5 articles */}
          {news.slice(0, 6).map(item => (
            <a 
              key={item.id} 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="block p-3 rounded-lg hover:bg-white/10 dark:hover:bg-gray-700/50 transition-colors duration-200"
            >
              <img src={item.image} alt={item.headline} className="rounded-md mb-2 w-full h-32 object-cover" />
              <p className="font-semibold text-gray-800 dark:text-gray-200">{item.headline}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{truncateWords(item.summary, 30)}</p>
              <p className="text-xs text-pink-600 dark:text-pink-400 mt-2">{item.source} - {new Date(item.datetime * 1000).toLocaleDateString()}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default NewsFeed; 