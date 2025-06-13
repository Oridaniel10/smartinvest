import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context object. This will be used to provide and consume the auth state.
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // check the auth state when the app loads
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser) {
          // if there is a token and user, set the user and authenticated state
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData, token) => {
    // save the data to localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // update the state
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    // remove the data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // reset the state
    setUser(null);
    setIsAuthenticated(false);
  };

  // if still checking the auth state, show loading
  if (loading) {
    return <div>Loading...</div>;
  }

  // The value provided to consuming components.
  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading
  };

  //every component that is wrapped in the AuthProvider will have access to the value object.
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
}; 