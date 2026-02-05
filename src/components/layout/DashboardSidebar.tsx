import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Calendar, 
  BookOpen, 
  FileSpreadsheet, 
  ClipboardList,
  Home,
   GraduationCap
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
       className={`bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      collapsible="icon"
    >
      <SidebarContent className="py-4">
        {/* Logo Section */}
        {!collapsed && (
           <div className="px-4 mb-8">
             <div className="flex items-center gap-3 text-sidebar-foreground">
               <div className="p-2.5 rounded-xl bg-sidebar-accent">
                 <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                 <h2 className="font-bold text-sm tracking-tight">FADAM SCHOOL</h2>
                 <p className="text-[10px] text-sidebar-foreground/60">Sistem Absensi Digital</p>
              </div>
            </div>
          </div>
        )}

        <SidebarGroup>
           <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-[10px] font-semibold tracking-widest px-4 mb-3">
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
                       className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent ${
                         isActive(item.url) ? 'bg-sidebar-accent text-sidebar-foreground font-medium' : ''
                      }`}
                       activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
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

        {/* System Status */}
        {!collapsed && (
           <div className="mt-auto px-4 py-6">
             <div className="bg-sidebar-accent rounded-xl p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                 <span className="text-sidebar-foreground/90 text-xs font-medium">Sistem Aktif 24 Jam</span>
              </div>
               <p className="text-sidebar-foreground/50 text-[10px] mt-1.5">Semua fitur tersedia</p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};

export default DashboardSidebar;
