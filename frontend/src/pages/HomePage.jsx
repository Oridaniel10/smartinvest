import React from "react";
import HotStocksSection from '../components/home/HotStocksSection';
import TopUsersSection from "../components/home/TopUsersSection";

function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Hot Stocks Section */}
        <HotStocksSection />

        {/* Top Users Section - Will be implemented next */}
        <TopUsersSection />
      </div>
    </div>
  );
}

export default HomePage;
