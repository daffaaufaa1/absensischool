 import React, { createContext, useContext, useEffect, useState } from 'react';
 
 type Theme = 'light' | 'dark' | 'system';
 
 interface ThemeContextType {
   theme: Theme;
   actualTheme: 'light' | 'dark';
   setTheme: (theme: Theme) => void;
 }
 
 const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
 
 export const useTheme = () => {
   const context = useContext(ThemeContext);
   if (!context) {
     throw new Error('useTheme must be used within a ThemeProvider');
   }
   return context;
 };
 
 interface ThemeProviderProps {
   children: React.ReactNode;
   defaultTheme?: Theme;
   storageKey?: string;
 }
 
 export const ThemeProvider: React.FC<ThemeProviderProps> = ({
   children,
   defaultTheme = 'system',
   storageKey = 'fadam-theme',
 }) => {
   const [theme, setThemeState] = useState<Theme>(() => {
     if (typeof window !== 'undefined') {
       const stored = localStorage.getItem(storageKey) as Theme | null;
       return stored || defaultTheme;
     }
     return defaultTheme;
   });
 
   const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');
 
   useEffect(() => {
     const root = window.document.documentElement;
     root.classList.remove('light', 'dark');
 
     let resolvedTheme: 'light' | 'dark';
     
     if (theme === 'system') {
       resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
     } else {
       resolvedTheme = theme;
     }
 
     root.classList.add(resolvedTheme);
     setActualTheme(resolvedTheme);
   }, [theme]);
 
   useEffect(() => {
     const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
     
     const handleChange = () => {
       if (theme === 'system') {
         const root = window.document.documentElement;
         root.classList.remove('light', 'dark');
         const resolvedTheme = mediaQuery.matches ? 'dark' : 'light';
         root.classList.add(resolvedTheme);
         setActualTheme(resolvedTheme);
       }
     };
 
     mediaQuery.addEventListener('change', handleChange);
     return () => mediaQuery.removeEventListener('change', handleChange);
   }, [theme]);
 
   const setTheme = (newTheme: Theme) => {
     localStorage.setItem(storageKey, newTheme);
     setThemeState(newTheme);
   };
 
   return (
     <ThemeContext.Provider value={{ theme, actualTheme, setTheme }}>
       {children}
     </ThemeContext.Provider>
   );
 };