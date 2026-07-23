'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemName?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  description = 'Are you sure you want to delete this item? This action cannot be undone.',
  itemName,
}: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-background border border-border/60 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 pt-0.5">
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
            {itemName && (
              <div className="mt-2 p-2.5 rounded-lg bg-muted/50 border border-border/40 text-xs font-semibold text-foreground truncate">
                "{itemName}"
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="h-9 px-4 text-xs font-medium border-2"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="h-9 px-4 text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md shadow-destructive/20 gap-2"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
}
