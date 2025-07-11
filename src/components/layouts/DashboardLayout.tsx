import React, { ReactNode } from 'react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { useSubscriptionManager } from '@/hooks/useSubscriptionManager';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  // Enable subscription management for all dashboard pages
  useSubscriptionManager({
    enablePeriodicCheck: true,
    enableVisibilityCheck: true,
    checkInterval: 300000, // 5 minutes
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 ml-64">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
