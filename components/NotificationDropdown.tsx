
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Info, AlertTriangle, CheckCircle, Bell, X } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AppNotification } from '../types';

interface NotificationDropdownProps {
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead } = useNotification();
  const { t, language } = useLanguage();
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  const getIcon = (type: string, size: number = 18) => {
    switch (type) {
      case 'success': return <CheckCircle size={size} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={size} className="text-amber-500" />;
      case 'alert': return <AlertTriangle size={size} className="text-red-500" />;
      default: return <Info size={size} className="text-blue-500" />;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification.id);
    setSelectedNotification(notification);
  };

  return (
    <>
      {/* Dropdown List - Aligned Right relative to screen */}
      <div className={`fixed top-24 right-4 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-fade-in`}>
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
                  onClick={() => handleNotificationClick(notification)}
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

      {/* Detail Modal - Using Portal to break out of z-index stacking context */}
      {selectedNotification && ReactDOM.createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedNotification(null)}
          style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
        >
          <div 
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden relative border-4 border-white transform transition-all scale-100"
            onClick={e => e.stopPropagation()}
          >
             {/* Header with Color Coding */}
             <div className={`p-8 pb-12 flex flex-col items-center text-center relative ${
                selectedNotification.type === 'alert' ? 'bg-red-50' :
                selectedNotification.type === 'warning' ? 'bg-amber-50' :
                selectedNotification.type === 'success' ? 'bg-green-50' :
                'bg-blue-50'
             }`}>
                <button 
                  onClick={() => setSelectedNotification(null)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 bg-white/50 rounded-full hover:bg-white transition-colors"
                >
                   <X size={20} />
                </button>

                <div className={`p-6 rounded-full mb-4 shadow-sm bg-white ${
                     selectedNotification.type === 'alert' ? 'text-red-500' :
                     selectedNotification.type === 'warning' ? 'text-amber-500' :
                     selectedNotification.type === 'success' ? 'text-green-500' :
                     'text-blue-500'
                }`}>
                    {getIcon(selectedNotification.type, 40)}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 break-words w-full leading-tight">
                    {selectedNotification.title}
                </h3>
             </div>
             
             {/* Content Overlay */}
             <div className="relative -mt-6 bg-white rounded-t-[2rem] p-6 pt-8 text-center min-h-[150px]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 py-1 rounded-full shadow-sm text-xs font-bold text-gray-400 border border-gray-100">
                   {formatTime(selectedNotification.time)}
                </div>

                <div className="max-h-[40vh] overflow-y-auto custom-scrollbar">
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-lg">
                      {selectedNotification.message}
                  </p>
                </div>
             </div>

             {/* Footer */}
             <div className="p-4 border-t border-gray-50 bg-gray-50/50">
                <button 
                    onClick={() => setSelectedNotification(null)}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                >
                    {t('close')}
                </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default NotificationDropdown;
