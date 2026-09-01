'use client';

import React from 'react';
import { FolderAuditLogPage } from '@/components/audit/FolderAuditLogPage';

export default function StockAuditPage() {
  return (
    <FolderAuditLogPage
      category="Stock"
      title="Stock Log"
      description="Chronological log of all Stock In, Stock Out, Stock Adjustments, and Branch Transfers with one-click atomic rollback."
      backHref="/stock"
      backLabel="Stock"
    />
  );
}
