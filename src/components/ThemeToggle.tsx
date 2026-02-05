 import React from 'react';
 import { Moon, Sun, Monitor } from 'lucide-react';
 import { useTheme } from './ThemeProvider';
 import { Button } from '@/components/ui/button';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 
 export const ThemeToggle: React.FC = () => {
   const { theme, setTheme, actualTheme } = useTheme();
 
   return (
     <DropdownMenu>
       <DropdownMenuTrigger asChild>
         <Button
           variant="ghost"
           size="icon"
           className="h-9 w-9 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent/50"
         >
           {actualTheme === 'dark' ? (
             <Moon className="h-4 w-4" />
           ) : (
             <Sun className="h-4 w-4" />
           )}
           <span className="sr-only">Toggle theme</span>
         </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent align="end" className="min-w-[140px]">
         <DropdownMenuItem
           onClick={() => setTheme('light')}
           className={theme === 'light' ? 'bg-accent' : ''}
         >
           <Sun className="mr-2 h-4 w-4" />
           Terang
         </DropdownMenuItem>
         <DropdownMenuItem
           onClick={() => setTheme('dark')}
           className={theme === 'dark' ? 'bg-accent' : ''}
         >
           <Moon className="mr-2 h-4 w-4" />
           Gelap
         </DropdownMenuItem>
         <DropdownMenuItem
           onClick={() => setTheme('system')}
           className={theme === 'system' ? 'bg-accent' : ''}
         >
           <Monitor className="mr-2 h-4 w-4" />
           Sistem
         </DropdownMenuItem>
       </DropdownMenuContent>
     </DropdownMenu>
   );
 };