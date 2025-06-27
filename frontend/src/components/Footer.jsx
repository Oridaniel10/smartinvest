import React from 'react';
import profileImage from '../../public/the_sia.jpeg';
import MapContainer from './MapComponent';

function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 md:p-8 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto">
        <div className="flex flex-wrap justify-between items-start gap-8">
          
          {/* Profile Section */}
          <div className="flex-shrink-0">
            <img src={profileImage} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-pink-500 shadow-lg"/>
          </div>

          {/* Contact Section */}
          <div className="flex flex-col space-y-2">
            <h2 className="text-xl font-bold mb-2 text-pink-600 dark:text-pink-500">Contact Me</h2>
            <p className="font-semibold">Ori Daniel</p>
            <a href="mailto:orizxzx@gmail.com" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
              Email: orizxzx@gmail.com
            </a>
            <a href="https://wa.me/972547668318" target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
              Phone: +972-547668318
            </a>
            <a href="https://www.google.com/maps/place/Tel+Aviv,+Israel" target="_blank" rel="noopener noreferrer" className="hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
              Address: Tel Aviv, Israel
            </a>
          </div>

          {/* Map Section */}
          <div className="w-full md:w-1/3 h-48 md:h-auto rounded-lg overflow-hidden shadow-lg">
            <MapContainer />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;