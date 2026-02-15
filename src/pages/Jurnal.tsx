import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Plus, Calendar, Clock, MapPin, FileText, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Class, ClassLocation, Journal } from '@/types/database';

const Jurnal: React.FC = () => {
  const { user, authUser } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [locations, setLocations] = useState<ClassLocation[]>([]);
  const [journals, setJournals] = useState<(Journal & { class_name?: string; location_name?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Form state
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [teachingHours, setTeachingHours] = useState('');
  const [description, setDescription] = useState('');

  const teachingHoursOptions = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    // Fetch classes
    const { data: classesData } = await supabase.from('classes').select('*').order('name');
    if (classesData) setClasses(classesData);

    // Fetch locations
    const { data: locationsData } = await supabase.from('class_locations').select('*').order('name');
    if (locationsData) setLocations(locationsData);

    // Fetch all journals
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

  // Filter journals by selected month and year
  const filteredJournals = useMemo(() => {
    return journals.filter((journal) => {
      const journalDate = new Date(journal.date);
      return journalDate.getMonth() === selectedMonth && journalDate.getFullYear() === selectedYear;
    });
  }, [journals, selectedMonth, selectedYear]);

  // Monthly recap stats
  const monthlyStats = useMemo(() => {
    const totalJournals = filteredJournals.length;
    const totalHours = filteredJournals.reduce((sum, j) => sum + j.teaching_hours, 0);
    const classBreakdown = filteredJournals.reduce((acc, j) => {
      const className = j.class_name || 'Unknown';
      acc[className] = (acc[className] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { totalJournals, totalHours, classBreakdown };
  }, [filteredJournals]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
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
        school_id: authUser?.school_id || '',
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
          <h1 className="text-2xl font-bold tracking-tight">Jurnal Harian</h1>
          <p className="text-muted-foreground">Catat kegiatan mengajar harian Anda</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Jurnal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                Tambah Jurnal Baru
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Kelas
                </Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="rounded-xl">
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
                <Label className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Jam Mengajar
                </Label>
                <Select value={teachingHours} onValueChange={setTeachingHours}>
                  <SelectTrigger className="rounded-xl">
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
                <Label className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Lokasi Ruangan
                </Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="rounded-xl">
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
                  className="rounded-xl"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Menyimpan...' : 'Simpan Jurnal'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month Selector */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <p className="text-lg font-semibold">{months[selectedMonth]}</p>
              <p className="text-sm text-muted-foreground">{selectedYear}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="daily">Harian</TabsTrigger>
          <TabsTrigger value="monthly">Rekap Bulanan</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          {/* Daily Journal List */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                Riwayat Jurnal - {months[selectedMonth]} {selectedYear}
              </CardTitle>
              <CardDescription>Daftar jurnal yang telah Anda buat</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredJournals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p>Belum ada jurnal di bulan ini</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Kelas</TableHead>
                        <TableHead>Jam</TableHead>
                        <TableHead>Ruangan</TableHead>
                        <TableHead>Deskripsi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJournals.map((journal) => (
                        <TableRow key={journal.id}>
                          <TableCell className="font-medium">
                            {new Date(journal.date).toLocaleDateString('id-ID', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
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
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          {/* Monthly Recap */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{monthlyStats.totalJournals}</p>
                    <p className="text-xs text-muted-foreground">Total Jurnal</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10">
                    <Clock className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{monthlyStats.totalHours}</p>
                    <p className="text-xs text-muted-foreground">Total Jam Mengajar</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{Object.keys(monthlyStats.classBreakdown).length}</p>
                    <p className="text-xs text-muted-foreground">Kelas Diajar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Class Breakdown */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                Rekap Per Kelas
              </CardTitle>
              <CardDescription>Jumlah jurnal per kelas di bulan {months[selectedMonth]}</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(monthlyStats.classBreakdown).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Belum ada data di bulan ini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(monthlyStats.classBreakdown).map(([className, count]) => (
                    <div key={className} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                      <span className="font-medium">{className}</span>
                      <span className="text-sm text-muted-foreground">{count} jurnal</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed List */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                Detail Jurnal Bulan Ini
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredJournals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Belum ada jurnal di bulan ini</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJournals.map((journal) => (
                    <div key={journal.id} className="p-4 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{journal.class_name}</span>
                          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                            {journal.teaching_hours} Jam
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(journal.date).toLocaleDateString('id-ID', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{journal.description}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {journal.location_name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Jurnal;
