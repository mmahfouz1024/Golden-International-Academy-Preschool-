
import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Shield, X, School, Briefcase, AlertCircle, CheckCircle, Save as SaveIcon, Edit2, ChevronLeft, ChevronRight, UserPlus, Users, Calendar } from 'lucide-react';
import { getUsers, saveUsers, getStudents, saveStudents, getClasses, saveClasses } from '../services/storageService';
import { User, UserRole, Student, ClassGroup, StudentStatus } from '../types';
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

  const [formData, setFormData] = useState<Partial<User> & { assignedClassIds?: string[] }>({
    name: '',
    username: '',
    password: '',
    role: 'teacher',
    permissions: [],
    linkedStudentId: '',
    assignedClassIds: []
  });

  // State for quick student registration
  const [isRegisteringStudent, setIsRegisteringStudent] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    name: '',
    age: '4',
    birthday: '',
    classGroup: ''
  });

  const handleOpenModal = (user?: User) => {
    setError('');
    setSuccessMsg('');
    setIsRegisteringStudent(false);
    setNewStudentData({ name: '', age: '4', birthday: '', classGroup: '' });

    if (user) {
      setEditingUser(user);
      // Find classes where this user is the teacher
      const assignedClasses = classes.filter(c => c.teacherId === user.id);
      
      setFormData({
        name: user.name,
        username: user.username,
        password: user.password,
        role: user.role,
        permissions: user.permissions || DEFAULT_PERMISSIONS[user.role as keyof typeof DEFAULT_PERMISSIONS] || [],
        linkedStudentId: user.linkedStudentId || '',
        assignedClassIds: assignedClasses.map(c => c.id)
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
        assignedClassIds: []
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
    // Reset student registration if leaving parent role
    if (role !== 'parent') {
        setIsRegisteringStudent(false);
    }
  };

  const togglePermission = (pageId: string) => {
    const currentPerms = formData.permissions || [];
    if (currentPerms.includes(pageId)) {
      setFormData({ ...formData, permissions: currentPerms.filter(id => id !== pageId) });
    } else {
      setFormData({ ...formData, permissions: [...currentPerms, pageId] });
    }
  };

  const toggleClassAssignment = (classId: string) => {
    const currentClasses = formData.assignedClassIds || [];
    if (currentClasses.includes(classId)) {
      setFormData({ ...formData, assignedClassIds: currentClasses.filter(id => id !== classId) });
    } else {
      setFormData({ ...formData, assignedClassIds: [...currentClasses, classId] });
    }
  };

  // Helper to calculate age from birthday
  const handleBirthdayChange = (val: string) => {
    let age = newStudentData.age;
    if (val) {
        const birthDate = new Date(val);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge--;
        }
        // Ensure reasonable age for kindergarten (e.g. at least 2)
        if (calculatedAge >= 0) age = calculatedAge.toString();
    }
    setNewStudentData({ ...newStudentData, birthday: val, age });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.name || !formData.password) return;

    // Validation: Parent must have a linked student
    let finalLinkedStudentId = formData.linkedStudentId;

    if (formData.role === 'parent') {
        // Option A: Registering a NEW student
        if (isRegisteringStudent) {
            if (!newStudentData.name) {
                setError("Please enter the new child's name.");
                return;
            }
            // Create the new student first
            const newStudentId = Date.now().toString();
            const newStudent: Student = {
                id: newStudentId,
                name: newStudentData.name,
                age: parseInt(newStudentData.age) || 4,
                birthday: newStudentData.birthday,
                classGroup: newStudentData.classGroup || (classes.length > 0 ? classes[0].name : 'Birds'),
                parentName: formData.name || 'Parent', // Temporary parent name until user is saved
                phone: '', // Will be updated if user provides phone
                status: StudentStatus.Active,
                attendanceToday: false,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newStudentData.name)}&background=random&color=fff`
            };

            // Save new student to state and storage
            const updatedStudentsList = [...students, newStudent];
            setStudents(updatedStudentsList);
            saveStudents(updatedStudentsList);

            finalLinkedStudentId = newStudentId;
        } 
        // Option B: Selecting existing student
        else if (!finalLinkedStudentId) {
            setError("Please select a student to link with this parent account.");
            return;
        }
    } else {
        // If not parent, clear linked student
        finalLinkedStudentId = ''; 
    }

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
      updatedUsers = users.map(u => u.id === editingUser.id ? { 
          ...u, 
          ...formData, 
          username: (formData.username || '').trim(), 
          id: userId,
          linkedStudentId: finalLinkedStudentId
      } as User : u);
    } else {
      const newUser: User = {
        id: userId,
        avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
        name: formData.name!,
        username: (formData.username || '').trim(),
        password: formData.password!,
        role: formData.role || 'teacher',
        permissions: formData.permissions,
        linkedStudentId: finalLinkedStudentId,
      } as User;
      updatedUsers = [...users, newUser];
    }
    setUsers(updatedUsers);
    saveUsers(updatedUsers);

    // If we created a new student, ensure their "parentName" matches the user name we just saved
    if (isRegisteringStudent && finalLinkedStudentId) {
       const fixedStudents = getStudents().map(s => s.id === finalLinkedStudentId ? { ...s, parentName: formData.name! } : s);
       setStudents(fixedStudents);
       saveStudents(fixedStudents);
    }

    // 2. Assign/Unassign Multiple Classes Logic
    const canHaveClass = formData.role === 'teacher';
    const targetClassIds = formData.assignedClassIds || [];

    const updatedClasses = classes.map(cls => {
      // If this class is selected in the modal, assign it to this user (overwrite previous teacher)
      if (canHaveClass && targetClassIds.includes(cls.id)) {
        return { ...cls, teacherId: userId };
      }
      
      // If this user was previously assigned to this class, but now it is unchecked (not in targetClassIds)
      if (cls.teacherId === userId && !targetClassIds.includes(cls.id)) {
        return { ...cls, teacherId: undefined };
      }

      // If role changed from teacher to something else, clear assignment
      if (!canHaveClass && cls.teacherId === userId) {
        return { ...cls, teacherId: undefined };
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
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t('userManagement')}</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">{t('manageUsers')}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm sm:text-base"
        >
          <Plus size={18} />
          <span>{t('addUser')}</span>
        </button>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="relative max-w-md">
          <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
          <input 
            type="text" 
            placeholder={t('search')}
            className={`w-full ${language === 'ar' ? 'pl-9 pr-9' : 'pr-4 pl-9'} py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs sm:text-sm">
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600">{t('userNameLabel')}</th>
                <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600">{t('role')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600">{t('username')}</th>
                <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600">{t('details')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                  onClick={() => handleOpenModal(user)}
                >
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                      <div className="flex flex-col">
                         <span className="font-medium text-gray-900 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">{user.name}</span>
                         <span className="sm:hidden text-[10px] text-gray-400 font-medium">
                            {t(`role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` as any)}
                         </span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4">
                     <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${getRoleBadge(user.role)}`}>
                       {t(`role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}` as any)}
                     </span>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-gray-600">
                    @{user.username}
                  </td>
                  <td className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4">
                     {user.role === 'teacher' && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <School size={14} className="text-gray-400" />
                          <span className="truncate max-w-[150px]">
                            {classes.filter(c => c.teacherId === user.id).length > 0 
                              ? classes.filter(c => c.teacherId === user.id).map(c => c.name).join(', ')
                              : <span className="text-gray-400 italic text-xs">{t('noClassAssigned')}</span>}
                          </span>
                        </div>
                      )}
                      {user.role === 'parent' && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Briefcase size={14} className="text-gray-400" />
                          <span>{students.find(s => s.id === user.linkedStudentId)?.name || <span className="text-gray-400 italic text-xs">{t('noLinkedStudent')}</span>}</span>
                        </div>
                      )}
                      {(user.role === 'admin' || user.role === 'manager') && (
                         <span className="text-gray-400 text-xs italic">-</span>
                      )}
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 text-left">
                     <div className="flex items-center gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                       <button 
                         type="button"
                         onClick={(e) => { e.stopPropagation(); handleOpenModal(user); }}
                         className="text-gray-400 hover:text-indigo-600 p-1.5 sm:p-2 hover:bg-indigo-50 rounded-lg transition-colors pointer-events-auto"
                         title={t('edit')}
                       >
                         <Edit2 size={16} className="pointer-events-none" />
                       </button>
                       <button 
                         type="button"
                         onClick={(e) => handleDelete(e, user.id)}
                         className="text-gray-400 hover:text-red-600 p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors pointer-events-auto"
                         title={t('delete')}
                       >
                         <Trash2 size={16} className="pointer-events-none" />
                       </button>
                       <div className="text-gray-300 px-0.5 hidden sm:block">|</div>
                       <button 
                         type="button"
                         className="text-gray-300 hover:text-indigo-600 p-1.5 sm:p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                         onClick={() => handleOpenModal(user)}
                       >
                         {language === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-8 sm:p-12 text-center text-gray-400">
            {t('noResults')}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
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
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl border border-green-100 flex items-center gap-2 animate-fade-in">
                  <CheckCircle size={18} />
                  {successMsg}
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 flex items-center gap-2 animate-fade-in">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('userNameLabel')}</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

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

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('role')}</label>
                  <select
                     className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                     value={formData.role}
                     onChange={e => handleRoleChange(e.target.value as UserRole)}
                  >
                    <option value="admin">{t('roleAdmin')}</option>
                    <option value="manager">{t('roleManager')}</option>
                    <option value="teacher">{t('roleTeacher')}</option>
                    <option value="parent">{t('roleParent')}</option>
                  </select>
                </div>

                {/* Conditional Fields based on Role */}
                {formData.role === 'parent' && (
                  <div className="col-span-2 bg-green-50 p-4 rounded-xl border border-green-100 transition-all">
                    <div className="flex justify-between items-center mb-2">
                       <label className="block text-sm font-bold text-green-800">
                           {isRegisteringStudent ? t('registerNewStudent') : t('linkedStudent')}
                       </label>
                       
                       {/* Toggle Button for Quick Registration */}
                       <button
                         type="button"
                         onClick={() => setIsRegisteringStudent(!isRegisteringStudent)}
                         className="text-xs flex items-center gap-1 text-green-700 hover:text-green-900 font-bold underline"
                       >
                         {isRegisteringStudent ? (
                             <>
                                <Users size={12} />
                                {t('selectExistingStudent')}
                             </>
                         ) : (
                             <>
                                <UserPlus size={12} />
                                {t('childNotListed')}
                             </>
                         )}
                       </button>
                    </div>

                    {isRegisteringStudent ? (
                        <div className="space-y-3 animate-fade-in bg-white p-3 rounded-lg border border-green-200">
                             <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">{t('childName')}</label>
                                <input
                                  type="text"
                                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm"
                                  placeholder="Child's Full Name"
                                  value={newStudentData.name}
                                  onChange={e => setNewStudentData({...newStudentData, name: e.target.value})}
                                />
                             </div>
                             
                             <div className="flex gap-3 items-center">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('birthday')}</label>
                                    <div className="relative">
                                      <input
                                        type="date"
                                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm"
                                        value={newStudentData.birthday}
                                        onChange={e => handleBirthdayChange(e.target.value)}
                                      />
                                      <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="w-20">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">{t('studentAge')}</label>
                                    <input
                                      type="number"
                                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm bg-gray-50"
                                      value={newStudentData.age}
                                      onChange={e => setNewStudentData({...newStudentData, age: e.target.value})}
                                    />
                                </div>
                             </div>

                             <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">{t('childClass')}</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
                                    value={newStudentData.classGroup}
                                    onChange={e => setNewStudentData({...newStudentData, classGroup: e.target.value})}
                                >
                                    <option value="">Select...</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                    {classes.length === 0 && <option value="Birds">Birds</option>}
                                </select>
                             </div>
                        </div>
                    ) : (
                        <select
                          className="w-full px-4 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 bg-white"
                          value={formData.linkedStudentId}
                          onChange={e => setFormData({...formData, linkedStudentId: e.target.value})}
                        >
                          <option value="">{t('selectStudent')}</option>
                          {students.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.classGroup})</option>
                          ))}
                        </select>
                    )}
                  </div>
                )}

                {formData.role === 'teacher' && (
                  <div className="col-span-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <label className="block text-sm font-bold text-blue-800 mb-2">{t('assignClass')}</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {classes.map(cls => (
                        <label key={cls.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-blue-100 cursor-pointer hover:bg-blue-50/50 transition-colors">
                          <input 
                            type="checkbox"
                            className="text-blue-600 rounded focus:ring-blue-500"
                            checked={formData.assignedClassIds?.includes(cls.id)}
                            onChange={() => toggleClassAssignment(cls.id)}
                          />
                          <span className="text-sm text-gray-700 font-medium">{cls.name}</span>
                          {cls.teacherId && cls.teacherId !== editingUser?.id && (
                            <span className="text-xs text-orange-500 ml-auto">({t('assignedTeacher')}: {users.find(u => u.id === cls.teacherId)?.name})</span>
                          )}
                        </label>
                      ))}
                      {classes.length === 0 && <p className="text-sm text-gray-500 italic">{t('noClassAssigned')}</p>}
                    </div>
                  </div>
                )}
                
                {/* Advanced Permissions */}
                {(formData.role === 'manager' || formData.role === 'admin' || formData.role === 'teacher') && (
                  <div className="col-span-2 mt-2">
                     <div className="flex items-center gap-2 mb-2">
                       <Shield size={16} className="text-gray-400" />
                       <label className="text-sm font-medium text-gray-700">{t('permissions')}</label>
                     </div>
                     <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-100 rounded-lg">
                       {ALL_PAGES.map(page => (
                         <label key={page.id} className="flex items-center gap-2 text-sm p-1 hover:bg-gray-50 rounded cursor-pointer">
                           <input 
                             type="checkbox"
                             checked={formData.permissions?.includes(page.id)}
                             onChange={() => togglePermission(page.id)}
                             disabled={formData.role === 'admin'} // Admin has all by default usually
                             className="rounded text-indigo-600 focus:ring-indigo-500"
                           />
                           <span className={formData.permissions?.includes(page.id) ? 'text-gray-800 font-medium' : 'text-gray-500'}>
                             {page.label}
                           </span>
                         </label>
                       ))}
                     </div>
                  </div>
                )}

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
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors flex justify-center items-center gap-2"
                >
                  <SaveIcon size={18} />
                  {t('saveData')}
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
