/* global globalThis */
import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const ToastContext = createContext(undefined);

const typeStyles = {
  info: 'border-gov-accent/40 bg-white/95 text-ink-contrast',
  success: 'border-user-primary/35 bg-white/95 text-ink-contrast',
  warning: 'border-amber-400/50 bg-amber-50/90 text-amber-900',
  danger: 'border-red-400/50 bg-red-50/95 text-red-900',
};

const iconByType = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  danger: '⛔',
};

const generateId = () => (globalThis.crypto?.randomUUID?.() ?? `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`);

export const ToastProvider = ({ children, position = 'top-right', defaultDuration = 4500 }) => {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timeout = timers.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    ({ id = generateId(), type = 'info', title, description, duration = defaultDuration, action } = {}) => {
      const toast = {
        id,
        type,
        title,
        description,
        action,
      };

      setToasts((current) => [...current, toast]);

      if (duration !== Infinity) {
        const timeout = setTimeout(() => removeToast(id), duration);
        timers.current.set(id, timeout);
      }

      return id;
    },
    [defaultDuration, removeToast],
  );

  useEffect(() => () => {
    timers.current.forEach((timeout) => clearTimeout(timeout));
    timers.current.clear();
  }, []);

  const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  const viewportPositionClass = useMemo(() => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-6 left-6';
      case 'bottom-right':
        return 'bottom-6 right-6';
      case 'top-left':
        return 'top-6 left-6';
      default:
        return 'top-6 right-6';
    }
  }, [position]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={`pointer-events-none fixed z-[999] flex max-w-sm flex-col gap-4 ${viewportPositionClass} sm:max-w-md`}
        role="region"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-start gap-3 rounded-3xl border p-4 shadow-toast backdrop-blur-md ${
                typeStyles[toast.type] ?? typeStyles.info
              }`}
            >
              <span className="text-lg" aria-hidden>
                {iconByType[toast.type] ?? iconByType.info}
              </span>
              <div className="flex-1">
                {toast.title && <p className="text-sm font-semibold text-ink-contrast">{toast.title}</p>}
                {toast.description && <p className="text-sm text-ink-subtle">{toast.description}</p>}
                {toast.action && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => {
                        toast.action.onClick?.();
                        removeToast(toast.id);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-ink-subtle/25 px-3 py-1 text-xs font-semibold text-gov-primary transition duration-200 hover:bg-gov-primary/10"
                    >
                      {toast.action.label}
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                aria-label="Dismiss notification"
                className="ml-1 text-sm font-semibold text-slate-400 transition hover:text-slate-600"
              >
                ✕
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
  position: PropTypes.oneOf(['top-right', 'top-left', 'bottom-right', 'bottom-left']),
  defaultDuration: PropTypes.number,
};

ToastProvider.defaultProps = {
  position: 'top-right',
  defaultDuration: 4500,
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;
