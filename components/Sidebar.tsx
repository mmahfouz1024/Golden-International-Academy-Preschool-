
import React, { useState } from 'react';
import { LayoutDashboard, Users, CalendarCheck, Sparkles, LogOut, Home, Download, UserCog, School, ChevronRight, Contact, FileClock, Palette, Database, FileText, GraduationCap, CalendarDays } from 'lucide-react';
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
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const allMenuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, defaultRoles: ['admin', 'manager', 'teacher', 'parent'] },
    { id: 'daily-report', label: t('dailyReportMenu'), icon: FileText, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'students', label: t('students'), icon: Users, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'teachers', label: t('teachers'), icon: GraduationCap, defaultRoles: ['admin', 'manager'] },
    { id: 'attendance', label: t('attendance'), icon: CalendarCheck, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'reports-archive', label: t('reportsArchive'), icon: FileClock, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'directory', label: t('directoryTitle'), icon: Contact, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'ai-planner', label: t('aiPlanner'), icon: Sparkles, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'classes', label: t('classes'), icon: School, defaultRoles: ['admin', 'manager'] },
    { id: 'schedule-manage', label: t('dailyScheduleManage'), icon: CalendarDays, defaultRoles: ['admin', 'manager'] },
    { id: 'users', label: t('users'), icon: UserCog, defaultRoles: ['admin', 'manager'] },
    { id: 'database', label: t('database'), icon: Database, defaultRoles: ['admin', 'manager'] },
    { id: 'parent-view', label: t('myChild'), icon: Home, defaultRoles: ['parent'] },
  ];

  const hasPermission = (item: any) => {
    if (!user) return false;
    
    // Admin always sees everything (except parent view usually)
    if (user.role === 'admin' && item.id !== 'parent-view') return true;

    // Parent Logic
    if (user.role === 'parent') {
      if (item.id === 'parent-view' || item.id === 'dashboard') return true;
      // If explicit permissions exist for the user, use them
      if (user.permissions && user.permissions.includes(item.id)) return true;
      return false;
    }

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
          className="fixed inset-0 bg-black/50 z-20 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72
        bg-white/80 backdrop-blur-xl border-r-4 border-white shadow-2xl
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Header - Matching Login Page Design */}
        <div className="relative bg-gradient-to-b from-indigo-500 to-purple-600 pb-8 pt-6 px-4 rounded-b-[2rem] shadow-lg mb-2 overflow-hidden shrink-0">
          
          {/* Decorative Circles */}
          <div className="absolute top-[-20%] left-[-20%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-[0%] right-[-10%] w-24 h-24 bg-yellow-300/20 rounded-full blur-xl"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center p-0.5 mb-3">
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
            <h1 className="text-white font-display font-bold text-base text-center leading-tight px-2">Golden International Academy & Preschool</h1>
            <p className="text-indigo-100 text-xs opacity-90 mt-1">Smart System</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto custom-scrollbar">
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
                  w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm
                  ${isActive 
                    ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-lg shadow-orange-200 transform scale-[1.02]' 
                    : 'bg-white/50 text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-md border border-transparent hover:border-indigo-100'}
                `}
              >
                <div className={`${isActive ? 'bg-white/20' : 'bg-gray-100'} p-1.5 rounded-lg`}>
                   <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="my-4 border-t border-gray-100 pt-4 space-y-2">
            <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-md border border-transparent"
            >
                <div className="bg-white/50 p-1.5 rounded-lg">
                    <LogOut size={18} className="text-red-500" />
                </div>
                <span>{t('logout')}</span>
            </button>
          </div>

          {showInstallButton && (
            <button
              onClick={onInstall}
              className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-200 text-indigo-600 bg-white border-2 border-indigo-100 hover:bg-indigo-50 mt-4 font-bold shadow-sm"
            >
              <div className="bg-indigo-100 p-1.5 rounded-lg">
                <Download size={18} />
              </div>
              <span>{t('installApp')}</span>
            </button>
          )}

          <div className="pt-2 mt-2">
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-200 text-gray-600 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 justify-between group bg-white/30"
            >
              <div className="flex items-center gap-3">
                <Palette size={18} className="text-gray-400 group-hover:text-indigo-500" />
                <span className="font-medium">{t('colorPalette')}</span>
              </div>
              {isThemeMenuOpen ? (
                 <ChevronRight size={16} className="rotate-90 text-gray-400" />
              ) : (
                 <ChevronRight size={16} className="text-gray-400" />
              )}
            </button>

            {isThemeMenuOpen && (
              <div className="mt-2 p-2 space-y-1 bg-white rounded-2xl shadow-lg border-2 border-indigo-50 animate-fade-in">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                      theme === t.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full shadow-sm border border-gray-100" style={{ backgroundColor: t.color }}></span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 mt-auto">
          <div className="bg-white p-3 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3">
            <button 
              onClick={() => setCurrentView('profile')}
              className="flex-1 flex items-center gap-3 group"
            >
              <div className="relative">
                 <img src={user?.avatar || "https://picsum.photos/seed/user/40/40"} alt="User" className="w-10 h-10 rounded-full border-2 border-indigo-100 group-hover:border-indigo-300 transition-colors" />
                 <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0 text-start">
                <p className="text-sm font-bold text-gray-800 truncate group-hover:text-indigo-600 transition-colors">{user?.name}</p>
                <p className="text-[10px] text-gray-500 truncate uppercase tracking-wider font-bold">{getRoleLabel(user?.role)}</p>
              </div>
            </button>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              title={t('logout')}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
    