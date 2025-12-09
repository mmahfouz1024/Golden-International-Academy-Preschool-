

import React, { useState } from 'react';
import { LayoutDashboard, Users, CalendarCheck, Sparkles, LogOut, Home, Download, Languages, UserCog, School, ChevronRight, ChevronLeft, Contact, FileClock, Palette, Database } from 'lucide-react';
import { User, Theme } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  user: User | null;
  onLogout: () => void;
  showInstallButton: boolean;
  onInstall: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setCurrentView, 
  isMobileOpen, 
  setIsMobileOpen, 
  user, 
  onLogout,
  showInstallButton,
  onInstall
}) => {
  const { t, toggleLanguage, language } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const allMenuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'students', label: t('students'), icon: Users, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'attendance', label: t('attendance'), icon: CalendarCheck, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'reports-archive', label: t('reportsArchive'), icon: FileClock, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'directory', label: t('directoryTitle'), icon: Contact, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'ai-planner', label: t('aiPlanner'), icon: Sparkles, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'classes', label: t('classes'), icon: School, defaultRoles: ['admin', 'manager'] },
    { id: 'users', label: t('users'), icon: UserCog, defaultRoles: ['admin'] },
    { id: 'database', label: t('database'), icon: Database, defaultRoles: ['admin', 'manager'] },
    { id: 'parent-view', label: t('myChild'), icon: Home, defaultRoles: ['parent'] },
  ];

  const hasPermission = (item: any) => {
    if (!user) return false;
    
    // Admin always sees everything (except parent view usually)
    if (user.role === 'admin' && item.id !== 'parent-view') return true;

    // Parent always sees parent view
    if (user.role === 'parent' && item.id === 'parent-view') return true;
    if (user.role === 'parent') return false;

    // If explicit permissions exist for the user, use them
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions.includes(item.id);
    }

    // Fallback to default role-based permissions
    return item.defaultRoles.includes(user.role);
  };

  const menuItems = allMenuItems.filter(item => hasPermission(item));

  const getRoleLabel = (role?: string) => {
    if (role === 'admin') return t('roleAdmin');
    if (role === 'manager') return t('roleManager');
    if (role === 'teacher') return t('roleTeacher');
    return t('roleParent');
  };

  const themes: { id: Theme; label: string; color: string }[] = [
    { id: 'smart', label: t('themeSmart'), color: '#4f46e5' },
    { id: 'blossom', label: t('themeBlossom'), color: '#db2777' },
    { id: 'garden', label: t('themeGarden'), color: '#16a34a' },
    { id: 'sunshine', label: t('themeSunshine'), color: '#d97706' },
  ];

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 ${language === 'ar' ? 'right-0' : 'left-0'} z-30 w-64 bg-white border-l border-r border-gray-100 shadow-lg md:shadow-none transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0')}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-center border-b border-gray-50 bg-indigo-50/20">
            <div className="w-40 h-40">
              <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-sm">
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

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-gray-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {showInstallButton && (
              <button
                onClick={onInstall}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 mt-4"
              >
                <Download size={20} />
                <span>{t('installApp')}</span>
              </button>
            )}

            <div className="pt-2 mt-2 border-t border-gray-100 space-y-2">
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-600 hover:bg-gray-50"
              >
                <Languages size={20} className="text-gray-400" />
                <span>{language === 'ar' ? 'English' : 'العربية'}</span>
              </button>

              <button
                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-600 hover:bg-gray-50 justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Palette size={20} className="text-gray-400 group-hover:text-indigo-500" />
                  <span>{t('colorPalette')}</span>
                </div>
                {isThemeMenuOpen ? (
                   language === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} className="rotate-90" />
                ) : (
                   language === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />
                )}
              </button>

              {isThemeMenuOpen && (
                <div className="px-4 py-2 space-y-1 bg-gray-50/50 rounded-xl mx-2 animate-fade-in">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        theme === t.id ? 'bg-white shadow-sm text-gray-800 font-medium' : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }}></span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="p-4 border-t border-gray-50">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentView('profile')}
                className={`flex-1 flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors ${currentView === 'profile' ? 'bg-indigo-50' : ''}`}
              >
                <img src={user?.avatar || "https://picsum.photos/seed/user/40/40"} alt="User" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                <div className="flex-1 min-w-0 text-start">
                  <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{getRoleLabel(user?.role)}</p>
                </div>
                <div className="text-gray-300">
                  {language === 'ar' ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </div>
              </button>
              <button 
                onClick={onLogout}
                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                title={t('logout')}
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;