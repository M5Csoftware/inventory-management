import type { TeamMember } from '@/types/invoice';

export function canApproveInvoice(
  user: { id?: string; role?: string; permissions?: string[] } | null | undefined,
  currentUser?: TeamMember | null
): boolean {
  if (!user && !currentUser) return false;

  const authRole = user?.role ? user.role.toLowerCase() : '';
  const authId = user?.id ? user.id.toLowerCase() : '';
  const teamRole = currentUser?.role ? currentUser.role.toLowerCase() : '';

  // Allowed roles: Admin, Master Admin, Invoice role
  if (
    authId === 'master' ||
    authRole === 'master' ||
    authRole === 'master admin' ||
    authRole === 'admin' ||
    authRole === 'invoice' ||
    authRole === 'invoice_manager' ||
    authRole === 'invoice specialist' ||
    authRole === 'invoice admin' ||
    teamRole === 'master admin' ||
    teamRole === 'admin' ||
    teamRole === 'invoice'
  ) {
    return true;
  }

  // Check wildcard or specific permissions
  if (user?.permissions && (user.permissions.includes('/invoice') || user.permissions.includes('*'))) {
    return true;
  }

  return false;
}
