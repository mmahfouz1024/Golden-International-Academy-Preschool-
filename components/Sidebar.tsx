
import React, { useState } from 'react';
import { LayoutDashboard, Users, CalendarCheck, Sparkles, LogOut, Home, Download, UserCog, School, ChevronRight, Contact, FileClock, Palette, Database, FileText, GraduationCap, CalendarDays, Wallet, Image as ImageIcon, Zap, Moon, Sun, QrCode, ScanLine, History, Banknote } from 'lucide-react';
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
  const { theme, setTheme, isDarkMode, toggleDarkMode } = useTheme();
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const allMenuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, defaultRoles: ['admin', 'manager', 'teacher', 'parent'] },
    { id: 'focus-mode', label: t('focusMode'), icon: Zap, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'gate-scanner', label: t('gateScanner'), icon: ScanLine, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'pickup-pass', label: t('pickupPass'), icon: QrCode, defaultRoles: ['parent'] },
    { id: 'daily-report', label: t('dailyReportMenu'), icon: FileText, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'students', label: t('students'), icon: Users, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'gallery', label: t('gallery'), icon: ImageIcon, defaultRoles: ['admin', 'manager', 'teacher', 'parent'] },
    { id: 'fees-management', label: t('feesManagement'), icon: Wallet, defaultRoles: ['admin', 'manager'] },
    { id: 'staff-affairs', label: t('staffAffairs'), icon: Banknote, defaultRoles: ['admin', 'manager'] },
    { id: 'teachers', label: t('teachers'), icon: GraduationCap, defaultRoles: ['admin', 'manager'] },
    { id: 'attendance', label: t('attendance'), icon: CalendarCheck, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'reports-archive', label: t('reportsArchive'), icon: FileClock, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'directory', label: t('directoryTitle'), icon: Contact, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'ai-planner', label: t('aiPlanner'), icon: Sparkles, defaultRoles: ['admin', 'manager', 'teacher'] },
    { id: 'login-history', label: t('loginHistory'), icon: History, defaultRoles: ['admin', 'manager'] },
    { id: 'classes', label: t('classes'), icon: School, defaultRoles: ['admin', 'manager'] },
    { id: 'schedule-manage', label: t('dailyScheduleManage'), icon: CalendarDays, defaultRoles: ['admin', 'manager'] },
    { id: 'users', label: t('users'), icon: UserCog, defaultRoles: ['admin', 'manager'] },
    { id: 'database', label: t('database'), icon: Database, defaultRoles: ['admin', 'manager'] },
    { id: 'parent-view', label: t('myChild'), icon: Home, defaultRoles: ['parent'] },
  ];

  const hasPermission = (item: any) => {
    if (!user) return false;
    if (user.role === 'admin' && item.id !== 'parent-view' && item.id !== 'pickup-pass') return true;
    if (user.role === 'parent') {
      if (item.id === 'parent-view' || item.id === 'dashboard' || item.id === 'gallery' || item.id === 'pickup-pass') return true;
      if (user.permissions && user.permissions.includes(item.id)) return true;
      return false;
    }
    if (user.permissions && user.permissions.length > 0) {
      return user.permissions.includes(item.id);
    }
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
    { id: 'smart', label: t('themeSmart'), color: '#7c3aed' },
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
        bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-r-4 border-white dark:border-gray-800 shadow-2xl
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Header - Matching Circular Logo Design */}
        <div className="relative bg-gradient-to-br from-indigo-800 to-indigo-600 pb-8 pt-6 px-4 rounded-b-[2.5rem] shadow-lg mb-2 overflow-hidden shrink-0">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold-400/20 rounded-full blur-2xl transform -translate-x-5 translate-y-5"></div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Exact Vector Replica of the Provided Logo Image */}
            <div className="w-28 h-28 rounded-full shadow-2xl bg-white flex items-center justify-center overflow-hidden mb-3">
              <svg viewBox="0 0 500 500" className="w-full h-full">
                  {/* Outer Border */}
                  <circle cx="250" cy="250" r="245" fill="white" stroke="#333" strokeWidth="2" />
                  
                  {/* Thick Split Ring */}
                  <path d="M 30,250 A 220,220 0 0 1 470,250" fill="none" stroke="#9333ea" strokeWidth="40" />
                  <path d="M 30,250 A 220,220 0 0 0 470,250" fill="none" stroke="#f59e0b" strokeWidth="40" />
                  
                  {/* Inner Divider */}
                  <circle cx="250" cy="250" r="200" fill="white" stroke="#333" strokeWidth="2" />
                  
                  {/* Center Content Group */}
                  <g transform="translate(0, -25)">
                      {/* Globe (Gold) */}
                      <path d="M 170,200 Q 250,130 330,200" fill="none" stroke="#f59e0b" strokeWidth="8" />
                      <path d="M 170,200 Q 250,270 330,200" fill="none" stroke="#f59e0b" strokeWidth="8" />
                      <line x1="250" y1="130" x2="250" y2="270" stroke="#f59e0b" strokeWidth="8" />
                      <line x1="150" y1="200" x2="350" y2="200" stroke="#f59e0b" strokeWidth="8" />
                      <path d="M 170,200 A 80,80 0 0 1 330,200" fill="none" stroke="#f59e0b" strokeWidth="8" />
                      
                      {/* Cap (Blue) */}
                      <path d="M 200,120 L 250,90 L 300,120 L 250,150 Z" fill="#3b82f6" stroke="#1e40af" strokeWidth="5" strokeLinejoin="round" />
                      <line x1="300" y1="120" x2="300" y2="160" stroke="#1e40af" strokeWidth="4" />
                      
                      {/* Book (Blue) */}
                      <path d="M 150,260 Q 250,310 350,260" fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
                      <path d="M 150,280 Q 250,330 350,280" fill="none" stroke="#3b82f6" strokeWidth="12" strokeLinecap="round" />
                      <line x1="250" y1="260" x2="250" y2="310" stroke="#3b82f6" strokeWidth="8" />
                  </g>

                  {/* Text exactly as requested */}
                  <text x="250" y="360" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="42" fill="#0f172a">Planet of Science</text>
                  <text x="250" y="410" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="32" fill="#334155">nersuye</text>
              </svg>
            </div>
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
                  w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm group
                  ${isActive 
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-200 transform scale-[1.02]' 
                    : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:bg-gold-50 dark:hover:bg-gray-800 hover:text-indigo-800 hover:shadow-md border border-transparent hover:border-gold-200'}
                `}
              >
                <div className={`
                  p-1.5 rounded-lg transition-colors
                  ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gold-100'}
                `}>
                   <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-indigo-600'} />
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="my-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2">
            <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:shadow-md border border-transparent"
            >
                <div className="bg-white/50 dark:bg-black/20 p-1.5 rounded-lg">
                    <LogOut size={18} className="text-red-500" />
                </div>
                <span>{t('logout')}</span>
            </button>
          </div>

          {showInstallButton && (
            <button
              onClick={onInstall}
              className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-200 text-indigo-700 bg-gold-50 border-2 border-gold-200 hover:bg-gold-100 mt-4 font-bold shadow-sm"
            >
              <div className="bg-white p-1.5 rounded-lg">
                <Download size={18} className="text-gold-600" />
              </div>
              <span>{t('installApp')}</span>
            </button>
          )}

          <div className="pt-2 mt-2 space-y-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
              className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-200 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md border border-transparent hover:border-gray-100 justify-between group bg-white/30 dark:bg-gray-800/30"
            >
              <div className="flex items-center gap-3">
                <Palette size={18} className="text-gray-400 group-hover:text-indigo-500" />
                <span className="font-medium">{t('colorPalette')}</span>
              </div>
              <ChevronRight size={16} className={`text-gray-400 transition-transform ${isThemeMenuOpen ? 'rotate-90' : ''}`} />
            </button>

            {isThemeMenuOpen && (
              <div className="p-2 space-y-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-indigo-50 dark:border-gray-700 animate-fade-in">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all ${
                      theme === t.id ? 'bg-indigo-50 dark:bg-gray-700 text-indigo-700 dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full shadow-sm border border-gray-100" style={{ backgroundColor: t.color }}></span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-200 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md border border-transparent hover:border-gray-100 dark:hover:border-gray-700 justify-between bg-white/30 dark:bg-gray-800/30"
            >
               <div className="flex items-center gap-3">
                  {isDarkMode ? <Moon size={18} className="text-indigo-400" /> : <Sun size={18} className="text-amber-500" />}
                  <span className="font-medium">{t('darkMode')}</span>
               </div>
               <div className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${isDarkMode ? 'translate-x-5' : ''}`}></div>
               </div>
            </button>
          </div>
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 mt-auto">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <button 
              onClick={() => setCurrentView('profile')}
              className="flex-1 flex items-center gap-3 group"
            >
              <div className="relative">
                 <img src={user?.avatar || "https://picsum.photos/seed/user/40/40"} alt="User" className="w-10 h-10 rounded-full border-2 border-indigo-100 dark:border-gray-600 group-hover:border-indigo-300 transition-colors" />
                 <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0 text-start">
                <p className="text-sm font-bold text-gray-800 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{user?.name}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate uppercase tracking-wider font-bold">{getRoleLabel(user?.role)}</p>
              </div>
            </button>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
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