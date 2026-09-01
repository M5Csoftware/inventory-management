'use client';

import React from 'react';
import { FolderAuditLogPage } from '@/components/audit/FolderAuditLogPage';

export default function OrdersAuditPage() {
  return (
    <FolderAuditLogPage
      category="Orders"
      title="Orders Log"
      description="Chronological log of all purchase order generations, status transitions, fulfillment updates, and deletions with rollback."
      backHref="/orders"
      backLabel="Orders"
    />
  );
}
