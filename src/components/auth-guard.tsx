'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Public routes that don't require authentication
    if (pathname === '/login') {
      setChecked(true);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
    } else {
      setChecked(true);
    }
  }, [pathname, router]);

  // On the login page, always render children immediately
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // For protected pages, only render once auth check passes
  if (!checked) {
    return null;
  }

  return <>{children}</>;
}
