import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm transition-opacity duration-300">
      {/* Backdrop clickable */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Content panel */}
      <div className="relative w-full max-w-lg bg-slate-50 border border-slate-300 rounded-xl shadow-2xl p-6 overflow-hidden transform transition-all duration-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-base font-bold text-slate-900">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-200 p-1.5 rounded-lg transition-colors duration-200"
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
};
