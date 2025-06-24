import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicUserData } from '../services/userService';
import { calculatePortfolioStats } from '../utils/portfolioCalculations';
import Spinner from '../components/Spinner';
import ProfileHeader from '../components/profile/ProfileHeader';
import PortfolioDashboard from '../components/profile/PortfolioDashboard';
import HoldingsList from '../components/profile/HoldingsList';
import ChartsSection from '../components/profile/ChartsSection';

function UserPage() {
    const { username } = useParams(); // Get username from URL (e.g., /users/ori)
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            setIsLoading(true);
            try {
                const rawData = await getPublicUserData(username);
                const processedData = await calculatePortfolioStats(rawData);
                setUserData(processedData);
                setError(null);
            } catch (err) {
                console.error(`Error fetching data for user ${username}:`, err);
                setError(err.response?.data?.error || 'Failed to fetch user data.');
            } finally {
                setIsLoading(false);
            }
        };

        if (username) {
            fetchUserData();
        }
    }, [username]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    if (error) {
        return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
    }
    
    if (!userData) {
        return <div className="text-center mt-10">User not found.</div>;
    }

    // Since this is a public page, we pass 'isPublicView' to disable actions
    return (
        <div className="container mx-auto p-4 lg:p-6">
            <div className="space-y-6">
                <ProfileHeader 
                    user={userData} 
                    isPublicView={true} // Prop to indicate a read-only view
                />
                <PortfolioDashboard stats={userData} isPublicView={true} />
                <HoldingsList portfolio={userData.portfolio} isPublicView={true} />
                <ChartsSection portfolio={userData.portfolio} />
            </div>
        </div>
    );
}

export default UserPage;
