import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop clickable */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Content panel */}
      <div className="relative w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-2xl p-6 overflow-hidden transform transition-all duration-200 z-10 space-y-4">
        <div className="flex justify-between items-center border-b border-border/60 pb-3">
          <h3 className="text-base font-bold text-foreground">
            {title}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
          >
            <X size={18} />
          </Button>
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
};
