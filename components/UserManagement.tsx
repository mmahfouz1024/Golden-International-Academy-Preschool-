
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Shield, X, Save } from 'lucide-react';
import { getUsers, saveUsers, getStudents } from '../services/storageService';
import { User, UserRole, Student } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const UserManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Load users and students from storage on mount
  useEffect(() => {
    setUsers(getUsers());
    setStudents(getStudents());
  }, []);

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    username: '',
    password: '',
    role: 'teacher',
    linkedStudentId: ''
  });

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        username: user.username,
        password: user.password,
        role: user.role,
        linkedStudentId: user.linkedStudentId || ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'teacher',
        linkedStudentId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.name || !formData.password) return;

    let updatedUsers: User[];

    if (editingUser) {
      updatedUsers = users.map(u => u.id === editingUser.id ? { ...u, ...formData } as User : u);
    } else {
      const newUser: User = {
        id: `u-${Date.now()}`,
        avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
        name: formData.name!,
        username: formData.username!,
        password: formData.password!,
        role: formData.role || 'teacher',
        linkedStudentId: formData.linkedStudentId,
      } as User;
      updatedUsers = [...users, newUser];
    }
    
    setUsers(updatedUsers);
    saveUsers(updatedUsers); // Persist to LocalStorage
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('deleteUserConfirm'))) {
      const updatedUsers = users.filter(u => u.id !== id);
      setUsers(updatedUsers);
      saveUsers(updatedUsers); // Persist to LocalStorage
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'teacher': return 'bg-blue-100 text-blue-700';
      case 'parent': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.includes(searchTerm) || u.username.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('userManagement')}</h2>
          <p className="text-gray-500 mt-1">{t('manageUsers')}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={20} />
          <span>{t('addUser')}</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="relative max-w-md">
          <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')}
            className={`w-full ${language === 'ar' ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">{t('username')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">{t('role')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">{t('linkedStudent')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => {
                const linkedStudent = students.find(s => s.id === user.linkedStudentId);
                return (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                        {user.role === 'admin' && <Shield size={12} />}
                        {t(`role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` as any)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'parent' ? (
                        linkedStudent ? (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <img src={linkedStudent.avatar} className="w-6 h-6 rounded-full" />
                            {linkedStudent.name}
                          </div>
                        ) : (
                          <span className="text-sm text-red-500 italic">{t('noLinkedStudent')}</span>
                        )
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => handleOpenModal(user)}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">{editingUser ? t('editUser') : t('addUser')}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('studentName')}</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="الاسم الكامل"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('username')}</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('role')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['admin', 'teacher', 'parent'] as UserRole[]).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setFormData({...formData, role})}
                      className={`py-2 rounded-lg text-sm border font-medium transition-all ${
                        formData.role === role
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t(`role${role.charAt(0).toUpperCase() + role.slice(1)}` as any)}
                    </button>
                  ))}
                </div>
              </div>

              {formData.role === 'parent' && (
                <div className="animate-fade-in p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('linkedStudent')}</label>
                  <select
                    className="w-full px-4 py-2 border border-yellow-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 bg-white"
                    value={formData.linkedStudentId}
                    onChange={e => setFormData({...formData, linkedStudentId: e.target.value})}
                  >
                    <option value="">{t('selectStudent')}</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.classGroup})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    * سيتمكن ولي الأمر هذا من رؤية تقارير الطالب المختار فقط.
                  </p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors flex justify-center items-center gap-2"
                >
                  <Save size={18} />
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
