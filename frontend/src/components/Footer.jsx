import React from 'react';
import profileImage from '../../public/profileImage.png';
import MapContainer from './MapComponent';

function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        {/* Profile Section */}
        <div className="footer-section">
          <img src={profileImage} alt="Profile" className="footer-profile"/>
        </div>

        {/* Contact Section */}
        <div className="footer-contact">
          <h2 className="footer-contact-title">Contact</h2>
          <p>Name: Ori Daniel</p>
          <button 
            className="footer-contact-button" 
            onClick={() => window.open('mailto:orizxzx@gmail.com', '_blank')}
          >
            Email: orizxzx@gmail.com
          </button>
          <button 
            className="footer-contact-button" 
            onClick={() => window.open('https://wa.me/972547668318', '_blank')}
          >
            Phone: +972-547668318
          </button>
          <button 
            className="footer-contact-button" 
            onClick={()=> window.open('https://www.google.com/maps/place/Tel+Aviv,+Israel/@31.769022,34.775179,10z/data=!4m5!3m4!1s0x1502b8895c69df1b:0x9d83482d43d4585e!8m2!3d32.0852999!4d34.7817677', '_blank')}
          >
            Address: Tel Aviv, Israel
          </button>
        </div>

        {/* Map Section */}
        <div className="footer-section">
          <MapContainer />
        </div>
      </div>
    </footer>
  );
}

export default Footer;