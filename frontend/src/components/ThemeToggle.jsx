import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import './ThemeToggle.css';

function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <label className="theme-toggle-switch">
      <input
        type="checkbox"
        onChange={toggleTheme}
        checked={theme === 'light'}
      />
      <span className="slider round"></span>
    </label>
  );
}

export default ThemeToggle; 