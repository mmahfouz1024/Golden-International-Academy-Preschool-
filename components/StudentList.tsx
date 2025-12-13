
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Phone, Star, ChevronLeft, ChevronRight, X, Save, Filter, Camera, ShieldCheck, Edit2, Trash2, AlertCircle, Mail, Calendar, UserCheck, UserPlus, CheckCircle, ChevronDown } from 'lucide-react';
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
  
  // New States for Parent Selection Logic
  const [parentMode, setParentMode] = useState<'new' | 'existing'>('new');
  const [existingParents, setExistingParents] = useState<User[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  
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

  // Load students, classes and users on mount
  useEffect(() => {
    setStudents(getStudents());
    const loadedClasses = getClasses();
    setClasses(loadedClasses);
    // Set default class for new students
    if (loadedClasses.length > 0) {
      setStudentData(prev => ({ ...prev, classGroup: loadedClasses[0].name }));
    }
    
    // Load existing parents
    const allUsers = getUsers();
    setExistingParents(allUsers.filter(u => u.role === 'parent'));
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

  // Helper to calculate precise age string
  const calculateDetailedAge = (birthDateStr: string) => {
    if (!birthDateStr) return '';
    const birth = new Date(birthDateStr);
    const now = new Date();
    
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
        years--;
        months += 12;
    }
    
    // Adjust month calculation if day hasn't passed yet
    if (now.getDate() < birth.getDate()) {
        months--;
        if (months < 0) {
            months += 12;
        }
    }

    return `${years} Y, ${months} M`;
  };

  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    // Force format: 25 October 2025
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
  };

  const handleBirthdayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = e.target.value;
      const ageString = calculateDetailedAge(newDate);
      
      setStudentData(prev => ({
          ...prev,
          birthday: newDate,
          age: ageString
      }));
  };

  const handleOpenModal = (student?: Student) => {
    setError('');
    
    // Refresh parents list
    const allUsers = getUsers();
    setExistingParents(allUsers.filter(u => u.role === 'parent'));

    if (student) {
      // Edit Mode
      setEditingStudent(student);
      setNewStudentAvatar(student.avatar);
      setParentMode('new'); 
      
      const parentUser = allUsers.find(u => u.linkedStudentId === student.id && u.role === 'parent');
      
      // Calculate display age from birthday if available, otherwise use stored age number
      const displayAge = student.birthday ? calculateDetailedAge(student.birthday) : student.age.toString();

      setStudentData({
        name: student.name,
        age: displayAge,
        birthday: student.birthday || '',
        classGroup: student.classGroup,
        parentName: student.parentName,
        phone: student.phone,
        parentUsername: parentUser ? parentUser.username : '',
        parentPassword: '', 
        parentEmail: parentUser?.email || ''
      });
    } else {
      // Add Mode
      setEditingStudent(null);
      setNewStudentAvatar('');
      setParentMode('new'); 
      setSelectedParentId('');
      
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

  const handleParentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedParentId(pId);
    
    const parent = existingParents.find(p => p.id === pId);
    if (parent) {
      setStudentData(prev => ({
        ...prev,
        parentName: parent.name,
        phone: parent.phone || '',
        parentEmail: parent.email || '',
        parentUsername: '',
        parentPassword: ''
      }));
    }
  };

  const handleDeleteStudent = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm(t('deleteStudentConfirm'))) {
      const updatedList = students.filter(s => s.id !== id);
      setStudents(updatedList);
      saveStudents(updatedList);

      const users = getUsers();
      const updatedUsers = users.filter(u => u.linkedStudentId !== id);
      saveUsers(updatedUsers);
    }
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!studentData.name || !studentData.parentName) return;

    if (parentMode === 'new' && studentData.parentUsername) {
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
      currentStudentId = editingStudent.id;
      const updatedStudent: Student = {
        ...editingStudent,
        name: studentData.name,
        age: parseInt(studentData.age) || 4, // Parsing "4 Y, 3 M" returns 4
        birthday: studentData.birthday,
        classGroup: studentData.classGroup,
        parentName: studentData.parentName,
        phone: studentData.phone,
        avatar: newStudentAvatar || editingStudent.avatar
      };
      
      updatedStudentsList = students.map(s => s.id === editingStudent.id ? updatedStudent : s);
    } else {
      currentStudentId = Date.now().toString();
      const newStudent: Student = {
        id: currentStudentId,
        name: studentData.name,
        age: parseInt(studentData.age) || 4, // Parsing "4 Y, 3 M" returns 4
        birthday: studentData.birthday,
        classGroup: studentData.classGroup,
        parentName: studentData.parentName,
        phone: studentData.phone,
        status: StudentStatus.Active,
        attendanceToday: false,
        avatar: newStudentAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name)}&background=random&color=fff`
      };
      updatedStudentsList = [newStudent, ...students];
    }

    setStudents(updatedStudentsList);
    saveStudents(updatedStudentsList);

    const currentUsers = getUsers();
    
    if (editingStudent) {
        const existingParentIndex = currentUsers.findIndex(u => u.linkedStudentId === currentStudentId && u.role === 'parent');
        
        if (existingParentIndex >= 0) {
          const updatedUsers = [...currentUsers];
          updatedUsers[existingParentIndex] = {
            ...updatedUsers[existingParentIndex],
            name: studentData.parentName,
            username: studentData.parentUsername.trim() || updatedUsers[existingParentIndex].username,
            password: studentData.parentPassword || updatedUsers[existingParentIndex].password,
            phone: studentData.phone,
            email: studentData.parentEmail
          };
          saveUsers(updatedUsers);
        } else if (studentData.parentUsername && studentData.parentPassword) {
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
    } 
    else if (parentMode === 'new' && studentData.parentUsername && studentData.parentPassword) {
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
      case StudentStatus.Active: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case StudentStatus.Inactive: return 'bg-rose-100 text-rose-700 border-rose-200';
      case StudentStatus.Pending: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-800">{t('studentRegistry')}</h2>
          <p className="text-sm text-slate-500 mt-1">{t('manageStudents')}</p>
        </div>
        <button 
          type="button"
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 font-bold active:scale-95"
        >
          <Plus size={20} />
          <span>{t('newStudent')}</span>
        </button>
      </div>

      <div className="bg-white/70 backdrop-blur-xl p-5 rounded-[1.5rem] shadow-sm border border-white/50">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          <div className="md:col-span-4 relative group">
            <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors`} size={20} />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')}
              className={`w-full ${language === 'ar' ? 'pl-4 pr-12' : 'pr-4 pl-12'} py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-white/50 focus:bg-white`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="hidden sm:block md:col-span-2 relative">
             <select 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white/50 text-slate-600 text-sm appearance-none cursor-pointer"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="All">{t('filterClass')}</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.name}>{cls.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className={`absolute ${language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`} />
          </div>

          <div className="hidden sm:block md:col-span-2 relative">
            <select 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white/50 text-slate-600 text-sm appearance-none cursor-pointer"
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
            >
              <option value="All">{t('filterAge')}</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
            </select>
            <ChevronDown size={16} className={`absolute ${language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`} />
          </div>

          <div className="hidden sm:block md:col-span-2 relative">
            <select 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white/50 text-slate-600 text-sm appearance-none cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="All">{t('filterStatus')}</option>
              <option value={StudentStatus.Active}>{StudentStatus.Active}</option>
              <option value={StudentStatus.Pending}>{StudentStatus.Pending}</option>
              <option value={StudentStatus.Inactive}>{StudentStatus.Inactive}</option>
            </select>
            <ChevronDown size={16} className={`absolute ${language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none`} />
          </div>
          
          <div className="md:col-span-2 flex items-center justify-end text-slate-400 gap-2">
            <Filter size={16} />
            <span className="text-sm font-medium">{t('advancedFilter')}</span>
          </div>

        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-xs sm:text-sm">
                <th className="px-6 py-5 font-bold text-slate-600">{t('studentName')}</th> 
                <th className="hidden sm:table-cell px-6 py-5 font-bold text-slate-600">{t('studentAge')}</th>
                <th className="px-6 py-5 font-bold text-slate-600">{t('studentClass')}</th>
                <th className="hidden sm:table-cell px-6 py-5 font-bold text-slate-600">{t('parentName')}</th>
                <th className="hidden sm:table-cell px-6 py-5 font-bold text-slate-600">{t('filterStatus')}</th>
                <th className="px-6 py-5 font-bold text-slate-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map((student) => (
                <tr 
                  key={student.id} 
                  className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                  onClick={() => onStudentSelect(student)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                      <div className="flex flex-col">
                         <span className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-indigo-600 transition-colors">{student.name}</span>
                         {/* Show Parent Name on Mobile only */}
                         <span className="sm:hidden text-xs text-slate-400">{student.parentName}</span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 text-slate-600 text-sm font-medium">{student.age}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-sky-700 text-xs font-bold border border-sky-100 whitespace-nowrap">
                      <Star size={12} fill="currentColor" className="opacity-50" /> {student.classGroup}
                    </span>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-800 text-sm font-bold">{student.parentName}</span>
                      <span className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                        <Phone size={10} /> {student.phone}
                      </span>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(student.status)}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                       <button 
                         type="button"
                         onClick={(e) => { e.stopPropagation(); handleOpenModal(student); }}
                         className="text-slate-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-xl transition-colors pointer-events-auto"
                         title={t('edit')}
                       >
                         <Edit2 size={18} className="pointer-events-none" />
                       </button>
                       <button 
                         type="button"
                         onClick={(e) => handleDeleteStudent(e, student.id)}
                         className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition-colors pointer-events-auto"
                         title={t('delete')}
                       >
                         <Trash2 size={18} className="pointer-events-none" />
                       </button>
                       <div className="w-px h-4 bg-slate-200 mx-1 hidden sm:block"></div>
                       <button 
                         type="button"
                         className="text-slate-300 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-xl transition-colors"
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
          <div className="p-12 text-center text-slate-400">
            {t('noResults')}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh] animate-fade-in border-4 border-white">
            <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800 font-display">{editingStudent ? t('editStudent') : t('addStudentTitle')}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveStudent} className="p-8 space-y-5">
              
              <div className="flex flex-col items-center justify-center mb-8">
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
                        className="w-28 h-28 rounded-full object-cover border-[6px] border-indigo-50 shadow-md transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <Camera className="text-white" size={28} />
                      </div>
                    </>
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-500 transition-all">
                       <Camera size={32} className="mb-1" />
                       <span className="text-[10px] font-bold uppercase tracking-wide">{t('addPhoto')}</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-xl border border-rose-100 flex items-center gap-2 text-sm animate-fade-in font-bold">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{t('studentName')}</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                    value={studentData.name}
                    onChange={e => setStudentData({...studentData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{t('birthday')}</label>
                  <div className="relative group bg-slate-50 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 h-[48px] flex items-center px-3 border border-transparent focus-within:bg-white transition-all">
                    <div className="flex items-center gap-2 w-full">
                       <Calendar size={18} className="text-indigo-500" />
                       <span className="text-sm font-medium text-slate-700 flex-1 truncate" dir="ltr">
                          {studentData.birthday ? getFormattedDate(studentData.birthday) : <span className="text-slate-400">Select Date</span>}
                       </span>
                       <ChevronDown size={14} className="text-slate-400" />
                    </div>
                    <input
                      type="date"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      value={studentData.birthday}
                      onChange={handleBirthdayChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{t('studentAge')}</label>
                  <input 
                    required
                    type="text"
                    readOnly 
                    dir="ltr"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                    className="w-full px-4 py-3 bg-slate-100 border-transparent rounded-xl focus:outline-none text-slate-500 cursor-not-allowed font-medium text-sm"
                    value={studentData.age}
                    placeholder="Auto"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{t('studentClass')}</label>
                  <select 
                    className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
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

                {/* Parent Information Section */}
                <div className="col-span-2 mt-4 pt-4 border-t border-slate-100">
                   <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">{t('parentName')}</label>
                      
                      {!editingStudent && (
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                           <button
                             type="button"
                             onClick={() => setParentMode('new')}
                             className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${parentMode === 'new' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                           >
                             <UserPlus size={12} />
                             {t('parentModeNew')}
                           </button>
                           <button
                             type="button"
                             onClick={() => setParentMode('existing')}
                             className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${parentMode === 'existing' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                           >
                             <UserCheck size={12} />
                             {t('parentModeExisting')}
                           </button>
                        </div>
                      )}
                   </div>

                   {parentMode === 'existing' ? (
                      <select
                        className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                        value={selectedParentId}
                        onChange={handleParentSelect}
                      >
                        <option value="">{t('selectParent')}</option>
                        {existingParents.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                        ))}
                      </select>
                   ) : (
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                        value={studentData.parentName}
                        onChange={e => setStudentData({...studentData, parentName: e.target.value})}
                      />
                   )}
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{t('phone')}</label>
                  <input 
                    required
                    type="tel"
                    dir="ltr"
                    disabled={parentMode === 'existing'}
                    style={{ direction: 'ltr', textAlign: 'left' }}
                    className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-left font-medium transition-all ${parentMode === 'existing' ? 'bg-slate-100 text-slate-500' : 'bg-slate-50 border-transparent focus:bg-white'}`}
                    value={studentData.phone}
                    onChange={e => setStudentData({...studentData, phone: e.target.value})}
                  />
                </div>
              </div>

              {/* Parent Account Section - Only show inputs if creating NEW parent */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                 <div className="flex items-center gap-2 mb-4 text-indigo-700">
                   <div className="p-1.5 bg-indigo-100 rounded-lg">
                      <ShieldCheck size={18} />
                   </div>
                   <h4 className="font-bold text-sm">{t('parentAccount')}</h4>
                 </div>
                 
                 {parentMode === 'new' ? (
                   <div className="grid grid-cols-2 gap-5 animate-fade-in">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{t('parentUsername')}</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                          value={studentData.parentUsername}
                          onChange={e => setStudentData({...studentData, parentUsername: e.target.value})}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{t('email')}</label>
                        <div className="relative">
                          <input 
                            type="email" 
                            className="w-full px-4 pl-10 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                            value={studentData.parentEmail}
                            onChange={e => setStudentData({...studentData, parentEmail: e.target.value})}
                            placeholder="parent@example.com"
                          />
                           <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{t('parentPassword')}</label>
                        <input 
                          type="password" 
                          className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
                          value={studentData.parentPassword}
                          onChange={e => setStudentData({...studentData, parentPassword: e.target.value})}
                          placeholder={editingStudent ? t('leaveBlankToKeep') : ""}
                        />
                      </div>
                   </div>
                 ) : (
                   <div className="p-4 bg-emerald-50 rounded-xl text-emerald-700 text-sm flex items-center gap-2 border border-emerald-100 font-medium">
                      <CheckCircle size={18} />
                      Parent account already exists for {studentData.parentName}.
                   </div>
                 )}
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 border-2 border-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 flex justify-center items-center gap-2"
                >
                  <Save size={20} />
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
