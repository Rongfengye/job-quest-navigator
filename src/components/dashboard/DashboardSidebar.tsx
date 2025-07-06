
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
  useSidebar
} from "@/components/ui/sidebar";
import { Vault, User, Settings, BookOpen } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';

const DashboardSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  
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
  
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!isCollapsed && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold storyline-logo">Storyline</span>
            </div>
            {user && (
              <div className="mt-4 p-2 bg-sidebar-accent rounded-md">
                <div className="text-sm font-medium">{user.firstName} {user.lastName}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
            )}
          </>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          {!isCollapsed && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => navigate(item.url)} 
                    isActive={isActive(item.url)}
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                    {!isCollapsed && <span className="ml-2">{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default DashboardSidebar;
