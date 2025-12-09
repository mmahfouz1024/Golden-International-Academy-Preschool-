
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AIPlanner from './components/AIPlanner';
import StudentDetail from './components/StudentDetail';
import Attendance from './components/Attendance';
import UserManagement from './components/UserManagement';
import ClassManagement from './components/ClassManagement';
import Directory from './components/Directory';
import ReportsArchive from './components/ReportsArchive';
import Profile from './components/Profile';
import DatabaseControl from './components/DatabaseControl';
import Login from './components/Login';
import NotificationDropdown from './components/NotificationDropdown';
import BackgroundPattern from './components/BackgroundPattern';
import { Menu, Bell, ChevronRight, ChevronLeft } from 'lucide-react';
import { Student, User } from './types';
import { MOCK_STUDENTS } from './constants';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { initStorage } from './services/storageService';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedReportDate, setSelectedReportDate] = useState<string | undefined>(undefined);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { t, dir, language } = useLanguage();
  const { unreadCount } = useNotification();
  const notificationRef = useRef<HTMLDivElement>(null);

  // Initialize DB
  useEffect(() => {
    initStorage().then(() => setIsInitialized(true));
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Close notifications when clicking outside
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
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    
    if (loggedInUser.role === 'parent') {
      const child = MOCK_STUDENTS.find(s => s.id === loggedInUser.linkedStudentId);
      if (child) {
        setSelectedStudent(child);
        setCurrentView('parent-view');
      }
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedStudent(null);
    setSelectedReportDate(undefined);
    setCurrentView('dashboard');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleSetView = (view: string) => {
    setCurrentView(view);
    if (user?.role !== 'parent') {
      setSelectedStudent(null); 
      setSelectedReportDate(undefined);
    }
  };

  const handleViewHistoricalReport = (student: Student, date: string) => {
    setSelectedStudent(student);
    setSelectedReportDate(date);
    // StudentDetail renders when selectedStudent is present
  };

  const handleBack = () => {
    if (selectedStudent) {
      if (user?.role === 'parent') {
        // Parents stick to their child view
      } else {
        setSelectedStudent(null);
        setSelectedReportDate(undefined);
      }
      return;
    }
    
    // If not in dashboard, go to dashboard (except for parents who default to parent-view)
    if (currentView !== 'dashboard') {
      if (user?.role === 'parent') {
        setCurrentView('parent-view');
      } else {
        setCurrentView('dashboard');
      }
    }
  };

  const showBackButton = selectedStudent || (currentView !== 'dashboard' && currentView !== 'parent-view');

  const renderContent = () => {
    if (selectedStudent) {
      return (
        <StudentDetail 
          student={selectedStudent} 
          initialDate={selectedReportDate}
          readOnly={user?.role === 'parent' || !!selectedReportDate} // Read only if viewing archive, unless we want to allow editing history
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <StudentList onStudentSelect={(student) => setSelectedStudent(student)} />;
      case 'ai-planner':
        return <AIPlanner />;
      case 'attendance':
        return <Attendance />;
      case 'directory':
        return <Directory />;
      case 'reports-archive':
        return <ReportsArchive onViewReport={handleViewHistoricalReport} />;
      case 'users':
        return <UserManagement />;
      case 'classes':
        return <ClassManagement />;
      case 'database':
        return <DatabaseControl />;
      case 'profile':
        return user ? <Profile user={user} onUpdateUser={handleUpdateUser} /> : null;
      case 'parent-view':
         return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
            <p className="text-xl font-medium">{t('noChildRecord')}</p>
            <p className="text-sm mt-2">{t('contactAdmin')}</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
           <p className="text-gray-500 font-medium">Starting System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <BackgroundPattern />
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className={`flex h-screen bg-transparent overflow-hidden font-sans ${dir === 'rtl' ? 'text-right' : 'text-left'}`} dir={dir}>
      <BackgroundPattern />
      <Sidebar 
        currentView={currentView} 
        setCurrentView={handleSetView} 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        user={user}
        onLogout={handleLogout}
        showInstallButton={!!deferredPrompt}
        onInstall={handleInstallClick}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={24} />
            </button>

            {/* Global Back Button */}
            {showBackButton && (
               <button 
                 onClick={handleBack}
                 className="p-2 text-gray-500 hover:bg-gray-100 hover:text-indigo-600 rounded-lg transition-colors hidden md:block"
                 title={t('back')}
               >
                 {language === 'ar' ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
               </button>
            )}

            <h2 className="text-lg font-bold text-gray-700 hidden sm:block">
              {user.role === 'parent' 
                ? t('myChild')
                : (selectedStudent 
                    ? t('dailyReport')
                    : (currentView === 'dashboard' && t('dashboard')) ||
                      (currentView === 'students' && t('students')) ||
                      (currentView === 'ai-planner' && t('aiPlanner')) ||
                      (currentView === 'attendance' && t('attendance')) ||
                      (currentView === 'directory' && t('directoryTitle')) ||
                      (currentView === 'reports-archive' && t('reportsArchive')) ||
                      (currentView === 'users' && t('users')) ||
                      (currentView === 'classes' && t('classManagement')) ||
                      (currentView === 'database' && t('dbSettings')) ||
                      (currentView === 'profile' && t('profile'))
                  )
              }
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 left-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
                )}
              </button>
              {showNotifications && (
                <NotificationDropdown onClose={() => setShowNotifications(false)} />
              )}
            </div>
            
            <div className="w-px h-8 bg-gray-100 mx-1"></div>
            <button 
              onClick={() => handleSetView('profile')}
              className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded-lg transition-colors"
              title={t('profile')}
            >
               <span className="text-sm font-medium text-gray-600 hidden sm:block">{user.name}</span>
               <img src={user.avatar} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto animate-fade-in">
             {/* Mobile Back Button */}
             {showBackButton && (
               <div className="md:hidden mb-4">
                 <button 
                   onClick={handleBack}
                   className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium"
                 >
                   {language === 'ar' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                   <span>{t('back')}</span>
                 </button>
               </div>
             )}
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
};

export default App;
