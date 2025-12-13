
import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, MessageCircle, X, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getUsers, getMessages, saveMessages, syncMessages } from '../services/storageService';
import { User, ChatMessage } from '../types';

// Sound effect for sending messages - Reliable Pop Sound
const SEND_SOUND_URL = "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3";

const Chat: React.FC = () => {
  const { t, language } = useLanguage();
  
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Audio ref for consistent playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio on mount
  useEffect(() => {
    audioRef.current = new Audio(SEND_SOUND_URL);
    audioRef.current.volume = 0.5; 
    audioRef.current.preload = 'auto';
  }, []);

  // Load Data function
  const loadData = () => {
    // 1. Get Current User securely
    const allUsers = getUsers();
    const storedUid = localStorage.getItem('golden_session_uid');
    
    if (!storedUid) return;
    
    const myUser = allUsers.find(u => u.id === storedUid);
    if (!myUser) return;
    
    setCurrentUser(myUser);

    // 2. Load Messages (Initial)
    const allMessages = getMessages();
    setMessages(allMessages);

    // 3. Filter Users for the Contact List
    let filteredUsers = allUsers.filter(u => u.id !== myUser.id);

    // HIDE GENERAL MANAGER (role 'admin') from chat contact list
    filteredUsers = filteredUsers.filter(u => u.role !== 'admin');

    if (myUser.role === 'parent') {
      // Parent sees ONLY Manager (displayed as "Admin" in UI)
      filteredUsers = filteredUsers.filter(u => u.role === 'manager');
    } 
    // Admin/Manager/Teacher see everyone (except themselves and General Manager)
    
    setUsers(filteredUsers);
  };

  // Initialize Data when Chat Opens or on Mount
  useEffect(() => {
    loadData();
  }, [isOpen]);

  // Polling for real-time updates (Cloud Sync & Local Sync)
  useEffect(() => {
    // We poll even if closed to show notification badge, but less frequently if closed
    const pollInterval = isOpen ? 3000 : 10000;

    const interval = setInterval(async () => {
      // 1. Sync messages from cloud (if enabled)
      const freshMessages = await syncMessages();
      
      setMessages(prev => {
        // Simple optimization: only update state if length changed or last ID changed
        // For a small app, strict equality check via JSON is acceptable
        if (JSON.stringify(prev) !== JSON.stringify(freshMessages)) {
          return freshMessages;
        }
        return prev;
      });
      
      // Refresh Users occasionally (in case someone new registered)
      if (isOpen) {
         // We can just re-read local users here
         const currentUsers = getUsers();
         if (currentUser && currentUsers.length - 1 !== users.length) {
             // Re-run filter logic if counts mismatch roughly
             loadData();
         }
      }

    }, pollInterval); 

    // Also listen for local storage events (Cross-tab sync for same browser)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'golden_academy_messages') {
        const freshMessages = getMessages();
        setMessages(freshMessages);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isOpen, users.length, currentUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mark messages as read and scroll to bottom
  useEffect(() => {
    if (isOpen && selectedUser && currentUser) {
      const hasUnread = messages.some(m => 
        m.senderId === selectedUser.id && 
        m.receiverId === currentUser.id && 
        !m.isRead
      );

      if (hasUnread) {
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
  }, [messages.length, isOpen, selectedUser, currentUser?.id]);

  // Scroll to bottom when opening a chat or sending a message
  useEffect(() => {
    if (isOpen && selectedUser) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, selectedUser, isOpen]);

  const playSendSound = () => {
    if (audioRef.current) {
      // Reset time to 0 to allow rapid replays
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => {
          // Ignore abort errors from rapid clicks
          if (e.name !== 'AbortError') {
             console.warn("Audio play prevented:", e);
          }
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
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

    // Update state immediately for UX
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    
    // Play Sound
    playSendSound();
    
    // Persist to storage (and sync to cloud)
    saveMessages(updatedMessages);
    
    setNewMessage('');
    setTimeout(scrollToBottom, 50);
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

  // If user is not logged in, don't show chat button
  if (!localStorage.getItem('golden_session_uid')) return null;

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
      {isOpen && currentUser && (
        <div className={`fixed bottom-24 ${language === 'ar' ? 'left-6' : 'right-6'} w-[90vw] md:w-96 h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden z-40 animate-fade-in`}>
          
          {/* Header */}
          <div className="bg-indigo-600 p-4 text-white flex items-center justify-between shrink-0 shadow-md z-10">
             <div className="flex items-center gap-3">
               {selectedUser ? (
                 <button onClick={() => setSelectedUser(null)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                   {language === 'ar' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                 </button>
               ) : (
                 <MessageCircle size={20} />
               )}
               
               <div className="flex flex-col">
                 <h3 className="font-bold text-lg leading-none">
                   {selectedUser ? selectedUser.name : t('chatTitle')}
                 </h3>
                 {selectedUser && (
                   <span className="text-[10px] opacity-80 font-normal mt-1">
                     {t(`role${selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}` as any)}
                   </span>
                 )}
               </div>
             </div>
             {selectedUser && (
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse border-2 border-indigo-600"></div>
             )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden relative bg-white">
            
            {!selectedUser ? (
              // ---------------- USER LIST VIEW ----------------
              <div className="flex flex-col h-full bg-white">
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
                    {getFilteredUsers().length > 0 ? (
                      getFilteredUsers().map(user => {
                          const unread = getUnreadCountForUser(user.id);
                          return (
                              <button
                                  key={user.id}
                                  onClick={() => setSelectedUser(user)}
                                  className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 rounded-xl transition-all border-b border-gray-50 last:border-0 group"
                              >
                                  <div className="relative">
                                      <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-indigo-200" />
                                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${user.role === 'admin' ? 'bg-purple-500' : 'bg-green-500'}`}></span>
                                  </div>
                                  <div className="flex-1 text-start">
                                      <div className="flex justify-between items-center mb-1">
                                          <h4 className="font-bold text-gray-800 text-sm group-hover:text-indigo-700">{user.name}</h4>
                                          {unread > 0 && (
                                              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                                                  {unread}
                                              </span>
                                          )}
                                      </div>
                                      <p className="text-xs text-gray-500 truncate group-hover:text-indigo-400">
                                        {t(`role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` as any)}
                                      </p>
                                  </div>
                                  <div className="text-gray-300 group-hover:text-indigo-400">
                                    {language === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                                  </div>
                              </button>
                          );
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        <UserIcon size={32} className="mb-2 opacity-20" />
                        <p className="text-sm">{t('noResults')}</p>
                      </div>
                    )}
                </div>
              </div>
            ) : (
              // ---------------- CHAT CONVERSATION VIEW ----------------
              <div className="flex flex-col h-full bg-slate-50">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {currentChatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                            <MessageCircle size={48} className="mb-2" />
                            <p className="text-sm">{t('noMessages')}</p>
                            <p className="text-xs">{t('typeMessage')}</p>
                        </div>
                    ) : (
                        currentChatMessages.map(msg => {
                            const isMe = msg.senderId === currentUser.id;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`
                                        max-w-[80%] p-3 rounded-2xl text-sm shadow-sm relative group
                                        ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'}
                                    `}>
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                        <div className={`flex items-center gap-1 justify-end mt-1`}>
                                            <span className={`text-[10px] ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                            {isMe && (
                                                <span className={`text-[10px] ${msg.isRead ? 'text-green-300' : 'text-indigo-300'}`}>
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
                
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t('typeMessage')}
                        className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-gray-50 text-sm transition-all"
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:bg-gray-300 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
                    >
                        <Send size={18} />
                    </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Chat;
