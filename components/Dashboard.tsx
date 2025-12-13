
import React, { useState, useEffect } from 'react';
import { Megaphone, Send, Trash2, Bell, Calendar, Pin, PinOff, FileText, ArrowRight, ArrowLeft, Sparkles, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { getUsers, savePosts, getSchedule, syncPosts } from '../services/storageService';
import { Post, User, ScheduleItem } from '../types';

interface DashboardProps {
  setCurrentView?: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setCurrentView }) => {
  const { t, language } = useLanguage();
  const { requestPermission, permissionStatus } = useNotification();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  
  // Initialize user synchronously to avoid content flicker
  const [currentUser] = useState<User | null>(() => {
    const userId = localStorage.getItem('golden_session_uid');
    if (userId) {
      const users = getUsers();
      return users.find(u => u.id === userId) || null;
    }
    return null;
  });

  const sortPosts = (postsToSort: Post[]) => {
    return postsToSort.sort((a, b) => {
      // 1. Sort by Pinned status first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // 2. Sort by Date descending
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  };

  useEffect(() => {
    // Initial Load - Try to fetch fresh from cloud immediately
    const loadData = async () => {
        const cloudPosts = await syncPosts(); // Use syncPosts to ensure we get latest
        setPosts(sortPosts(cloudPosts));
    };
    loadData();
    
    // Fetch Schedule
    const loadedSchedule = getSchedule();
    loadedSchedule.sort((a, b) => a.time.localeCompare(b.time));
    setSchedule(loadedSchedule);

    // POLL FOR NEW POSTS (Real-time updates)
    const interval = setInterval(async () => {
        const freshPosts = await syncPosts();
        setPosts(prev => {
            // Only update if data changed to prevent re-renders
            if (JSON.stringify(prev) !== JSON.stringify(freshPosts)) {
                return sortPosts(freshPosts);
            }
            return prev;
        });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);
  
  const handlePost = () => {
    if (!newPostContent.trim() || !currentUser) return;

    const newPost: Post = {
      id: Date.now().toString(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content: newPostContent.trim(),
      date: new Date().toISOString(),
      isPinned: false
    };

    const updatedPosts = sortPosts([newPost, ...posts]);
    setPosts(updatedPosts);
    savePosts(updatedPosts);
    setNewPostContent('');
  };

  const handleDeletePost = (id: string) => {
    if (window.confirm(t('deleteUserConfirm'))) { // Reuse delete confirmation
      const updatedPosts = posts.filter(p => p.id !== id);
      setPosts(updatedPosts);
      savePosts(updatedPosts);
    }
  };

  const handleTogglePin = (id: string) => {
    const updatedPosts = posts.map(p => {
      if (p.id === id) {
        return { ...p, isPinned: !p.isPinned };
      }
      return p;
    });
    
    // Re-sort and save
    const sortedPosts = sortPosts(updatedPosts);
    setPosts(sortedPosts);
    savePosts(sortedPosts);
  };

  const handlePermissionClick = async () => {
      setIsRequestingPermission(true);
      await requestPermission();
      setIsRequestingPermission(false);
  };

  const canCreatePost = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager');

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScheduleItemStyle = (color: string) => {
    switch (color) {
      case 'green': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'blue': return 'bg-sky-50 border-sky-200 text-sky-700';
      case 'orange': return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'purple': return 'bg-violet-50 border-violet-200 text-violet-700';
      case 'red': return 'bg-rose-50 border-rose-200 text-rose-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Section with Date */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2">
        <div>
          <h2 className="text-4xl font-display font-bold text-slate-800 tracking-tight">{t('dashboard')}</h2>
          <p className="text-slate-500 font-medium mt-1">Welcome back, {currentUser?.name}</p>
        </div>
        
        <div className={`flex items-center gap-3 bg-white/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/50 shadow-sm`}>
           <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
             <Calendar size={22} />
           </div>
           <div>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today</p>
             <p className="text-lg font-bold text-slate-800 font-display">
                {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
             </p>
           </div>
        </div>
      </div>

      {/* Permission Banner */}
      {permissionStatus === 'default' && (
         <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-1 shadow-xl shadow-indigo-200">
           <div className="bg-white/10 backdrop-blur-sm rounded-[1.3rem] p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-white/20 rounded-full">
                    <Bell size={24} className="animate-pulse" />
                 </div>
                 <div>
                    <h3 className="font-bold text-lg">{t('enableSystemNotifications')}</h3>
                    <p className="text-indigo-100 opacity-90 text-sm">{t('systemNotificationsDesc')}</p>
                 </div>
              </div>
              <button 
                 onClick={handlePermissionClick}
                 disabled={isRequestingPermission}
                 className="bg-white text-indigo-600 px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg whitespace-nowrap flex items-center gap-2 disabled:opacity-70"
              >
                 {isRequestingPermission && (
                     <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                 )}
                 {t('allow')}
              </button>
           </div>
         </div>
      )}

      {/* PARENT PROMPT CARD */}
      {currentUser?.role === 'parent' && (
         <div className="relative overflow-hidden bg-gradient-to-br from-rose-400 via-pink-500 to-orange-400 rounded-3xl p-8 text-white shadow-xl shadow-pink-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-yellow-300/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner border border-white/20">
                       <Sparkles size={32} className="text-yellow-200 animate-spin-slow" fill="currentColor" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold mb-1 font-display">{t('checkDailyReport')}</h3>
                       <p className="text-rose-100 text-sm font-medium opacity-90 max-w-md">{t('dailyReportPrompt')}</p>
                    </div>
                </div>
                <button 
                   onClick={() => setCurrentView?.('parent-view')}
                   className="bg-white text-rose-600 px-8 py-3.5 rounded-2xl font-bold shadow-lg hover:bg-rose-50 transition-colors flex items-center gap-2 whitespace-nowrap group-hover:scale-105"
                >
                   <FileText size={20} />
                   {t('viewChildReport')}
                   {language === 'ar' ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                </button>
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* School Announcements Section */}
        <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                    <Megaphone size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{t('schoolAnnouncements')}</h3>
               </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-white/50 h-[600px] flex flex-col relative overflow-hidden">
                {canCreatePost && (
                  <div className="mb-6 bg-white p-2 rounded-3xl border border-slate-100 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <textarea
                      className="w-full bg-transparent p-4 focus:outline-none text-slate-700 placeholder-slate-400 text-sm resize-none rounded-2xl"
                      rows={2}
                      placeholder={t('writeAnnouncement')}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                    />
                    <div className="flex justify-end px-2 pb-2">
                      <button 
                        onClick={handlePost}
                        disabled={!newPostContent.trim()}
                        className="bg-slate-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
                      >
                        <Send size={16} />
                        {t('post')}
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-5 pb-4">
                  {posts.length > 0 ? (
                    posts.map(post => (
                      <div 
                        key={post.id} 
                        className={`p-6 rounded-3xl border transition-all hover:shadow-md ${
                            post.isPinned 
                                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100' 
                                : 'bg-white border-slate-100'
                        }`}
                      >
                        {post.isPinned && (
                            <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold mb-3 uppercase tracking-wide">
                                <Pin size={12} fill="currentColor" />
                                <span>Pinned Announcement</span>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-md ${post.authorRole === 'admin' ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-gradient-to-br from-orange-400 to-pink-500'}`}>
                              {post.authorName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{post.authorName}</p>
                              <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                                 <span>{t(`role${post.authorRole.charAt(0).toUpperCase() + post.authorRole.slice(1)}` as any)}</span>
                                 <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                 <span>{getRelativeTime(post.date)}</span>
                              </p>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          {canCreatePost && (
                            <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleTogglePin(post.id)}
                                    className={`p-2 rounded-xl transition-colors ${post.isPinned ? 'text-amber-600 bg-amber-100' : 'text-slate-400 hover:bg-slate-100'}`}
                                    title={post.isPinned ? t('unpinPost') : t('pinPost')}
                                >
                                    {post.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                                </button>
                                <button 
                                  onClick={() => handleDeletePost(post.id)}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                  title={t('deletePost')}
                                >
                                  <Trash2 size={16} />
                                </button>
                            </div>
                          )}
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                          {post.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                      <Megaphone size={48} className="mb-4 opacity-20" />
                      <p className="text-sm font-medium">{t('noNotifications')}</p>
                    </div>
                  )}
                </div>
            </div>
        </div>

        {/* Daily Schedule - Timeline Style */}
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                 <Clock size={24} />
               </div>
               <h3 className="text-xl font-bold text-slate-800">{t('dailySchedule')}</h3>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-white/50 h-fit min-h-[400px]">
                <div className="relative space-y-0 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-100 before:via-slate-200 before:to-transparent before:z-0">
                  {schedule.map((item) => (
                    <div key={item.id} className="relative flex items-center mb-6 last:mb-0 group z-10">
                       <div className="absolute left-0 ml-5 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white bg-indigo-500 shadow-md group-hover:scale-125 transition-transform"></div>
                       
                       <div className={`ml-10 flex-1 p-4 rounded-2xl border transition-all hover:shadow-md hover:-translate-y-0.5 hover:bg-white ${getScheduleItemStyle(item.color)}`}>
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-xs font-bold opacity-70 flex items-center gap-1">
                                <Clock size={12} />
                                <span dir="ltr">{item.time}</span>
                             </span>
                             {/* Optional: Add icons based on keywords later */}
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                       </div>
                    </div>
                  ))}
                  
                  {schedule.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Calendar size={24} />
                       </div>
                       <p className="text-sm">No schedule items yet</p>
                    </div>
                  )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
