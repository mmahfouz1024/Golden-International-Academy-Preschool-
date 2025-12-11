
import React, { useState, useEffect } from 'react';
import { Users, UserCheck, GraduationCap, Megaphone, Send, Trash2, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ATTENDANCE_DATA } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { getStudents, getUsers, getPosts, savePosts } from '../services/storageService';
import { Post, User } from '../types';

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const { requestPermission, permissionStatus, isSupported } = useNotification();

  const [statsData, setStatsData] = useState({
    totalStudents: 0,
    presentToday: 0,
    totalTeachers: 0
  });
  
  const [posts, setPosts] = useState<Post[]>([]);
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

  useEffect(() => {
    // Fetch real data from storage/database
    const students = getStudents();
    const users = getUsers();
    const loadedPosts = getPosts();
    
    // Calculate stats
    const totalStudents = students.length;
    const presentToday = students.filter(s => s.attendanceToday).length;
    
    // Count all staff roles (Teacher, Admin, Manager) as "Teachers/Staff"
    const totalTeachers = users.filter(u => ['teacher', 'admin', 'manager'].includes(u.role)).length;

    setStatsData({
      totalStudents,
      presentToday,
      totalTeachers
    });

    setPosts(loadedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);
  
  const handlePost = () => {
    if (!newPostContent.trim() || !currentUser) return;

    const newPost: Post = {
      id: Date.now().toString(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content: newPostContent.trim(),
      date: new Date().toISOString()
    };

    const updatedPosts = [newPost, ...posts];
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

  const canCreatePost = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager');

  const stats = [
    { label: t('statsTotalStudents'), value: statsData.totalStudents.toString(), icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: t('statsPresentToday'), value: statsData.presentToday.toString(), icon: UserCheck, color: 'bg-green-100 text-green-600' },
    { label: t('statsTeachers'), value: statsData.totalTeachers.toString(), icon: GraduationCap, color: 'bg-purple-100 text-purple-600' },
  ];

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('dashboard')}</h2>
          <p className="text-gray-500 mt-1">{t('overview')}</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
          {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Permission Banner for Mobile Notifications - Only Show if Supported */}
      {permissionStatus === 'default' && isSupported && (
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
               onClick={requestPermission}
               className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-bold hover:bg-indigo-50 transition-colors shadow-sm whitespace-nowrap"
            >
               {t('allow')}
            </button>
         </div>
      )}

      {/* School Announcements Section - Moved to Top */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col max-h-[400px]">
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
                <div key={post.id} className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 relative group">
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
                    {canCreatePost && (
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t('deletePost')}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
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

      {/* Stats Cards - Hidden for Parents */}
      {currentUser?.role !== 'parent' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className={`p-4 rounded-xl ${stat.color}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                  <div className="flex items-baseline gap-1">
                    <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={`grid grid-cols-1 ${currentUser?.role !== 'parent' ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
        
        {/* Attendance Chart - Hidden for Parents */}
        {currentUser?.role !== 'parent' && (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">{t('attendanceChart')}</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={ATTENDANCE_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                    <Tooltip 
                      cursor={{ fill: '#f9fafb' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="present" name="Present" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
                    <Bar dataKey="absent" name="Absent" fill="#fecaca" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Daily Schedule - Moved to col-span-1 to match previous layout flow but now next to chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{t('dailySchedule')}</h3>
            <div className="space-y-4">
              {[
                { time: '08:00', title: 'Arrival & Reception', color: 'border-green-500 bg-green-50' },
                { time: '09:00', title: 'Morning Circle', color: 'border-blue-500 bg-blue-50' },
                { time: '10:30', title: 'Breakfast', color: 'border-orange-500 bg-orange-50' },
                { time: '11:00', title: 'Free Play', color: 'border-purple-500 bg-purple-50' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border-l-4 border-r-0 border-gray-200" style={{ borderColor: item.color.split(' ')[0].replace('border-', '') }}>
                  <span className="text-sm font-bold text-gray-600 bg-white px-2 py-0.5 rounded shadow-sm min-w-[60px] text-center">{item.time}</span>
                  <span className="text-gray-800 font-medium">{item.title}</span>
                </div>
              ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
