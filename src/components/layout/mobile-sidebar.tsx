'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Package, Settings, ChevronDown, ChevronRight, LogOut, X, Users, Truck, PlusCircle, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navItems } from './sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useInventory } from '@/context/inventory-context';
import { useAuth } from '@/context/auth-context';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeBranch, setActiveBranch } = useInventory();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    onClose();
    logout();
  };
  
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

  const toggleSubMenu = (label: string) => {
    setOpenSubMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  if (pathname === '/login') return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm transition-opacity md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-background border-r flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Package className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">M5C Logistics</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Branch Selector */}
        <div className="px-6 py-4 border-b border-border/10">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Current Branch
          </label>
          {user?.role === 'admin' ? (
            <div className="relative">
              <select 
                value={activeBranch}
                onChange={(e) => setActiveBranch(e.target.value)}
                className="w-full h-10 bg-accent/50 border border-border/50 text-foreground text-sm rounded-xl px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer shadow-sm"
              >
                <option value="All">🌐 All Branches</option>
                <option value="Ahmedabad">🏭 Ahmedabad</option>
                <option value="Ludhiana">🏭 Ludhiana</option>
                <option value="Delhi">🏭 Delhi</option>
                <option value="Mumbai">🏭 Mumbai</option>
              </select>
              <ChevronDown className="absolute right-4 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          ) : (
            <div className="w-full h-10 bg-accent/30 border border-border/30 text-foreground text-sm rounded-xl px-4 flex items-center shadow-sm">
              🏭 {activeBranch}
            </div>
          )}
        </div>
        
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            
            if (item.subItems) {
              const isExpanded = openSubMenus[item.label];
              const hasActiveChild = item.subItems.some(sub => pathname === sub.href);
              
              return (
                <div key={item.label} className="space-y-1">
                  <button
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
                      <motion.div layoutId={`icon-m-${item.label}`} className="h-5 w-5">
                        <ChevronDown className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <motion.div layoutId={`icon-m-${item.label}`} className="h-5 w-5">
                        <ChevronRight className="h-5 w-5" />
                      </motion.div>
                    )}
                  </button>
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
                            onClick={onClose}
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

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href || '#'}
                onClick={onClose}
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
            onClick={onClose}
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
            onClick={onClose}
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
    </>
  );
}
