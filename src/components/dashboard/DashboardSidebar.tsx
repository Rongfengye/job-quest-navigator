import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter
} from "@/components/ui/sidebar";
import { Vault, User, Settings, BookOpen, LogOut, Crown } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { usePlanStatus } from '@/context/PlanStatusContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { isPremium, isBasic } = usePlanStatus();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Core navigation items
  const navigationItems = [
    {
      title: "Question Vault",
      url: "/dashboard",
      icon: Vault,
    },
    {
      title: "Behavioral Prep",
      url: "/behavioral",
      icon: BookOpen,
    },
  ];
  
  // Account-related items
  const accountItems = [
    {
      title: "Profile",
      url: "/profile",
      icon: User,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];
  
  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "There was a problem signing you out. Please try again.",
      });
    }
  };

  // For mobile, render without Sidebar wrapper (just the content)
  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl font-bold storyline-logo">Storyline</span>
          </div>
          {user && (
            <div className="mb-6 p-3 bg-gray-50 rounded-md">
              <div className="text-sm font-medium">{user.firstName} {user.lastName}</div>
              <div className="text-xs text-muted-foreground truncate mb-2">{user.email}</div>
              <div className="flex items-center">
                {isPremium ? (
                  <div className="flex items-center">
                    <Crown className="h-4 w-4 mr-1 text-yellow-600" />
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
                      Premium
                    </Badge>
                  </div>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200">
                    Basic
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1 px-4">
          {/* Core Navigation Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Navigation</h3>
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.title}
                  onClick={() => navigate(item.url)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 group ${
                    isActive(item.url)
                      ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-500 pl-2'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer'
                  }`}
                >
                  <item.icon className={`h-4 w-4 mr-3 transition-opacity ${
                    isActive(item.url) ? 'opacity-100' : 'opacity-75 group-hover:opacity-90'
                  }`} />
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-full h-px bg-gray-200 mb-6"></div>
          
          {/* Account Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Account</h3>
            <div className="space-y-1">
              {accountItems.map((item) => (
                <button
                  key={item.title}
                  onClick={() => navigate(item.url)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 group ${
                    isActive(item.url)
                      ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-500 pl-2'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 cursor-pointer'
                  }`}
                >
                  <item.icon className={`h-4 w-4 mr-3 transition-opacity ${
                    isActive(item.url) ? 'opacity-100' : 'opacity-75 group-hover:opacity-90'
                  }`} />
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 group cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-3 opacity-60 group-hover:opacity-80" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Desktop sidebar (existing code)
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold storyline-logo">Storyline</span>
        </div>
        {user && (
          <div className="mt-4 p-3 bg-sidebar-accent rounded-md">
            <div className="text-sm font-medium">{user.firstName} {user.lastName}</div>
            <div className="text-xs text-muted-foreground truncate mb-2">{user.email}</div>
            <div className="flex items-center">
              {isPremium ? (
                <div className="flex items-center">
                  <Crown className="h-4 w-4 mr-1 text-yellow-600" />
                  <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
                    Premium
                  </Badge>
                </div>
              ) : (
                <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200">
                  Basic
                </Badge>
              )}
            </div>
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        {/* Core Navigation Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.url)} 
                    isActive={isActive(item.url)}
                    className={`transition-all duration-200 group ${
                      isActive(item.url)
                        ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-500 pl-2 hover:bg-blue-100'
                        : 'hover:bg-gray-100 cursor-pointer'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 mr-2 transition-opacity ${
                      isActive(item.url) ? 'opacity-100' : 'opacity-75 group-hover:opacity-90'
                    }`} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Separator */}
        <div className="mx-4 h-px bg-gray-200 my-4"></div>
        
        {/* Account Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.url)} 
                    isActive={isActive(item.url)}
                    className={`transition-all duration-200 group ${
                      isActive(item.url)
                        ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-500 pl-2 hover:bg-blue-100'
                        : 'hover:bg-gray-100 cursor-pointer'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 mr-2 transition-opacity ${
                      isActive(item.url) ? 'opacity-100' : 'opacity-75 group-hover:opacity-90'
                    }`} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Sign Out button */}
        <div className="px-4 mt-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={handleSignOut} 
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 group cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2 opacity-60 group-hover:opacity-80" />
                <span>Sign Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {/* Footer can remain empty or have other content */}
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
