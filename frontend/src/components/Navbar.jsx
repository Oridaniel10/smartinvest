import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";
import logo from '../../public/logo.png';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  return (
    <nav className="bg-pink-800 text-white px-4 py-3 flex justify-between items-center shadow-md dark:bg-pink-800" ref={menuRef}>
      <div className="text-xl font-bold flex items-center space-x-2">
        <Link to="/">SmartInvest</Link>
        <img src={logo} alt="Profile" className="w-8 h-8 rounded-full object-cover hover:cursor-pointer" onClick={() => navigate('/')}/>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center space-x-4">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/chat" className="hover:underline">Chat</Link>
        {isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <div className="flex items-center border-2 border-white rounded-full p-1 px-2 hover:cursor-pointer">
              <Link to="/profile" className="flex items-center space-x-2 hover:underline p-1">
                <img src={user.profile_image} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                <span>{user.name}</span>
              </Link>
            </div>
            <button onClick={handleLogout} className="hover:underline">Logout</button>
          </div>
        ) : (
          <>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/register" className="hover:underline">Register</Link>
          </>
        )}
        <ThemeToggle />
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-16 right-0 w-48 bg-pink-800 dark:bg-pink-800 rounded-md shadow-lg md:hidden z-20">
          <div className="flex flex-col items-start space-y-2 p-4">
            <Link to="/" className="hover:underline w-full text-left" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/chat" className="hover:underline w-full text-left" onClick={() => setIsMenuOpen(false)}>Chat</Link>
            <hr className="w-full border-pink-500 my-2" />
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="flex items-center space-x-2 hover:underline p-1 w-full" onClick={() => setIsMenuOpen(false)}>
                  <img src={user.profile_image} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                  <span>{user.name}</span>
                </Link>
                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="hover:underline text-left w-full">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline w-full text-left" onClick={() => setIsMenuOpen(false)}>Login</Link>
                <Link to="/register" className="hover:underline w-full text-left" onClick={() => setIsMenuOpen(false)}>Register</Link>
              </>
            )}
             <hr className="w-full border-pink-500 my-2" />
            <div className="w-full">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
