import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Toast } from '../../hooks/useToast';

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onClose }) => {
  const duration = toast.duration || 5000;
  const [isExiting, setIsExiting] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Handle entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsEntering(false);
    }, 50); // Short delay to trigger entrance animation
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, duration, onClose, isPaused]);

  const handleClose = () => {
    setIsExiting(true);
    // Wait for exit animation to complete before removing
    setTimeout(() => {
      onClose(toast.id);
    }, 400); // Slightly longer to match animation duration
  };

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success': 
        return { 
          bg: 'bg-green-50 border-green-200', 
          progress: 'bg-green-500',
          progressDark: 'bg-green-600'
        };
      case 'error': 
        return { 
          bg: 'bg-red-50 border-red-200', 
          progress: 'bg-red-500',
          progressDark: 'bg-red-600'
        };
      case 'warning': 
        return { 
          bg: 'bg-yellow-50 border-yellow-200', 
          progress: 'bg-yellow-500',
          progressDark: 'bg-yellow-600'
        };
      case 'info': 
        return { 
          bg: 'bg-blue-50 border-blue-200', 
          progress: 'bg-blue-500',
          progressDark: 'bg-blue-600'
        };
      default:
        return { 
          bg: 'bg-gray-50 border-gray-200', 
          progress: 'bg-gray-500',
          progressDark: 'bg-gray-600'
        };
    }
  };

  const colors = getColors();

  return (
    <div 
      className={`toast-container min-w-[300px] max-w-sm ${colors.bg} border rounded-lg shadow-lg mb-4 overflow-hidden relative transition-all duration-300 hover:shadow-xl transform ${
        isExiting 
          ? 'animate-toast-exit' 
          : isEntering 
            ? 'animate-toast-enter-start' 
            : 'animate-toast-enter-end'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Progress Bar Background */}
      <div className={`absolute inset-0 ${colors.progress} opacity-20`} />
      
      {/* Animated Progress Bar */}
      <div 
        className={`absolute inset-0 ${colors.progressDark} opacity-30 origin-left`}
        style={{
          animation: `progressBar ${duration}ms linear forwards`,
          animationPlayState: isPaused ? 'paused' : 'running'
        }}
      />
      
      {/* Content */}
      <div className="relative p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-1 text-sm text-gray-500">
                {toast.message}
              </p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={handleClose}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none transition-colors duration-200 hover:bg-gray-50 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50">
      {toasts.map(toast => (
        <ToastComponent key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};