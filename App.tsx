
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
  
  // Initialization States
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const { t, dir, language } = useLanguage();
  const { unreadCount } = useNotification();
  const notificationRef = useRef<HTMLDivElement>(null);

  // Initialize DB Strict Check
  useEffect(() => {
    const startApp = async () => {
      try {
        const result = await initStorage();
        if (!result.success) {
          // BLOCKING ERROR: Do not proceed if DB connection fails
          setInitError(result.message || 'Unknown Database Error');
        } else {
           console.log("DB Connected Successfully");
        }
      } catch (err) {
        setInitError('Critical System Error');
      } finally {
        setIsInitialized(true);
      }
    };
    startApp();
  }, []);

  // Session Restoration Logic
  useEffect(() => {
    if (isInitialized && !user && !initError) {
      const storedUserId = localStorage.getItem('golden_session_uid');
      if (storedUserId) {
        const users = getUsers();
        const foundUser = users.find(u => u.id === storedUserId);
        if (foundUser) {
           console.log("Restoring session for:", foundUser.username);
           setUser(foundUser);
    
           // Route based on role
           if (foundUser.role === 'parent') {
              const allStudents = getStudents();
              const child = allStudents.find(s => s.id === foundUser.linkedStudentId);
              if (child) {
                setSelectedStudent(child);
              }
              // Set default view to dashboard for parents
              setCurrentView('dashboard');
            } else {
              if (foundUser.role === 'admin') {
                 setCurrentView('dashboard');
              } else if (foundUser.permissions && foundUser.permissions.length > 0) {
                 setCurrentView(foundUser.permissions[0]);
              } else {
                 setCurrentView('dashboard');
              }
            }
        }
      }
    }
  }, [isInitialized, user, initError]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
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
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Persist session
    localStorage.setItem('golden_session_uid', loggedInUser.id);
    
    if (loggedInUser.role === 'parent') {
      // Use getStudents() from storageService instead of MOCK_STUDENTS
      const allStudents = getStudents();
      const child = allStudents.find(s => s.id === loggedInUser.linkedStudentId);
      if (child) {
        setSelectedStudent(child);
      }
      // Set default view to dashboard for parents
      setCurrentView('dashboard');
    } else {
      if (loggedInUser.role === 'admin') {
         setCurrentView('dashboard');
      } else if (loggedInUser.permissions && loggedInUser.permissions.length > 0) {
         setCurrentView(loggedInUser.permissions[0]);
      } else {
         setCurrentView('dashboard');
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('golden_session_uid'); // Clear session
    setSelectedStudent(null);
    setSelectedReportDate(undefined);
    setCurrentView('dashboard');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleSetView = (view: string) => {
    setCurrentView(view);
    // Only clear selection if NOT switching to profile
    if (view !== 'profile' && user?.role !== 'parent') {
      setSelectedStudent(null); 
      setSelectedReportDate(undefined);
    }
  };

  const handleViewHistoricalReport = (student: Student, date: string) => {
    setSelectedStudent(student);
    setSelectedReportDate(date);
  };

  const handleBack = () => {
    // 1. Exit Profile View
    if (currentView === 'profile') {
       if (user?.role === 'parent') {
         setCurrentView('dashboard');
       } else {
         // Return to first allowed view
         if (user?.role === 'admin') {
            setCurrentView('dashboard');
         } else if (user?.permissions && user.permissions.length > 0) {
            setCurrentView(user.permissions[0]);
         } else {
            setCurrentView('dashboard');
         }
       }
       return;
    }

    // 2. Clear Historical Report Date (go back to today's report)
    if (selectedReportDate) {
      setSelectedReportDate(undefined);
      return;
    }

    // 3. Deselect Student (Admin/Teacher only)
    if (selectedStudent) {
      if (user?.role === 'parent') {
        // Parent cannot deselect their child, so just go to dashboard if they were viewing child details
        if (currentView === 'parent-view') {
           setCurrentView('dashboard');
           return;
        }
      } else {
        setSelectedStudent(null);
      }
      return;
    }
    
    // 4. Navigate to Dashboard/Home
    if (currentView !== 'dashboard' && currentView !== 'parent-view') {
      if (user?.role === 'parent') {
        setCurrentView('dashboard');
      } else {
         if (user?.permissions && user.permissions.includes('dashboard')) {
             setCurrentView('dashboard');
         } else if (user?.permissions && user.permissions.length > 0) {
             setCurrentView(user.permissions[0]);
         }
      }
    }
  };

  // Logic to show/hide Back Button
  const showBackButton = 
    currentView === 'profile' || 
    !!selectedReportDate || 
    (!!selectedStudent && user?.role !== 'parent') || 
    (currentView !== 'dashboard' && currentView !== 'parent-view' && user?.role !== 'parent') ||
    (user?.role === 'parent' && currentView !== 'dashboard');

  const renderContent = () => {
    // 1. Profile View (High Priority)
    if (currentView === 'profile') {
       return user ? <Profile user={user} onUpdateUser={handleUpdateUser} /> : null;
    }

    // Fix for Parents: Ensure they can navigate to Dashboard
    if (user?.role === 'parent' && currentView === 'dashboard') {
        return <Dashboard />;
    }

    // 2. Student Detail (If selected)
    // For parents, selectedStudent is always set to their child. We only show it if they are on 'parent-view'.
    if (selectedStudent) {
       if (user?.role === 'parent') {
         if (currentView === 'parent-view') {
           return (
              <StudentDetail 
                student={selectedStudent} 
                initialDate={selectedReportDate}
                readOnly={true} 
              />
            );
         }
       } else {
         // Admin/Teacher drill-down
         return (
            <StudentDetail 
              student={selectedStudent} 
              initialDate={selectedReportDate}
              readOnly={!!selectedReportDate} 
            />
          );
       }
    }

    const isAllowed = (view: string) => {
       if (!user) return false;
       if (view === 'profile') return true;
       
       if (user.role === 'admin') return true;
       if (user.role === 'parent') {
          if (view === 'parent-view' || view === 'dashboard') return true;
          return user.permissions?.includes(view) || false;
       }
       
       if (user.permissions && user.permissions.length > 0) {
         return user.permissions.includes(view);
       }
       return true; 
    };

    if (!isAllowed(currentView)) {
      return <div className="p-8 text-center text-gray-500">{t('contactAdmin')} (Access Denied)</div>;
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'students': return <StudentList onStudentSelect={(student) => setSelectedStudent(student)} />;
      case 'ai-planner': return <AIPlanner />;
      case 'attendance': return <Attendance />;
      case 'directory': return <Directory />;
      case 'reports-archive': return <ReportsArchive onViewReport={handleViewHistoricalReport} />;
      case 'users': return <UserManagement />;
      case 'classes': return <ClassManagement />;
      case 'database': return <DatabaseControl />;
      // Profile handled above
      case 'parent-view':
         return (
          <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
            <p className="text-xl font-medium">{t('noChildRecord')}</p>
            <p className="text-sm mt-2">{t('contactAdmin')}</p>
          </div>
        );
      default: return <Dashboard />;
    }
  };

  // LOADING STATE
  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-sky-50">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
           <p className="text-gray-500 font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // BLOCKING ERROR STATE (DB CONNECTION FAILED)
  if (initError) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-sky-50 p-4">
        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-[2.5rem] shadow-xl max-w-md w-full text-center border-4 border-white">
           <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
             <WifiOff size={40} />
           </div>
           <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('dbConnectionError')}</h2>
           <p className="text-gray-500 mb-6">{initError}</p>
           
           <div className="bg-gray-50 p-4 rounded-xl text-xs text-gray-400 font-mono mb-6 text-left overflow-auto max-h-32 border border-gray-100">
             Technical Details: Ensure Supabase URL and Key are correct and you have an internet connection.
           </div>

           <button 
             onClick={() => window.location.reload()}
             className="w-full py-4 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-full font-bold hover:scale-105 transition-transform shadow-lg flex items-center justify-center gap-2"
           >
             <RefreshCw size={20} />
             Try Again
           </button>
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
        <header className="h-20 bg-white/60 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 sm:px-8 z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 text-gray-500 hover:bg-white/50 rounded-lg"
            >
              <Menu size={24} />
            </button>

            {showBackButton && (
               <button 
                 onClick={handleBack}
                 className="p-2 text-gray-500 hover:bg-white/50 hover:text-indigo-600 rounded-xl transition-colors hidden md:block"
                 title={t('back')}
               >
                 {language === 'ar' ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
               </button>
            )}

            <h2 className="text-xl font-bold text-gray-800 hidden sm:block">
              {user.role === 'parent' 
                ? (currentView === 'dashboard' ? t('dashboard') : t('myChild'))
                : (selectedStudent 
                    ? t('dailyReport')
                    : (currentView === 'dashboard' && t('dashboard')) ||
                      (currentView === 'chat' && t('chat')) ||
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
                className="relative p-3 text-gray-400 hover:text-indigo-600 hover:bg-white/50 rounded-xl transition-all"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 left-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse"></span>
                )}
              </button>
              {showNotifications && (
                <NotificationDropdown onClose={() => setShowNotifications(false)} />
              )}
            </div>
            
            <div className="w-px h-8 bg-gray-200/50 mx-1"></div>
            <button 
              onClick={() => handleSetView('profile')}
              className="flex items-center gap-3 hover:bg-white/50 p-2 rounded-xl transition-colors border border-transparent hover:border-white/50"
              title={t('profile')}
            >
               <span className="text-sm font-bold text-gray-700 hidden sm:block">{user.name}</span>
               <img src={user.avatar} alt="Profile" className="w-9 h-9 rounded-full border-2 border-white shadow-sm" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto animate-fade-in pb-12">
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
      
      {/* Global Floating Chat Widget */}
      <Chat />
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
