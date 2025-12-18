
import React, { useState, useEffect } from 'react';
import { History, Search, Trash2, Smartphone, Clock, User as UserIcon, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getLoginLogs, saveLoginLogs, getUsers } from '../services/storageService';
import { LoginLog, User } from '../types';

const LoginHistory: React.FC = () => {
  const { t, language } = useLanguage();
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setLogs(getLoginLogs());
    const uid = localStorage.getItem('golden_session_uid');
    const allUsers = getUsers();
    setCurrentUser(allUsers.find(u => u.id === uid) || null);
  }, []);

  const handleClearLogs = () => {
    if (window.confirm(t('deletePostConfirm'))) {
      saveLoginLogs([]);
      setLogs([]);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userRole.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'manager': return 'bg-orange-100 text-orange-700';
      case 'teacher': return 'bg-blue-100 text-blue-700';
      case 'parent': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <History className="text-indigo-600" />
            {t('loginHistory')}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Track application access and user sessions</p>
        </div>
        
        {currentUser?.role === 'admin' && logs.length > 0 && (
            <button 
                onClick={handleClearLogs}
                className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl hover:bg-rose-100 transition-all font-bold text-sm"
            >
                <Trash2 size={16} />
                {t('clearLogs')}
            </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
          <input 
            type="text" 
            placeholder={t('search')}
            className={`w-full ${language === 'ar' ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
            </button>
        )}
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 font-bold text-gray-600 text-sm">{t('userNameLabel')}</th>
                <th className="px-6 py-4 font-bold text-gray-600 text-sm">{t('role')}</th>
                <th className="px-6 py-4 font-bold text-gray-600 text-sm">{t('loginTime')}</th>
                <th className="px-6 py-4 font-bold text-gray-600 text-sm">{t('device')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                           <UserIcon size={18} />
                       </div>
                       <span className="font-bold text-gray-800">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getRoleBadgeColor(log.userRole)}`}>
                        {t(`role${log.userRole.charAt(0).toUpperCase() + log.userRole.slice(1)}` as any)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                        <Clock size={14} className="text-indigo-400" />
                        <span dir="ltr">{getRelativeTime(log.timestamp)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono truncate max-w-[200px]">
                        <Smartphone size={14} className="shrink-0" />
                        {log.deviceInfo}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
              <div className="p-20 text-center text-gray-400 flex flex-col items-center gap-3">
                  <History size={48} className="opacity-10" />
                  <p>{t('noLogs')}</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginHistory;
