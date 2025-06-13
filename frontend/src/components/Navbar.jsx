import React from "react";
import { Link, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";
import logo from '../../public/logo.png';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login"); // Redirect to login page after logout
  };

  return (
    <nav className="bg-pink-800 text-white px-4 py-3 flex justify-between items-center shadow-md dark:bg-pink-800">
      <div className="text-xl font-bold flex items-center space-x-2">
        <Link to="/">SmartInvest</Link>
      <img src={logo} alt="Profile" className="w-8 h-8 rounded-full object-cover hover:cursor-pointer" onClick={() => navigate('/')}/>
      </div>
      <div className="flex items-center space-x-4">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/chat" className="hover:underline">Chat</Link>

        {isAuthenticated ? (
          <>
          <div className="flex items-center space-x-2">
            {/* profile image and name withing div with box lines */}
            <div className="flex items-center border-2 border-white rounded-full p-1 px-2 hover:cursor-pointer">
            <Link to="/profile" className="flex items-center space-x-2 hover:underline p-1">
              <img src={user.profile_image} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
              <span>{user.name}</span>
            </Link>
            </div>
            <button onClick={handleLogout} className="hover:underline">Logout</button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/register" className="hover:underline">Register</Link>
          </>
        )}
        
        <ThemeToggle />
      </div>
    </nav>
  );
}

export default Navbar;
