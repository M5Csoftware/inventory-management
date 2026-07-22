'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Package, LayoutDashboard, Box, Truck, Users, FileText, Settings, ChevronDown, ChevronRight, PlusCircle, List, LogOut, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SubNavItem {
  href: string;
  label: string;
  icon: any;
}

export interface NavItem {
  label: string;
  href?: string;
  icon: any;
  subItems?: SubNavItem[];
}

export const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Products',
    icon: Box,
    subItems: [
      { href: '/products', label: 'All Products', icon: List },
      { href: '/products/new', label: 'Add Product', icon: PlusCircle },
    ]
  },
  {
    label: 'Stock',
    icon: Truck,
    subItems: [
      { href: '/stock', label: 'Current Stock', icon: List },
      { href: '/stock/in', label: 'Stock In (Add)', icon: PlusCircle },
      { href: '/stock/out', label: 'Stock Out (Remove)', icon: PlusCircle },
      { href: '/stock/assets', label: 'Assets (Assigned)', icon: List },
    ]
  },
  {
    label: 'Categories',
    icon: Package,
    subItems: [
      { href: '/categories', label: 'All Categories', icon: List },
      { href: '/categories/new', label: 'Add Category', icon: PlusCircle },
    ]
  },
  {
    label: 'Suppliers',
    icon: Users,
    subItems: [
      { href: '/suppliers', label: 'All Suppliers', icon: List },
      { href: '/suppliers/new', label: 'Add Supplier', icon: PlusCircle },
    ]
  },
  {
    label: 'Orders',
    icon: ShoppingCart,
    subItems: [
      { href: '/orders', label: 'All Orders', icon: List },
      { href: '/orders/new', label: 'Generate Order', icon: PlusCircle },
    ]
  },
  { href: '/reports', label: 'Reports', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };
  
  // Track open states of submenus. By default, keep active section open.
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    navItems.forEach(item => {
      if (item.subItems) {
        const hasActiveChild = item.subItems.some(sub => pathname === sub.href);
        initialState[item.label] = hasActiveChild;
      }
    });
    return initialState;
  });

  if (pathname === '/login') return null;

  const toggleSubMenu = (label: string) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  return (
    <aside className="hidden w-64 flex-col border-r bg-background/50 backdrop-blur-xl md:flex shrink-0">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Package className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold tracking-tight">M5C Logistics</span>
      </div>
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          if (item.subItems) {
            const isExpanded = openSubMenus[item.label];
            const hasActiveChild = item.subItems.some(sub => pathname === sub.href);
            
            return (
              <div key={item.label} className="space-y-1">
                <Link
                  href={item.subItems[0].href}
                  onClick={() => toggleSubMenu(item.label)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-base font-medium transition-all text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    hasActiveChild && "text-foreground font-semibold"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                  {isExpanded ? (
                    <motion.div layoutId={`icon-${item.label}`} className="h-5 w-5">
                      <ChevronDown className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div layoutId={`icon-${item.label}`} className="h-5 w-5">
                      <ChevronRight className="h-5 w-5" />
                    </motion.div>
                  )}
                </Link>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pl-6 space-y-1 mt-1 border-l ml-5 border-border">
                        {item.subItems.map((sub) => {
                      const SubIcon = sub.icon;
                      const isActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                            isActive
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                          )}
                        >
                          <SubIcon className="h-4 w-4" />
                          <span>{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
          }

          // Item with no children (like Dashboard, Reports)
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href || '#'}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t space-y-2">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-all",
            pathname === '/settings'
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
        <Link
          href="/manage-roles"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-all",
            pathname === '/manage-roles'
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Users className="h-5 w-5" />
          <span>Manage Roles</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-all text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
        >
          <LogOut className="h-5 w-5" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
