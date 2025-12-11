
import React, { useState, useRef } from 'react';
import { User, Mail, Phone, Lock, Camera, Save, Check, Bell } from 'lucide-react';
import { User as UserType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';

interface ProfileProps {
  user: UserType;
  onUpdateUser: (updatedUser: UserType) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const { t, language } = useLanguage();
  const { requestPermission, permissionStatus } = useNotification();
  const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || '',
    phone: user.phone || '',
    interests: user.interests ? user.interests.join(', ') : '',
    avatar: user.avatar || ''
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: UserType = {
      ...user,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      interests: formData.interests.split(',').map(s => s.trim()).filter(Boolean),
      avatar: formData.avatar
    };
    
    onUpdateUser(updatedUser);
    showSuccess(t('profileUpdated'));
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (passwordData.current !== user.password) {
      setErrorMsg(t('passwordWrong'));
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      setErrorMsg(t('passwordMismatch'));
      return;
    }

    if (passwordData.new.length < 3) {
      setErrorMsg('Password too short');
      return;
    }

    const updatedUser: UserType = {
      ...user,
      password: passwordData.new
    };

    onUpdateUser(updatedUser);
    setPasswordData({ current: '', new: '', confirm: '' });
    showSuccess(t('profileUpdated'));
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      showSuccess(t('notificationsEnabled'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Sidebar / Photo Card */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload}
            />

            <div className="relative group cursor-pointer" onClick={triggerFileInput}>
              <img 
                src={formData.avatar || "https://picsum.photos/seed/default/200/200"} 
                alt="Profile" 
                className="w-32 h-32 rounded-full border-4 border-indigo-50 shadow-md object-cover"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mt-4">{user.name}</h2>
            <p className="text-sm text-gray-500 uppercase tracking-wide">{user.role}</p>
            <button 
              onClick={triggerFileInput}
              className="mt-4 text-sm text-indigo-600 font-medium hover:text-indigo-800"
            >
              {t('changePhoto')}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <button
               onClick={() => setActiveTab('details')}
               className={`w-full text-start px-6 py-4 text-sm font-medium flex items-center gap-3 transition-colors ${
                 activeTab === 'details' ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'
               }`}
             >
               <User size={18} />
               {t('personalInfo')}
             </button>
             <button
               onClick={() => setActiveTab('security')}
               className={`w-full text-start px-6 py-4 text-sm font-medium flex items-center gap-3 transition-colors ${
                 activeTab === 'security' ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'
               }`}
             >
               <Lock size={18} />
               {t('security')}
             </button>
          </div>
        </div>

        {/* Main Content Form */}
        <div className="flex-1 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
           
           <h3 className="text-xl font-bold text-gray-800 mb-6">
             {activeTab === 'details' ? t('personalInfo') : t('security')}
           </h3>

           {successMsg && (
             <div className="mb-6 bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-100 flex items-center gap-2 animate-fade-in">
               <Check size={18} />
               {successMsg}
             </div>
           )}

           {errorMsg && (
             <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 flex items-center gap-2 animate-fade-in">
               <User size={18} />
               {errorMsg}
             </div>
           )}

           {activeTab === 'details' ? (
             <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('fullName')}</label>
                  <div className="relative">
                    <User className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
                    <input 
                      type="text"
                      className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('email')}</label>
                    <div className="relative">
                      <Mail className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
                      <input 
                        type="email"
                        className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('mobile')}</label>
                    <div className="relative">
                      <Phone className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
                      <input 
                        type="tel"
                        className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('interests')}</label>
                  <textarea 
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                    value={formData.interests}
                    onChange={e => setFormData({...formData, interests: e.target.value})}
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                  >
                    <Save size={18} />
                    {t('updateProfile')}
                  </button>
                </div>
             </form>
           ) : (
             <div className="space-y-8">
                 {/* Notification Permission Card */}
                 <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-indigo-100">
                    <div className="flex items-start gap-4">
                       <div className="p-3 bg-white rounded-full text-indigo-600 shadow-sm">
                          <Bell size={24} />
                       </div>
                       <div className="flex-1">
                          <h4 className="font-bold text-gray-800 mb-1">{t('enableNotifications')}</h4>
                          <p className="text-sm text-gray-600 mb-4">{t('notificationsDesc')}</p>
                          <button 
                             onClick={handleEnableNotifications}
                             disabled={permissionStatus === 'granted'}
                             className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                                permissionStatus === 'granted' 
                                  ? 'bg-green-100 text-green-700 cursor-default'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                             }`}
                          >
                             {permissionStatus === 'granted' ? t('notificationsEnabled') : t('enableNotifications')}
                          </button>
                       </div>
                    </div>
                 </div>

                 <form onSubmit={handlePasswordChange} className="space-y-6 pt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('currentPassword')}</label>
                      <input 
                        type="password"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        value={passwordData.current}
                        onChange={e => setPasswordData({...passwordData, current: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('newPassword')}</label>
                      <input 
                        type="password"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        value={passwordData.new}
                        onChange={e => setPasswordData({...passwordData, new: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('confirmPassword')}</label>
                      <input 
                        type="password"
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        value={passwordData.confirm}
                        onChange={e => setPasswordData({...passwordData, confirm: e.target.value})}
                      />
                    </div>

                    <div className="pt-4">
                      <button 
                        type="submit"
                        className="bg-red-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition-all flex items-center gap-2"
                      >
                        <Lock size={18} />
                        {t('changePassword')}
                      </button>
                    </div>
                 </form>
             </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default Profile;
