import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();
  
  return <div className="form-container relative">
    <h2 className="text-2xl font-bold mb-4 text-center">404 - Page Not Found</h2>
    <p className="text-center">The page you are looking for does not exist.</p>
    <button className="btn-primary" onClick={() => navigate('/')}>Go to Home</button>
  </div>;
}

export default NotFound;