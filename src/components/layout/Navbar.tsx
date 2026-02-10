import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Users, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';

const Navbar: React.FC = () => {
  const { authUser, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = () => {
    if (!authUser?.profile?.full_name) return 'U';
    return authUser.profile.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="bg-sidebar border-b border-sidebar-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center">
              <span className="text-sidebar-foreground font-black text-sm">FA</span>
            </div>
            <h1 className="text-sidebar-foreground font-bold text-sm tracking-tight hidden sm:block">FADAM SCHOOL</h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 hover:bg-sidebar-accent text-sidebar-foreground h-9 px-2"
                >
                  <Avatar className="h-7 w-7 border border-sidebar-accent">
                    <AvatarImage src={authUser?.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium text-sidebar-foreground">
                    {authUser?.profile?.full_name || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate('/biodata')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Biodata</span>
                </DropdownMenuItem>
                
                {authUser?.role === 'guru' && (
                  <DropdownMenuItem onClick={() => navigate('/pengurus-access')} className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Pengurus Kelas</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
