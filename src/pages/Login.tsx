import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, IdCard, Lock, ArrowRight, GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const [nisNit, setNisNit] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginWithNisNit } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nisNit.trim()) {
      toast.error('NIS/NIT tidak boleh kosong');
      return;
    }

    if (!password) {
      toast.error('Password tidak boleh kosong');
      return;
    }

    setLoading(true);

    const { error, isAdmin } = await loginWithNisNit(nisNit.trim(), password);

    if (error) {
      toast.error(error);
    } else {
      toast.success('Login berhasil!');
      navigate(isAdmin ? '/admin' : '/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Top curved gradient section */}
      <div className="relative h-[42vh] min-h-[260px] flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-primary overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-20 -left-20 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-32 bg-background rounded-t-[100%]" />
        </div>
        
        {/* Logo and branding */}
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center shadow-2xl animate-float">
              <div className="w-20 h-20 rounded-2xl bg-primary-foreground flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-primary" />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground tracking-tight mb-1">
            FADAM SCHOOL
          </h1>
          <p className="text-primary-foreground/60 text-sm">
            Sistem Absensi Digital
          </p>
        </div>
      </div>

      {/* Form section */}
      <div className="flex-1 flex flex-col px-6 pt-4 pb-8 -mt-8 relative z-20">
        <div className="max-w-sm mx-auto w-full">
          {/* Welcome text */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-foreground">Selamat Datang!</h2>
            <p className="text-muted-foreground text-sm mt-1">Masuk untuk melanjutkan</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* NIS/NIT field */}
            <div className="space-y-2">
              <Label htmlFor="nisNit" className="text-sm font-medium">NIS / NIT</Label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <IdCard className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <Input
                  id="nisNit"
                  type="text"
                  placeholder="Masukkan NIS atau NIT"
                  value={nisNit}
                  onChange={(e) => setNisNit(e.target.value.replace(/[^0-9]/g, ''))}
                  className="pl-14 h-12 text-base rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-14 pr-12 h-12 text-base rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Masuk
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6">
          <p className="text-center text-xs text-muted-foreground">
            © 2024 FADAM School. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
