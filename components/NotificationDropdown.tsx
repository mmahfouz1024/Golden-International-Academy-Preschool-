
import React from 'react';
import { Info, AlertTriangle, CheckCircle, Bell, X } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';

interface NotificationDropdownProps {
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead } = useNotification();
  const { t, language } = useLanguage();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={18} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={18} className="text-amber-500" />;
      case 'alert': return <AlertTriangle size={18} className="text-red-500" />;
      default: return <Info size={18} className="text-blue-500" />;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`absolute top-12 ${language === 'ar' ? 'left-0' : 'right-0'} w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-fade-in`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-50">
        <h3 className="font-bold text-gray-800">{t('notifications')}</h3>
        <div className="flex items-center gap-2">
          {notifications.some(n => !n.isRead) && (
            <button 
              onClick={markAllAsRead}
              className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
            >
              {t('markAllRead')}
            </button>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        </div>
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${notification.isRead ? 'opacity-60' : 'bg-blue-50/30'}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {formatTime(notification.time)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            <Bell size={32} className="mx-auto mb-2 opacity-20" />
            <p className="text-sm">{t('noNotifications')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
