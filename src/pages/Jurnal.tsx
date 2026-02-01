import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Class, ClassLocation, Journal } from '@/types/database';

const Jurnal: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [locations, setLocations] = useState<ClassLocation[]>([]);
  const [journals, setJournals] = useState<(Journal & { class_name?: string; location_name?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [teachingHours, setTeachingHours] = useState('');
  const [description, setDescription] = useState('');

  const teachingHoursOptions = ['1', '2', '3', '4', '5', '6', '7', '8'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch classes
    const { data: classesData } = await supabase.from('classes').select('*').order('name');
    if (classesData) setClasses(classesData);

    // Fetch locations
    const { data: locationsData } = await supabase.from('class_locations').select('*').order('name');
    if (locationsData) setLocations(locationsData);

    // Fetch journals
    if (user) {
      const { data: journalsData } = await supabase
        .from('journals')
        .select('*')
        .eq('teacher_id', user.id)
        .order('date', { ascending: false });

      if (journalsData) {
        // Map class and location names
        const journalsWithNames = journalsData.map((journal) => ({
          ...journal,
          class_name: classesData?.find((c) => c.id === journal.class_id)?.name,
          location_name: locationsData?.find((l) => l.id === journal.location_id)?.name,
        }));
        setJournals(journalsWithNames);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedLocation || !teachingHours || !description) {
      toast.error('Semua field harus diisi');
      return;
    }

    if (!user) {
      toast.error('Anda harus login');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('journals').insert({
        teacher_id: user.id,
        class_id: selectedClass,
        location_id: selectedLocation,
        teaching_hours: parseInt(teachingHours),
        description,
        date: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      toast.success('Jurnal berhasil disimpan!');
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error('Gagal menyimpan jurnal: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedClass('');
    setSelectedLocation('');
    setTeachingHours('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jurnal Harian</h1>
          <p className="text-muted-foreground">Catat kegiatan mengajar harian Anda</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white shadow-elegant">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Jurnal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Tambah Jurnal Baru
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Kelas</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Jam Mengajar</Label>
                <Select value={teachingHours} onValueChange={setTeachingHours}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jumlah jam" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachingHoursOptions.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour} Jam
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Lokasi Ruangan</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih ruangan" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Deskripsi Jurnal Hari Ini</Label>
                <Textarea
                  placeholder="Tuliskan kegiatan mengajar hari ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 gradient-primary text-white"
                  disabled={loading}
                >
                  {loading ? 'Menyimpan...' : 'Simpan Jurnal'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Journal List */}
      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Riwayat Jurnal
          </CardTitle>
          <CardDescription>Daftar jurnal yang telah Anda buat</CardDescription>
        </CardHeader>
        <CardContent>
          {journals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada jurnal yang dibuat</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Jam</TableHead>
                    <TableHead>Ruangan</TableHead>
                    <TableHead>Deskripsi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journals.map((journal) => (
                    <TableRow key={journal.id}>
                      <TableCell className="font-medium">
                        {new Date(journal.date).toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>{journal.class_name}</TableCell>
                      <TableCell>{journal.teaching_hours} Jam</TableCell>
                      <TableCell>{journal.location_name}</TableCell>
                      <TableCell className="max-w-xs truncate">{journal.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Jurnal;
