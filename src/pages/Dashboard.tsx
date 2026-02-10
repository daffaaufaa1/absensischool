import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, BookOpen, FileSpreadsheet, ClipboardList, Clock, CheckCircle2, TrendingUp, ArrowRight, AlertCircle, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

const Dashboard: React.FC = () => {
  const { authUser, user } = useAuth();
  const navigate = useNavigate();
  const isGuru = authUser?.role === 'guru';

  const [stats, setStats] = useState({
    totalHadir: 0,
    totalIzin: 0,
    totalSakit: 0,
    totalAlpha: 0,
  });
  const [loading, setLoading] = useState(true);

  const currentTime = new Date();
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  const getGreeting = () => {
    if (hours < 12) return 'Selamat Pagi';
    if (hours < 15) return 'Selamat Siang';
    if (hours < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const { data } = await supabase
        .from('attendance')
        .select('status')
        .eq('user_id', user.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      if (data) {
        setStats({
          totalHadir: data.filter(a => a.status === 'hadir').length,
          totalIzin: data.filter(a => a.status === 'izin').length,
          totalSakit: data.filter(a => a.status === 'sakit').length,
          totalAlpha: data.filter(a => a.status === 'alpha').length,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      title: 'Absensi',
      description: 'Lakukan absensi kehadiran',
      icon: Calendar,
      url: '/absensi',
    },
    ...(isGuru ? [
      {
        title: 'Jurnal Harian',
        description: 'Isi jurnal kegiatan mengajar',
        icon: BookOpen,
        url: '/jurnal',
      },
      {
        title: 'Input Nilai',
        description: 'Masukkan nilai siswa',
        icon: FileSpreadsheet,
        url: '/nilai',
      },
    ] : []),
    {
      title: 'Rekap Kehadiran',
      description: 'Lihat riwayat kehadiran',
      icon: ClipboardList,
      url: '/kehadiran',
    },
  ];

  const statsCards = [
    {
      label: 'Hadir',
      value: stats.totalHadir,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Izin',
      value: stats.totalIzin,
      icon: Calendar,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Sakit',
      value: stats.totalSakit,
      icon: Heart,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Alpha',
      value: stats.totalAlpha,
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Card */}
      <Card className="relative overflow-hidden bg-primary text-primary-foreground shadow-card">
        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-primary-foreground/70 text-sm font-medium">{getGreeting()}</span>
              <CardTitle className="text-2xl md:text-3xl font-bold text-primary-foreground tracking-tight">
                {authUser?.profile?.full_name || 'Pengguna'}
              </CardTitle>
              <CardDescription className="text-primary-foreground/60 flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-foreground/15 text-primary-foreground">
                  {isGuru ? 'Guru' : 'Siswa'}
                </span>
                {authUser?.profile?.class && (
                  <span className="text-primary-foreground/50">• {authUser.profile.class}</span>
                )}
              </CardDescription>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <div className="flex items-center gap-2 text-primary-foreground bg-primary-foreground/10 px-4 py-2 rounded-xl">
                <Clock className="h-5 w-5" />
                <span className="text-2xl font-bold tabular-nums">{timeString}</span>
              </div>
              <span className="text-primary-foreground/50 text-xs mt-1">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statsCards.map((stat) => (
          <Card key={stat.label} className="shadow-card hover:shadow-elegant transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{loading ? '-' : stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Menu Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">Menu Utama</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {menuItems.map((item) => (
            <Card
              key={item.title}
              className="group shadow-card overflow-hidden transition-shadow duration-200 hover:shadow-elegant cursor-pointer"
              onClick={() => navigate(item.url)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary text-primary-foreground">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{item.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
