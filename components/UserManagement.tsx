
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Shield, X, School, Briefcase, AlertCircle, CheckCircle, Save as SaveIcon } from 'lucide-react';
import { getUsers, saveUsers, getStudents, getClasses, saveClasses } from '../services/storageService';
import { User, UserRole, Student, ClassGroup } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const UserManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Default permissions for each role
  const DEFAULT_PERMISSIONS = {
    admin: ['dashboard', 'students', 'attendance', 'reports-archive', 'directory', 'ai-planner', 'classes', 'users', 'database'],
    manager: ['dashboard', 'students', 'attendance', 'reports-archive', 'directory', 'ai-planner', 'classes', 'database'],
    teacher: ['dashboard', 'students', 'attendance', 'reports-archive', 'directory', 'ai-planner'],
    parent: ['parent-view']
  };

  const ALL_PAGES = [
    { id: 'dashboard', label: t('dashboard') },
    { id: 'students', label: t('students') },
    { id: 'attendance', label: t('attendance') },
    { id: 'reports-archive', label: t('reportsArchive') },
    { id: 'directory', label: t('directoryTitle') },
    { id: 'ai-planner', label: t('aiPlanner') },
    { id: 'classes', label: t('classes') },
    { id: 'users', label: t('users') },
    { id: 'database', label: t('database') },
  ];

  // Load users, students, and classes from storage on mount
  useEffect(() => {
    setUsers(getUsers());
    setStudents(getStudents());
    setClasses(getClasses());
  }, []);

  const [formData, setFormData] = useState<Partial<User> & { assignedClassId?: string }>({
    name: '',
    username: '',
    password: '',
    role: 'teacher',
    permissions: [],
    linkedStudentId: '',
    assignedClassId: ''
  });

  const handleOpenModal = (user?: User) => {
    setError('');
    setSuccessMsg('');
    if (user) {
      setEditingUser(user);
      // Find class where this user is the teacher
      const assignedClass = classes.find(c => c.teacherId === user.id);
      
      setFormData({
        name: user.name,
        username: user.username,
        password: user.password,
        role: user.role,
        permissions: user.permissions || DEFAULT_PERMISSIONS[user.role as keyof typeof DEFAULT_PERMISSIONS] || [],
        linkedStudentId: user.linkedStudentId || '',
        assignedClassId: assignedClass ? assignedClass.id : ''
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'teacher',
        permissions: DEFAULT_PERMISSIONS['teacher'],
        linkedStudentId: '',
        assignedClassId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData({
      ...formData,
      role,
      permissions: DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS] || []
    });
  };

  const togglePermission = (pageId: string) => {
    const currentPerms = formData.permissions || [];
    if (currentPerms.includes(pageId)) {
      setFormData({ ...formData, permissions: currentPerms.filter(id => id !== pageId) });
    } else {
      setFormData({ ...formData, permissions: [...currentPerms, pageId] });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.name || !formData.password) return;

    // Check for duplicate username
    const usernameToCheck = (formData.username || '').trim().toLowerCase();
    const isDuplicate = users.some(u => 
      u.username.toLowerCase() === usernameToCheck && 
      (!editingUser || u.id !== editingUser.id)
    );

    if (isDuplicate) {
      setError(t('usernameExists' as any));
      return;
    }

    let updatedUsers: User[];
    let userId = editingUser ? editingUser.id : `u-${Date.now()}`;

    // 1. Save User Logic
    if (editingUser) {
      updatedUsers = users.map(u => u.id === editingUser.id ? { ...u, ...formData, username: (formData.username || '').trim(), id: userId } as User : u);
    } else {
      const newUser: User = {
        id: userId,
        avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
        name: formData.name!,
        username: (formData.username || '').trim(),
        password: formData.password!,
        role: formData.role || 'teacher',
        permissions: formData.permissions,
        linkedStudentId: formData.linkedStudentId,
      } as User;
      updatedUsers = [...users, newUser];
    }
    setUsers(updatedUsers);
    saveUsers(updatedUsers);

    // 2. Assign/Unassign Class Logic
    const canHaveClass = formData.role === 'teacher' || formData.role === 'manager';
    const targetClassId = formData.assignedClassId;

    const updatedClasses = classes.map(cls => {
      // If this is the new target class and the user is allowed to have one, assign them
      if (canHaveClass && cls.id === targetClassId) {
        return { ...cls, teacherId: userId };
      }
      
      // If this user was previously assigned to this class
      if (cls.teacherId === userId) {
         // But they either can't have a class anymore (role changed)
         // OR they are now assigned to a different class
         // OR they are unassigned (targetClassId is empty)
         if (!canHaveClass || cls.id !== targetClassId) {
           return { ...cls, teacherId: undefined };
         }
      }
      return cls;
    });

    setClasses(updatedClasses);
    saveClasses(updatedClasses);

    setSuccessMsg(t('savedSuccessfully'));
    setTimeout(() => setIsModalOpen(false), 1000);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event bubbling
    
    if (window.confirm(t('deleteUserConfirm'))) {
      const updatedUsers = users.filter(u => u.id !== id);
      setUsers(updatedUsers);
      saveUsers(updatedUsers); 
      
      // Also unassign from any classes
      const updatedClasses = classes.map(c => c.teacherId === id ? { ...c, teacherId: undefined } : c);
      setClasses(updatedClasses);
      saveClasses(updatedClasses);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'manager': return 'bg-orange-100 text-orange-700';
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
          type="button"
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
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">{t('details')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => {
                const linkedStudent = students.find(s => s.id === user.linkedStudentId);
                const assignedClass = classes.find(c => c.teacherId === user.id);
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => handleOpenModal(user)}>
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
                        {user.role === 'manager' && <Briefcase size={12} />}
                        {t(`role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` as any)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'parent' ? (
                        linkedStudent ? (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="text-xs text-gray-400">{t('linkedStudent')}:</span>
                            <img src={linkedStudent.avatar} className="w-6 h-6 rounded-full" />
                            {linkedStudent.name}
                          </div>
                        ) : (
                          <span className="text-sm text-red-500 italic">{t('noLinkedStudent')}</span>
                        )
                      ) : (user.role === 'teacher' || user.role === 'manager') ? (
                         assignedClass ? (
                          <div className="flex items-center gap-2 text-sm text-indigo-700">
                             <School size={14} />
                             {assignedClass.name}
                          </div>
                         ) : (
                           <span className="text-xs text-gray-400">{t('noClassAssigned')}</span>
                         )
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenModal(user); }}
                          type="button"
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors z-10"
                        >
                          <Edit2 size={18} className="pointer-events-none" />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => handleDelete(e, user.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors z-10"
                        >
                          <Trash2 size={18} className="pointer-events-none" />
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
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
              
              {successMsg && (
                 <div className="bg-green-50 text-green-600 px-4 py-3 rounded-xl border border-green-100 flex items-center gap-2 text-sm animate-fade-in">
                   <CheckCircle size={18} />
                   {successMsg}
                 </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 flex items-center gap-2 text-sm animate-fade-in">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('userNameLabel')}</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
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
                    type="password" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('role')}</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['admin', 'manager', 'teacher', 'parent'] as UserRole[]).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleChange(role)}
                      className={`py-2 rounded-lg text-xs font-medium transition-all ${
                        formData.role === role
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t(`role${role.charAt(0).toUpperCase() + role.slice(1)}` as any)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Fields based on Role */}
              {formData.role === 'parent' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('linkedStudent')}</label>
                  <div className="flex items-center gap-3">
                    <select
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                      value={formData.linkedStudentId || ''}
                      onChange={e => setFormData({...formData, linkedStudentId: e.target.value})}
                    >
                      <option value="">{t('selectStudent')}</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>{student.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {(formData.role === 'teacher' || formData.role === 'manager') && (
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                   <label className="block text-sm font-medium text-indigo-800 mb-2 flex items-center gap-2">
                     <School size={16} />
                     {t('assignClass')}
                   </label>
                   <select
                      className="w-full px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                      value={formData.assignedClassId || ''}
                      onChange={e => setFormData({...formData, assignedClassId: e.target.value})}
                    >
                      <option value="">{t('selectClass')}</option>
                      {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} {cls.teacherId && cls.teacherId !== (editingUser?.id) ? `(${t('assignedTeacher')})` : ''}
                        </option>
                      ))}
                    </select>
                </div>
              )}

              {/* Permissions Section */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-sm font-bold text-gray-800 mb-3">{t('permissions')}</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {ALL_PAGES.map(page => {
                    const isChecked = formData.permissions?.includes(page.id);
                    return (
                      <div 
                        key={page.id} 
                        onClick={() => togglePermission(page.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                        }`}
                      >
                         <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                           isChecked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'
                         }`}>
                           {isChecked && <div className="text-white text-[10px]">✓</div>} 
                         </div>
                         <span className={`text-xs font-medium ${isChecked ? 'text-indigo-700' : 'text-gray-600'}`}>{page.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

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
                  disabled={!!successMsg}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors flex justify-center items-center gap-2"
                >
                  {successMsg ? <CheckCircle size={18} /> : <SaveIcon size={18} />}
                  {successMsg ? t('savedSuccessfully') : t('save')}
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
