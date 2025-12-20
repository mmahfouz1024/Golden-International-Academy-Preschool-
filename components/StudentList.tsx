
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, UserCheck, UserPlus, Search, Calendar, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react';
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
  const [parents, setParents] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Parent Selection Logic
  const [parentMode, setParentMode] = useState<'existing' | 'new'>('existing');
  const [selectedParentId, setSelectedParentId] = useState('');
  const [parentSearchTerm, setParentSearchTerm] = useState('');

  const [studentData, setStudentData] = useState({ 
    name: '', 
    birthday: '', 
    classGroup: '',
    age: ''
  });

  const [newParentData, setNewParentData] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    setStudents(getStudents());
    const loadedClasses = getClasses();
    setClasses(loadedClasses);
    const allUsers = getUsers();
    setParents(allUsers.filter(u => u.role === 'parent'));
  };

  const calculateDetailedAge = (birthDateStr: string) => {
    if (!birthDateStr) return '';
    const birth = new Date(birthDateStr);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) { years--; months += 12; }
    return `${years} Y, ${months} M`;
  };

  const handleOpenModal = (student?: Student) => {
    loadAllData();
    if (student) {
      setEditingStudent(student);
      const allUsers = getUsers();
      const parentUser = allUsers.find(u => 
        (u.linkedStudentIds?.includes(student.id)) || (u.linkedStudentId === student.id)
      );
      
      setStudentData({ 
        name: student.name, 
        birthday: student.birthday || '', 
        classGroup: student.classGroup,
        age: student.birthday ? calculateDetailedAge(student.birthday) : student.age.toString()
      });

      if (parentUser) {
        setParentMode('existing');
        setSelectedParentId(parentUser.id);
      }
    } else {
      setEditingStudent(null);
      setParentMode('existing');
      setSelectedParentId('');
      setStudentData({ 
        name: '', 
        birthday: '', 
        classGroup: classes.length > 0 ? classes[0].name : '',
        age: ''
      });
      setNewParentData({ name: '', username: '', password: '', phone: '', email: '' });
    }
    setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData.name) return;

    const allUsers = getUsers();
    const currentStudentId = editingStudent ? editingStudent.id : Date.now().toString();
    let finalParentName = '';
    let finalParentPhone = '';
    let updatedUsers = [...allUsers];

    // 1. Logic for Parent Association
    if (parentMode === 'existing') {
        if (!selectedParentId) {
            alert(language === 'ar' ? 'يرجى اختيار ولي أمر' : 'Please select a parent');
            return;
        }
        const parentUser = updatedUsers.find(u => u.id === selectedParentId);
        if (parentUser) {
            finalParentName = parentUser.name;
            finalParentPhone = parentUser.phone || '';
            
            // Link student if not already linked
            const currentLinks = parentUser.linkedStudentIds || (parentUser.linkedStudentId ? [parentUser.linkedStudentId] : []);
            if (!currentLinks.includes(currentStudentId)) {
                parentUser.linkedStudentIds = [...currentLinks, currentStudentId];
            }
        }
    } else {
        // Create NEW Parent
        if (!newParentData.username || !newParentData.password || !newParentData.name) {
            alert(language === 'ar' ? 'يرجى إكمال بيانات ولي الأمر الجديد' : 'Please complete new parent details');
            return;
        }
        
        const isDup = allUsers.some(u => u.username.toLowerCase() === newParentData.username.trim().toLowerCase());
        if (isDup) { alert(t('usernameExists' as any)); return; }

        const newParentId = `u-${Date.now()}`;
        const newUser: User = {
            id: newParentId,
            name: newParentData.name,
            username: newParentData.username.trim(),
            password: newParentData.password,
            role: 'parent',
            phone: newParentData.phone,
            email: newParentData.email,
            linkedStudentIds: [currentStudentId],
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newParentData.name)}&background=random`
        };
        updatedUsers.push(newUser);
        finalParentName = newParentData.name;
        finalParentPhone = newParentData.phone;
    }

    // 2. Save Student
    const student: Student = { 
      id: currentStudentId, 
      name: studentData.name, 
      age: parseInt(studentData.age) || 4, 
      birthday: studentData.birthday, 
      classGroup: studentData.classGroup, 
      parentName: finalParentName, 
      phone: finalParentPhone, 
      status: editingStudent?.status || StudentStatus.Active, 
      attendanceToday: editingStudent?.attendanceToday || false, 
      avatar: editingStudent?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name)}&background=random` 
    };

    const updatedStudents = editingStudent 
        ? students.map(s => s.id === editingStudent.id ? student : s) 
        : [student, ...students];

    setStudents(updatedStudents);
    saveStudents(updatedStudents);
    saveUsers(updatedUsers);
    
    setIsModalOpen(false);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredParents = parents.filter(p => 
    p.name.toLowerCase().includes(parentSearchTerm.toLowerCase()) ||
    p.username.toLowerCase().includes(parentSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-800">{t('studentRegistry')}</h2>
          <p className="text-slate-500 font-medium">{t('manageStudents')}</p>
        </div>
        <button 
            onClick={() => handleOpenModal()} 
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
            <Plus size={20}/>
            <span>{t('addStudentTitle')}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
            type="text" 
            placeholder={t('searchPlaceholder')} 
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">{t('studentName')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">{t('studentClass')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm">{t('parentName')}</th>
                <th className="px-6 py-4 font-bold text-slate-600 text-sm"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map(s => (
                <tr key={s.id} onClick={() => onStudentSelect(s)} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={s.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover" alt={s.name} />
                      <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{s.classGroup}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{s.parentName}</span>
                        <span className="text-xs text-slate-400" dir="ltr">{s.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <button 
                        onClick={(e) => {e.stopPropagation(); handleOpenModal(s);}} 
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    >
                      <Edit2 size={18}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredStudents.length === 0 && (
          <div className="p-20 text-center text-slate-300">
            <Search size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-medium">{t('noResults')}</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl my-8 animate-fade-in overflow-hidden border-4 border-white">
            
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{editingStudent ? t('editStudent') : t('addStudentTitle')}</h3>
                <p className="text-slate-500 text-sm mt-1">{t('manageStudents')}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-rose-500"><X size={24}/></button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-8 space-y-8">
              
              {/* Student Info Section */}
              <div className="space-y-4">
                <h4 className="font-bold text-indigo-600 text-sm uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                    {language === 'ar' ? 'بيانات الطفل' : 'Child Information'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-full">
                        <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">{t('studentName')}</label>
                        <input required className="w-full p-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-400 transition-all outline-none font-bold" value={studentData.name} onChange={e => setStudentData({...studentData, name: e.target.value})} />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">{t('birthday')}</label>
                        <div className="relative">
                            <input type="date" className="w-full p-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-400 transition-all outline-none font-bold" value={studentData.birthday} onChange={e => {
                                const val = e.target.value;
                                setStudentData({...studentData, birthday: val, age: calculateDetailedAge(val)});
                            }} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">{t('studentClass')}</label>
                        <select 
                            className="w-full p-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-400 transition-all outline-none font-bold"
                            value={studentData.classGroup} 
                            onChange={e => setStudentData({...studentData, classGroup: e.target.value})}
                        >
                            <option value="">{t('selectOption')}</option>
                            {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
              </div>

              {/* Parent Association Section */}
              <div className="space-y-6 pt-4 border-t border-slate-50">
                <h4 className="font-bold text-emerald-600 text-sm uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full"></div>
                    {t('parentAccount')}
                </h4>

                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
                    <button 
                        type="button"
                        onClick={() => setParentMode('existing')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${parentMode === 'existing' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <UserCheck size={18} />
                        {t('parentModeExisting')}
                    </button>
                    <button 
                        type="button"
                        onClick={() => setParentMode('new')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${parentMode === 'new' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <UserPlus size={18} />
                        {t('parentModeNew')}
                    </button>
                </div>

                {parentMode === 'existing' ? (
                    <div className="space-y-4 animate-fade-in">
                        <div className="relative">
                            <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400`} size={18} />
                            <input 
                                type="text"
                                placeholder={t('selectParent')}
                                className={`w-full ${language === 'ar' ? 'pr-12' : 'pl-12'} p-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-400 transition-all outline-none font-bold text-sm`}
                                value={parentSearchTerm}
                                onChange={(e) => setParentSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="max-h-48 overflow-y-auto custom-scrollbar border-2 border-slate-100 rounded-2xl p-2 space-y-1">
                            {filteredParents.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedParentId(p.id);
                                        setParentSearchTerm(p.name);
                                    }}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedParentId === p.id ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-slate-50'}`}
                                >
                                    <div className="flex items-center gap-3 text-start">
                                        <img src={p.avatar} className="w-8 h-8 rounded-full border" alt="" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{p.name}</p>
                                            <p className="text-xs text-slate-400" dir="ltr">{p.phone}</p>
                                        </div>
                                    </div>
                                    {selectedParentId === p.id && <CheckCircle size={18} className="text-indigo-600" />}
                                </button>
                            ))}
                            {filteredParents.length === 0 && (
                                <div className="p-8 text-center text-slate-400 italic text-sm">
                                    {t('noResults')}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <div className="col-span-full">
                            <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">{t('parentName')}</label>
                            <input className="w-full p-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-400 transition-all outline-none font-bold" value={newParentData.name} onChange={e => setNewParentData({...newParentData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">{t('parentUsername')}</label>
                            <input className="w-full p-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-400 transition-all outline-none font-bold" value={newParentData.username} onChange={e => setNewParentData({...newParentData, username: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">{t('parentPassword')}</label>
                            <input type="text" className="w-full p-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-400 transition-all outline-none font-bold" value={newParentData.password} onChange={e => setNewParentData({...newParentData, password: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">{t('phone')}</label>
                            <input type="tel" className="w-full p-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-400 transition-all outline-none font-bold" value={newParentData.phone} onChange={e => setNewParentData({...newParentData, phone: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 ml-1">{t('email')}</label>
                            <input type="email" className="w-full p-3.5 bg-slate-50 rounded-2xl border-2 border-transparent focus:bg-white focus:border-indigo-400 transition-all outline-none font-bold" value={newParentData.email} onChange={e => setNewParentData({...newParentData, email: e.target.value})} />
                        </div>
                    </div>
                )}
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-bold text-lg shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3">
                    <Plus size={24} />
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
