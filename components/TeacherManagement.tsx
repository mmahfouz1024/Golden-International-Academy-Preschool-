
import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, X, School, CheckCircle, Save as SaveIcon, Edit2, ChevronLeft, ChevronRight, AlertCircle, Phone, Mail } from 'lucide-react';
import { getUsers, saveUsers, getClasses, saveClasses } from '../services/storageService';
import { User, ClassGroup } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const TeacherManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Default permissions for teacher
  const TEACHER_PERMISSIONS = ['dashboard', 'students', 'attendance', 'reports-archive', 'directory', 'ai-planner'];

  // Load teachers and classes
  useEffect(() => {
    const allUsers = getUsers();
    setTeachers(allUsers.filter(u => u.role === 'teacher'));
    setClasses(getClasses());
  }, []);

  const [formData, setFormData] = useState<Partial<User> & { assignedClassIds?: string[] }>({
    name: '',
    username: '',
    password: '',
    phone: '',
    email: '',
    assignedClassIds: []
  });

  const handleOpenModal = (teacher?: User) => {
    setError('');
    setSuccessMsg('');

    if (teacher) {
      setEditingTeacher(teacher);
      // Find classes where this user is the teacher
      const assignedClasses = classes.filter(c => c.teacherId === teacher.id);
      
      setFormData({
        name: teacher.name,
        username: teacher.username,
        password: teacher.password,
        phone: teacher.phone || '',
        email: teacher.email || '',
        assignedClassIds: assignedClasses.map(c => c.id)
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        phone: '',
        email: '',
        assignedClassIds: []
      });
    }
    setIsModalOpen(true);
  };

  const toggleClassAssignment = (classId: string) => {
    const currentClasses = formData.assignedClassIds || [];
    if (currentClasses.includes(classId)) {
      setFormData({ ...formData, assignedClassIds: currentClasses.filter(id => id !== classId) });
    } else {
      setFormData({ ...formData, assignedClassIds: [...currentClasses, classId] });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.name || !formData.password) return;

    // Check for duplicate username
    const allUsers = getUsers();
    const usernameToCheck = (formData.username || '').trim().toLowerCase();
    const isDuplicate = allUsers.some(u => 
      u.username.toLowerCase() === usernameToCheck && 
      (!editingTeacher || u.id !== editingTeacher.id)
    );

    if (isDuplicate) {
      setError(t('usernameExists' as any));
      return;
    }

    let updatedUsers: User[];
    let userId = editingTeacher ? editingTeacher.id : `u-${Date.now()}`;

    // 1. Save Teacher Logic
    const teacherData: User = {
        id: userId,
        avatar: editingTeacher?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name!)}&background=random`,
        name: formData.name!,
        username: (formData.username || '').trim(),
        password: formData.password!,
        role: 'teacher',
        permissions: TEACHER_PERMISSIONS,
        phone: formData.phone,
        email: formData.email,
        // Preserve other fields
        linkedStudentId: '',
        interests: editingTeacher?.interests || []
    };

    if (editingTeacher) {
      updatedUsers = allUsers.map(u => u.id === editingTeacher.id ? teacherData : u);
    } else {
      updatedUsers = [...allUsers, teacherData];
    }
    
    // Update local state and storage
    saveUsers(updatedUsers);
    setTeachers(updatedUsers.filter(u => u.role === 'teacher'));

    // 2. Assign/Unassign Multiple Classes Logic
    const targetClassIds = formData.assignedClassIds || [];
    const updatedClasses = classes.map(cls => {
      // If this class is selected in the modal, assign it to this teacher
      if (targetClassIds.includes(cls.id)) {
        return { ...cls, teacherId: userId };
      }
      
      // If this teacher was previously assigned to this class, but now it is unchecked
      if (cls.teacherId === userId && !targetClassIds.includes(cls.id)) {
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
    e.stopPropagation(); 
    
    if (window.confirm(t('deleteTeacherConfirm'))) {
      const allUsers = getUsers();
      const updatedUsers = allUsers.filter(u => u.id !== id);
      
      saveUsers(updatedUsers); 
      setTeachers(updatedUsers.filter(u => u.role === 'teacher'));
      
      // Unassign from any classes
      const updatedClasses = classes.map(c => c.teacherId === id ? { ...c, teacherId: undefined } : c);
      setClasses(updatedClasses);
      saveClasses(updatedClasses);
    }
  };

  const filteredTeachers = teachers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t('teacherManagement')}</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">{t('manageTeachers')}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm sm:text-base"
        >
          <Plus size={18} />
          <span>{t('addTeacher')}</span>
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
                <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600">{t('username')}</th>
                <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600">{t('contactInfo')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600">{t('assignedClasses')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTeachers.map((teacher) => (
                <tr 
                  key={teacher.id} 
                  className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                  onClick={() => handleOpenModal(teacher)}
                >
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img src={teacher.avatar} alt={teacher.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                      <div className="flex flex-col">
                         <span className="font-medium text-gray-900 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">{teacher.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4 text-sm text-gray-600">
                    @{teacher.username}
                  </td>
                  <td className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4 text-sm text-gray-600">
                    <div className="flex flex-col gap-1">
                        {teacher.phone && (
                            <div className="flex items-center gap-1">
                                <Phone size={12} className="text-gray-400" />
                                <span dir="ltr">{teacher.phone}</span>
                            </div>
                        )}
                        {teacher.email && (
                            <div className="flex items-center gap-1">
                                <Mail size={12} className="text-gray-400" />
                                <span className="truncate max-w-[150px]">{teacher.email}</span>
                            </div>
                        )}
                    </div>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <School size={14} className="text-gray-400" />
                          <span className="truncate max-w-[150px]">
                            {classes.filter(c => c.teacherId === teacher.id).length > 0 
                              ? classes.filter(c => c.teacherId === teacher.id).map(c => c.name).join(', ')
                              : <span className="text-gray-400 italic text-xs">{t('noClassAssigned')}</span>}
                          </span>
                        </div>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 text-left">
                     <div className="flex items-center gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                       <button 
                         type="button"
                         onClick={(e) => { e.stopPropagation(); handleOpenModal(teacher); }}
                         className="text-gray-400 hover:text-indigo-600 p-1.5 sm:p-2 hover:bg-indigo-50 rounded-lg transition-colors pointer-events-auto"
                         title={t('edit')}
                       >
                         <Edit2 size={16} className="pointer-events-none" />
                       </button>
                       <button 
                         type="button"
                         onClick={(e) => handleDelete(e, teacher.id)}
                         className="text-gray-400 hover:text-red-600 p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors pointer-events-auto"
                         title={t('delete')}
                       >
                         <Trash2 size={16} className="pointer-events-none" />
                       </button>
                       <div className="text-gray-300 px-0.5 hidden sm:block">|</div>
                       <button 
                         type="button"
                         className="text-gray-300 hover:text-indigo-600 p-1.5 sm:p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                         onClick={() => handleOpenModal(teacher)}
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
        {filteredTeachers.length === 0 && (
          <div className="p-8 sm:p-12 text-center text-gray-400">
            {t('noResults')}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 sticky top-0 z-10">
              <h3 className="text-lg font-bold text-gray-800">{editingTeacher ? t('editTeacher') : t('addTeacher')}</h3>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('mobile')}</label>
                  <input 
                    type="tel" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

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
                        {cls.teacherId && cls.teacherId !== editingTeacher?.id && (
                          <span className="text-xs text-orange-500 ml-auto">({t('assignedTeacher')}: {getUsers().find(u => u.id === cls.teacherId)?.name})</span>
                        )}
                      </label>
                    ))}
                    {classes.length === 0 && <p className="text-sm text-gray-500 italic">{t('noClassAssigned')}</p>}
                  </div>
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

export default TeacherManagement;
