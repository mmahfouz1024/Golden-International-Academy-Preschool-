
import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, MessageCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getUsers, getMessages, saveMessages } from '../services/storageService';
import { User, ChatMessage } from '../types';

const Chat: React.FC = () => {
  const { t, language } = useLanguage();
  const currentUser = JSON.parse(localStorage.getItem('golden_academy_users') || '[]').find((u: User) => u.id === localStorage.getItem('golden_session_uid'));
  
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    const allUsers = getUsers();
    const allMessages = getMessages();
    setMessages(allMessages);

    let filteredUsers = allUsers.filter(u => u.id !== currentUser.id);

    if (currentUser.role === 'parent') {
      // Parents can see admins AND managers
      filteredUsers = filteredUsers.filter(u => u.role === 'admin' || u.role === 'manager');
    }
    
    setUsers(filteredUsers);
  }, [currentUser, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mark messages as read when opening a chat
  useEffect(() => {
    if (isOpen && selectedUser && currentUser) {
      scrollToBottom();

      // Find unread messages from this sender
      const unreadMessages = messages.filter(m => 
        m.senderId === selectedUser.id && 
        m.receiverId === currentUser.id && 
        !m.isRead
      );

      if (unreadMessages.length > 0) {
        const updatedMessages = messages.map(m => {
          if (m.senderId === selectedUser.id && m.receiverId === currentUser.id && !m.isRead) {
            return { ...m, isRead: true };
          }
          return m;
        });
        setMessages(updatedMessages);
        saveMessages(updatedMessages);
      }
    }
  }, [selectedUser, isOpen, currentUser]); // Removed 'messages' from dependency to avoid loop, logic handled carefully

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !currentUser) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      receiverId: selectedUser.id,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isRead: false
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setNewMessage('');
    setTimeout(scrollToBottom, 100);
  };

  const getFilteredUsers = () => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const currentChatMessages = messages.filter(m => 
    (m.senderId === currentUser?.id && m.receiverId === selectedUser?.id) ||
    (m.senderId === selectedUser?.id && m.receiverId === currentUser?.id)
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Calculate total unread messages for the floating badge
  const totalUnreadCount = currentUser 
    ? messages.filter(m => m.receiverId === currentUser.id && !m.isRead).length 
    : 0;

  // Helper to get unread count per user
  const getUnreadCountForUser = (senderId: string) => {
    if (!currentUser) return 0;
    return messages.filter(m => m.senderId === senderId && m.receiverId === currentUser.id && !m.isRead).length;
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 ${language === 'ar' ? 'left-6' : 'right-6'} z-50 p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center ${
          isOpen ? 'bg-red-500 rotate-90' : 'bg-gradient-to-r from-indigo-600 to-purple-600'
        } text-white border-4 border-white`}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        
        {/* Total Unread Badge */}
        {!isOpen && totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white animate-bounce">
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </span>
        )}
      </button>

      {/* Chat Widget Popup */}
      {isOpen && (
        <div className={`fixed bottom-24 ${language === 'ar' ? 'left-6' : 'right-6'} w-[90vw] md:w-96 h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-40 animate-fade-in`}>
          
          {/* Header */}
          <div className="bg-indigo-600 p-4 text-white flex items-center justify-between shrink-0">
             <div className="flex items-center gap-3">
               {selectedUser && (
                 <button onClick={() => setSelectedUser(null)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                   {language === 'ar' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                 </button>
               )}
               <h3 className="font-bold text-lg">
                 {selectedUser ? selectedUser.name : t('chatTitle')}
               </h3>
             </div>
             {selectedUser && (
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                   <span className="text-xs opacity-80">{t(`role${selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}` as any)}</span>
                </div>
             )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden relative">
            
            {/* User List View */}
            <div className={`absolute inset-0 flex flex-col bg-white transition-transform duration-300 ${selectedUser ? (language === 'ar' ? 'translate-x-full' : '-translate-x-full') : 'translate-x-0'}`}>
                <div className="p-3 border-b border-gray-100 bg-gray-50">
                    <div className="relative">
                        <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={16} />
                        <input 
                        type="text" 
                        placeholder={t('search')}
                        className={`w-full ${language === 'ar' ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500 text-sm`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    {getFilteredUsers().map(user => {
                        const unread = getUnreadCountForUser(user.id);
                        return (
                            <button
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-50 last:border-0"
                            >
                                <div className="relative">
                                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${user.role === 'admin' ? 'bg-purple-500' : 'bg-green-500'}`}></span>
                                </div>
                                <div className="flex-1 text-start">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-gray-800 text-sm">{user.name}</h4>
                                        {unread > 0 && (
                                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                                {unread}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">{t(`role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` as any)}</p>
                                </div>
                                {language === 'ar' ? <ChevronLeft size={16} className="text-gray-300" /> : <ChevronRight size={16} className="text-gray-300" />}
                            </button>
                        );
                    })}
                    {getFilteredUsers().length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">
                         {t('noResults')}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Conversation View */}
            <div className={`absolute inset-0 flex flex-col bg-slate-50 transition-transform duration-300 ${selectedUser ? 'translate-x-0' : (language === 'ar' ? '-translate-x-full' : 'translate-x-full')}`}>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    {currentChatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                            <MessageCircle size={40} className="mb-2" />
                            <p className="text-sm">{t('noMessages')}</p>
                        </div>
                    ) : (
                        currentChatMessages.map(msg => {
                            const isMe = msg.senderId === currentUser.id;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`
                                        max-w-[80%] p-3 rounded-2xl text-sm shadow-sm relative
                                        ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-700 rounded-tl-none'}
                                    `}>
                                        <p>{msg.content}</p>
                                        <div className={`flex items-center gap-1 justify-end mt-1`}>
                                            <span className={`text-[10px] ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                            {isMe && (
                                                <span className="text-[10px] text-indigo-200">
                                                    {msg.isRead ? '✓✓' : '✓'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t('typeMessage')}
                        className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-indigo-500 bg-gray-50 text-sm"
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Chat;
