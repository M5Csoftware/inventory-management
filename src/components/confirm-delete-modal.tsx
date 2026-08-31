'use client';

import React from 'react';
import { ConfirmModal, ConfirmModalProps } from './confirm-modal';

export { ConfirmModal };
export type { ConfirmModalProps };

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

