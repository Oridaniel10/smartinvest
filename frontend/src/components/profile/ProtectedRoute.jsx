import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * A wrapper component that protects routes requiring authentication.
 * It checks if the user is authenticated using the useAuth hook.
 * If the user is authenticated, it renders the child components (via <Outlet />).
 * If not, it redirects the user to the /login page.
 *
 * @returns {React.Component} Either the child route's component or a redirect to the login page.
 */
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // if still checking the auth state
  if (loading) {
    return <div>Loading...</div>;
  }

  // if not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // if authenticated, render the protected content
  return <Outlet />;
};

export default ProtectedRoute; 