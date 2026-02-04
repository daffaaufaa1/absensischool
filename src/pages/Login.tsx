import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, Sparkles, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Username tidak boleh kosong');
      return;
    }

    setLoading(true);

    // Try siswa first, then guru
    const siswaEmail = `${username.trim()}@siswa.fadam.sch.id`;
    const guruEmail = `${username.trim()}@guru.fadam.sch.id`;

    let { error } = await signIn(siswaEmail, password);
    
    // If siswa login failed, try guru
    if (error) {
      const guruResult = await signIn(guruEmail, password);
      error = guruResult.error;
    }

    if (error) {
      toast.error('Login gagal: Username atau password salah');
    } else {
      toast.success('Login berhasil!');
      navigate('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Top curved gradient section */}
      <div className="relative h-[45vh] min-h-[280px] flex flex-col items-center justify-center">
        {/* Background gradient with curves */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute top-20 -left-20 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-32 bg-background rounded-t-[100%]" />
        </div>
        
        {/* Logo and branding */}
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          {/* Animated Logo */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl animate-float">
              <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center">
                <span className="text-4xl font-black text-primary">F</span>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-400 flex items-center justify-center shadow-lg">
              <Shield className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            FADAM SCHOOL
          </h1>
          <p className="text-white/70 text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
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
            {/* Username field */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Username</Label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="pl-14 h-12 text-base rounded-xl border-2 border-border focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-14 pr-12 h-12 text-base rounded-xl border-2 border-border focus:border-primary transition-colors"
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
              className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-primary to-accent text-white shadow-lg hover:shadow-xl hover:opacity-95 transition-all duration-300 group"
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

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">atau</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Register link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Belum punya akun?
            </p>
            <Link to="/register">
              <Button
                variant="outline"
                className="w-full h-12 text-base font-medium rounded-xl border-2 hover:bg-primary/5 hover:border-primary transition-all duration-300"
              >
                Daftar Akun Baru
              </Button>
            </Link>
          </div>
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
