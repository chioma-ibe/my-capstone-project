import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import '../../styles/components/Toast/Toast.css';

function Toast({ message, show, onClose, duration = 3000 }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, onClose, duration]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="toast-container success"
          onClick={onClose}
        >
          <div className="toast-icon">🗓️</div>
          <div className="toast-message">{message}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Toast;
