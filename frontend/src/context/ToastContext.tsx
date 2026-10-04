import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  subtext?: string;
}

interface ToastContextType {
  toast: (message: string, subtext?: string, type?: 'success' | 'error' | 'info') => void;
  success: (message: string, subtext?: string) => void;
  error: (message: string, subtext?: string) => void;
  info: (message: string, subtext?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, subtext?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, subtext }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider
      value={{
        toast: addToast,
        success: (m, s) => addToast(m, s, 'success'),
        error: (m, s) => addToast(m, s, 'error'),
        info: (m, s) => addToast(m, s, 'info'),
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl shadow-warm border transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
              t.type === 'success'
                ? 'bg-white border-[#C8E6C9] text-[#292526]'
                : t.type === 'error'
                ? 'bg-white border-[#FFCDD2] text-[#292526]'
                : 'bg-white border-[#F0E4DE] text-[#292526]'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#27AE60]" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5 text-[#E74C3C]" />}
              {t.type === 'info' && <Info className="w-5 h-5 text-[#FF986F]" />}
            </div>
            <div className="flex-1 text-sm">
              <p className="font-semibold text-xs sm:text-sm text-[#292526]">{t.message}</p>
              {t.subtext && <p className="text-xs text-[#898487] mt-0.5">{t.subtext}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[#898487] hover:text-[#292526] p-0.5 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
