'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Save,
  HelpCircle,
  Info,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ConfirmModalVariant = 'danger' | 'primary' | 'success' | 'warning' | 'info';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemName?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmLoadingText?: string;
  variant?: ConfirmModalVariant;
  icon?: React.ReactNode;
}

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemName?: string | React.ReactNode;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  description = 'Are you sure you want to delete this item? This action cannot be undone.',
  itemName,
}: ConfirmDeleteModalProps) {
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      itemName={itemName}
      variant="danger"
      confirmText="Delete"
      confirmLoadingText="Deleting..."
    />
  );
}

const variantStyles: Record<
  ConfirmModalVariant,
  {
    iconBg: string;
    iconColor: string;
    ringColor: string;
    confirmBtn: string;
    defaultIcon: React.ReactNode;
  }
> = {
  danger: {
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    ringColor: 'ring-destructive/5',
    confirmBtn: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md shadow-destructive/20',
    defaultIcon: <Trash2 className="h-5 w-5" />,
  },
  primary: {
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    ringColor: 'ring-primary/5',
    confirmBtn: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20',
    defaultIcon: <Save className="h-5 w-5" />,
  },
  success: {
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    ringColor: 'ring-emerald-500/5',
    confirmBtn: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20',
    defaultIcon: <CheckCircle2 className="h-5 w-5" />,
  },
  warning: {
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-600 dark:text-amber-400',
    ringColor: 'ring-amber-500/5',
    confirmBtn: 'bg-amber-600 text-white hover:bg-amber-700 shadow-md shadow-amber-600/20',
    defaultIcon: <AlertTriangle className="h-5 w-5" />,
  },
  info: {
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-600 dark:text-blue-400',
    ringColor: 'ring-blue-500/5',
    confirmBtn: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20',
    defaultIcon: <Info className="h-5 w-5" />,
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed with this operation?',
  itemName,
  confirmText,
  cancelText = 'Cancel',
  confirmLoadingText,
  variant = 'primary',
  icon,
}: ConfirmModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  if (!isOpen) return null;

  const currentVariant = variantStyles[variant] || variantStyles.primary;

  const defaultConfirmText =
    variant === 'danger'
      ? 'Delete'
      : variant === 'warning'
      ? 'Proceed'
      : 'Confirm';

  const finalConfirmText = confirmText || defaultConfirmText;
  const finalLoadingText =
    confirmLoadingText ||
    (variant === 'danger' ? 'Deleting...' : 'Processing...');

  const handleConfirm = async () => {
    if (processingRef.current || isProcessing) return;
    processingRef.current = true;
    try {
      setIsProcessing(true);
      await onConfirm();
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => {
        if (!isProcessing) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md bg-background border border-border/70 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-2xl ${currentVariant.iconBg} ${currentVariant.iconColor} ring-8 ${currentVariant.ringColor} shrink-0`}
          >
            {icon || currentVariant.defaultIcon}
          </div>
          <div className="space-y-1.5 pt-0.5 min-w-0 flex-1">
            <h3 className="text-lg font-bold tracking-tight text-foreground">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
            {itemName && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-muted/50 border border-border/50 text-xs font-semibold text-foreground">
                {itemName}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border/40 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="h-9 px-4 text-xs font-medium border-2"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`h-9 px-4 text-xs font-medium gap-2 ${currentVariant.confirmBtn}`}
          >
            {icon || currentVariant.defaultIcon}
            {isProcessing ? finalLoadingText : finalConfirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
