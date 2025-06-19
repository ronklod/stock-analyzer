import React, { createContext, useState, useContext, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ThemeProvider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Custom provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  // Function to toggle theme
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      
      // Apply theme class to body
      document.body.className = newTheme;
      
      // Store preference in localStorage if needed
      localStorage.setItem('theme', newTheme);
      
      return newTheme;
    });
  };

  // Effect to check system preference or stored preference on init
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.className = savedTheme;
    } else if (prefersDark) {
      setTheme('dark');
      document.body.className = 'dark';
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;