
import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ScanLine, CheckCircle, AlertTriangle, UserCheck, RefreshCw, Smartphone } from 'lucide-react';
import { getStudents, saveAttendanceHistory, getAttendanceHistory } from '../services/storageService';
import { Student } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const GateScanner: React.FC = () => {
  const { t } = useLanguage();
  const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  // We don't strictly need a ref for the scanner instance with the cleanup pattern below, 
  // but it helps if we want to call methods on it elsewhere.
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Load students for verification
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    setStudents(getStudents());
  }, []);

  useEffect(() => {
    // 1. Only initialize if we are in 'idle' mode
    if (scanStatus !== 'idle') return;

    const scannerId = "reader";
    let scanner: Html5QrcodeScanner | null = null;

    // 2. Use a small timeout to ensure the DOM element with id="reader" is actually rendered
    const timerId = setTimeout(() => {
        const element = document.getElementById(scannerId);
        if (!element) return;

        // Configuration
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
            rememberLastUsedCamera: true,
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true
        };
        
        // Initialize
        try {
            scanner = new Html5QrcodeScanner(scannerId, config, false);
            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;
        } catch (err) {
            console.error("Error starting scanner:", err);
        }
    }, 100);

    // 3. Cleanup function: Critical for React strict mode / re-renders
    return () => {
        clearTimeout(timerId);
        if (scanner) {
            scanner.clear().catch(error => console.warn("Failed to clear scanner", error));
            scannerRef.current = null;
        }
    };
  }, [scanStatus]);

  const processScanData = (decodedText: string) => {
      try {
          const data = JSON.parse(decodedText);
          // Expected Format: { sid: "student_id", pid: "parent_id", ts: timestamp, nonce: "..." }
          
          if (!data.sid) throw new Error("Invalid QR Code");

          // Find Student
          const student = students.find(s => s.id === data.sid);
          
          if (student) {
              setScannedStudent(student);
              setScanStatus('success');
              
              // --- AUTO CHECKOUT / CHECKIN LOGIC ---
              const today = new Date().toISOString().split('T')[0];
              const history = getAttendanceHistory();
              
              if (!history[today]) {
                  history[today] = {};
              }
              
              // Mark student as present if scanned
              history[today][student.id] = 'present';
              saveAttendanceHistory(history);
              
              // Play Success Sound
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.play().catch(e => console.log("Audio play error", e));

          } else {
              throw new Error("Student Not Found");
          }

      } catch (e) {
          console.error(e);
          setScanStatus('error');
          setErrorMsg(t('unauthorized'));
          setTimeout(() => setScanStatus('idle'), 3000); // Reset after 3s
      }
  };

  const onScanSuccess = (decodedText: string) => {
      // Stop scanner temporarily by changing state, which triggers cleanup
      setScanStatus('processing' as any); 
      processScanData(decodedText);
  };

  const onScanFailure = (_error: any) => {
      // console.warn(`Code scan error = ${_error}`);
  };

  const resetScanner = () => {
      setScanStatus('idle');
      setScannedStudent(null);
  };

  // --- SIMULATION FOR WEB/DEMO ---
  const simulateScan = () => {
      if (students.length > 0) {
          // Pick random student
          const randomStudent = students[Math.floor(Math.random() * students.length)];
          const mockQr = JSON.stringify({ sid: randomStudent.id, pid: "simulated", ts: Date.now() });
          // Manually trigger success flow
          setScanStatus('processing' as any);
          processScanData(mockQr);
      } else {
          alert("No students to simulate.");
      }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in pb-20">
        
        {/* Header */}
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <ScanLine className="text-indigo-600" />
                    {t('gateScanner')}
                </h2>
                <p className="text-gray-500 text-sm">{t('scanToVerify')}</p>
            </div>
            
            {/* Simulation Button (Visible for Demo) */}
            <button 
                onClick={simulateScan}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 flex items-center gap-1"
                title={t('simulateScan')}
            >
                <Smartphone size={14} /> Simulate
            </button>
        </div>

        {/* Scanner Area */}
        <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl aspect-square border-4 border-gray-800">
            
            {scanStatus === 'idle' && (
                <>
                    {/* 
                       Removed 'object-cover' and 'h-full' from the reader div. 
                       The library creates its own video element inside. 
                       Adding conflicting CSS often hides the video.
                    */}
                    <div id="reader" style={{ width: '100%', height: '100%' }}></div>
                    
                    <p className="absolute bottom-6 left-0 right-0 text-center text-white/80 text-sm font-medium bg-black/40 py-2 backdrop-blur-sm pointer-events-none z-10">
                        {t('scannerInstruction')}
                    </p>
                </>
            )}

            {scanStatus === 'success' && scannedStudent && (
                <div className="absolute inset-0 bg-green-500 flex flex-col items-center justify-center text-white p-6 animate-fade-in">
                    <div className="bg-white p-2 rounded-full mb-6 shadow-xl">
                        <CheckCircle size={64} className="text-green-500" />
                    </div>
                    <div className="bg-white/20 backdrop-blur-md rounded-2xl p-2 mb-4 w-32 h-32 border-4 border-white/50 shadow-inner">
                        <img src={scannedStudent.avatar} alt="Student" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <h2 className="text-3xl font-bold text-center mb-1">{scannedStudent.name}</h2>
                    <p className="text-green-100 text-lg font-medium mb-8">{scannedStudent.classGroup}</p>
                    
                    <div className="bg-white/20 rounded-xl p-4 w-full text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <UserCheck size={20} />
                            <span className="font-bold uppercase tracking-wider text-sm">{t('authorizedPickup')}</span>
                        </div>
                        <p className="text-sm font-medium opacity-90">{scannedStudent.parentName}</p>
                    </div>
                </div>
            )}

            {scanStatus === 'error' && (
                <div className="absolute inset-0 bg-red-500 flex flex-col items-center justify-center text-white p-6 animate-shake">
                    <div className="bg-white p-4 rounded-full mb-6 shadow-xl">
                        <AlertTriangle size={64} className="text-red-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-center mb-2">{t('accessDenied')}</h2>
                    <p className="text-red-100 text-lg text-center font-medium">{errorMsg}</p>
                </div>
            )}
        </div>

        {/* Actions */}
        {scanStatus !== 'idle' && (
            <button 
                onClick={resetScanner}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
                <RefreshCw size={20} />
                {t('back')} / Scan Next
            </button>
        )}

    </div>
  );
};

export default GateScanner;
