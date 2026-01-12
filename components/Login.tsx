
import React, { useState } from 'react';
import { LogIn, Sun, Cloud, Star, Sparkles, UserCircle, KeyRound, LockKeyhole, ArrowLeft, ArrowRight, CheckCircle, Send, PlayCircle, Baby } from 'lucide-react';
import { getUsers, saveUsers, getMessages, saveMessages, recordLoginLog, getStudents, saveStudents } from '../services/storageService';
import { User, ChatMessage, Student, StudentStatus } from '../types';
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

  const { t, dir, language } = useLanguage();

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
      recordLoginLog(user);
      onLogin(user);
    } else {
      setError(t('loginError'));
    }
  };

  const handleDemoLogin = () => {
    const demoUser: User = {
        id: 'demo-admin-user',
        username: 'demo',
        name: language === 'ar' ? 'مدير تجريبي' : 'Demo Admin',
        role: 'admin', // Full access
        password: 'demo',
        avatar: 'https://ui-avatars.com/api/?name=Demo+Admin&background=f59e0b&color=fff',
        permissions: ['dashboard', 'students', 'attendance', 'reports-archive', 'directory', 'ai-planner', 'classes', 'users', 'database', 'teachers', 'schedule-manage', 'daily-report', 'fees-management', 'gallery', 'focus-mode', 'gate-scanner'],
        phone: '0000000000'
    };

    // Ensure demo user exists in storage for consistency (so lookups don't fail)
    const currentUsers = getUsers();
    if (!currentUsers.find(u => u.id === demoUser.id)) {
        saveUsers([...currentUsers, demoUser]);
    }

    recordLoginLog(demoUser);
    onLogin(demoUser);
  };

  const handleDemoParentLogin = () => {
    // 1. Create Demo Student first so the parent has someone to view
    const demoStudentId = 'demo-child-1';
    const demoStudent: Student = {
        id: demoStudentId,
        name: language === 'ar' ? 'طفل تجريبي' : 'Demo Child',
        age: 4,
        classGroup: 'Birds',
        parentName: language === 'ar' ? 'ولي أمر تجريبي' : 'Demo Parent',
        phone: '0100000000',
        status: StudentStatus.Active,
        attendanceToday: false,
        avatar: 'https://ui-avatars.com/api/?name=Demo+Child&background=random'
    };

    const currentStudents = getStudents();
    if (!currentStudents.find(s => s.id === demoStudentId)) {
        saveStudents([...currentStudents, demoStudent]);
    }

    // 2. Create Demo Parent User
    const demoParent: User = {
        id: 'demo-parent-user',
        username: 'demo_parent',
        name: language === 'ar' ? 'ولي أمر تجريبي' : 'Demo Parent',
        role: 'parent',
        password: 'demo',
        avatar: 'https://ui-avatars.com/api/?name=Demo+Parent&background=0ea5e9&color=fff',
        permissions: ['parent-view', 'gallery'],
        phone: '0100000000',
        linkedStudentId: demoStudentId,
        linkedStudentIds: [demoStudentId]
    };

    const currentUsers = getUsers();
    if (!currentUsers.find(u => u.id === demoParent.id)) {
        saveUsers([...currentUsers, demoParent]);
    }

    recordLoginLog(demoParent);
    onLogin(demoParent);
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

    const recipients = users.filter(u => u.role === 'admin' || u.role === 'manager');
    
    if (recipients.length === 0) {
        setError("System Error: No Admin found to contact.");
        return;
    }

    const messages = getMessages();
    const newMessages: ChatMessage[] = [];
    const timestamp = new Date().toISOString();

    recipients.forEach(recipient => {
        newMessages.push({
            id: `sys-recover-${Date.now()}-${recipient.id}`,
            senderId: targetUser.id, 
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
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-indigo-50 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
      
      {/* Playful Background Elements */}
      <div className="absolute top-10 left-10 text-gold-400 animate-bounce delay-1000">
        <Sun size={64} fill="currentColor" className="opacity-80" />
      </div>
      <div className="absolute top-20 right-20 text-indigo-300 animate-pulse">
        <Cloud size={80} fill="currentColor" className="opacity-60" />
      </div>
      <div className="absolute bottom-10 left-20 text-purple-400 animate-bounce">
        <Star size={48} fill="currentColor" className="opacity-70" />
      </div>
      <div className="absolute bottom-32 right-10 text-gold-300 animate-pulse delay-700">
        <Cloud size={60} fill="currentColor" className="opacity-60" />
      </div>

      {/* Main Card */}
      <div className="bg-white/80 backdrop-blur-lg w-full max-w-md rounded-[2.5rem] shadow-2xl border-4 border-white relative z-10 overflow-hidden transform transition-all hover:scale-[1.01]">
        
        {/* Header Section */}
        <div className="bg-gradient-to-b from-indigo-700 to-indigo-900 p-8 text-center relative overflow-hidden">
          {/* Decorative Circles in Header */}
          <div className="absolute top-[-50%] left-[-20%] w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-[-20%] right-[-20%] w-40 h-40 bg-gold-400/20 rounded-full blur-xl"></div>

          <div className="flex justify-center mb-4 relative z-10">
            {/* Logo Container */}
            <div className="w-36 h-36 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center overflow-hidden">
               <svg viewBox="0 0 500 500" className="w-full h-full">
                  <circle cx="250" cy="250" r="245" fill="white" stroke="#333" strokeWidth="2" />
                  
                  {/* Thick Split Ring */}
                  <path d="M 30,250 A 220,220 0 0 1 470,250" fill="none" stroke="#9333ea" strokeWidth="40" />
                  <path d="M 30,250 A 220,220 0 0 0 470,250" fill="none" stroke="#f59e0b" strokeWidth="40" />
                  
                  {/* Inner Divider */}
                  <circle cx="250" cy="250" r="200" fill="white" stroke="#333" strokeWidth="2" />
                  
                  {/* Center Content Group */}
                  <g transform="translate(0, -25)">
                      {/* Globe */}
                      <path d="M 170,200 Q 250,130 330,200" fill="none" stroke="#f59e0b" strokeWidth="8" />
                      <path d="M 170,200 Q 250,270 330,200" fill="none" stroke="#f59e0b" strokeWidth="8" />
                      <line x1="250" y1="130" x2="250" y2="270" stroke="#f59e0b" strokeWidth="8" />
                      <line x1="150" y1="200" x2="350" y2="200" stroke="#f59e0b" strokeWidth="8" />
                      <path d="M 170,200 A 80,80 0 0 1 330,200" fill="none" stroke="#f59e0b" strokeWidth="8" />
                      
                      {/* Cap */}
                      <path d="M 200,120 L 250,90 L 300,120 L 250,150 Z" fill="#3b82f6" stroke="#1e40af" strokeWidth="5" strokeLinejoin="round" />
                      <line x1="300" y1="120" x2="300" y2="160" stroke="#1e40af" strokeWidth="4" />
                      
                      {/* Book */}
                      <path d="M 150,260 Q 250,310 350,260" fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
                      <path d="M 150,280 Q 250,330 350,280" fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
                      <line x1="250" y1="260" x2="250" y2="310" stroke="#3b82f6" strokeWidth="8" />
                  </g>

                  {/* Text */}
                  <text x="250" y="360" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="42" fill="#0f172a">Planet of Science</text>
                  <text x="250" y="410" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="32" fill="#334155">nersuye</text>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center justify-center gap-2">
            {t('welcome')}
            <Sparkles size={20} className="text-gold-300 animate-spin-slow" />
          </h2>
          <p className="text-indigo-200 text-sm font-bold mt-1 tracking-wide">Planet of Science</p>
        </div>

        {/* Content Section */}
        <div className="p-8 bg-white min-h-[350px]">
          
          {/* LOGIN FORM */}
          {!isRecovering && (
              <div className="space-y-5 animate-fade-in">
                <form onSubmit={handleLoginSubmit} className="space-y-5">
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
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-400 group-focus-within:text-gold-600 transition-colors">
                        <KeyRound size={24} />
                        </div>
                        <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-gold-100 bg-gold-50/50 focus:bg-white focus:border-gold-400 focus:ring-4 focus:ring-gold-100 outline-none transition-all font-medium text-gray-700 placeholder-••••••••"
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
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white text-lg font-bold py-4 rounded-full shadow-lg shadow-indigo-200 transform transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mt-4"
                    >
                    <span>{t('loginButton')}</span>
                    <div className="bg-white/20 rounded-full p-1">
                        <LogIn size={20} />
                    </div>
                    </button>
                </form>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">Or try for free</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={handleDemoLogin}
                        className="w-full bg-white border-2 border-gold-400 text-gold-600 hover:bg-gold-50 text-base font-bold py-3 rounded-full shadow-sm transform transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
                    >
                        <PlayCircle size={20} />
                        <span>{language === 'ar' ? 'دخول تجريبي (مدير)' : 'Trial Mode (Admin)'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleDemoParentLogin}
                        className="w-full bg-white border-2 border-indigo-400 text-indigo-600 hover:bg-indigo-50 text-base font-bold py-3 rounded-full shadow-sm transform transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Baby size={20} />
                        <span>{language === 'ar' ? 'دخول تجريبي (ولي أمر)' : 'Trial Mode (Parent)'}</span>
                    </button>
                </div>
              </div>
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

          <div className="text-center pt-6 mt-4 border-t border-gray-100">
             <p className="text-xs text-gray-500 font-bold mb-1">Powered by Mohamed Mahfouz</p>
             <p className="text-[10px] text-gray-400 mt-0.5 font-mono" dir="ltr">eMail: M.mahfouz1024@gmail.com</p>
             <p className="text-[10px] text-gray-400 mt-0.5 font-mono" dir="ltr">Phone: 01063743345</p>
             <p className="text-[10px] text-gray-300 mt-2">All rights reserved @ 2025</p>
             <p className="text-[10px] text-gray-300">Version 1.00</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;