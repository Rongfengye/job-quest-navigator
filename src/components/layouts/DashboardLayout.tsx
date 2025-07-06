
import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import { useAuthContext } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { SidebarTrigger } from "@/components/ui/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthContext();
  
  // If still loading auth state, show a minimal loading indicator
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-interview-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to home page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Persistent header with sidebar trigger - always visible */}
        <div className="fixed top-0 left-0 right-0 z-50 h-12 bg-background border-b flex items-center px-4">
          <SidebarTrigger />
          <span className="ml-4 font-semibold text-interview-primary">Storyline Dashboard</span>
        </div>
        
        <DashboardSidebar />
        <main className="flex-1 overflow-auto pt-12">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
