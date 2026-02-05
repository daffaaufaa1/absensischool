 import { useEffect, useRef, useState, useCallback } from 'react';
 import * as faceapi from 'face-api.js';
 
 interface FaceDetectionResult {
   isModelLoaded: boolean;
   isDetecting: boolean;
   faceDetected: boolean;
   headTurnDetected: boolean;
   error: string | null;
   loadModels: () => Promise<void>;
   startDetection: (video: HTMLVideoElement) => void;
   stopDetection: () => void;
   resetDetection: () => void;
 }
 
 export const useFaceDetection = (): FaceDetectionResult => {
   const [isModelLoaded, setIsModelLoaded] = useState(false);
   const [isDetecting, setIsDetecting] = useState(false);
   const [faceDetected, setFaceDetected] = useState(false);
   const [headTurnDetected, setHeadTurnDetected] = useState(false);
   const [error, setError] = useState<string | null>(null);
   
   const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
   const headPositionsRef = useRef<number[]>([]);
   const consecutiveDetectionsRef = useRef(0);
 
   const loadModels = useCallback(async () => {
     try {
       setError(null);
       const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
       
       await Promise.all([
         faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
         faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
       ]);
       
       setIsModelLoaded(true);
     } catch (err) {
       console.error('Error loading face detection models:', err);
       setError('Gagal memuat model deteksi wajah');
       setIsModelLoaded(false);
     }
   }, []);
 
   const detectHeadTurn = useCallback((landmarks: faceapi.FaceLandmarks68) => {
     const nose = landmarks.getNose();
     const leftEye = landmarks.getLeftEye();
     const rightEye = landmarks.getRightEye();
     
     // Calculate horizontal position of nose relative to eyes
     const eyeCenter = (leftEye[0].x + rightEye[3].x) / 2;
     const noseX = nose[3].x;
     const offset = noseX - eyeCenter;
     
     headPositionsRef.current.push(offset);
     
     // Keep last 20 positions
     if (headPositionsRef.current.length > 20) {
       headPositionsRef.current.shift();
     }
     
     // Check for significant head movement (left-right turn)
     if (headPositionsRef.current.length >= 10) {
       const positions = headPositionsRef.current;
       const min = Math.min(...positions);
       const max = Math.max(...positions);
       const range = max - min;
       
       // If head moved significantly left and right
       if (range > 15) {
         setHeadTurnDetected(true);
         return true;
       }
     }
     
     return false;
   }, []);
 
   const startDetection = useCallback((video: HTMLVideoElement) => {
     if (!isModelLoaded) {
       setError('Model belum dimuat');
       return;
     }
     
     setIsDetecting(true);
     setFaceDetected(false);
     setHeadTurnDetected(false);
     headPositionsRef.current = [];
     consecutiveDetectionsRef.current = 0;
     
     const options = new faceapi.TinyFaceDetectorOptions({
       inputSize: 320,
       scoreThreshold: 0.5,
     });
     
     detectionIntervalRef.current = setInterval(async () => {
       if (video.paused || video.ended) return;
       
       try {
         const detection = await faceapi
           .detectSingleFace(video, options)
           .withFaceLandmarks(true);
         
         if (detection) {
           consecutiveDetectionsRef.current++;
           
           // Require 3 consecutive detections for stability
           if (consecutiveDetectionsRef.current >= 3) {
             setFaceDetected(true);
             
             // Only check head turn after face is confirmed
             if (!headTurnDetected) {
               detectHeadTurn(detection.landmarks);
             }
           }
         } else {
           consecutiveDetectionsRef.current = Math.max(0, consecutiveDetectionsRef.current - 1);
           if (consecutiveDetectionsRef.current === 0) {
             setFaceDetected(false);
           }
         }
       } catch (err) {
         console.error('Detection error:', err);
       }
     }, 150);
   }, [isModelLoaded, headTurnDetected, detectHeadTurn]);
 
   const stopDetection = useCallback(() => {
     if (detectionIntervalRef.current) {
       clearInterval(detectionIntervalRef.current);
       detectionIntervalRef.current = null;
     }
     setIsDetecting(false);
   }, []);
 
   const resetDetection = useCallback(() => {
     stopDetection();
     setFaceDetected(false);
     setHeadTurnDetected(false);
     headPositionsRef.current = [];
     consecutiveDetectionsRef.current = 0;
   }, [stopDetection]);
 
   useEffect(() => {
     return () => {
       stopDetection();
     };
   }, [stopDetection]);
 
   return {
     isModelLoaded,
     isDetecting,
     faceDetected,
     headTurnDetected,
     error,
     loadModels,
     startDetection,
     stopDetection,
     resetDetection,
   };
 };