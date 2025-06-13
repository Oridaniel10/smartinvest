import React, { useState, useEffect } from 'react';
import { getTopUsers } from '../../services/userService';
import { calculatePortfolioStats } from '../../utils/portfolioCalculations';
import HotUserCard from './HotUserCard';
import Spinner from '../Spinner';

const FilterButton = ({ text, timeframe, activeTimeframe, onClick }) => (
    <button
        onClick={() => onClick(timeframe)}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            activeTimeframe === timeframe
            ? 'bg-pink-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-pink-400/20'
        }`}
    >
        {text}
    </button>
);

function TopUsersSection() {
    const [topUsers, setTopUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeframe, setTimeframe] = useState('all'); // '24h', '7d', 'all'
    const [sortBy, setSortBy] = useState('overall_pl'); // 'overall_pl' or 'overall_pl_percentage'

    useEffect(() => {
        const fetchAndProcessTopUsers = async () => {
            try {
                setIsLoading(true);
                // 1. Fetch users with raw portfolio and transaction data
                const rawUsers = await getTopUsers(timeframe, sortBy);

                // 2. Process each user to get live, calculated stats
                const processedUsersPromises = rawUsers.map(user => 
                    calculatePortfolioStats(user)
                );
                const processedUsers = await Promise.all(processedUsersPromises);
                
                // 3. Re-sort based on freshly calculated data, as backend sort was on stale data
                processedUsers.sort((a, b) => b[sortBy] - a[sortBy]);

                setTopUsers(processedUsers);
                setError(null);
            } catch (err) {
                console.error("Error processing top users:", err);
                setError(err.message || 'Failed to fetch top users.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndProcessTopUsers();
    }, [timeframe, sortBy]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Top Performers</h2>
                <div className="flex items-center bg-gray-700/50 p-1 rounded-lg">
                    <button onClick={() => setSortBy('overall_pl')} className={`px-3 py-1 text-sm rounded-md transition ${sortBy === 'overall_pl' ? 'bg-pink-500 text-white' : 'text-gray-300 hover:bg-white/10'}`}>By Amount ($)</button>
                    <button onClick={() => setSortBy('overall_pl_percentage')} className={`px-3 py-1 text-sm rounded-md transition ${sortBy === 'overall_pl_percentage' ? 'bg-pink-500 text-white' : 'text-gray-300 hover:bg-white/10'}`}>By Return (%)</button>
                </div>
                <div className="flex space-x-2">
                    <FilterButton text="24H" timeframe="24h" activeTimeframe={timeframe} onClick={setTimeframe} />
                    <FilterButton text="Month" timeframe="1m" activeTimeframe={timeframe} onClick={setTimeframe} />
                    <FilterButton text="All Time" timeframe="all" activeTimeframe={timeframe} onClick={setTimeframe} />
                </div>
            </div>
            
            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Spinner />
                </div>
            ) : error ? (
                <div className="text-center text-red-500 py-10">
                    Error: {error}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topUsers.map((user, index) => (
                        <HotUserCard key={user.id} user={user} rank={index + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default TopUsersSection; 