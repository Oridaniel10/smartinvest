import React, { useState, useEffect, useCallback } from 'react';
import { getProfileData } from '../services/userService';
import { getStockQuote } from '../services/stockService'; // Import the service to get live prices
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import ProfileHeader from '../components/profile/ProfileHeader';
import PortfolioDashboard from '../components/profile/PortfolioDashboard';
import HoldingsList from '../components/profile/HoldingsList';
import ChartsSection from '../components/profile/ChartsSection';
import ActionsPanel from '../components/profile/ActionsPanel';
import NewsFeed from '../components/profile/NewsFeed';
import { calculatePortfolioStats } from '../utils/portfolioCalculations';

function ProfilePage() {
  const { user } = useAuth(); // Get the basic user info from context for immediate display
  const [profileData, setProfileData] = useState(null); //state render the profile data after change
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewsFeedVisible, setIsNewsFeedVisible] = useState(true);

  //use callback is a hook that allows us to fetch the profile data and process it and return the data to the states at the beginning of the page
  const fetchAndProcessProfileData = useCallback(async () => {
    try {
      const rawData = await getProfileData();
      const processedData = await calculatePortfolioStats(rawData);
      setProfileData(processedData);
      setError(null);
    } catch (err) {
      console.error("Error processing profile data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchAndProcessProfileData();
  }, [fetchAndProcessProfileData]);

  const handleTransactionSuccess = () => {
    // Refetch the profile data to show the updated portfolio and balance
    fetchAndProcessProfileData(); 
  };

  const handleImageUpdate = (newImageUrl) => {
    // Update the profile data state locally for an immediate UI update
    setProfileData(prevData => ({
      ...prevData,
      profile_image: newImageUrl,
    }));
    // Note: We might also want to update the user object in AuthContext
    // for a fully persistent change across the app, but for now this works for the profile page.
  };

  const handlePrivacyUpdate = (newIsPublic) => {
    setProfileData(prevData => ({
      ...prevData,
      is_public: newIsPublic,
    }));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">Error: {error}</div>;
  }
  
  if (!profileData) {
    return <div className="text-center mt-10">No profile data found.</div>;
  }

  // Main layout using CSS Grid for flexibility
  return (
    <div className="container mx-auto p-4 lg:p-6">
      <div className={`grid grid-cols-1 ${isNewsFeedVisible ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
        
        {/* Main Content Area */}
        <div className={`${isNewsFeedVisible ? 'lg:col-span-2' : 'lg:col-span-1'} space-y-6`}>
          <ProfileHeader 
              user={profileData} 
              onImageUpdate={handleImageUpdate} 
              onTransactionSuccess={handleTransactionSuccess}
              onPrivacyUpdate={handlePrivacyUpdate}
          />
          <PortfolioDashboard stats={profileData} />
          <HoldingsList portfolio={profileData.portfolio} />
          <ChartsSection portfolio={profileData.portfolio} />
          <ActionsPanel onTransactionSuccess={handleTransactionSuccess} />
        </div>

        {/* Right Sidebar */}
        <div className={isNewsFeedVisible ? "lg:col-span-1" : "hidden"}>
            <NewsFeed isVisible={isNewsFeedVisible} onVisibilityChange={setIsNewsFeedVisible} />
        </div>
        
        {/* Floating button to show news feed when it's hidden */}
        {!isNewsFeedVisible && (
            <div className="fixed top-20 right-0 z-20">
                 <NewsFeed isVisible={isNewsFeedVisible} onVisibilityChange={setIsNewsFeedVisible} />
            </div>
        )}

      </div>
    </div>
  );
}

export default ProfilePage;
