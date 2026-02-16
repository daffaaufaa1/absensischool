import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, LogOut, School, Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react';

interface SchoolItem {
  id: string;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

const SuperAdminPanel: React.FC = () => {
  const { isSuperAdmin, loginAsSuperAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', code: '', address: '', admin_username: '', admin_password: '',
  });

  // Login form state
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSchools();
    }
  }, [isSuperAdmin]);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/super-admin?action=list-schools`;
      const res = await fetch(url, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      const data = await res.json();
      if (Array.isArray(data)) setSchools(data);
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      toast.error('Username dan password wajib diisi');
      return;
    }
    setLoginLoading(true);
    const { error } = await loginAsSuperAdmin(loginForm.username, loginForm.password);
    if (error) toast.error(error);
    else toast.success('Login berhasil!');
    setLoginLoading(false);
  };

  const handleCreateSchool = async () => {
    if (!form.name || !form.code || !form.admin_username || !form.admin_password) {
      toast.error('Lengkapi semua data');
      return;
    }

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/super-admin?action=create-school`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Sekolah berhasil ditambahkan!');
      setDialogOpen(false);
      setForm({ name: '', code: '', address: '', admin_username: '', admin_password: '' });
      fetchSchools();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Login screen for super admin - same style as main login
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
        <div className="relative h-[38vh] min-h-[240px] flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-primary overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
            <div className="absolute top-16 -left-16 w-36 h-36 bg-white/5 rounded-full" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-28 bg-background rounded-t-[100%]" />
          </div>
          <div className="relative z-10 flex flex-col items-center text-center px-4">
            <div className="relative mb-4">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center shadow-xl">
                <div className="w-16 h-16 rounded-xl bg-primary-foreground flex items-center justify-center">
                  <span className="text-primary font-black text-2xl tracking-tighter">FA</span>
                </div>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground tracking-tight mb-0.5">
              FADAM SCHOOL
            </h1>
            <p className="text-primary-foreground/60 text-sm">Super Admin Panel</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col px-6 pt-2 pb-8 -mt-8 relative z-20">
          <div className="max-w-sm mx-auto w-full">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Login Super Admin</h2>
              <p className="text-muted-foreground text-sm mt-1">Masuk untuk mengelola platform</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="sa-username" className="text-sm font-medium">Username</Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <Input
                    id="sa-username"
                    placeholder="Masukkan username"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="pl-14 h-12 text-base rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sa-password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <Input
                    id="sa-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
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
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold rounded-xl shadow-lg transition-all duration-200 group"
                disabled={loginLoading}
              >
                {loginLoading ? (
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

          <div className="mt-auto pt-6">
            <p className="text-center text-xs text-muted-foreground">
              © 2024 FADAM School
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary">
              <School className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Super Admin</h1>
              <p className="text-xs text-muted-foreground">Manajemen Sekolah</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{schools.length} sekolah terdaftar</span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Sekolah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Sekolah Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nama Sekolah</Label>
                  <Input
                    placeholder="Contoh: SMA Negeri 1 Jakarta"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kode Sekolah</Label>
                  <Input
                    placeholder="Contoh: SMAN1JKT"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alamat (opsional)</Label>
                  <Input
                    placeholder="Alamat sekolah"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
                <div className="border-t pt-4 space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">Akun Admin Sekolah</p>
                  <div className="space-y-2">
                    <Label>Username Admin</Label>
                    <Input
                      placeholder="Username untuk admin sekolah"
                      value={form.admin_username}
                      onChange={(e) => setForm({ ...form, admin_username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password Admin</Label>
                    <Input
                      type="password"
                      placeholder="Password untuk admin sekolah"
                      value={form.admin_password}
                      onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Batal</Button>
                </DialogClose>
                <Button onClick={handleCreateSchool}>Tambah Sekolah</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">No</TableHead>
                  <TableHead>Nama Sekolah</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {loading ? 'Memuat...' : 'Belum ada sekolah terdaftar'}
                    </TableCell>
                  </TableRow>
                ) : (
                  schools.map((school, index) => (
                    <TableRow key={school.id}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{school.name}</TableCell>
                      <TableCell className="font-mono text-sm">{school.code}</TableCell>
                      <TableCell>{school.address || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${school.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                          {school.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(school.created_at).toLocaleDateString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminPanel;
