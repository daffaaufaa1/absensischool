import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, Calendar, Filter, Download, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Attendance, AttendanceStatus, Class } from '@/types/database';
import { UserProfile } from '@/types/auth';

interface AttendanceWithProfile extends Attendance {
  profile?: UserProfile;
}

const statusColors: Record<AttendanceStatus, string> = {
  hadir: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  izin: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  sakit: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  alpha: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

const statusLabels: Record<AttendanceStatus, string> = {
  hadir: 'H',
  izin: 'I',
  sakit: 'S',
  alpha: 'A',
};

const Kehadiran: React.FC = () => {
  const { authUser, user } = useAuth();
  const [attendanceData, setAttendanceData] = useState<AttendanceWithProfile[]>([]);
  const [myAttendance, setMyAttendance] = useState<Attendance[]>([]);
  const [classAttendance, setClassAttendance] = useState<AttendanceWithProfile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  const isGuru = authUser?.role === 'guru';
  const myClass = authUser?.profile?.class;

  const months = [
    { value: '0', label: 'Januari' },
    { value: '1', label: 'Februari' },
    { value: '2', label: 'Maret' },
    { value: '3', label: 'April' },
    { value: '4', label: 'Mei' },
    { value: '5', label: 'Juni' },
    { value: '6', label: 'Juli' },
    { value: '7', label: 'Agustus' },
    { value: '8', label: 'September' },
    { value: '9', label: 'Oktober' },
    { value: '10', label: 'November' },
    { value: '11', label: 'Desember' },
  ];

  useEffect(() => {
    fetchData();
  }, [user, selectedMonth, selectedClass]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch classes
    const { data: classesData } = await supabase.from('classes').select('*').order('name');
    if (classesData) setClasses(classesData);

    // Calculate date range for selected month
    const year = new Date().getFullYear();
    const month = parseInt(selectedMonth);
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    // Fetch my attendance
    const { data: myData } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (myData) setMyAttendance(myData);

    // For teachers, fetch attendance based on selected class
    if (isGuru) {
      if (selectedClass) {
        // Fetch all attendance for the month
        const { data: allData } = await supabase
          .from('attendance')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false });

        if (allData) {
          // Fetch profiles for selected class
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .eq('class', selectedClass);

          const classUserIds = profiles?.map((p) => p.user_id) || [];
          
          const attendanceWithProfiles = allData
            .filter((a) => classUserIds.includes(a.user_id))
            .map((attendance) => ({
              ...attendance,
              profile: profiles?.find((p) => p.user_id === attendance.user_id),
            }));

          setAttendanceData(attendanceWithProfiles);
        }
      } else {
        setAttendanceData([]);
      }
    } else {
      // For students, fetch class attendance only for their class
      if (myClass) {
        const { data: allData } = await supabase
          .from('attendance')
          .select('*')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false });

        if (allData) {
          // Fetch profiles for student's class
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .eq('class', myClass);

          const classUserIds = profiles?.map((p) => p.user_id) || [];
          
          const attendanceWithProfiles = allData
            .filter((a) => classUserIds.includes(a.user_id))
            .map((attendance) => ({
              ...attendance,
              profile: profiles?.find((p) => p.user_id === attendance.user_id),
            }));

          setClassAttendance(attendanceWithProfiles);
        }
      }
    }

    setLoading(false);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Rekap Kehadiran - FADAM School</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                th { background-color: #1f2937; color: white; }
                tr:nth-child(even) { background-color: #f9fafb; }
                h1 { text-align: center; color: #1f2937; }
                .header { text-align: center; margin-bottom: 20px; }
                .status-h { background-color: #dcfce7; color: #166534; }
                .status-i { background-color: #dbeafe; color: #1e40af; }
                .status-s { background-color: #fef3c7; color: #92400e; }
                .status-a { background-color: #fee2e2; color: #991b1b; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>FADAM SCHOOL</h1>
                <h2>Rekap Kehadiran ${months.find(m => m.value === selectedMonth)?.label} ${new Date().getFullYear()}</h2>
                ${selectedClass ? `<h3>Kelas: ${selectedClass}</h3>` : ''}
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

  const renderStatusBadge = (status: AttendanceStatus) => (
    <Badge variant="outline" className={statusColors[status]}>
      {statusLabels[status]}
    </Badge>
  );

  // Group attendance by student for better display
  const groupedByStudent = (data: AttendanceWithProfile[]) => {
    const grouped: { [key: string]: { profile: UserProfile; records: AttendanceWithProfile[] } } = {};
    data.forEach((record) => {
      const key = record.user_id;
      if (!grouped[key]) {
        grouped[key] = { profile: record.profile!, records: [] };
      }
      grouped[key].records.push(record);
    });
    return Object.values(grouped).sort((a, b) => 
      a.profile.full_name.localeCompare(b.profile.full_name)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rekap Kehadiran</h1>
          <p className="text-muted-foreground">
            {isGuru ? 'Lihat rekap kehadiran siswa dan guru' : 'Lihat riwayat kehadiran kelas Anda'}
          </p>
        </div>
        <Button variant="outline" onClick={handlePrint}>
          <Download className="mr-2 h-4 w-4" />
          Cetak
        </Button>
      </div>

      {isGuru ? (
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="students">Kehadiran Siswa</TabsTrigger>
            <TabsTrigger value="personal">Kehadiran Saya</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-4">
            {/* Filters */}
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-full sm:w-[200px] rounded-xl">
                        <SelectValue placeholder="Pilih Kelas" />
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
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-full sm:w-[150px] rounded-xl">
                        <SelectValue placeholder="Pilih Bulan" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Students Attendance Table */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  Tabel Kehadiran Siswa
                </CardTitle>
                <CardDescription>
                  H = Hadir, I = Izin, S = Sakit, A = Alpha
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div ref={printRef} className="overflow-x-auto">
                  {!selectedClass ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p>Pilih kelas untuk melihat data kehadiran</p>
                    </div>
                  ) : loading ? (
                    <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
                  ) : attendanceData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                        <ClipboardList className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p>Belum ada data kehadiran di kelas ini</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-12 text-center font-semibold">No</TableHead>
                          <TableHead>Nama</TableHead>
                          <TableHead className="w-28 text-center font-semibold">Tanggal</TableHead>
                          <TableHead className="w-20 text-center font-semibold">Status</TableHead>
                          <TableHead className="w-24 text-center font-semibold">Jam</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceData.map((attendance, index) => (
                          <TableRow key={attendance.id}>
                            <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="font-medium">
                              {attendance.profile?.full_name || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {new Date(attendance.date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </TableCell>
                            <TableCell className="text-center">
                              {renderStatusBadge(attendance.status)}
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {attendance.check_in_time?.slice(0, 5) || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personal">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <ClipboardList className="h-4 w-4 text-primary" />
                      </div>
                      Kehadiran Saya
                    </CardTitle>
                    <CardDescription>Riwayat kehadiran Anda bulan ini</CardDescription>
                  </div>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[150px] rounded-xl">
                      <SelectValue placeholder="Pilih Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {myAttendance.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p>Belum ada data kehadiran</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-12 text-center font-semibold">No</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="text-center font-semibold">Status</TableHead>
                        <TableHead className="text-center font-semibold">Jam Masuk</TableHead>
                        <TableHead>Keterangan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myAttendance.map((attendance, index) => (
                        <TableRow key={attendance.id}>
                          <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                          <TableCell>
                            {new Date(attendance.date).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="text-center">
                            {renderStatusBadge(attendance.status)}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {attendance.check_in_time?.slice(0, 5) || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{attendance.notes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        // Student view - show class attendance only
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ClipboardList className="h-4 w-4 text-primary" />
                  </div>
                  Kehadiran Kelas {myClass || '-'}
                </CardTitle>
                <CardDescription>H = Hadir, I = Izin, S = Sakit, A = Alpha</CardDescription>
              </div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[150px] rounded-xl">
                  <SelectValue placeholder="Pilih Bulan" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={printRef}>
              {!myClass ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p>Kelas Anda belum diatur</p>
                  <p className="text-sm mt-1">Silakan update biodata untuk mengatur kelas Anda</p>
                </div>
              ) : loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
              ) : classAttendance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p>Belum ada data kehadiran bulan ini</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 text-center font-semibold">No</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead className="w-28 text-center font-semibold">Tanggal</TableHead>
                      <TableHead className="w-20 text-center font-semibold">Status</TableHead>
                      <TableHead className="w-24 text-center font-semibold">Jam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classAttendance.map((attendance, index) => (
                      <TableRow key={attendance.id}>
                        <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {attendance.profile?.full_name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {new Date(attendance.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </TableCell>
                        <TableCell className="text-center">
                          {renderStatusBadge(attendance.status)}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {attendance.check_in_time?.slice(0, 5) || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Kehadiran;
