import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SISTEM DETEKSI WAJAH MEDIAPIPE - Panduan Pak Eko
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Bayangkan sistem ini seperti SATPAM PINTAR di pintu masuk:
 * 
 * 1. PENGENALAN WAJAH (Face Detection)
 *    - Satpam melihat siapa yang datang
 *    - Mencatat posisi wajah: [x, y, lebar, tinggi, kepercayaan]
 *    - x, y = koordinat pojok kiri atas kotak wajah (seperti titik di peta)
 *    - lebar, tinggi = ukuran kotak yang mengelilingi wajah
 *    - kepercayaan = seberapa yakin satpam bahwa itu memang wajah (0-1)
 * 
 * 2. DETEKSI GERAKAN KEPALA (Liveness Check)
 *    - Satpam minta pengunjung menoleh kiri-kanan
 *    - Ini untuk membuktikan bukan foto atau patung
 *    - Seperti tes "buktikan kamu manusia hidup"
 * 
 * 3. FORMAT OUTPUT: [x, y, w, h, confidence]
 *    - x = posisi horizontal (dari kiri)
 *    - y = posisi vertikal (dari atas)
 *    - w = lebar kotak wajah
 *    - h = tinggi kotak wajah
 *    - confidence = tingkat keyakinan (0.0 - 1.0)
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Tipe data untuk hasil deteksi wajah format [x, y, w, h, confidence]
export interface FaceBox {
  x: number;      // Posisi horizontal (piksel dari kiri)
  y: number;      // Posisi vertikal (piksel dari atas)  
  w: number;      // Lebar kotak wajah (piksel)
  h: number;      // Tinggi kotak wajah (piksel)
  confidence: number; // Tingkat keyakinan (0.0 - 1.0)
}

interface FaceDetectionResult {
  isModelLoaded: boolean;        // Apakah "otak" AI sudah siap?
  isDetecting: boolean;          // Apakah sedang mengamati?
  faceDetected: boolean;         // Apakah wajah ditemukan?
  headTurnDetected: boolean;     // Apakah kepala sudah digelengkan?
  currentFace: FaceBox | null;   // Data wajah saat ini [x, y, w, h, confidence]
  error: string | null;          // Pesan error jika ada masalah
  loadModels: () => Promise<void>;           // Fungsi memuat "otak" AI
  startDetection: (video: HTMLVideoElement) => void;  // Mulai mengamati
  stopDetection: () => void;     // Berhenti mengamati
  resetDetection: () => void;    // Reset semua status
}

export const useFaceDetection = (): FaceDetectionResult => {
  // ═══ STATE: Status-status penting sistem ═══
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [headTurnDetected, setHeadTurnDetected] = useState(false);
  const [currentFace, setCurrentFace] = useState<FaceBox | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // ═══ REFERENSI: Variabel yang tidak berubah antar render ═══
  const detectorRef = useRef<FaceDetector | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const headPositionsRef = useRef<number[]>([]);  // Riwayat posisi kepala
  const consecutiveDetectionsRef = useRef(0);     // Hitungan deteksi berturut-turut

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * MEMUAT MODEL AI (Seperti memasang otak ke robot)
   * ═══════════════════════════════════════════════════════════════════════
   * 
   * Proses ini seperti:
   * 1. Download "otak" AI dari internet (file model)
   * 2. Pasang ke browser supaya bisa berpikir
   * 3. Kalau berhasil, sistem siap mengenali wajah
   */
  const loadModels = useCallback(async () => {
    try {
      setError(null);
      
      // Langkah 1: Siapkan "ruang kerja" untuk AI (WASM runtime)
      // Ini seperti menyiapkan meja kerja sebelum mulai bekerja
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );
      
      // Langkah 2: Buat detektor wajah dengan model BlazeFace
      // BlazeFace = algoritma super cepat untuk deteksi wajah
      // Seperti melatih satpam untuk mengenali wajah dengan cepat
      detectorRef.current = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          // Model BlazeFace Short Range - optimal untuk jarak dekat (selfie)
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
          delegate: 'GPU'  // Pakai GPU untuk performa maksimal
        },
        runningMode: 'VIDEO',  // Mode video untuk streaming kamera
        minDetectionConfidence: 0.5  // Minimal 50% yakin itu wajah
      });
      
      setIsModelLoaded(true);
      console.log('✅ Model MediaPipe berhasil dimuat!');
    } catch (err) {
      console.error('❌ Gagal memuat model:', err);
      setError('Gagal memuat model pengenalan wajah. Coba refresh halaman.');
      setIsModelLoaded(false);
    }
  }, []);

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * KONVERSI KE FORMAT [x, y, w, h, confidence]
   * ═══════════════════════════════════════════════════════════════════════
   * 
   * MediaPipe memberikan data dalam format berbeda, kita konversi ke format
   * yang diminta Pak Eko: [x, y, w, h, confidence]
   * 
   * Bayangkan seperti menerjemahkan bahasa:
   * MediaPipe bicara: "boundingBox.originX, boundingBox.originY..."
   * Kita terjemahkan: "[x, y, w, h, confidence]"
   */
  const convertToFaceBox = useCallback((detection: any, videoWidth: number, videoHeight: number): FaceBox => {
    const bbox = detection.boundingBox;
    
    // Konversi koordinat relatif ke piksel absolut
    // originX dan originY sudah dalam piksel dari MediaPipe
    return {
      x: Math.round(bbox.originX),
      y: Math.round(bbox.originY),
      w: Math.round(bbox.width),
      h: Math.round(bbox.height),
      confidence: Math.round(detection.categories[0].score * 100) / 100  // Bulatkan 2 desimal
    };
  }, []);

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * DETEKSI GERAKAN KEPALA (Anti Foto/Video Palsu)
   * ═══════════════════════════════════════════════════════════════════════
   * 
   * Cara kerjanya seperti ini:
   * 1. Catat posisi tengah wajah setiap frame
   * 2. Simpan 20 posisi terakhir (seperti rekam jejak)
   * 3. Hitung selisih posisi paling kiri dan paling kanan
   * 4. Kalau selisihnya lebih dari 40 piksel = kepala bergerak!
   * 
   * Analogi: Seperti mengukur seberapa jauh kepala menoleh
   * Kalau diam saja (foto) = selisih kecil
   * Kalau geleng kepala = selisih besar ✓
   */
  const detectHeadTurn = useCallback((faceBox: FaceBox) => {
    // Hitung titik tengah wajah (center X)
    // Ini seperti mencari "hidung" sebagai patokan
    const centerX = faceBox.x + faceBox.w / 2;
    
    // Simpan posisi ke riwayat
    headPositionsRef.current.push(centerX);
    
    // Batasi hanya 20 posisi terakhir (jendela pengamatan)
    // Seperti ingatan jangka pendek - hanya ingat 20 posisi terakhir
    if (headPositionsRef.current.length > 20) {
      headPositionsRef.current.shift();  // Buang yang paling lama
    }
    
    // Analisis pergerakan jika sudah cukup data
    if (headPositionsRef.current.length >= 10) {
      const positions = headPositionsRef.current;
      const minPos = Math.min(...positions);  // Posisi paling kiri
      const maxPos = Math.max(...positions);  // Posisi paling kanan
      const range = maxPos - minPos;          // Jarak pergerakan
      
      // Jika kepala bergerak lebih dari 40 piksel = lulus verifikasi!
      // Angka 40 dipilih karena:
      // - Foto diam: range < 10 piksel (noise kamera)
      // - Kepala geleng: range > 40 piksel (gerakan nyata)
      if (range > 40) {
        console.log(`✅ Gerakan kepala terdeteksi! Range: ${range}px`);
        setHeadTurnDetected(true);
        return true;
      }
    }
    
    return false;
  }, []);

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * MULAI DETEKSI (Satpam mulai bertugas)
   * ═══════════════════════════════════════════════════════════════════════
   * 
   * Proses setiap 100ms (10 kali per detik):
   * 1. Ambil frame dari video
   * 2. Kirim ke AI untuk dianalisis
   * 3. Dapat hasil: ada wajah atau tidak?
   * 4. Kalau ada, catat posisinya dan cek gerakan kepala
   */
  const startDetection = useCallback((video: HTMLVideoElement) => {
    if (!isModelLoaded || !detectorRef.current) {
      setError('Model belum siap. Tunggu sebentar...');
      return;
    }
    
    setIsDetecting(true);
    setFaceDetected(false);
    setHeadTurnDetected(false);
    setCurrentFace(null);
    headPositionsRef.current = [];
    consecutiveDetectionsRef.current = 0;
    
    let lastTimestamp = -1;
    
    // Loop deteksi setiap 100ms
    // Lebih cepat dari face-api.js (150ms) karena MediaPipe lebih ringan
    detectionIntervalRef.current = setInterval(async () => {
      if (video.paused || video.ended || !detectorRef.current) return;
      
      const timestamp = performance.now();
      
      // Skip jika timestamp sama (hindari duplikasi)
      if (timestamp === lastTimestamp) return;
      lastTimestamp = timestamp;
      
      try {
        // Minta AI menganalisis frame video saat ini
        const detections = detectorRef.current.detectForVideo(video, timestamp);
        
        if (detections.detections.length > 0) {
          // Wajah ditemukan!
          consecutiveDetectionsRef.current++;
          
          // Butuh 3 deteksi berturut-turut untuk konfirmasi
          // Ini untuk menghindari "false positive" (salah deteksi)
          if (consecutiveDetectionsRef.current >= 3) {
            setFaceDetected(true);
            
            // Konversi ke format [x, y, w, h, confidence]
            const faceBox = convertToFaceBox(
              detections.detections[0],
              video.videoWidth,
              video.videoHeight
            );
            setCurrentFace(faceBox);
            
            // Log format sesuai permintaan Pak Eko
            console.log(`🎯 Wajah: [${faceBox.x}, ${faceBox.y}, ${faceBox.w}, ${faceBox.h}, ${faceBox.confidence}]`);
            
            // Cek gerakan kepala jika belum terverifikasi
            if (!headTurnDetected) {
              detectHeadTurn(faceBox);
            }
          }
        } else {
          // Tidak ada wajah - kurangi counter
          consecutiveDetectionsRef.current = Math.max(0, consecutiveDetectionsRef.current - 1);
          if (consecutiveDetectionsRef.current === 0) {
            setFaceDetected(false);
            setCurrentFace(null);
          }
        }
      } catch (err) {
        console.error('Error saat deteksi:', err);
      }
    }, 100);  // 100ms = 10 FPS deteksi
  }, [isModelLoaded, headTurnDetected, detectHeadTurn, convertToFaceBox]);

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * BERHENTI DETEKSI (Satpam istirahat)
   * ═══════════════════════════════════════════════════════════════════════
   */
  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsDetecting(false);
  }, []);

  /**
   * ═══════════════════════════════════════════════════════════════════════
   * RESET SEMUA STATUS (Mulai dari awal)
   * ═══════════════════════════════════════════════════════════════════════
   */
  const resetDetection = useCallback(() => {
    stopDetection();
    setFaceDetected(false);
    setHeadTurnDetected(false);
    setCurrentFace(null);
    headPositionsRef.current = [];
    consecutiveDetectionsRef.current = 0;
  }, [stopDetection]);

  // Cleanup saat komponen di-unmount
  useEffect(() => {
    return () => {
      stopDetection();
      // Bersihkan detector untuk membebaskan memori
      if (detectorRef.current) {
        detectorRef.current.close();
        detectorRef.current = null;
      }
    };
  }, [stopDetection]);

  return {
    isModelLoaded,
    isDetecting,
    faceDetected,
    headTurnDetected,
    currentFace,
    error,
    loadModels,
    startDetection,
    stopDetection,
    resetDetection,
  };
};
