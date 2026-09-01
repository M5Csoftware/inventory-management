'use client';

import React from 'react';
import { FolderAuditLogPage } from '@/components/audit/FolderAuditLogPage';

export default function InvoiceAuditPage() {
  return (
    <FolderAuditLogPage
      category="Invoice"
      title="Invoice Log"
      description="Chronological log of all inward invoice check-ins, physical count tallies, approvals, and deletions with one-click rollback."
      backHref="/invoice"
      backLabel="Invoice"
    />
  );
}
