import { useTheme } from '../contexts/ThemeState';
import { motion } from 'framer-motion';
import '../styles/components/ThemeToggle.css';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="theme-toggle">
      <div className="theme-toggle-container" onClick={toggleTheme}>
        <motion.div
          className="theme-toggle-circle"
          animate={{
            x: isDark ? 0 : 28,
            backgroundColor: isDark ? "#f1c40f" : "#ffffff"
          }}
          transition={{
            type: "spring",
            stiffness: 700,
            damping: 30
          }}
        >
          {isDark ? (
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </motion.svg>
          ) : (
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              stroke="#3498db"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </motion.svg>
          )}
        </motion.div>
        <motion.div
          className="theme-toggle-track"
          animate={{
            backgroundColor: isDark ? "#3a3b3f" : "#e9ecef"
          }}
        />
      </div>
    </div>
  );
}

export default ThemeToggle;
