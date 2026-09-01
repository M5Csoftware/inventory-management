'use client';

import React from 'react';
import { FolderAuditLogPage } from '@/components/audit/FolderAuditLogPage';

export default function AssetsAuditPage() {
  return (
    <FolderAuditLogPage
      category="Assets"
      title="Assets Log"
      description="Chronological log of all hardware asset assignments, returns, maintenance bookings, and serial records with one-click rollback."
      backHref="/stock/assets"
      backLabel="Assets"
    />
  );
}
