import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Calendar, 
  BookOpen, 
  FileSpreadsheet, 
  ClipboardList,
  Home
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const DashboardSidebar: React.FC = () => {
  const { authUser } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const isGuru = authUser?.role === 'guru';

  const menuItems = [
    { title: 'Dashboard', url: '/dashboard', icon: Home },
    { title: 'Absensi', url: '/absensi', icon: Calendar },
    ...(isGuru ? [
      { title: 'Jurnal', url: '/jurnal', icon: BookOpen },
      { title: 'Input Nilai', url: '/nilai', icon: FileSpreadsheet },
    ] : []),
    { title: 'Rekap Kehadiran', url: '/kehadiran', icon: ClipboardList },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar
      className={`gradient-sidebar border-r-0 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      collapsible="icon"
    >
      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70 uppercase text-xs tracking-wider px-4 mb-2">
            {!collapsed && 'Menu Utama'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    className="mx-2"
                  >
                    <NavLink
                      to={item.url}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-white/80 hover:text-white hover:bg-white/10 ${
                        isActive(item.url) ? 'bg-white/20 text-white font-medium shadow-lg' : ''
                      }`}
                      activeClassName="bg-white/20 text-white font-medium"
                    >
                      <item.icon className={`h-5 w-5 ${collapsed ? 'mx-auto' : ''}`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
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
