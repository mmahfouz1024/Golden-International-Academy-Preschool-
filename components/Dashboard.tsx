
import React, { useState, useEffect } from 'react';
import { Megaphone, Send, Trash2, Bell, Calendar, Pin, PinOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { getUsers, getPosts, savePosts, getSchedule } from '../services/storageService';
import { Post, User, ScheduleItem } from '../types';

const Dashboard: React.FC = () => {
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
    // Fetch real data from storage/database
    const loadedPosts = getPosts();
    setPosts(sortPosts(loadedPosts));
    
    // Fetch Schedule
    const loadedSchedule = getSchedule();
    loadedSchedule.sort((a, b) => a.time.localeCompare(b.time));
    setSchedule(loadedSchedule);
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
      case 'green': return 'border-green-500 bg-green-50';
      case 'blue': return 'border-blue-500 bg-blue-50';
      case 'orange': return 'border-orange-500 bg-orange-50';
      case 'purple': return 'border-purple-500 bg-purple-50';
      case 'red': return 'border-red-500 bg-red-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-800">{t('dashboard')}</h2>
        </div>
        
        <div className={`flex flex-col ${language === 'ar' ? 'md:items-end' : 'md:items-end'} gap-1`}>
          <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-2xl">
             <Calendar size={20} />
             <span className="text-xl font-bold font-display">
                {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </span>
          </div>
          <span className="text-sm font-medium text-gray-400 px-2 tracking-wide">
            Golden International Academy & Preschool
          </span>
        </div>
      </div>

      {/* Permission Banner for Mobile Notifications - FORCE SHOW if Default */}
      {permissionStatus === 'default' && (
         <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 shadow-lg text-white flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-white/20 rounded-lg">
                  <Bell size={24} className="animate-pulse" />
               </div>
               <div>
                  <h3 className="font-bold">{t('enableSystemNotifications')}</h3>
                  <p className="text-sm text-indigo-100">{t('systemNotificationsDesc')}</p>
               </div>
            </div>
            <button 
               onClick={handlePermissionClick}
               disabled={isRequestingPermission}
               className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-bold hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
               {isRequestingPermission && (
                   <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
               )}
               {t('allow')}
            </button>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* School Announcements Section (Bulletin Board) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[650px]">
            <div className="flex items-center gap-2 mb-6">
              <Megaphone className="text-orange-500" size={24} />
              <h3 className="text-lg font-bold text-gray-800">{t('schoolAnnouncements')}</h3>
            </div>

            {canCreatePost && (
              <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <textarea
                  className="w-full bg-white p-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm resize-none"
                  rows={3}
                  placeholder={t('writeAnnouncement')}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={handlePost}
                    disabled={!newPostContent.trim()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={14} />
                    {t('post')}
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
              {posts.length > 0 ? (
                posts.map(post => (
                  <div 
                    key={post.id} 
                    className={`p-4 rounded-xl border relative group transition-all ${
                        post.isPinned 
                            ? 'bg-amber-50 border-amber-200 shadow-sm' 
                            : 'bg-indigo-50/50 border-indigo-100'
                    }`}
                  >
                    {post.isPinned && (
                        <div className={`absolute top-0 ${language === 'ar' ? 'left-0' : 'right-0'} bg-amber-200 text-amber-800 px-2 py-0.5 rounded-bl-lg rounded-tr-lg text-[10px] font-bold flex items-center gap-1`}>
                            <Pin size={10} fill="currentColor" />
                            Pinned
                        </div>
                    )}

                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${post.authorRole === 'admin' ? 'bg-purple-500' : 'bg-orange-500'}`}>
                          {post.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{post.authorName}</p>
                          <p className="text-[10px] text-gray-500">{t(`role${post.authorRole.charAt(0).toUpperCase() + post.authorRole.slice(1)}` as any)} • {getRelativeTime(post.date)}</p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      {canCreatePost && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleTogglePin(post.id)}
                                className={`p-1.5 rounded-lg transition-colors ${post.isPinned ? 'text-amber-600 hover:bg-amber-100' : 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50'}`}
                                title={post.isPinned ? t('unpinPost') : t('pinPost')}
                            >
                                {post.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                            </button>
                            <button 
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title={t('deletePost')}
                            >
                              <Trash2 size={16} />
                            </button>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mt-2">
                      {post.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-sm">{t('noNotifications')}</p>
                </div>
              )}
            </div>
        </div>

        {/* Daily Schedule - Dynamic Data */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{t('dailySchedule')}</h3>
            <div className="space-y-4">
              {schedule.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg border-l-4 border-r-0 border-gray-200 ${getScheduleItemStyle(item.color)}`}
                  style={{ borderColor: getScheduleItemStyle(item.color).split(' ')[0].replace('border-', '') }}
                >
                  <span className="text-sm font-bold text-gray-600 bg-white px-2 py-0.5 rounded shadow-sm min-w-[60px] text-center" dir="ltr">{item.time}</span>
                  <span className="text-gray-800 font-medium">{item.title}</span>
                </div>
              ))}
              {schedule.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm italic">
                  --
                </div>
              )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
