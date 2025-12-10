
import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, MessageCircle, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getUsers, getMessages, saveMessages } from '../services/storageService';
import { User, ChatMessage } from '../types';

const Chat: React.FC = () => {
  const { t, language } = useLanguage();
  const currentUser = JSON.parse(localStorage.getItem('golden_academy_users') || '[]').find((u: User) => u.id === localStorage.getItem('golden_session_uid'));
  
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    // Load Data
    const allUsers = getUsers();
    const allMessages = getMessages();
    setMessages(allMessages);

    // Filter Users based on Role
    let filteredUsers = allUsers.filter(u => u.id !== currentUser.id);

    if (currentUser.role === 'parent') {
      // Parents can ONLY see admins
      filteredUsers = filteredUsers.filter(u => u.role === 'admin');
    }
    // Admin, Manager, Teacher can see everyone (already handled by default)
    
    setUsers(filteredUsers);
  }, [currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedUser]);

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

  if (!currentUser) return null;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 md:gap-6">
      {/* Users List Sidebar */}
      <div className={`
        ${selectedUser ? 'hidden md:flex' : 'flex'} 
        flex-col w-full md:w-80 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden
      `}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t('chatTitle')}</h2>
          <div className="relative">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
            <input 
              type="text" 
              placeholder={t('search')}
              className={`w-full ${language === 'ar' ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {getFilteredUsers().map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                selectedUser?.id === user.id 
                  ? 'bg-indigo-50 border-indigo-100 shadow-sm' 
                  : 'hover:bg-gray-50 border-transparent'
              } border`}
            >
              <div className="relative">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" 
                />
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  user.role === 'admin' ? 'bg-purple-500' : 'bg-green-500'
                }`}></span>
              </div>
              <div className="flex-1 text-start">
                <h4 className={`font-bold text-sm ${selectedUser?.id === user.id ? 'text-indigo-700' : 'text-gray-800'}`}>
                  {user.name}
                </h4>
                <p className="text-xs text-gray-400 font-medium capitalize">
                  {t(`role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` as any)}
                </p>
              </div>
            </button>
          ))}
          {getFilteredUsers().length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              {t('noResults')}
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`
        ${!selectedUser ? 'hidden md:flex' : 'flex'} 
        flex-1 flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative
      `}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white z-10">
              <button 
                onClick={() => setSelectedUser(null)}
                className="md:hidden p-2 hover:bg-gray-50 rounded-lg text-gray-500"
              >
                <div className="rotate-180 transform">➜</div>
              </button>
              <img src={selectedUser.avatar} alt={selectedUser.name} className="w-10 h-10 rounded-full border border-gray-200" />
              <div>
                <h3 className="font-bold text-gray-800">{selectedUser.name}</h3>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Active Now
                </span>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {currentChatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                   <MessageCircle size={48} className="mb-2" />
                   <p>{t('noMessages')}</p>
                </div>
              ) : (
                currentChatMessages.map(msg => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`
                        max-w-[75%] p-3 rounded-2xl shadow-sm text-sm relative
                        ${isMe 
                          ? 'bg-indigo-600 text-white rounded-tr-none' 
                          : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'}
                      `}>
                        <p>{msg.content}</p>
                        <span className={`text-[10px] block mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('typeMessage')}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-gray-50"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={40} className="text-indigo-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">{t('chatTitle')}</h3>
            <p className="text-sm text-gray-500">{t('selectUserToChat')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
