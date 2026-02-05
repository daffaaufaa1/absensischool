import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
 import { Eye, EyeOff, User, Lock, ArrowRight, UserPlus, BookOpen, GraduationCap, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/auth';
import { Class } from '@/types/database';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('siswa');
  const [selectedClass, setSelectedClass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('*').order('name');
      if (data) setClasses(data);
    };
    fetchClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Username tidak boleh kosong');
      return;
    }

    if (username.includes('@') || username.includes(' ')) {
      toast.error('Username tidak boleh mengandung @ atau spasi');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Password tidak cocok');
      return;
    }

    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    
    if (role === 'siswa' && !selectedClass) {
      toast.error('Siswa harus memilih kelas');
      return;
    }

    setLoading(true);

    // Convert username to email format for Supabase auth
    const email = `${username.trim()}@${role}.fadam.sch.id`;
    
    const { error } = await signUp(
      email,
      password,
      fullName,
      role,
      role === 'siswa' ? selectedClass : undefined
    );

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Username sudah terdaftar');
      } else {
        toast.error('Registrasi gagal: ' + error.message);
      }
    } else {
      toast.success('Registrasi berhasil! Silakan login.');
      navigate('/login');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Top curved gradient section */}
       <div className="relative h-[32vh] min-h-[200px] flex flex-col items-center justify-center">
        {/* Background gradient with curves */}
         <div className="absolute inset-0 bg-primary overflow-hidden">
          {/* Decorative circles */}
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
           <div className="absolute top-10 -left-20 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-20 bg-background rounded-t-[100%]" />
        </div>
        
        {/* Back button */}
        <Link 
          to="/login" 
           className="absolute top-4 left-4 z-20 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-primary-foreground hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>

        {/* Logo and branding */}
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <div className="relative mb-3">
             <div className="w-18 h-18 rounded-2xl bg-white/10 flex items-center justify-center">
               <div className="w-14 h-14 rounded-xl bg-primary-foreground flex items-center justify-center">
                 <UserPlus className="w-7 h-7 text-primary" />
              </div>
            </div>
          </div>
          
           <h1 className="text-xl md:text-2xl font-bold text-primary-foreground tracking-tight mb-1">
            Buat Akun Baru
          </h1>
           <p className="text-primary-foreground/60 text-sm">
             Daftar untuk mulai menggunakan
          </p>
        </div>
      </div>

      {/* Form section */}
      <div className="flex-1 flex flex-col px-6 pt-2 pb-6 -mt-6 relative z-20 overflow-y-auto">
        <div className="max-w-sm mx-auto w-full">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Daftar Sebagai</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('siswa')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
                    role === 'siswa'
                       ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                     role === 'siswa' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className={`text-sm font-medium ${role === 'siswa' ? 'text-primary' : 'text-foreground'}`}>
                    Siswa
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('guru')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
                    role === 'guru'
                       ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                     role === 'guru' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className={`text-sm font-medium ${role === 'guru' ? 'text-primary' : 'text-foreground'}`}>
                    Guru
                  </span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">Nama Lengkap</Label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center">
                   <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                   className="pl-12 h-11 text-sm rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                 className="h-11 text-sm rounded-xl"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Hanya huruf kecil, angka, dan underscore
              </p>
            </div>

            {/* Class Selection - Only for students */}
            {role === 'siswa' && (
              <div className="space-y-2">
                <Label htmlFor="class" className="text-sm font-medium">Kelas</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                   <SelectTrigger className="h-11 text-sm rounded-xl">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.name}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center">
                   <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                   className="pl-12 pr-11 h-11 text-sm rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                 className="h-11 text-sm rounded-xl"
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
               className="w-full h-12 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Daftar Sekarang
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          {/* Login link */}
          <div className="text-center mt-5 pb-4">
            <p className="text-sm text-muted-foreground">
              Sudah punya akun?{' '}
               <Link to="/login" className="text-foreground hover:underline font-semibold">
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
