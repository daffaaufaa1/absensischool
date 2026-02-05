import React, { useState, useEffect, useRef } from 'react';
 import { FileSpreadsheet, Save, Search, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Subject, GradeType } from '@/types/database';

interface StudentGrade {
  id: string;
  name: string;
  class: string;
  grades: { [key: string]: number | null };
}

// Generate sample students
const generateSampleStudents = (): StudentGrade[] => {
  const firstNames = ['Ahmad', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Galih', 'Hana', 'Indra', 'Joko', 'Kartika', 'Lina', 'Mira', 'Nadia', 'Omar', 'Putri', 'Qori', 'Rina', 'Sari', 'Tono', 'Umi', 'Vina', 'Wati', 'Xena', 'Yuni', 'Zara', 'Adi', 'Bayu', 'Candra', 'Dina', 'Edo', 'Fani', 'Gita', 'Hadi', 'Ika'];
  const lastNames = ['Pratama', 'Santoso', 'Wijaya', 'Kusuma', 'Hidayat', 'Saputra', 'Lestari', 'Wibowo', 'Nugroho', 'Purnama'];
  
  return firstNames.map((firstName, index) => ({
    id: `student-${index + 1}`,
    name: `${firstName} ${lastNames[index % lastNames.length]}`,
    class: `Kelas ${Math.floor(index / 12) + 7}${String.fromCharCode(65 + (index % 3))}`,
    grades: {},
  }));
};

const InputNilai: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students] = useState<StudentGrade[]>(generateSampleStudents());
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGradeType, setSelectedGradeType] = useState<GradeType>('tugas');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<{ studentId: string; field: string } | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [localGrades, setLocalGrades] = useState<{ [key: string]: { [key: string]: number | null } }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const gradeTypes: { value: GradeType; label: string }[] = [
    { value: 'tugas', label: 'Tugas' },
    { value: 'ulangan_harian', label: 'Ulangan Harian' },
    { value: 'kegiatan_harian', label: 'Kegiatan Harian' },
  ];

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from('subjects').select('*').order('name');
      if (data) setSubjects(data);
    };
    fetchSubjects();
  }, []);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCellClick = (studentId: string, field: string, currentValue: number | null) => {
    setEditingCell({ studentId, field });
    setTempValue(currentValue?.toString() || '');
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const value = tempValue ? parseFloat(tempValue) : null;
      if (value !== null && (value < 0 || value > 100)) {
        toast.error('Nilai harus antara 0-100');
        return;
      }

      setLocalGrades((prev) => ({
        ...prev,
        [editingCell.studentId]: {
          ...prev[editingCell.studentId],
          [editingCell.field]: value,
        },
      }));
    }
    setEditingCell(null);
    setTempValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setTempValue('');
    }
  };

  const getGrade = (studentId: string, field: string): number | null => {
    return localGrades[studentId]?.[field] ?? null;
  };

  const handleSaveGrades = async () => {
    if (!selectedSubject) {
      toast.error('Pilih mata pelajaran terlebih dahulu');
      return;
    }

    if (!user) {
      toast.error('Anda harus login');
      return;
    }

    // In a real app, save to database
    toast.success('Nilai berhasil disimpan!');
    setDialogOpen(false);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Rekap Nilai Siswa - FADAM School</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                th { background-color: #3b82f6; color: white; }
                tr:nth-child(even) { background-color: #f9fafb; }
                h1 { text-align: center; color: #1e40af; }
                .header { text-align: center; margin-bottom: 20px; }
                .info { margin-bottom: 10px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>ABSENSI FADAM SCHOOL</h1>
                <h2>Rekap Nilai Siswa</h2>
              </div>
              <div class="info">
                <p><strong>Mata Pelajaran:</strong> ${subjects.find(s => s.id === selectedSubject)?.name || '-'}</p>
                <p><strong>Jenis Nilai:</strong> ${gradeTypes.find(g => g.value === selectedGradeType)?.label || '-'}</p>
                <p><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID')}</p>
              </div>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold tracking-tight">Input Nilai Siswa</h1>
          <p className="text-muted-foreground">Masukkan nilai untuk setiap siswa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
             <Download className="mr-2 h-4 w-4" />
            Cetak
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
               <Button>
                <Save className="mr-2 h-4 w-4" />
                Simpan Nilai
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                 <DialogTitle className="flex items-center gap-2">
                   <div className="p-2 rounded-lg bg-primary/10">
                     <Save className="h-4 w-4 text-primary" />
                   </div>
                   Simpan Nilai
                 </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Mata Pelajaran</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                     <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Pilih mata pelajaran" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Jenis Nilai</Label>
                  <Select value={selectedGradeType} onValueChange={(v) => setSelectedGradeType(v as GradeType)}>
                     <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Pilih jenis nilai" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                    Batal
                  </Button>
                   <Button onClick={handleSaveGrades} className="flex-1">
                    Simpan
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
       <Card className="shadow-card">
         <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama siswa atau kelas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                   className="pl-10 rounded-xl"
                />
              </div>
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
               <SelectTrigger className="w-full sm:w-[200px] rounded-xl">
                <SelectValue placeholder="Pilih Mapel" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedGradeType} onValueChange={(v) => setSelectedGradeType(v as GradeType)}>
               <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
                <SelectValue placeholder="Jenis Nilai" />
              </SelectTrigger>
              <SelectContent>
                {gradeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grade Table */}
       <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <div className="p-2 rounded-lg bg-primary/10">
               <FileSpreadsheet className="h-4 w-4 text-primary" />
             </div>
            Tabel Nilai Siswa
          </CardTitle>
          <CardDescription>Klik pada sel untuk memasukkan nilai (0-100)</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={printRef} className="overflow-x-auto">
            <Table>
              <TableHeader>
                 <TableRow className="hover:bg-transparent">
                   <TableHead className="w-12 text-center font-semibold">No</TableHead>
                   <TableHead className="min-w-[200px] font-semibold">Nama Siswa</TableHead>
                   <TableHead className="w-32 text-center font-semibold">Kelas</TableHead>
                   <TableHead className="w-24 text-center font-semibold">Nilai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student, index) => (
                  <TableRow key={student.id} className="hover:bg-muted/50">
                     <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{student.name}</TableCell>
                     <TableCell className="text-center text-muted-foreground">{student.class}</TableCell>
                    <TableCell className="text-center">
                      {editingCell?.studentId === student.id && editingCell?.field === 'grade' ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                           className="w-20 mx-auto text-center rounded-lg"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => handleCellClick(student.id, 'grade', getGrade(student.id, 'grade'))}
                           className="cursor-pointer hover:bg-muted rounded-lg px-2 py-1.5 min-h-[36px] flex items-center justify-center border border-transparent hover:border-border transition-colors"
                        >
                          {getGrade(student.id, 'grade') ?? '-'}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InputNilai;
