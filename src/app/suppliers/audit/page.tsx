'use client';

import React from 'react';
import { FolderAuditLogPage } from '@/components/audit/FolderAuditLogPage';

export default function SuppliersAuditPage() {
  return (
    <FolderAuditLogPage
      category="Suppliers"
      title="Suppliers Log"
      description="Chronological log of all vendor supplier registrations, contact changes, rate revisions, and deletions with rollback."
      backHref="/suppliers"
      backLabel="Suppliers"
    />
  );
}
