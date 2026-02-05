import React, { useState } from 'react';
 import { User, Save, Camera, Mail, GraduationCap, Shield } from 'lucide-react';
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
       <Card className="shadow-card overflow-hidden">
         <div className="h-32 bg-primary" />
        <CardHeader className="relative -mt-16 pb-0">
          <div className="flex flex-col items-center">
            <div className="relative">
               <Avatar className="h-24 w-24 border-4 border-background shadow-card">
                <AvatarImage src={authUser?.profile?.avatar_url || undefined} />
                 <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                 className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 shadow-card"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
             <CardTitle className="mt-4 text-xl tracking-tight">{fullName || 'Nama Pengguna'}</CardTitle>
             <div className="flex items-center gap-2 mt-1">
               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                 {authUser?.role === 'guru' ? 'Guru' : 'Siswa'}
               </span>
               {className && (
                 <span className="text-sm text-muted-foreground">{className}</span>
               )}
             </div>
          </div>
        </CardHeader>
      </Card>

       <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <div className="p-2 rounded-lg bg-primary/10">
               <User className="h-4 w-4 text-primary" />
             </div>
            Informasi Biodata
          </CardTitle>
          <CardDescription>Perbarui informasi profil Anda</CardDescription>
        </CardHeader>
         <CardContent className="space-y-5">
          <div className="space-y-2">
             <Label htmlFor="email" className="flex items-center gap-2">
               <Mail className="h-3.5 w-3.5 text-muted-foreground" />
               Email
             </Label>
            <Input
              id="email"
              type="email"
              value={authUser?.email || ''}
              disabled
               className="bg-muted rounded-xl"
            />
            <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
          </div>

          <div className="space-y-2">
             <Label htmlFor="fullName" className="flex items-center gap-2">
               <User className="h-3.5 w-3.5 text-muted-foreground" />
               Nama Lengkap
             </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Masukkan nama lengkap"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
               className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
             <Label htmlFor="role" className="flex items-center gap-2">
               <Shield className="h-3.5 w-3.5 text-muted-foreground" />
               Peran
             </Label>
            <Input
              id="role"
              type="text"
              value={authUser?.role === 'guru' ? 'Guru' : authUser?.role === 'siswa' ? 'Siswa' : 'Pengurus Kelas'}
              disabled
               className="bg-muted capitalize rounded-xl"
            />
          </div>

          {authUser?.role === 'siswa' && (
            <div className="space-y-2">
               <Label htmlFor="class" className="flex items-center gap-2">
                 <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                 Kelas
               </Label>
              <Input
                id="class"
                type="text"
                placeholder="Contoh: Kelas 9A"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                 className="rounded-xl"
              />
            </div>
          )}

          <Button
            onClick={handleSave}
             className="w-full"
             size="lg"
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
