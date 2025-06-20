import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setThemeMode: (mode: Theme) => void;
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
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Effect to check for authentication token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }
  }, []);

  // Function to save theme preference
  const saveThemePreference = async (newTheme: Theme) => {
    // Always save to localStorage
    localStorage.setItem('theme', newTheme);

    // If we have an auth token, also save to server
    if (authToken) {
      try {
        await fetch('/api/user/preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ theme: newTheme })
        });
      } catch (error) {
        console.error('Failed to save theme preference to server:', error);
      }
    }
  };

  // Function to toggle theme
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      
      // Apply theme class to body
      document.body.className = newTheme;
      
      // Save preference
      saveThemePreference(newTheme);
      
      return newTheme;
    });
  };

  // Function to set a specific theme mode
  const setThemeMode = (mode: Theme) => {
    if (theme !== mode) {
      setTheme(mode);
      document.body.className = mode;
      saveThemePreference(mode);
    }
  };

  // Effect to load theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      let themePreference: Theme | null = null;
      
      // Try to get theme from server if authenticated
      if (authToken) {
        try {
          const response = await fetch('/api/user/preferences', {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.theme) {
              themePreference = data.theme as Theme;
            }
          }
        } catch (error) {
          console.error('Failed to fetch theme preference from server:', error);
        }
      }
      
      // Fall back to localStorage if needed
      if (!themePreference) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          themePreference = savedTheme;
        }
      }
      
      // Check system preference if no stored preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (themePreference) {
        setTheme(themePreference);
        document.body.className = themePreference;
      } else if (prefersDark) {
        setTheme('dark');
        document.body.className = 'dark';
      }
    };
    
    loadThemePreference();
  }, [authToken]);

  // Listen for authentication changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'token') {
        setAuthToken(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode }}>
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