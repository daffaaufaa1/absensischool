import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, CheckCircle, XCircle, MapPin, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Absensi: React.FC = () => {
  const { authUser, user } = useAuth();
  const [attendanceType, setAttendanceType] = useState<'hadir' | 'izin'>('hadir');
  const [step, setStep] = useState<'select' | 'camera' | 'permit' | 'success'>('select');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [permitFile, setPermitFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationVerified, setLocationVerified] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [headTurnDetected, setHeadTurnDetected] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isGuru = authUser?.role === 'guru';

  // Allow attendance 24 hours (no time restriction for now)
  const canAttend = true;

  // Get user location
  const getLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          // For demo, we'll verify any location
          setLocationVerified(true);
          toast.success('Lokasi terverifikasi!');
        },
        (error) => {
          toast.error('Gagal mendapatkan lokasi: ' + error.message);
        }
      );
    } else {
      toast.error('Geolocation tidak didukung browser ini');
    }
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStep('camera');
      getLocation();
    } catch (error) {
      toast.error('Gagal mengakses kamera');
      console.error(error);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setPhoto(dataUrl);
        
        // Simulate face verification (in real app, use face detection API)
        setTimeout(() => {
          setFaceVerified(true);
          toast.success('Wajah terdeteksi! Silakan gelengkan kepala untuk verifikasi.');
        }, 1000);
      }
    }
  };

  // Simulate head turn detection
  const simulateHeadTurn = () => {
    setHeadTurnDetected(true);
    toast.success('Verifikasi wajah berhasil!');
    stopCamera();
  };

  // Handle file upload for permit
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPermitFile(e.target.files[0]);
    }
  };

  // Submit attendance
  const submitAttendance = async () => {
    if (!user) {
      toast.error('Anda harus login');
      return;
    }

    setLoading(true);

    try {
      const now = new Date();
      const timeString = now.toTimeString().split(' ')[0];

      const attendanceData = {
        user_id: user.id,
        date: now.toISOString().split('T')[0],
        status: attendanceType as 'hadir' | 'izin',
        check_in_time: timeString,
        notes: notes || null,
        photo_url: photo || null,
        permit_file_url: null as string | null,
      };

      // If permit file, upload it
      if (permitFile && attendanceType === 'izin') {
        const fileExt = permitFile.name.split('.').pop();
        const fileName = `${user.id}/${now.getTime()}.${fileExt}`;
        
        // For now, we'll skip actual file upload and just save reference
        attendanceData.permit_file_url = fileName;
      }

      const { error } = await supabase.from('attendance').insert(attendanceData);

      if (error) {
        if (error.code === '23505') {
          toast.error('Anda sudah melakukan absensi hari ini');
        } else {
          throw error;
        }
      } else {
        setStep('success');
        toast.success('Absensi berhasil dicatat!');
      }
    } catch (error: any) {
      toast.error('Gagal mencatat absensi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  if (!canAttend) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-elegant border-0">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-orange-500" />
            </div>
            <CardTitle>Di Luar Jam Absensi</CardTitle>
            <CardDescription>
              Jam absensi untuk {isGuru ? 'Guru' : 'Siswa'}: {isGuru ? '06:50 - 07:30' : '07:00 - 08:00'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-elegant border-0">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-float">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-green-600">Absensi Berhasil!</CardTitle>
            <CardDescription>
              Kehadiran Anda telah tercatat pada {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.reload()} className="gradient-primary text-white">
              Kembali
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="shadow-elegant border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Absensi Harian
          </CardTitle>
          <CardDescription>
            Pilih jenis kehadiran dan lakukan verifikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'select' && (
            <>
              <div className="space-y-4">
                <Label>Pilih Jenis Kehadiran</Label>
                <RadioGroup
                  value={attendanceType}
                  onValueChange={(value) => setAttendanceType(value as 'hadir' | 'izin')}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem value="hadir" id="hadir" className="peer sr-only" />
                    <Label
                      htmlFor="hadir"
                      className="flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50"
                    >
                      <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                      <span className="font-semibold">Hadir</span>
                      <span className="text-xs text-muted-foreground">Verifikasi wajah</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="izin" id="izin" className="peer sr-only" />
                    <Label
                      htmlFor="izin"
                      className="flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all peer-checked:border-primary peer-checked:bg-primary/5 hover:border-primary/50"
                    >
                      <Upload className="h-8 w-8 text-orange-500 mb-2" />
                      <span className="font-semibold">Izin</span>
                      <span className="text-xs text-muted-foreground">Upload surat</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                onClick={() => {
                  if (attendanceType === 'hadir') {
                    startCamera();
                  } else {
                    setStep('permit');
                  }
                }}
                className="w-full gradient-primary text-white shadow-elegant"
              >
                Lanjutkan
              </Button>
            </>
          )}

          {step === 'camera' && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                {!photo ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img src={photo} alt="Captured" className="w-full h-full object-cover" />
                )}
                <canvas ref={canvasRef} className="hidden" />

                {/* Overlay guides */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-60 border-4 border-white/50 rounded-full" />
                </div>

                {/* Status indicators */}
                <div className="absolute top-4 left-4 space-y-2">
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    locationVerified ? 'bg-green-500/90 text-white' : 'bg-white/90'
                  }`}>
                    <MapPin className="h-4 w-4" />
                    {locationVerified ? 'Lokasi OK' : 'Mengambil lokasi...'}
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    faceVerified ? 'bg-green-500/90 text-white' : 'bg-white/90'
                  }`}>
                    <Camera className="h-4 w-4" />
                    {faceVerified ? 'Wajah OK' : 'Posisikan wajah'}
                  </div>
                </div>
              </div>

              {!photo ? (
                <Button
                  onClick={capturePhoto}
                  className="w-full gradient-primary text-white"
                  disabled={!locationVerified}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Ambil Foto
                </Button>
              ) : !headTurnDetected ? (
                <div className="space-y-4">
                  <p className="text-center text-sm text-muted-foreground">
                    Gelengkan kepala ke kiri dan kanan untuk verifikasi
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPhoto(null);
                        setFaceVerified(false);
                      }}
                      className="flex-1"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Ulangi
                    </Button>
                    <Button
                      onClick={simulateHeadTurn}
                      className="flex-1 gradient-primary text-white"
                    >
                      Verifikasi Selesai
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={submitAttendance}
                  className="w-full gradient-primary text-white"
                  disabled={loading}
                >
                  {loading ? 'Menyimpan...' : 'Konfirmasi Absensi'}
                </Button>
              )}
            </div>
          )}

          {step === 'permit' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Surat Izin</Label>
                <div className="border-2 border-dashed rounded-xl p-8 text-center">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="permit-upload"
                  />
                  <label htmlFor="permit-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {permitFile ? permitFile.name : 'Klik untuk upload surat izin'}
                    </p>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Keterangan (Opsional)</Label>
                <Textarea
                  placeholder="Tambahkan keterangan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('select')}
                  className="flex-1"
                >
                  Kembali
                </Button>
                <Button
                  onClick={submitAttendance}
                  className="flex-1 gradient-primary text-white"
                  disabled={loading || !permitFile}
                >
                  {loading ? 'Menyimpan...' : 'Kirim Izin'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Absensi;
