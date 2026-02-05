import React, { useState, useRef, useEffect } from 'react';
 import { Camera, Upload, CheckCircle, XCircle, RotateCcw, Shield, Loader2, ScanFace, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
 import { useFaceDetection } from '@/hooks/useFaceDetection';

const Absensi: React.FC = () => {
  const { authUser, user } = useAuth();
  const [attendanceType, setAttendanceType] = useState<'hadir' | 'izin'>('hadir');
  const [step, setStep] = useState<'select' | 'camera' | 'permit' | 'success'>('select');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [permitFile, setPermitFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

   const {
     isModelLoaded,
     isDetecting,
     faceDetected,
     headTurnDetected,
     error: faceError,
     loadModels,
     startDetection,
     stopDetection,
     resetDetection,
   } = useFaceDetection();

  const canAttend = true;

   // Load face detection models on mount
   useEffect(() => {
     loadModels();
   }, [loadModels]);
 
  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      setStream(mediaStream);
      setStep('camera');
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        toast.error('Akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.');
      } else {
        toast.error('Gagal mengakses kamera');
      }
      console.error(error);
    }
  };

  // Attach stream to video element when both are ready
  useEffect(() => {
    if (stream && videoRef.current && step === 'camera') {
      videoRef.current.srcObject = stream;
       // Start face detection when video is ready
       if (isModelLoaded && videoRef.current) {
         videoRef.current.onloadedmetadata = () => {
           if (videoRef.current) {
             startDetection(videoRef.current);
           }
         };
       }
    }
   }, [stream, step, isModelLoaded, startDetection]);

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
     stopDetection();
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
         toast.success('Foto diambil! Gelengkan kepala untuk verifikasi.');
      }
    }
  };

  // Handle file upload for permit
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPermitFile(e.target.files[0]);
    }
  };

   // Handle retake
   const handleRetake = () => {
     setPhoto(null);
     resetDetection();
     if (videoRef.current && isModelLoaded) {
       startDetection(videoRef.current);
     }
   };
 
   // Handle verification complete
   useEffect(() => {
     if (headTurnDetected && photo) {
       toast.success('Verifikasi wajah berhasil!');
       stopCamera();
     }
   }, [headTurnDetected, photo]);
 
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
         <Card className="shadow-card">
          <CardHeader className="text-center">
             <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
               <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Di Luar Jam Absensi</CardTitle>
            <CardDescription>
               Sistem absensi tidak tersedia saat ini
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
         <Card className="shadow-card overflow-hidden">
           <div className="h-1.5 bg-gradient-to-r from-emerald-500 to-emerald-400" />
          <CardHeader className="text-center pt-8">
             <div className="mx-auto w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 animate-float">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
             <CardTitle className="text-2xl">Absensi Berhasil!</CardTitle>
            <CardDescription className="text-base mt-2">
              Kehadiran Anda telah tercatat pada
            </CardDescription>
            <p className="font-semibold text-foreground mt-1">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </CardHeader>
          <CardContent className="text-center pb-8">
             <p className="text-sm text-muted-foreground mb-6">
               Terima kasih telah melakukan absensi
             </p>
             <Button onClick={() => window.location.reload()} size="lg" className="px-8">
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Info Banner */}
       <Card className="shadow-card bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
             <div className="p-2.5 rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Sistem Absensi Aktif 24 Jam</p>
               <p className="text-xs text-muted-foreground">
                 {isModelLoaded ? 'Face detection siap digunakan' : 'Memuat model deteksi wajah...'}
               </p>
            </div>
             {!isModelLoaded && <Loader2 className="h-4 w-4 animate-spin ml-auto text-muted-foreground" />}
          </div>
        </CardContent>
      </Card>

       <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <div className="p-2 rounded-xl bg-primary/10">
               <ScanFace className="h-5 w-5 text-primary" />
            </div>
            Absensi Harian
          </CardTitle>
          <CardDescription>
            Pilih jenis kehadiran dan lakukan verifikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           {faceError && (
             <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
               {faceError}
             </div>
           )}
 
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
                       className="flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                    >
                       <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                         <ScanFace className="h-7 w-7 text-emerald-600" />
                       </div>
                      <span className="font-semibold">Hadir</span>
                      <span className="text-xs text-muted-foreground">Verifikasi wajah</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="izin" id="izin" className="peer sr-only" />
                    <Label
                      htmlFor="izin"
                       className="flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:border-primary/50"
                    >
                       <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
                         <Upload className="h-7 w-7 text-amber-600" />
                       </div>
                      <span className="font-semibold">Izin</span>
                      <span className="text-xs text-muted-foreground">Upload surat</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                onClick={() => {
                  if (attendanceType === 'hadir') {
                     if (!isModelLoaded) {
                       toast.error('Model deteksi wajah belum siap');
                       return;
                     }
                    startCamera();
                  } else {
                    setStep('permit');
                  }
                }}
                 className="w-full"
                 size="lg"
                 disabled={attendanceType === 'hadir' && !isModelLoaded}
              >
                 {attendanceType === 'hadir' && !isModelLoaded ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Memuat Model...
                   </>
                 ) : (
                   'Lanjutkan'
                 )}
              </Button>
            </>
          )}

          {step === 'camera' && (
            <div className="space-y-4">
               <div className="relative rounded-2xl overflow-hidden bg-muted aspect-video">
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
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-8">
                   <div className={`w-48 h-60 border-4 rounded-full transition-colors duration-300 ${
                     faceDetected ? 'border-emerald-400' : 'border-white/40'
                   }`} />
                </div>

                {/* Status indicator */}
                <div className="absolute top-4 left-4">
                   <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                     faceDetected 
                       ? 'bg-emerald-500 text-white' 
                       : 'bg-white/90 text-foreground'
                  }`}>
                     {isDetecting && !faceDetected && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                     {faceDetected && <CheckCircle className="h-3.5 w-3.5" />}
                     {faceDetected ? 'Wajah Terdeteksi' : 'Mendeteksi wajah...'}
                   </div>
                 </div>
 
                 {/* Head turn indicator */}
                 {photo && !headTurnDetected && (
                   <div className="absolute bottom-4 left-4 right-4">
                     <div className="bg-white/95 backdrop-blur rounded-xl p-3 text-center">
                       <p className="text-sm font-medium text-foreground">
                         Gelengkan kepala ke kiri dan kanan
                       </p>
                       <div className="flex justify-center gap-3 mt-2">
                         <div className="text-2xl animate-pulse">👈</div>
                         <div className="text-2xl animate-pulse">👉</div>
                       </div>
                     </div>
                  </div>
                 )}
 
                 {/* Verification complete */}
                 {headTurnDetected && (
                   <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                     <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
                       <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                       <p className="font-semibold text-emerald-600">Verifikasi Berhasil!</p>
                     </div>
                   </div>
                 )}
               </div>
 
               {/* Back button */}
               <Button
                 variant="ghost"
                 onClick={() => {
                   stopCamera();
                   setPhoto(null);
                   resetDetection();
                   setStep('select');
                 }}
                 className="w-full"
               >
                 <ArrowLeft className="mr-2 h-4 w-4" />
                 Kembali
               </Button>
 
               {!photo ? (
                 <Button
                   onClick={capturePhoto}
                   className="w-full"
                   size="lg"
                   disabled={!faceDetected}
                 >
                   <Camera className="mr-2 h-4 w-4" />
                   {faceDetected ? 'Ambil Foto' : 'Menunggu deteksi wajah...'}
                 </Button>
               ) : !headTurnDetected ? (
                 <div className="flex gap-3">
                   <Button
                     variant="outline"
                     onClick={handleRetake}
                     className="flex-1"
                   >
                     <RotateCcw className="mr-2 h-4 w-4" />
                     Ulangi
                   </Button>
                </div>
              ) : (
                <Button
                  onClick={submitAttendance}
                   className="w-full"
                   size="lg"
                  disabled={loading}
                >
                   {loading ? (
                     <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Menyimpan...
                     </>
                   ) : (
                     'Konfirmasi Absensi'
                   )}
                </Button>
              )}
            </div>
          )}

          {step === 'permit' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Surat Izin</Label>
                 <div className="border-2 border-dashed rounded-2xl p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="permit-upload"
                  />
                  <label htmlFor="permit-upload" className="cursor-pointer">
                     <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                       <Upload className="h-8 w-8 text-muted-foreground" />
                     </div>
                     {permitFile ? (
                       <p className="text-sm font-medium text-foreground">{permitFile.name}</p>
                     ) : (
                       <p className="text-sm text-muted-foreground">Klik untuk upload surat izin</p>
                     )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Keterangan (Opsional)</Label>
                <Textarea
                  placeholder="Tambahkan keterangan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                   className="min-h-[100px]"
                />
              </div>

               <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep('select')}
                  className="flex-1"
                >
                  Kembali
                </Button>
                <Button
                  onClick={submitAttendance}
                   className="flex-1"
                  disabled={loading || !permitFile}
                >
                   {loading ? (
                     <>
                       <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Menyimpan...
                     </>
                   ) : (
                     'Kirim Izin'
                   )}
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
