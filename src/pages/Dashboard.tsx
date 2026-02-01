import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, BookOpen, FileSpreadsheet, ClipboardList, Clock, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Dashboard: React.FC = () => {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const isGuru = authUser?.role === 'guru';

  const currentTime = new Date();
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  // Check attendance time
  const isWithinAttendanceTime = () => {
    const time = hours * 60 + minutes;
    if (isGuru) {
      // Guru: 06:50 - 07:30
      return time >= 410 && time <= 450;
    } else {
      // Siswa: 07:00 - 08:00
      return time >= 420 && time <= 480;
    }
  };

  const canAttend = isWithinAttendanceTime();

  const menuItems = [
    {
      title: 'Absensi',
      description: canAttend ? 'Lakukan absensi sekarang' : 'Di luar jam absensi',
      icon: Calendar,
      url: '/absensi',
      color: 'from-blue-500 to-blue-600',
      disabled: false,
    },
    ...(isGuru ? [
      {
        title: 'Jurnal Harian',
        description: 'Isi jurnal kegiatan mengajar',
        icon: BookOpen,
        url: '/jurnal',
        color: 'from-purple-500 to-purple-600',
        disabled: false,
      },
      {
        title: 'Input Nilai',
        description: 'Masukkan nilai siswa',
        icon: FileSpreadsheet,
        url: '/nilai',
        color: 'from-green-500 to-green-600',
        disabled: false,
      },
    ] : []),
    {
      title: 'Rekap Kehadiran',
      description: 'Lihat riwayat kehadiran',
      icon: ClipboardList,
      url: '/kehadiran',
      color: 'from-orange-500 to-orange-600',
      disabled: false,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Card */}
      <Card className="gradient-card shadow-card border-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                Selamat Datang, {authUser?.profile?.full_name}!
              </CardTitle>
              <CardDescription className="mt-1">
                {isGuru ? 'Panel Guru' : 'Panel Siswa'} • {authUser?.profile?.class || 'FADAM School'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <span className="text-lg font-semibold">{timeString}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${canAttend ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className={canAttend ? 'text-green-600' : 'text-muted-foreground'}>
              {canAttend 
                ? 'Anda dapat melakukan absensi sekarang' 
                : `Jam absensi: ${isGuru ? '06:50 - 07:30' : '07:00 - 08:00'}`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item) => (
          <Card
            key={item.title}
            className={`shadow-card border-0 overflow-hidden transition-all duration-300 hover:shadow-elegant hover:-translate-y-1 cursor-pointer ${
              item.disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={() => !item.disabled && navigate(item.url)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color} shadow-lg`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-card border-0">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground">Total Hadir Bulan Ini</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground">Hari Kerja</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardContent className="p-4 text-center">
            <ClipboardList className="h-8 w-8 mx-auto text-orange-500 mb-2" />
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground">Izin/Sakit</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-0">
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-bold">-</p>
            <p className="text-xs text-muted-foreground">Alpha</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
