'use client';

import React from 'react';
import { FolderAuditLogPage } from '@/components/audit/FolderAuditLogPage';

export default function CategoriesAuditPage() {
  return (
    <FolderAuditLogPage
      category="Categories"
      title="Categories Log"
      description="Chronological log of all inventory categories additions, taxonomy updates, and deletions with rollback."
      backHref="/categories"
      backLabel="Categories"
    />
  );
}
