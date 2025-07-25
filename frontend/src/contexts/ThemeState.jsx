import { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  // Check if user has a theme preference in localStorage
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark'; // Default to dark theme
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Update localStorage and document body when theme changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const value = {
    theme,
    toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
