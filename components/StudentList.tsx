
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Phone, Star, ChevronLeft, ChevronRight, X, Save, Filter, Camera, ShieldCheck, Edit2, Trash2, AlertCircle, Mail } from 'lucide-react';
import { Student, StudentStatus, User, ClassGroup } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getStudents, saveStudents, getUsers, saveUsers, getClasses } from '../services/storageService';

interface StudentListProps {
  onStudentSelect: (student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ onStudentSelect }) => {
  const { t, language } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterClass, setFilterClass] = useState('All');
  const [filterAge, setFilterAge] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newStudentAvatar, setNewStudentAvatar] = useState<string>('');
  const [error, setError] = useState('');
  
  // State to track if we are editing
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [studentData, setStudentData] = useState({
    name: '',
    age: '',
    birthday: '',
    classGroup: '',
    parentName: '',
    phone: '',
    parentUsername: '',
    parentPassword: '',
    parentEmail: ''
  });

  // Load students and classes from storage on mount
  useEffect(() => {
    setStudents(getStudents());
    const loadedClasses = getClasses();
    setClasses(loadedClasses);
    // Set default class for new students
    if (loadedClasses.length > 0) {
      setStudentData(prev => ({ ...prev, classGroup: loadedClasses[0].name }));
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewStudentAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenModal = (student?: Student) => {
    setError('');
    if (student) {
      // Edit Mode
      setEditingStudent(student);
      setNewStudentAvatar(student.avatar);
      
      // Try to find linked parent user to populate credentials
      const users = getUsers();
      const parentUser = users.find(u => u.linkedStudentId === student.id && u.role === 'parent');

      setStudentData({
        name: student.name,
        age: student.age.toString(),
        birthday: student.birthday || '',
        classGroup: student.classGroup,
        parentName: student.parentName,
        phone: student.phone,
        parentUsername: parentUser ? parentUser.username : '',
        parentPassword: '', // Don't show password for security, only allow reset
        parentEmail: parentUser?.email || ''
      });
    } else {
      // Add Mode
      setEditingStudent(null);
      setNewStudentAvatar('');
      const defaultClass = classes.length > 0 ? classes[0].name : 'Birds';
      setStudentData({ 
        name: '', 
        age: '', 
        birthday: '',
        classGroup: defaultClass, 
        parentName: '', 
        phone: '', 
        parentUsername: '', 
        parentPassword: '',
        parentEmail: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDeleteStudent = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(t('deleteStudentConfirm'))) {
      const updatedList = students.filter(s => s.id !== id);
      setStudents(updatedList);
      saveStudents(updatedList);

      // Also remove linked parent user? Optional, but good practice
      const users = getUsers();
      const updatedUsers = users.filter(u => u.linkedStudentId !== id);
      saveUsers(updatedUsers);
    }
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!studentData.name || !studentData.parentName) return;

    // Check parent username duplicate if provided
    if (studentData.parentUsername) {
      const allUsers = getUsers();
      const parentUser = editingStudent 
        ? allUsers.find(u => u.linkedStudentId === editingStudent.id && u.role === 'parent')
        : null;

      const isDuplicate = allUsers.some(u => 
        u.username.toLowerCase() === studentData.parentUsername.trim().toLowerCase() && 
        (!parentUser || u.id !== parentUser.id)
      );

      if (isDuplicate) {
        setError(t('usernameExists' as any));
        return;
      }
    }

    let updatedStudentsList: Student[];
    let currentStudentId = '';

    if (editingStudent) {
      // Update existing student
      currentStudentId = editingStudent.id;
      const updatedStudent: Student = {
        ...editingStudent,
        name: studentData.name,
        age: parseInt(studentData.age) || 4,
        birthday: studentData.birthday,
        classGroup: studentData.classGroup,
        parentName: studentData.parentName,
        phone: studentData.phone,
        avatar: newStudentAvatar || editingStudent.avatar
      };
      
      updatedStudentsList = students.map(s => s.id === editingStudent.id ? updatedStudent : s);
    } else {
      // Create new student
      currentStudentId = Date.now().toString();
      const newStudent: Student = {
        id: currentStudentId,
        name: studentData.name,
        age: parseInt(studentData.age) || 4,
        birthday: studentData.birthday,
        classGroup: studentData.classGroup,
        parentName: studentData.parentName,
        phone: studentData.phone,
        status: StudentStatus.Active,
        attendanceToday: false,
        // Use uploaded avatar OR generate initials avatar
        avatar: newStudentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name)}&background=random&color=fff`
      };
      updatedStudentsList = [newStudent, ...students];
    }

    setStudents(updatedStudentsList);
    saveStudents(updatedStudentsList);

    // Handle Parent User
    const currentUsers = getUsers();
    const existingParentIndex = currentUsers.findIndex(u => u.linkedStudentId === currentStudentId && u.role === 'parent');

    if (existingParentIndex >= 0) {
      // Update existing parent user
      const updatedUsers = [...currentUsers];
      updatedUsers[existingParentIndex] = {
        ...updatedUsers[existingParentIndex],
        name: studentData.parentName,
        username: studentData.parentUsername.trim() || updatedUsers[existingParentIndex].username,
        // Only update password if provided
        password: studentData.parentPassword || updatedUsers[existingParentIndex].password,
        phone: studentData.phone,
        email: studentData.parentEmail
      };
      saveUsers(updatedUsers);
    } else if (studentData.parentUsername && studentData.parentPassword) {
      // Create new parent user if credentials provided
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: studentData.parentName,
        username: studentData.parentUsername.trim(),
        password: studentData.parentPassword,
        role: 'parent',
        linkedStudentId: currentStudentId,
        phone: studentData.phone,
        email: studentData.parentEmail,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.parentName)}&background=random`,
        interests: []
      };
      saveUsers([...currentUsers, newUser]);
    }

    setIsModalOpen(false);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.parentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'All' || student.classGroup === filterClass;
    const matchesAge = filterAge === 'All' || student.age.toString() === filterAge;
    const matchesStatus = filterStatus === 'All' || student.status === filterStatus;
    
    return matchesSearch && matchesClass && matchesAge && matchesStatus;
  });

  const getStatusColor = (status: StudentStatus) => {
    switch (status) {
      case StudentStatus.Active: return 'bg-green-100 text-green-700';
      case StudentStatus.Inactive: return 'bg-red-100 text-red-700';
      case StudentStatus.Pending: return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('studentRegistry')}</h2>
          <p className="text-gray-500 mt-1">{t('manageStudents')}</p>
        </div>
        <button 
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={20} />
          <span>{t('newStudent')}</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          <div className="md:col-span-4 relative">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')}
              className={`w-full ${language === 'ar' ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="md:col-span-2 relative">
             <select 
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500 bg-white text-gray-600"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="All">{t('filterClass')}</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.name}>{cls.name}</option>
              ))}
              {classes.length === 0 && (
                <>
                  <option value="Birds">Birds</option>
                  <option value="Buds">Buds</option>
                  <option value="Stars">Stars</option>
                </>
              )}
            </select>
          </div>

          <div className="md:col-span-2">
            <select 
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500 bg-white text-gray-600"
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
            >
              <option value="All">{t('filterAge')}</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select 
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500 bg-white text-gray-600"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">{t('filterStatus')}</option>
              <option value={StudentStatus.Active}>{StudentStatus.Active}</option>
              <option value={StudentStatus.Pending}>{StudentStatus.Pending}</option>
              <option value={StudentStatus.Inactive}>{StudentStatus.Inactive}</option>
            </select>
          </div>
          
          <div className="md:col-span-2 flex items-center justify-end text-gray-400 gap-2">
            <Filter size={18} />
            <span className="text-sm">{t('advancedFilter')}</span>
          </div>

        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">{t('addStudentTitle').split(' ')[1]}</th> 
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">{t('studentAge')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">{t('studentClass')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">{t('parentName')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">{t('filterStatus')}</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map((student) => (
                <tr 
                  key={student.id} 
                  className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                  onClick={() => onStudentSelect(student)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                      <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{student.age}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                      <Star size={12} /> {student.classGroup}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-gray-900 text-sm font-medium">{student.parentName}</span>
                      <span className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                        <Phone size={10} /> {student.phone}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                       <button 
                         type="button"
                         onClick={(e) => { e.stopPropagation(); handleOpenModal(student); }}
                         className="text-gray-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-colors pointer-events-auto"
                         title={t('edit')}
                       >
                         <Edit2 size={18} className="pointer-events-none" />
                       </button>
                       <button 
                         type="button"
                         onClick={(e) => handleDeleteStudent(e, student.id)}
                         className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors pointer-events-auto"
                         title={t('delete')}
                       >
                         <Trash2 size={18} className="pointer-events-none" />
                       </button>
                       <div className="text-gray-300 px-1">|</div>
                       <button 
                         type="button"
                         className="text-gray-300 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                         onClick={() => onStudentSelect(student)}
                       >
                         {language === 'ar' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            {t('noResults')}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-y-auto max-h-[90vh] animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">{editingStudent ? t('editStudent') : t('addStudentTitle')}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              
              <div className="flex flex-col items-center justify-center mb-6">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                />
                <div 
                  className="relative cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {newStudentAvatar ? (
                    <>
                      <img 
                        src={newStudentAvatar} 
                        alt="Preview" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-indigo-50"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white" size={24} />
                      </div>
                    </>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-slate-100 hover:border-indigo-400 hover:text-indigo-500 transition-all">
                       <Camera size={28} className="mb-1" />
                       <span className="text-[10px] font-bold">{t('addPhoto')}</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 flex items-center gap-2 text-sm animate-fade-in">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('studentName')}</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={studentData.name}
                    onChange={e => setStudentData({...studentData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('studentAge')}</label>
                  <input 
                    required
                    type="number" 
                    min="2" max="7"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={studentData.age}
                    onChange={e => setStudentData({...studentData, age: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('birthday')}</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={studentData.birthday}
                    onChange={e => setStudentData({...studentData, birthday: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('studentClass')}</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    value={studentData.classGroup}
                    onChange={e => setStudentData({...studentData, classGroup: e.target.value})}
                  >
                    {classes.map(cls => (
                       <option key={cls.id} value={cls.name}>{cls.name}</option>
                    ))}
                    {classes.length === 0 && (
                      <>
                        <option value="Birds">Birds</option>
                        <option value="Buds">Buds</option>
                        <option value="Stars">Stars</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('parentName')}</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={studentData.parentName}
                    onChange={e => setStudentData({...studentData, parentName: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
                  <input 
                    required
                    type="tel" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={studentData.phone}
                    onChange={e => setStudentData({...studentData, phone: e.target.value})}
                  />
                </div>
              </div>

              {/* Parent Account Section */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                 <div className="flex items-center gap-2 mb-4 text-indigo-700">
                   <ShieldCheck size={20} />
                   <h4 className="font-bold">{t('parentAccount')}</h4>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('parentUsername')}</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50"
                        value={studentData.parentUsername}
                        onChange={e => setStudentData({...studentData, parentUsername: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                      <div className="relative">
                        <input 
                          type="email" 
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50 pl-10"
                          value={studentData.parentEmail}
                          onChange={e => setStudentData({...studentData, parentEmail: e.target.value})}
                          placeholder="parent@example.com"
                        />
                         <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('parentPassword')}</label>
                      <input 
                        type="password" 
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50"
                        value={studentData.parentPassword}
                        onChange={e => setStudentData({...studentData, parentPassword: e.target.value})}
                        placeholder={editingStudent ? t('leaveBlankToKeep') : ""}
                      />
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
                  <Save size={18} />
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

export default StudentList;
