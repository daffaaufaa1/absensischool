import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, LogOut, Users, BookOpen, GraduationCap } from 'lucide-react';

interface Student {
  id: string;
  nis: string;
  full_name: string;
  class_id: string | null;
  classes?: { name: string } | null;
}

interface Teacher {
  id: string;
  nit: string;
  full_name: string;
  subject: string;
}

interface ClassItem {
  id: string;
  name: string;
}

const AdminPanel: React.FC = () => {
  const { isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Student form
  const [studentForm, setStudentForm] = useState({ nis: '', full_name: '', class_id: '', password: '' });
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);

  // Teacher form
  const [teacherForm, setTeacherForm] = useState({ nit: '', full_name: '', subject: '', password: '' });
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);

  // Filter
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, teachersRes, classesRes] = await Promise.all([
        supabase.functions.invoke('admin-students', { method: 'GET' }),
        supabase.functions.invoke('admin-teachers', { method: 'GET' }),
        supabase.from('classes').select('*').order('name'),
      ]);

      if (studentsRes.data) setStudents(studentsRes.data);
      if (teachersRes.data) setTeachers(teachersRes.data);
      if (classesRes.data) setClasses(classesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Student CRUD
  const handleSaveStudent = async () => {
    if (!studentForm.nis || !studentForm.full_name || !studentForm.class_id) {
      toast.error('Lengkapi semua data siswa');
      return;
    }
    if (!editingStudent && !studentForm.password) {
      toast.error('Password wajib diisi untuk siswa baru');
      return;
    }

    try {
      if (editingStudent) {
        const { data, error } = await supabase.functions.invoke('admin-students', {
          method: 'PUT',
          body: { id: editingStudent.id, ...studentForm },
        });
        if (error || data?.error) throw new Error(data?.error || 'Gagal mengupdate siswa');
        toast.success('Data siswa berhasil diupdate');
      } else {
        const { data, error } = await supabase.functions.invoke('admin-students', {
          method: 'POST',
          body: studentForm,
        });
        if (error || data?.error) throw new Error(data?.error || 'Gagal menambah siswa');
        toast.success('Siswa berhasil ditambahkan');
      }
      setStudentDialogOpen(false);
      setStudentForm({ nis: '', full_name: '', class_id: '', password: '' });
      setEditingStudent(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentForm({ nis: student.nis, full_name: student.full_name, class_id: student.class_id || '', password: '' });
    setStudentDialogOpen(true);
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Yakin ingin menghapus siswa ini?')) return;
    try {
      const { data, error } = await supabase.functions.invoke('admin-students', {
        method: 'DELETE',
        body: { id },
      });
      if (error || data?.error) throw new Error(data?.error || 'Gagal menghapus');
      toast.success('Siswa berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Teacher CRUD
  const handleSaveTeacher = async () => {
    if (!teacherForm.nit || !teacherForm.full_name || !teacherForm.subject) {
      toast.error('Lengkapi semua data guru');
      return;
    }
    if (!editingTeacher && !teacherForm.password) {
      toast.error('Password wajib diisi untuk guru baru');
      return;
    }

    try {
      if (editingTeacher) {
        const { data, error } = await supabase.functions.invoke('admin-teachers', {
          method: 'PUT',
          body: { id: editingTeacher.id, ...teacherForm },
        });
        if (error || data?.error) throw new Error(data?.error || 'Gagal mengupdate guru');
        toast.success('Data guru berhasil diupdate');
      } else {
        const { data, error } = await supabase.functions.invoke('admin-teachers', {
          method: 'POST',
          body: teacherForm,
        });
        if (error || data?.error) throw new Error(data?.error || 'Gagal menambah guru');
        toast.success('Guru berhasil ditambahkan');
      }
      setTeacherDialogOpen(false);
      setTeacherForm({ nit: '', full_name: '', subject: '', password: '' });
      setEditingTeacher(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setTeacherForm({ nit: teacher.nit, full_name: teacher.full_name, subject: teacher.subject, password: '' });
    setTeacherDialogOpen(true);
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('Yakin ingin menghapus guru ini?')) return;
    try {
      const { data, error } = await supabase.functions.invoke('admin-teachers', {
        method: 'DELETE',
        body: { id },
      });
      if (error || data?.error) throw new Error(data?.error || 'Gagal menghapus');
      toast.success('Guru berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const filteredStudents = selectedClassFilter === 'all'
    ? students
    : students.filter(s => s.class_id === selectedClassFilter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Panel Admin</h1>
              <p className="text-xs text-muted-foreground">Manajemen Data Sekolah</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" />
              Data Siswa
            </TabsTrigger>
            <TabsTrigger value="teachers" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Data Guru
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Select value={selectedClassFilter} onValueChange={setSelectedClassFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kelas</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  {filteredStudents.length} siswa
                </span>
              </div>
              <Dialog open={studentDialogOpen} onOpenChange={(open) => {
                setStudentDialogOpen(open);
                if (!open) { setEditingStudent(null); setStudentForm({ nis: '', full_name: '', class_id: '', password: '' }); }
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Siswa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>NIS</Label>
                      <Input
                        placeholder="Nomor Induk Siswa"
                        value={studentForm.nis}
                        onChange={(e) => setStudentForm({ ...studentForm, nis: e.target.value.replace(/[^0-9]/g, '') })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nama Lengkap</Label>
                      <Input
                        placeholder="Nama lengkap siswa"
                        value={studentForm.full_name}
                        onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Kelas</Label>
                      <Select value={studentForm.class_id} onValueChange={(v) => setStudentForm({ ...studentForm, class_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kelas" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Password {editingStudent && '(kosongkan jika tidak diubah)'}</Label>
                      <Input
                        type="password"
                        placeholder="Password login"
                        value={studentForm.password}
                        onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Batal</Button>
                    </DialogClose>
                    <Button onClick={handleSaveStudent}>
                      {editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
                    </Button>
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
                      <TableHead>NIS</TableHead>
                      <TableHead>Nama Lengkap</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead className="w-24 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Belum ada data siswa
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student, index) => (
                        <TableRow key={student.id}>
                          <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-mono">{student.nis}</TableCell>
                          <TableCell className="font-medium">{student.full_name}</TableCell>
                          <TableCell>{student.classes?.name || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditStudent(student)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteStudent(student.id)}>
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
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{teachers.length} guru</span>
              <Dialog open={teacherDialogOpen} onOpenChange={(open) => {
                setTeacherDialogOpen(open);
                if (!open) { setEditingTeacher(null); setTeacherForm({ nit: '', full_name: '', subject: '', password: '' }); }
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Guru
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTeacher ? 'Edit Guru' : 'Tambah Guru Baru'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>NIT</Label>
                      <Input
                        placeholder="Nomor Induk Tenaga Pendidik"
                        value={teacherForm.nit}
                        onChange={(e) => setTeacherForm({ ...teacherForm, nit: e.target.value.replace(/[^0-9]/g, '') })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nama Lengkap</Label>
                      <Input
                        placeholder="Nama lengkap guru"
                        value={teacherForm.full_name}
                        onChange={(e) => setTeacherForm({ ...teacherForm, full_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mata Pelajaran</Label>
                      <Input
                        placeholder="Mata pelajaran yang diampu"
                        value={teacherForm.subject}
                        onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password {editingTeacher && '(kosongkan jika tidak diubah)'}</Label>
                      <Input
                        type="password"
                        placeholder="Password login"
                        value={teacherForm.password}
                        onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Batal</Button>
                    </DialogClose>
                    <Button onClick={handleSaveTeacher}>
                      {editingTeacher ? 'Simpan Perubahan' : 'Tambah Guru'}
                    </Button>
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
                      <TableHead>NIT</TableHead>
                      <TableHead>Nama Lengkap</TableHead>
                      <TableHead>Mata Pelajaran</TableHead>
                      <TableHead className="w-24 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Belum ada data guru
                        </TableCell>
                      </TableRow>
                    ) : (
                      teachers.map((teacher, index) => (
                        <TableRow key={teacher.id}>
                          <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-mono">{teacher.nit}</TableCell>
                          <TableCell className="font-medium">{teacher.full_name}</TableCell>
                          <TableCell>{teacher.subject}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditTeacher(teacher)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteTeacher(teacher.id)}>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
