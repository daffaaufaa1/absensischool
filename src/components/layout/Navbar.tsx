import React, { useState } from 'react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getGreeting = () => {
    if (!authUser?.profile) return 'Selamat Datang';
    
    const name = authUser.profile.full_name;
    if (authUser.role === 'guru') {
      return `Selamat Datang, ${name.startsWith('Mr.') || name.startsWith('Mrs.') ? name : `Mr./Mrs. ${name}`}`;
    }
    return `Selamat Datang, ${name}`;
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
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-sidebar-accent flex items-center justify-center">
               <span className="text-sidebar-foreground font-bold text-lg">F</span>
            </div>
            <div className="hidden sm:block">
               <h1 className="text-sidebar-foreground font-bold text-lg tracking-tight">FADAM SCHOOL</h1>
            </div>
          </div>

          {/* Welcome text - center */}
          <div className="hidden md:flex items-center">
             <p className="text-sidebar-foreground/80 text-sm font-medium">{getGreeting()}</p>
          </div>

          {/* Right side - Profile dropdown */}
          <div className="flex items-center gap-2">
             {/* Theme toggle */}
             <ThemeToggle />
 
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
               className="md:hidden text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                   className="flex items-center gap-2 hover:bg-sidebar-accent text-sidebar-foreground"
                >
                   <Avatar className="h-8 w-8 border-2 border-sidebar-accent">
                    <AvatarImage src={authUser?.profile?.avatar_url || undefined} />
                     <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-sm">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                   <span className="hidden sm:inline text-sm font-medium text-sidebar-foreground">
                    {authUser?.profile?.full_name || 'User'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-elegant">
                <DropdownMenuItem onClick={() => navigate('/biodata')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Biodata</span>
                </DropdownMenuItem>
                
                {authUser?.role === 'guru' && (
                  <DropdownMenuItem onClick={() => navigate('/pengurus-access')} className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Access Pengurus Kelas</span>
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

        {/* Mobile menu */}
        {mobileMenuOpen && (
           <div className="md:hidden py-4 border-t border-sidebar-border">
             <p className="text-sidebar-foreground/80 text-sm font-medium text-center">{getGreeting()}</p>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
