
import React, { useState, useEffect } from 'react';
import { LogIn, Sun, Cloud, Star, Sparkles, UserCircle, KeyRound, LockKeyhole, ArrowLeft, ArrowRight, CheckCircle, Send, Fingerprint, ScanFace, X } from 'lucide-react';
import { getUsers, getMessages, saveMessages } from '../services/storageService';
import { User, ChatMessage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Forgot Password State
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverUsername, setRecoverUsername] = useState('');
  const [recoverSuccess, setRecoverSuccess] = useState(false);

  // Biometric State
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');

  const { t, dir, language } = useLanguage();

  useEffect(() => {
    // Check if we have a saved user for biometrics
    const storedUid = localStorage.getItem('biometric_uid');
    if (storedUid) {
      setIsBiometricAvailable(true);
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getUsers();
    
    // Normalize inputs: trim whitespace and lowercase username for case-insensitive check
    const normalizedInputUsername = username.trim().toLowerCase();
    const normalizedInputPassword = password.trim();

    const user = users.find(u => 
      u.username.trim().toLowerCase() === normalizedInputUsername && 
      u.password === normalizedInputPassword
    );
    
    if (user) {
      // Save user ID for Biometric quick login later
      localStorage.setItem('biometric_uid', user.id);
      onLogin(user);
    } else {
      setError(t('loginError'));
    }
  };

  const startBiometricScan = () => {
    setBiometricStatus('scanning');
    
    // Simulate Scan Delay
    setTimeout(() => {
        // Retrieve the last successfully logged in user ID
        const storedUid = localStorage.getItem('biometric_uid');
        
        if (storedUid) {
           const users = getUsers();
           const user = users.find(u => u.id === storedUid);
           if (user) {
             setBiometricStatus('success');
             setTimeout(() => {
                 onLogin(user);
             }, 800); // Wait a bit to show success state
           } else {
             setBiometricStatus('failed');
             setTimeout(() => setBiometricStatus('idle'), 2000);
           }
        } else {
           setBiometricStatus('failed');
           setTimeout(() => setBiometricStatus('idle'), 2000);
        }
    }, 1500);
  };

  const handleRecoverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!recoverUsername.trim()) return;

    const users = getUsers();
    const normalizedRecoverUsername = recoverUsername.trim().toLowerCase();
    
    // Find the user who lost their password
    const targetUser = users.find(u => u.username.toLowerCase() === normalizedRecoverUsername);
    
    if (!targetUser) {
        setError(t('userNotFound'));
        return;
    }

    // Find BOTH Admins (General Managers) AND Managers to send the notification to
    const recipients = users.filter(u => u.role === 'admin' || u.role === 'manager');
    
    if (recipients.length === 0) {
        setError("System Error: No Admin found to contact.");
        return;
    }

    const messages = getMessages();
    const newMessages: ChatMessage[] = [];
    const timestamp = new Date().toISOString();

    // Send a message to EACH recipient (Admin & Manager) from the user
    recipients.forEach(recipient => {
        newMessages.push({
            id: `sys-recover-${Date.now()}-${recipient.id}`,
            senderId: targetUser.id, // Comes "from" the user so admin sees who it is
            receiverId: recipient.id,
            content: `⚠️ *FORGOT PASSWORD ALERT* \n\nUser *${targetUser.name}* (Username: ${targetUser.username}) requested a password reset.\n\nRole: ${targetUser.role}\nPhone: ${targetUser.phone || 'N/A'}\n\nPlease reset their password and contact them via WhatsApp.`,
            timestamp: timestamp,
            isRead: false
        });
    });

    saveMessages([...messages, ...newMessages]);
    setRecoverSuccess(true);
  };

  const switchMode = () => {
      setIsRecovering(!isRecovering);
      setError('');
      setRecoverSuccess(false);
      setRecoverUsername('');
      setUsername('');
      setPassword('');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-sky-100 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
      
      {/* Playful Background Elements */}
      <div className="absolute top-10 left-10 text-yellow-400 animate-bounce delay-1000">
        <Sun size={64} fill="currentColor" className="opacity-80" />
      </div>
      <div className="absolute top-20 right-20 text-white animate-pulse">
        <Cloud size={80} fill="currentColor" className="opacity-60" />
      </div>
      <div className="absolute bottom-10 left-20 text-pink-400 animate-bounce">
        <Star size={48} fill="currentColor" className="opacity-70" />
      </div>
      <div className="absolute bottom-32 right-10 text-indigo-400 animate-pulse delay-700">
        <Cloud size={60} fill="currentColor" className="opacity-60" />
      </div>

      {/* Main Card */}
      <div className="bg-white/80 backdrop-blur-lg w-full max-w-md rounded-[2.5rem] shadow-2xl border-4 border-white relative z-10 overflow-hidden transform transition-all hover:scale-[1.01]">
        
        {/* Header Section */}
        <div className="bg-gradient-to-b from-indigo-500 to-purple-600 p-8 text-center relative overflow-hidden">
          {/* Decorative Circles in Header */}
          <div className="absolute top-[-50%] left-[-20%] w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-40 h-40 bg-yellow-300/20 rounded-full blur-xl"></div>

          <div className="flex justify-center mb-4 relative z-10">
            <div className="w-40 h-40 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center p-1">
               {/* Logo SVG */}
               <svg viewBox="0 0 500 500" className="w-full h-full">
                  <circle cx="250" cy="250" r="240" fill="#ffffff" stroke="#fcd34d" strokeWidth="15" />
                  <g transform="translate(120, 100) rotate(-15) scale(0.9)">
                     <ellipse cx="40" cy="30" rx="20" ry="26" fill="#9333ea" opacity="0.9" />
                     <ellipse cx="95" cy="10" rx="20" ry="26" fill="#7c3aed" opacity="0.9" />
                     <ellipse cx="150" cy="30" rx="20" ry="26" fill="#db2777" opacity="0.9" />
                     <path d="M 30 75 Q 95 150 160 75 Q 160 140 95 170 Q 30 140 30 75 Z" fill="#4f46e5" opacity="0.9" />
                  </g>
                  <g transform="translate(45, 290)">
                     <text x="0" y="0" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="120" fill="#7e22ce" stroke="#ffffff" strokeWidth="4">G</text>
                     <text x="85" y="0" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="120" fill="#f59e0b" stroke="#ffffff" strokeWidth="4">O</text>
                     <text x="175" y="0" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="120" fill="#ef4444" stroke="#ffffff" strokeWidth="4">L</text>
                     <text x="240" y="0" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="120" fill="#10b981" stroke="#ffffff" strokeWidth="4">D</text>
                     <text x="325" y="0" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="120" fill="#3b82f6" stroke="#ffffff" strokeWidth="4">E</text>
                     <text x="395" y="0" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="120" fill="#ec4899" stroke="#ffffff" strokeWidth="4">N</text>
                  </g>
               </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center justify-center gap-2">
            {t('welcome')}
            <Sparkles size={20} className="text-yellow-300 animate-spin-slow" />
          </h2>
          <p className="text-white text-sm font-bold mt-2 tracking-wide drop-shadow-md">Golden International Academy & Preschool</p>
        </div>

        {/* Content Section */}
        <div className="p-8 bg-white min-h-[350px]">
          
          {/* LOGIN FORM */}
          {!isRecovering && (
              <form onSubmit={handleLoginSubmit} className="space-y-5 animate-fade-in">
                <div className="space-y-2 group">
                  <label className="text-sm font-bold text-gray-500 ml-4">{t('username')}</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors">
                      <UserCircle size={24} />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-indigo-100 bg-indigo-50/50 focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium text-gray-700 placeholder-gray-400"
                      placeholder="Enter your username"
                    />
                  </div>
                </div>
                
                <div className="space-y-2 group">
                  <label className="text-sm font-bold text-gray-500 ml-4">{t('password')}</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 group-focus-within:text-pink-600 transition-colors">
                      <KeyRound size={24} />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-pink-100 bg-pink-50/50 focus:bg-white focus:border-pink-400 focus:ring-4 focus:ring-pink-100 outline-none transition-all font-medium text-gray-700 placeholder-••••••••"
                    />
                  </div>
                </div>

                <div className="text-end">
                    <button type="button" onClick={switchMode} className="text-sm text-indigo-500 font-bold hover:text-indigo-700">
                        {t('forgotPassword')}
                    </button>
                </div>

                {error && (
                  <div className="animate-fade-in text-center bg-red-50 text-red-500 text-sm font-bold py-3 px-4 rounded-2xl border-2 border-red-100 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white text-lg font-bold py-4 rounded-full shadow-lg shadow-orange-200 transform transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mt-4"
                >
                  <span>{t('loginButton')}</span>
                  <div className="bg-white/20 rounded-full p-1">
                    <LogIn size={20} />
                  </div>
                </button>

                {/* Biometric Button */}
                {isBiometricAvailable && (
                  <button
                    type="button"
                    onClick={() => { setShowBiometricModal(true); setBiometricStatus('idle'); }}
                    className="w-full bg-white border-2 border-slate-200 text-slate-600 font-bold py-3.5 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 mt-2 group relative overflow-hidden"
                  >
                     <Fingerprint size={24} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                     <span>{t('loginWithBiometrics')}</span>
                     <ScanFace size={20} className="text-pink-400 absolute right-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {isRecovering && (
              <form onSubmit={handleRecoverSubmit} className="space-y-5 animate-fade-in">
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                          <LockKeyhole size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800">{t('recoverAccount')}</h3>
                  </div>

                  {!recoverSuccess ? (
                      <>
                        <div className="space-y-2 group">
                            <label className="text-sm font-bold text-gray-500 ml-4">{t('enterUsernameRecover')}</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600 transition-colors">
                                <UserCircle size={24} />
                                </div>
                                <input
                                type="text"
                                value={recoverUsername}
                                onChange={(e) => setRecoverUsername(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-blue-100 bg-blue-50/50 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-gray-700"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="animate-fade-in text-center bg-red-50 text-red-500 text-sm font-bold py-3 px-4 rounded-2xl border-2 border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white text-lg font-bold py-4 rounded-full shadow-lg shadow-blue-200 transform transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mt-4"
                        >
                            <span>{t('sendRecoveryRequest')}</span>
                            <Send size={18} />
                        </button>
                      </>
                  ) : (
                      <div className="bg-green-50 border-2 border-green-100 p-6 rounded-3xl text-center space-y-4">
                          <CheckCircle size={48} className="text-green-500 mx-auto" />
                          <h4 className="text-lg font-bold text-green-700">{t('recoveryRequestSent')}</h4>
                          <p className="text-green-600 text-sm leading-relaxed font-medium">
                              {t('whatsappRecoveryMsg')}
                          </p>
                      </div>
                  )}

                  <button
                    type="button"
                    onClick={switchMode}
                    className="w-full py-3 text-gray-500 font-bold hover:text-indigo-600 flex items-center justify-center gap-2 transition-colors"
                  >
                    {language === 'ar' ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
                    {t('backToLogin')}
                  </button>
              </form>
          )}

          <div className="text-center pt-6">
             <p className="text-xs text-gray-400 font-medium">Powered by Mohamed Mahfouz</p>
             <p className="text-[10px] text-gray-300 mt-0.5">eMail: M.mahfouz1024@gmail.com</p>
             <p className="text-[10px] text-gray-300 mt-0.5">Phone: 01063743345</p>
             <p className="text-[10px] text-gray-300 mt-0.5">All rights reserved @ 2025</p>
             <p className="text-[10px] text-gray-300 mt-0.5">Version 1.00</p>
          </div>
        </div>
      </div>

      {/* BIOMETRIC SIMULATION MODAL */}
      {showBiometricModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm text-center relative shadow-2xl border-4 border-white">
                <button 
                    onClick={() => setShowBiometricModal(false)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                    <X size={20} />
                </button>

                <h3 className="text-xl font-bold text-gray-800 mb-6 mt-2">Authentication Required</h3>
                
                <div 
                    onClick={() => biometricStatus === 'idle' && startBiometricScan()}
                    className={`
                        w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 transition-all duration-300
                        ${biometricStatus === 'idle' ? 'bg-indigo-50 text-indigo-500 cursor-pointer hover:bg-indigo-100 hover:scale-105' : ''}
                        ${biometricStatus === 'scanning' ? 'bg-indigo-100 text-indigo-600 animate-pulse' : ''}
                        ${biometricStatus === 'success' ? 'bg-green-100 text-green-600 scale-110' : ''}
                        ${biometricStatus === 'failed' ? 'bg-red-100 text-red-600 shake' : ''}
                    `}
                >
                    {biometricStatus === 'success' ? (
                        <CheckCircle size={48} />
                    ) : (
                        <Fingerprint size={48} />
                    )}
                </div>

                <div className="h-8 mb-4">
                    {biometricStatus === 'idle' && <p className="text-gray-500 font-medium">Touch the sensor to verify</p>}
                    {biometricStatus === 'scanning' && <p className="text-indigo-600 font-bold">Scanning...</p>}
                    {biometricStatus === 'success' && <p className="text-green-600 font-bold">Identity Verified</p>}
                    {biometricStatus === 'failed' && <p className="text-red-600 font-bold">Not Recognized. Try Again.</p>}
                </div>

                {biometricStatus === 'idle' && (
                    <p className="text-xs text-gray-400">
                        (Simulated Web Demo: Click the fingerprint icon above)
                    </p>
                )}
            </div>
        </div>
      )}

    </div>
  );
};

export default Login;
