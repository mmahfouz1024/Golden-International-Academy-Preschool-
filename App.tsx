
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
import ClassGallery from './components/ClassGallery';
import TeacherFocusMode from './components/TeacherFocusMode';
import PickupPass from './components/PickupPass';
import GateScanner from './components/GateScanner';
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
import { App as CapacitorApp } from '@capacitor/app';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedReportDate, setSelectedReportDate] = useState<string | undefined>(undefined);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Parent specific: List of children
  const [parentChildren, setParentChildren] = useState<Student[]>([]);

  // Initialization States
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  
  const { t, dir, language } = useLanguage();
  const { unreadCount, addNotification } = useNotification();
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
        console.error("App Initialization Error:", err);
        setInitError('Critical System Error - Please refresh');
      } finally {
        setIsInitialized(true);
      }
    };
    startApp();
  }, []);

  // Helper to find children for a parent user
  const findChildrenForParent = (parentUser: User): Student[] => {
      const allStudents = getStudents();
      let children: Student[] = [];

      // 1. Check array IDs (New)
      if (parentUser.linkedStudentIds && parentUser.linkedStudentIds.length > 0) {
          children = allStudents.filter(s => parentUser.linkedStudentIds!.includes(s.id));
      } 
      // 2. Check single ID (Legacy)
      else if (parentUser.linkedStudentId) {
          const child = allStudents.find(s => s.id === parentUser.linkedStudentId);
          if (child) children = [child];
      }
      // 3. Fallback match by Name if IDs missing (Robustness)
      if (children.length === 0) {
          children = allStudents.filter(s => s.parentName === parentUser.name);
      }
      
      return children;
  };

  // Session Restoration Logic
  useEffect(() => {
    if (isInitialized && !user && !initError) {
      try {
        const storedUserId = localStorage.getItem('golden_session_uid');
        if (storedUserId) {
          const users = getUsers();
          const foundUser = users.find(u => u.id === storedUserId);
          if (foundUser) {
             console.log("Restoring session for:", foundUser.username);
             setUser(foundUser);
             setIsMobileOpen(false); // Ensure sidebar is closed on restore
      
             // Route based on role
             if (foundUser.role === 'parent') {
                const children = findChildrenForParent(foundUser);
                setParentChildren(children);
                
                // If only one child, auto-select
                if (children.length === 1) {
                    setSelectedStudent(children[0]);
                }
                // Set default view to dashboard for parents (or child selection)
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
      } catch (e) {
        console.error("Session restore failed", e);
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
    setIsMobileOpen(false); // Force sidebar to close on login
    setUser(loggedInUser);
    // Persist session
    localStorage.setItem('golden_session_uid', loggedInUser.id);
    
    if (loggedInUser.role === 'parent') {
      const children = findChildrenForParent(loggedInUser);
      setParentChildren(children);

      // If only one child, auto-select. If multiple, selectedStudent remains null (triggering selection screen)
      if (children.length === 1) {
        setSelectedStudent(children[0]);
      } else {
        setSelectedStudent(null);
      }
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
    if (window.confirm(t('logoutConfirm'))) {
      setIsMobileOpen(false); // Force sidebar to close on logout
      setUser(null);
      localStorage.removeItem('golden_session_uid'); // Clear session
      setSelectedStudent(null);
      setParentChildren([]);
      setSelectedReportDate(undefined);
      setCurrentView('dashboard');
    }
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

    // 3. Deselect Student (Admin/Teacher only OR Parent going back to list)
    if (selectedStudent) {
      if (user?.role === 'parent') {
        // If parent has multiple children, go back to selection list
        if (parentChildren.length > 1) {
            setSelectedStudent(null);
            return;
        }
        // If single child, they stay on dashboard/detail or handle navigation otherwise
        if (currentView === 'parent-view') {
           setCurrentView('dashboard');
           return;
        }
      } else {
        setSelectedStudent(null);
      }
      return;
    }
    
    // 4. Navigate to Dashboard/Home (General Back navigation)
    if (currentView !== 'dashboard') {
      if (user?.role === 'parent') {
        // Parents always go back to dashboard from any view
        setCurrentView('dashboard');
      } else {
         // Admin/Teacher go to dashboard if allowed, or their first permission
         if (user?.permissions && user.permissions.includes('dashboard')) {
             setCurrentView('dashboard');
         } else if (user?.permissions && user.permissions.length > 0) {
             setCurrentView(user.permissions[0]);
         }
      }
    }
  };

  // Back Button Hardware Logic
  useEffect(() => {
    let lastBackTime = 0;

    const handleHardwareBack = async () => {
        // Check if we can go back internally
        const canGoBackInternally = 
            currentView === 'profile' || 
            !!selectedReportDate || 
            (!!selectedStudent && (user?.role !== 'parent' || parentChildren.length > 1)) || 
            (currentView !== 'dashboard' && user?.role !== 'parent') ||
            (user?.role === 'parent' && currentView !== 'dashboard');

        if (canGoBackInternally) {
            handleBack();
        } else {
            // We are at root (Login or Dashboard), handle double tap to exit
            const now = Date.now();
            if (now - lastBackTime < 2000) {
                // Exit app
                try {
                    await CapacitorApp.exitApp();
                } catch (e) {
                    console.log("App exit failed (web mode)", e);
                }
            } else {
                lastBackTime = now;
                addNotification('System', t('pressBackAgainToExit'), 'info');
            }
        }
    };

    // Attach listener
    try {
        CapacitorApp.addListener('backButton', handleHardwareBack);
    } catch (e) {
        console.warn("Capacitor App listener failed", e);
    }

    return () => {
        try {
            CapacitorApp.removeAllListeners();
        } catch (e) {}
    };
  }, [currentView, selectedStudent, selectedReportDate, user, parentChildren, addNotification]); // Depend on state to decide logic

  // Logic to show/hide Back Button
  const showBackButton = 
    currentView === 'profile' || 
    !!selectedReportDate || 
    (!!selectedStudent && (user?.role !== 'parent' || parentChildren.length > 1)) || 
    (currentView !== 'dashboard' && user?.role !== 'parent') ||
    (user?.role === 'parent' && currentView !== 'dashboard');

  const renderContent = () => {
    // 1. Profile View (High Priority)
    if (currentView === 'profile') {
       return user ? <Profile user={user} onUpdateUser={handleUpdateUser} /> : null;
    }

    // Fix for Parents: Ensure they can navigate to Dashboard
    if (user?.role === 'parent' && currentView === 'dashboard') {
        return <Dashboard setCurrentView={handleSetView} />;
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

    // 3. Parent Multi-Child Selection Screen
    if (user?.role === 'parent' && currentView === 'parent-view' && !selectedStudent) {
       if (parentChildren.length > 0) {
           return (
               <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{t('selectChildTitle')}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                      {parentChildren.map(child => (
                          <button 
                            key={child.id}
                            onClick={() => setSelectedStudent(child)}
                            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-indigo-500 hover:shadow-md transition-all flex flex-col items-center gap-4 group"
                          >
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
    }

    // 4. Main Views Switch
    switch (currentView) {
      case 'dashboard':
        return <Dashboard setCurrentView={handleSetView} />;
      case 'students':
        return <StudentList onStudentSelect={(s) => { setSelectedStudent(s); setSelectedReportDate(undefined); }} />;
      case 'focus-mode':
        return <TeacherFocusMode />;
      case 'daily-report':
        return <DailyReportManagement />;
      case 'fees-management':
        return <FeesManagement />;
      case 'gallery':
        return <ClassGallery />;
      case 'attendance':
        return <Attendance />;
      case 'ai-planner':
        return <AIPlanner />;
      case 'users':
        return <UserManagement />;
      case 'teachers':
        return <TeacherManagement />;
      case 'classes':
        return <ClassManagement />;
      case 'schedule-manage':
        return <DailyScheduleManagement />;
      case 'directory':
        return <Directory />;
      case 'reports-archive':
        return <ReportsArchive onViewReport={handleViewHistoricalReport} />;
      case 'database':
        return <DatabaseControl />;
      case 'pickup-pass':
        return user ? <PickupPass user={user} /> : null;
      case 'gate-scanner':
        return <GateScanner />;
      default:
        return <Dashboard setCurrentView={handleSetView} />;
    }
  };

  if (initError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4 text-center">
         <WifiOff size={48} className="text-red-500 mb-4" />
         <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Error</h2>
         <p className="text-gray-600 mb-6">{initError}</p>
         <button 
           onClick={() => window.location.reload()}
           className="px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 flex items-center gap-2"
         >
           <RefreshCw size={20} />
           Retry
         </button>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-sky-50 dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-indigo-600 font-bold animate-pulse">{t('loading')}</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-gray-900 ${dir === 'rtl' ? 'rtl' : 'ltr'}`} dir={dir}>
      <BackgroundPattern />
      
      {/* Sidebar */}
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

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${language === 'ar' ? 'lg:mr-72' : 'lg:ml-72'} relative z-10 h-full overflow-hidden`}>
        
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 px-4 sm:px-8 py-4 flex items-center justify-between bg-slate-50/80 dark:bg-gray-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800"
            >
              <Menu size={24} />
            </button>
            
            {showBackButton && (
              <button 
                onClick={handleBack}
                className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1 group"
              >
                <div className="bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-sm group-hover:shadow border border-gray-100 dark:border-gray-700 group-hover:border-indigo-100 transition-all">
                   {language === 'ar' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </div>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 hidden sm:block">{t('back')}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative" ref={notificationRef}>
              <button 
                className="p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto pt-2">
             {renderContent()}
          </div>

          {/* Added Footer to Main Layout */}
          <div className="text-center pt-6 mt-4 border-t border-gray-200 dark:border-gray-800 pb-8">
             <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">Powered by Mohamed Mahfouz</p>
             <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono" dir="ltr">eMail: M.mahfouz1024@gmail.com</p>
             <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 font-mono" dir="ltr">Phone: 01063743345</p>
             <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-2">All rights reserved @ 2025</p>
             <p className="text-[10px] text-gray-300 dark:text-gray-600">Version 1.00</p>
          </div>
        </main>

      </div>

      {/* Floating Chat Widget */}
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
