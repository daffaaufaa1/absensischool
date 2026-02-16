import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, LogOut, School, Eye } from 'lucide-react';

interface SchoolItem {
  id: string;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
  admin_username?: string;
  student_count?: number;
  teacher_count?: number;
}

interface SchoolDetail {
  school: SchoolItem;
  admin_username: string;
  student_count: number;
  teacher_count: number;
  class_count: number;
}

const SuperAdminPanel: React.FC = () => {
  const { isSuperAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedSchoolDetail, setSelectedSchoolDetail] = useState<SchoolDetail | null>(null);
  const [form, setForm] = useState({
    name: '', code: '', address: '', admin_username: '', admin_password: '',
  });

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/login');
      return;
    }
    fetchSchools();
  }, [isSuperAdmin]);

  const apiCall = async (action: string, method = 'GET', body?: any) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/super-admin?action=${action}`;
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return res.json();
  };

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const data = await apiCall('list-schools');
      if (Array.isArray(data)) setSchools(data);
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchool = async () => {
    if (!form.name || !form.code || !form.admin_username || !form.admin_password) {
      toast.error('Lengkapi semua data');
      return;
    }
    try {
      const data = await apiCall('create-school', 'POST', form);
      if (data.error) { toast.error(data.error); return; }
      toast.success('Sekolah berhasil ditambahkan!');
      setDialogOpen(false);
      setForm({ name: '', code: '', address: '', admin_username: '', admin_password: '' });
      fetchSchools();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleStatus = async (school: SchoolItem) => {
    try {
      const data = await apiCall('update-school', 'POST', {
        id: school.id,
        name: school.name,
        code: school.code,
        address: school.address,
        is_active: !school.is_active,
      });
      if (data.error) { toast.error(data.error); return; }
      toast.success(`Sekolah ${!school.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchSchools();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteSchool = async (id: string) => {
    if (!confirm('Yakin ingin menghapus sekolah ini? Semua data terkait akan ikut terhapus.')) return;
    try {
      const data = await apiCall('delete-school', 'POST', { id });
      if (data.error) { toast.error(data.error); return; }
      toast.success('Sekolah berhasil dihapus');
      fetchSchools();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleViewDetail = async (school: SchoolItem) => {
    try {
      const data = await apiCall(`school-detail&school_id=${school.id}`);
      if (data.error) { toast.error(data.error); return; }
      setSelectedSchoolDetail(data);
      setDetailDialogOpen(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

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
                  <Input placeholder="Contoh: SMA Negeri 1 Jakarta" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Kode Sekolah</Label>
                  <Input placeholder="Contoh: SMAN1JKT" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} />
                </div>
                <div className="space-y-2">
                  <Label>Alamat (opsional)</Label>
                  <Input placeholder="Alamat sekolah" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="border-t pt-4 space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">Akun Admin Sekolah</p>
                  <div className="space-y-2">
                    <Label>Username Admin</Label>
                    <Input placeholder="Username untuk admin sekolah" value={form.admin_username} onChange={(e) => setForm({ ...form, admin_username: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password Admin</Label>
                    <Input type="password" placeholder="Password untuk admin sekolah" value={form.admin_password} onChange={(e) => setForm({ ...form, admin_password: e.target.value })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
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
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={school.is_active}
                            onCheckedChange={() => handleToggleStatus(school)}
                          />
                          <span className={`text-xs font-medium ${school.is_active ? 'text-emerald-600' : 'text-destructive'}`}>
                            {school.is_active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(school.created_at).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetail(school)} title="Lihat Detail">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteSchool(school.id)} title="Hapus">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog - Read Only */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Sekolah</DialogTitle>
          </DialogHeader>
          {selectedSchoolDetail && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nama Sekolah</p>
                  <p className="font-medium">{selectedSchoolDetail.school.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kode</p>
                  <p className="font-mono font-medium">{selectedSchoolDetail.school.code}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Alamat</p>
                  <p className="font-medium">{selectedSchoolDetail.school.address || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className={`font-medium ${selectedSchoolDetail.school.is_active ? 'text-emerald-600' : 'text-destructive'}`}>
                    {selectedSchoolDetail.school.is_active ? 'Aktif' : 'Nonaktif'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Admin Username</p>
                  <p className="font-mono font-medium">{selectedSchoolDetail.admin_username}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tanggal Daftar</p>
                  <p className="font-medium">{new Date(selectedSchoolDetail.school.created_at).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Statistik</p>
                <div className="grid grid-cols-3 gap-4">
                  <Card><CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{selectedSchoolDetail.student_count}</p>
                    <p className="text-xs text-muted-foreground">Siswa</p>
                  </CardContent></Card>
                  <Card><CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{selectedSchoolDetail.teacher_count}</p>
                    <p className="text-xs text-muted-foreground">Guru</p>
                  </CardContent></Card>
                  <Card><CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{selectedSchoolDetail.class_count}</p>
                    <p className="text-xs text-muted-foreground">Kelas</p>
                  </CardContent></Card>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Tutup</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminPanel;
