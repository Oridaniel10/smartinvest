import React from 'react';
import './WelcomePopup.css';

//this is the welcome popup that displays the welcome message with a 3D animation.
function WelcomePopup({ user }) {
  if (!user) {
    return null;
  }

  return (
    <div className="welcome-overlay">
      <div className="welcome-popup">
        <div className="welcome-card">
          <div className="welcome-card-front">
            <img src={user.profile_image} alt="Profile" className="welcome-avatar" />
            <h2 className="welcome-title">Welcome,</h2>
            <p className="welcome-name">{user.name}!</p>
          </div>
          <div className="welcome-card-back">
            <h2 className="welcome-title">SmartInvest</h2>
            <p>Ready to invest?</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomePopup; 