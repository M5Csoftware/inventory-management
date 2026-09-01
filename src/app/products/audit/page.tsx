'use client';

import React from 'react';
import { FolderAuditLogPage } from '@/components/audit/FolderAuditLogPage';

export default function ProductsAuditPage() {
  return (
    <FolderAuditLogPage
      category="Products"
      title="Products Log"
      description="Chronological log of all product catalog creations, price updates, detail changes, and deletions with one-click rollback."
      backHref="/products"
      backLabel="Products"
    />
  );
}
