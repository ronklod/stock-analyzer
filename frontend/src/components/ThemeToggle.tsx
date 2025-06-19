import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  // Add props if needed
}

const ThemeToggle: React.FC<ThemeToggleProps> = () => {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  return (
    <button 
      onClick={toggleTheme}
      style={{
        padding: '5px 10px',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        background: isDarkMode ? '#fff' : '#333',
        color: isDarkMode ? '#333' : '#fff'
      }}
    >
      {isDarkMode ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
};

export default ThemeToggle;