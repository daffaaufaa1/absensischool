import React, { useState } from 'react';
import { User, Save, Camera } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Biodata: React.FC = () => {
  const { authUser, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(authUser?.profile?.full_name || '');
  const [className, setClassName] = useState(authUser?.profile?.class || '');
  const [loading, setLoading] = useState(false);

  const getInitials = () => {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSave = async () => {
    if (!authUser?.id) {
      toast.error('Anda harus login');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          class: className || null,
        })
        .eq('user_id', authUser.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Biodata berhasil disimpan!');
    } catch (error: any) {
      toast.error('Gagal menyimpan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="shadow-elegant border-0 overflow-hidden">
        <div className="h-32 gradient-hero" />
        <CardHeader className="relative -mt-16 pb-0">
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={authUser?.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 shadow-md"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="mt-4 text-xl">{fullName || 'Nama Pengguna'}</CardTitle>
            <CardDescription className="capitalize">
              {authUser?.role === 'guru' ? 'Guru' : 'Siswa'} • {className || 'FADAM School'}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Informasi Biodata
          </CardTitle>
          <CardDescription>Perbarui informasi profil Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={authUser?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Masukkan nama lengkap"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Peran</Label>
            <Input
              id="role"
              type="text"
              value={authUser?.role === 'guru' ? 'Guru' : authUser?.role === 'siswa' ? 'Siswa' : 'Pengurus Kelas'}
              disabled
              className="bg-muted capitalize"
            />
          </div>

          {authUser?.role === 'siswa' && (
            <div className="space-y-2">
              <Label htmlFor="class">Kelas</Label>
              <Input
                id="class"
                type="text"
                placeholder="Contoh: Kelas 9A"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
              />
            </div>
          )}

          <Button
            onClick={handleSave}
            className="w-full gradient-primary text-white shadow-elegant"
            disabled={loading}
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Biodata;
