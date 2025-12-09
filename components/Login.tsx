
import React, { useState } from 'react';
import { LogIn, Languages } from 'lucide-react';
import { getUsers } from '../services/storageService';
import { User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { t, language, toggleLanguage, dir } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Get latest users from storage
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      onLogin(user);
    } else {
      setError(t('loginError'));
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative z-10 ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
      
      <button 
        onClick={toggleLanguage}
        className="absolute top-6 right-6 flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-sm text-gray-600 hover:text-indigo-600 hover:shadow-md transition-all font-medium z-10"
      >
        <Languages size={20} />
        <span>{language === 'ar' ? 'English' : 'العربية'}</span>
      </button>

      <div className="bg-white/90 backdrop-blur-md w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative border border-white/50">
        <div className="p-8 bg-indigo-600/90 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-48 h-48 rounded-full border-4 border-white/20 shadow-2xl bg-white flex items-center justify-center p-1 overflow-hidden">
               <svg viewBox="0 0 500 500" className="w-full h-full">
                  {/* Background Circle */}
                  <circle cx="250" cy="250" r="240" fill="#ffffff" stroke="#fcd34d" strokeWidth="15" />
                  
                  {/* Paw Print Graphic */}
                  <g transform="translate(120, 100) rotate(-15) scale(0.9)">
                     <ellipse cx="40" cy="30" rx="20" ry="26" fill="#9333ea" opacity="0.9" />
                     <ellipse cx="95" cy="10" rx="20" ry="26" fill="#7c3aed" opacity="0.9" />
                     <ellipse cx="150" cy="30" rx="20" ry="26" fill="#db2777" opacity="0.9" />
                     <path d="M 30 75 Q 95 150 160 75 Q 160 140 95 170 Q 30 140 30 75 Z" fill="#4f46e5" opacity="0.9" />
                  </g>

                  {/* Text: GOLDEN - Colorful Letters */}
                  <g transform="translate(45, 290)">
                     <text x="0" y="0" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="120" fill="#7e22ce" stroke="#ffffff" strokeWidth="4" style={{ filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>G</text>
                     <text x="85" y="0" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="120" fill="#f59e0b" stroke="#ffffff" strokeWidth="4" style={{ filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>O</text>
                     <text x="175" y="0" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="120" fill="#ef4444" stroke="#ffffff" strokeWidth="4" style={{ filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>L</text>
                     <text x="240" y="0" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="120" fill="#10b981" stroke="#ffffff" strokeWidth="4" style={{ filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>D</text>
                     <text x="325" y="0" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="120" fill="#3b82f6" stroke="#ffffff" strokeWidth="4" style={{ filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>E</text>
                     <text x="395" y="0" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="120" fill="#ec4899" stroke="#ffffff" strokeWidth="4" style={{ filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.1))' }}>N</text>
                  </g>

                  {/* Subtitle */}
                  <text x="250" y="380" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="26" fill="#4b5563">
                    International Academy
                  </text>
                  <text x="250" y="415" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="24" fill="#6b7280">
                    & Preschool
                  </text>
               </svg>
            </div>
          </div>
          <p className="text-indigo-100 text-lg font-medium">{t('loginTitle')}</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('username')}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder=""
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="********"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              {t('loginButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
