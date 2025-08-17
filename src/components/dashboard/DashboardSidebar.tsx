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
  
  const menuItems = [
    // {
    //   title: "Question Vault",
    //   url: "/dashboard",
    //   icon: Vault,
    // },
    {
      title: "Behavioral Prep",
      url: "/behavioral",
      icon: BookOpen,
    },
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
                    <Crown className="h-4 w-4 mr-1 text-yellow-500" />
                    <Badge className="bg-yellow-500 hover:bg-yellow-500/80 text-white">
                      Premium
                    </Badge>
                  </div>
                ) : (
                  <Badge variant="secondary">
                    Basic
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1 px-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Menu</h3>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.title}
                  onClick={() => navigate(item.url)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive(item.url)
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4 mr-3" />
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
                  <Crown className="h-4 w-4 mr-1 text-yellow-500" />
                  <Badge className="bg-yellow-500 hover:bg-yellow-500/80 text-white">
                    Premium
                  </Badge>
                </div>
              ) : (
                <Badge variant="secondary">
                  Basic
                </Badge>
              )}
            </div>
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.url)} 
                    isActive={isActive(item.url)}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Sign Out button moved here, right after the menu */}
        <div className="px-4 mt-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={handleSignOut} 
                className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
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
