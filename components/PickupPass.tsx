
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { User, Student } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getStudents } from '../services/storageService';
import { QrCode, Clock, ShieldCheck, UserCheck, Share } from 'lucide-react';

interface PickupPassProps {
  user: User;
}

const PickupPass: React.FC<PickupPassProps> = ({ user }) => {
  const { t } = useLanguage();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [children, setChildren] = useState<Student[]>([]);
  const [qrValue, setQrValue] = useState('');
  const [expiryTime, setExpiryTime] = useState<string>('');

  useEffect(() => {
    // 1. Find User's Children
    const allStudents = getStudents();
    let userChildren: Student[] = [];
    
    if (user.linkedStudentIds && user.linkedStudentIds.length > 0) {
        userChildren = allStudents.filter(s => user.linkedStudentIds?.includes(s.id));
    } else if (user.linkedStudentId) {
        const child = allStudents.find(s => s.id === user.linkedStudentId);
        if (child) userChildren = [child];
    }

    setChildren(userChildren);
    if (userChildren.length > 0) {
        setSelectedStudent(userChildren[0]);
    }
  }, [user]);

  // Generate Dynamic QR Code
  useEffect(() => {
    if (!selectedStudent) return;

    const generateCode = () => {
        const timestamp = Date.now();
        const data = {
            sid: selectedStudent.id,
            pid: user.id, // Parent ID
            ts: timestamp,
            nonce: Math.random().toString(36).substring(7) // Randomness to ensure uniqueness
        };
        setQrValue(JSON.stringify(data));
        
        const date = new Date();
        setExpiryTime(date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    };

    generateCode();
    // Refresh code every 5 minutes to prevent stale screenshots
    const interval = setInterval(generateCode, 5 * 60 * 1000); 

    return () => clearInterval(interval);
  }, [selectedStudent, user.id]);

  const shareQrCode = async () => {
    try {
        const svg = document.querySelector("#pickup-qr-wrapper svg") as SVGElement;
        if (!svg) return;

        // Convert SVG to XML string
        const xml = new XMLSerializer().serializeToString(svg);
        const svg64 = btoa(unescape(encodeURIComponent(xml)));
        const b64Start = 'data:image/svg+xml;base64,';
        const image64 = b64Start + svg64;

        // Draw to Canvas to convert to PNG
        const img = new Image();
        img.src = image64;
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            const padding = 40;
            const textHeight = 100;
            const targetSize = 600;
            
            canvas.width = targetSize; 
            canvas.height = targetSize + textHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw QR Code
            ctx.drawImage(img, padding, padding + 50, targetSize - (padding*2), targetSize - (padding*2));

            // Add Text (Child Name + Time) for context in the image itself
            ctx.font = 'bold 36px Arial';
            ctx.fillStyle = '#312e81'; // Indigo-900
            ctx.textAlign = 'center';
            ctx.fillText(selectedStudent?.name || '', canvas.width/2, 60);
            
            ctx.font = '24px Arial';
            ctx.fillStyle = '#6b7280'; // Gray-500
            ctx.fillText(`${t('validFor')}: ${expiryTime}`, canvas.width/2, canvas.height - 30);

            const dataUrl = canvas.toDataURL('image/png');
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], 'pickup-pass.png', { type: 'image/png' });

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: 'Golden Academy Pickup Pass',
                        text: `${t('pickupPass')} - ${selectedStudent?.name}`,
                        files: [file]
                    });
                } catch (shareError) {
                    console.log('Share canceled or failed', shareError);
                }
            } else {
                // Fallback download if Web Share API not supported
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `pickup-pass-${selectedStudent?.name}.png`;
                link.click();
                alert(t('sharingNotSupported'));
            }
        };
    } catch (e) {
        console.error(e);
        alert("Error generating image for sharing");
    }
  };

  if (children.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-3xl border border-gray-100">
              <UserCheck size={48} className="mb-4 opacity-20" />
              <p>{t('noChildRecord')}</p>
          </div>
      );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 animate-fade-in">
        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
                <QrCode className="text-indigo-600" />
                {t('pickupPass')}
            </h2>
            <p className="text-gray-500 mt-1">{t('digitalId')}</p>
        </div>

        {/* Child Selector (If multiple) */}
        {children.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 justify-center">
                {children.map(child => (
                    <button
                        key={child.id}
                        onClick={() => setSelectedStudent(child)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                            selectedStudent?.id === child.id 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                    >
                        {child.name}
                    </button>
                ))}
            </div>
        )}

        {/* The Card */}
        {selectedStudent && (
            <div className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-white overflow-hidden relative">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-20 pattern-dots"></div>
                    
                    <div className="w-24 h-24 mx-auto rounded-full border-4 border-white/30 shadow-lg mb-3 overflow-hidden bg-white">
                        <img src={selectedStudent.avatar} alt={selectedStudent.name} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-xl font-bold">{selectedStudent.name}</h3>
                    <p className="text-indigo-100 text-sm opacity-90">{selectedStudent.classGroup}</p>
                </div>

                {/* QR Section */}
                <div className="p-8 flex flex-col items-center justify-center bg-white">
                    <div className="p-4 bg-white rounded-3xl border-4 border-gray-100 shadow-inner" id="pickup-qr-wrapper">
                        <div style={{ height: "auto", margin: "0 auto", maxWidth: 200, width: "100%" }}>
                            <QRCode
                                size={256}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                value={qrValue}
                                viewBox={`0 0 256 256`}
                                fgColor="#312e81" // Indigo-900
                            />
                        </div>
                    </div>
                    
                    <div className="mt-6 text-center space-y-2">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-bold border border-green-100">
                            <ShieldCheck size={16} />
                            {t('authorizedPickup')}
                        </div>
                        <p className="text-gray-400 text-xs flex items-center justify-center gap-1">
                            <Clock size={12} />
                            {t('generatedAt')}: {expiryTime}
                        </p>
                    </div>

                    {/* Share Button */}
                    <button 
                        onClick={shareQrCode}
                        className="mt-6 w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors"
                    >
                        <Share size={18} />
                        {t('sharePass')}
                    </button>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">{t('sharePassDesc')}</p>
                </div>

                {/* Footer Security Strip */}
                <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                    <p className="text-xs text-gray-400 font-mono tracking-widest uppercase">
                        SECURE • VALID • {new Date().toLocaleDateString()}
                    </p>
                </div>
            </div>
        )}
    </div>
  );
};

export default PickupPass;
