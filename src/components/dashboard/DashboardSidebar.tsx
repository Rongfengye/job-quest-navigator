
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

const DashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { isPremium, isBasic } = usePlanStatus();
  const { toast } = useToast();
  
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
