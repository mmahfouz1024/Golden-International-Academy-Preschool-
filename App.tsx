
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AIPlanner from './components/AIPlanner';
import StudentDetail from './components/StudentDetail';
import Attendance from './components/Attendance';
import UserManagement from './components/UserManagement';
import TeacherManagement from './components/TeacherManagement';
import ClassManagement from './components/ClassManagement';
import DailyScheduleManagement from './components/DailyScheduleManagement';
import Directory from './components/Directory';
import ReportsArchive from './components/ReportsArchive';
import Profile from './components/Profile';
import DatabaseControl from './components/DatabaseControl';
import DailyReportManagement from './components/DailyReportManagement';
import FeesManagement from './components/FeesManagement';
import StaffAffairs from './components/StaffAffairs';
import ClassGallery from './components/ClassGallery';
import TeacherFocusMode from './components/TeacherFocusMode';
import PickupPass from './components/PickupPass';
import GateScanner from './components/GateScanner';
import LoginHistory from './components/LoginHistory';
import Login from './components/Login';
import Chat from './components/Chat';
import NotificationDropdown from './components/NotificationDropdown';
import BackgroundPattern from './components/BackgroundPattern';
import { Menu, Bell, ChevronRight, ChevronLeft, WifiOff, RefreshCw } from 'lucide-react';
import { Student, User } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { initStorage, getStudents, getUsers } from './services/storageService';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedReportDate, setSelectedReportDate] = useState<string | undefined>(undefined);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [parentChildren, setParentChildren] = useState<Student[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const { t, dir, language } = useLanguage();
  const { unreadCount } = useNotification();
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startApp = async () => {
      try {
        const result = await initStorage();
        if (!result.success) {
          setInitError(result.message || 'Unknown Database Error');
        }
      } catch (err) {
        setInitError('Critical System Error');
      } finally {
        setIsInitialized(true);
      }
    };
    startApp();
  }, []);

  const findChildrenForParent = (parentUser: User): Student[] => {
      const allStudents = getStudents();
      let children: Student[] = [];
      if (parentUser.linkedStudentIds && parentUser.linkedStudentIds.length > 0) {
          children = allStudents.filter(s => parentUser.linkedStudentIds!.includes(s.id));
      } else if (parentUser.linkedStudentId) {
          const child = allStudents.find(s => s.id === parentUser.linkedStudentId);
          if (child) children = [child];
      }
      if (children.length === 0) {
          children = allStudents.filter(s => s.parentName === parentUser.name);
      }
      return children;
  };

  useEffect(() => {
    if (isInitialized && !user && !initError) {
      try {
        const storedUserId = localStorage.getItem('golden_session_uid');
        if (storedUserId) {
          const users = getUsers();
          const foundUser = users.find(u => u.id === storedUserId);
          if (foundUser) {
             setUser(foundUser);
             if (foundUser.role === 'parent') {
                const children = findChildrenForParent(foundUser);
                setParentChildren(children);
                if (children.length === 1) setSelectedStudent(children[0]);
                setCurrentView('dashboard');
              } else {
                setCurrentView('dashboard');
              }
          }
        }
      } catch (e) {}
    }
  }, [isInitialized, user, initError]);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleLogin = (loggedInUser: User) => {
    setIsMobileOpen(false);
    setUser(loggedInUser);
    localStorage.setItem('golden_session_uid', loggedInUser.id);
    if (loggedInUser.role === 'parent') {
      const children = findChildrenForParent(loggedInUser);
      setParentChildren(children);
      if (children.length === 1) setSelectedStudent(children[0]);
      else setSelectedStudent(null);
      setCurrentView('dashboard');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    if (window.confirm(t('logoutConfirm'))) {
      setIsMobileOpen(false);
      setUser(null);
      localStorage.removeItem('golden_session_uid');
      setSelectedStudent(null);
      setParentChildren([]);
      setCurrentView('dashboard');
    }
  };

  const handleSetView = (view: string) => {
    setCurrentView(view);
    if (view !== 'profile' && user?.role !== 'parent') {
      setSelectedStudent(null); 
      setSelectedReportDate(undefined);
    }
  };

  const handleBack = () => {
    if (currentView === 'profile') {
       if (user?.role === 'parent') setCurrentView('dashboard');
       else setCurrentView('dashboard');
       return;
    }
    if (selectedReportDate) { setSelectedReportDate(undefined); return; }
    if (selectedStudent) {
      if (user?.role === 'parent' && parentChildren.length > 1) { setSelectedStudent(null); return; }
      if (currentView === 'parent-view') { setCurrentView('dashboard'); return; }
      if (user?.role !== 'parent') setSelectedStudent(null);
      return;
    }
    if (currentView !== 'dashboard') setCurrentView('dashboard');
  };

  const showBackButton = 
    currentView === 'profile' || 
    !!selectedReportDate || 
    (!!selectedStudent && (user?.role !== 'parent' || parentChildren.length > 1)) || 
    (currentView !== 'dashboard');

  const renderContent = () => {
    if (currentView === 'profile') return user ? <Profile user={user} onUpdateUser={setUser} /> : null;
    if (user?.role === 'parent' && currentView === 'dashboard') return <Dashboard setCurrentView={handleSetView} />;
    if (selectedStudent) {
       if (user?.role === 'parent' && currentView === 'parent-view') return <StudentDetail student={selectedStudent} initialDate={selectedReportDate} readOnly={true} />;
       if (user?.role !== 'parent') return <StudentDetail student={selectedStudent} initialDate={selectedReportDate} readOnly={!!selectedReportDate} />;
    }
    if (user?.role === 'parent' && currentView === 'parent-view' && !selectedStudent) {
       return (
           <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{t('selectChildTitle')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                  {parentChildren.map(child => (
                      <button key={child.id} onClick={() => setSelectedStudent(child)} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-indigo-500 hover:shadow-md transition-all flex flex-col items-center gap-4 group">
                          <img src={child.avatar} alt={child.name} className="w-24 h-24 rounded-full object-cover group-hover:scale-110 transition-transform" />
                          <div className="text-center">
                              <h3 className="font-bold text-lg text-gray-800 dark:text-white">{child.name}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{child.classGroup}</p>
                          </div>
                      </button>
                  ))}
              </div>
           </div>
       );
    }
    switch (currentView) {
      case 'dashboard': return <Dashboard setCurrentView={handleSetView} />;
      case 'students': return <StudentList onStudentSelect={(s) => { setSelectedStudent(s); setSelectedReportDate(undefined); }} />;
      case 'focus-mode': return <TeacherFocusMode />;
      case 'daily-report': return <DailyReportManagement />;
      case 'fees-management': return <FeesManagement />;
      case 'staff-affairs': return <StaffAffairs />;
      case 'gallery': return <ClassGallery />;
      case 'attendance': return <Attendance />;
      case 'ai-planner': return <AIPlanner />;
      case 'users': return <UserManagement />;
      case 'teachers': return <TeacherManagement />;
      case 'classes': return <ClassManagement />;
      case 'schedule-manage': return <DailyScheduleManagement />;
      case 'directory': return <Directory />;
      case 'reports-archive': return <ReportsArchive onViewReport={(s, d) => { setSelectedStudent(s); setSelectedReportDate(d); }} />;
      case 'database': return <DatabaseControl />;
      case 'login-history': return <LoginHistory />;
      case 'pickup-pass': return user ? <PickupPass user={user} /> : null;
      case 'gate-scanner': return <GateScanner />;
      default: return <Dashboard setCurrentView={handleSetView} />;
    }
  };

  if (initError) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4 text-center">
       <WifiOff size={48} className="text-red-500 mb-4" />
       <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Error</h2>
       <button onClick={() => window.location.reload()} className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 flex items-center gap-2">
         <RefreshCw size={20} /> Retry
       </button>
    </div>
  );

  if (!isInitialized) return <div className="flex flex-col items-center justify-center min-h-screen bg-sky-50 dark:bg-gray-900"><div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div></div>;

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-gray-900 ${dir === 'rtl' ? 'rtl' : 'ltr'}`} dir={dir}>
      <BackgroundPattern />
      <Sidebar currentView={currentView} setCurrentView={handleSetView} isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} user={user} onLogout={handleLogout} showInstallButton={!!deferredPrompt} onInstall={handleInstallClick} />

      <div className={`flex-1 flex flex-col transition-all duration-300 relative z-10 h-full overflow-hidden`}>
        
        {/* Updated Header with Floating Buttons matching the sketch */}
        <header className="sticky top-0 z-20 px-6 sm:px-10 py-6 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            {showBackButton ? (
              <button onClick={handleBack} className="p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 transition-all flex items-center justify-center">
                {language === 'ar' ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
              </button>
            ) : (
              <button 
                onClick={() => setIsMobileOpen(true)}
                className="p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 transition-all flex items-center justify-center"
              >
                <Menu size={24} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="relative" ref={notificationRef}>
              <button 
                className="p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 transition-all relative flex items-center justify-center"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto pt-2">
             {renderContent()}
          </div>
          <div className="text-center pt-6 mt-4 border-t border-gray-200 dark:border-gray-800 pb-8">
             <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">Powered by Mohamed Mahfouz</p>
             <p className="text-[10px] text-gray-400 mt-2">All rights reserved @ 2025</p>
          </div>
        </main>
      </div>
      <Chat />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
