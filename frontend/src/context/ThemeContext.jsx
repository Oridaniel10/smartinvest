import React, { createContext, useState, useEffect } from 'react';

// create the context with a default value
export const ThemeContext = createContext();

// create the provider component
export const ThemeProvider = ({ children }) => {
  // state to hold the current theme. default to 'dark'
  const [theme, setTheme] = useState(() => {
    // get the theme from local storage if it exists, otherwise default to dark
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });

  // effect to apply the theme to the root html element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    // save the theme to local storage whenever it changes
    localStorage.setItem('theme', theme);
  }, [theme]);

  // function to toggle the theme
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 