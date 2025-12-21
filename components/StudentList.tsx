
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, UserCheck, UserPlus, Search, CheckCircle, Phone, User, Calendar, Baby, ShieldCheck } from 'lucide-react';
import { Student, StudentStatus, User as UserType, ClassGroup } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getStudents, saveStudents, getUsers, saveUsers, getClasses } from '../services/storageService';

interface StudentListProps {
  onStudentSelect: (student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ onStudentSelect }) => {
  const { t, language } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [parents, setParents] = useState<UserType[]>([]);
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

    if (parentMode === 'existing') {
        if (!selectedParentId) {
            alert(language === 'ar' ? 'يرجى اختيار ولي أمر' : 'Please select a parent');
            return;
        }
        const parentUser = updatedUsers.find(u => u.id === selectedParentId);
        if (parentUser) {
            finalParentName = parentUser.name;
            finalParentPhone = parentUser.phone || '';
            const currentLinks = parentUser.linkedStudentIds || (parentUser.linkedStudentId ? [parentUser.linkedStudentId] : []);
            if (!currentLinks.includes(currentStudentId)) {
                parentUser.linkedStudentIds = [...currentLinks, currentStudentId];
            }
        }
    } else {
        if (!newParentData.username || !newParentData.password || !newParentData.name) {
            alert(language === 'ar' ? 'يرجى إكمال بيانات ولي الأمر الجديد' : 'Please complete new parent details');
            return;
        }
        const isDup = allUsers.some(u => u.username.toLowerCase() === newParentData.username.trim().toLowerCase());
        if (isDup) { alert(t('usernameExists' as any)); return; }

        const newParentId = `u-${Date.now()}`;
        const newUser: UserType = {
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

  const getStatusColor = (status: StudentStatus) => {
    switch (status) {
      case StudentStatus.Active: return 'bg-emerald-500';
      case StudentStatus.Pending: return 'bg-amber-500';
      case StudentStatus.Inactive: return 'bg-rose-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-800 tracking-tight">{t('studentRegistry')}</h2>
          <p className="text-slate-500 font-medium text-sm">{t('manageStudents')}</p>
        </div>
        <button 
            onClick={() => handleOpenModal()} 
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 whitespace-nowrap text-sm"
        >
            <Plus size={18}/>
            <span>{t('addStudentTitle')}</span>
        </button>
      </div>

      {/* Search Bar - Stylized */}
      <div className="bg-white/70 backdrop-blur-md p-2 rounded-[1.2rem] shadow-sm border border-white flex items-center gap-2 max-w-xl mx-auto">
        <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl">
          <Search size={18} />
        </div>
        <input 
            type="text" 
            placeholder={t('searchPlaceholder')} 
            className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-700 px-1" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      {/* Compact Card Grid Layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {filteredStudents.map(student => (
          <div 
            key={student.id}
            onClick={() => onStudentSelect(student)}
            className="group relative bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-indigo-50 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
          >
            {/* Status Indicator */}
            <div className="absolute top-3 right-3">
                <span className={`block w-2 h-2 rounded-full ${getStatusColor(student.status)} animate-pulse`}></span>
            </div>

            {/* Avatar Section */}
            <div className="flex flex-col items-center text-center mb-3">
                <div className="relative mb-3">
                    <div className="absolute inset-0 bg-indigo-100 rounded-2xl rotate-6 scale-105 group-hover:rotate-12 transition-transform"></div>
                    <img 
                      src={student.avatar} 
                      className="relative w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-sm" 
                      alt={student.name} 
                    />
                </div>
                <h3 className="text-sm font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2 px-1">{student.name}</h3>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold">
                    <ShieldCheck size={10} />
                    {student.classGroup}
                </div>
            </div>

            {/* Info Section - More Compact */}
            <div className="space-y-2 pt-3 border-t border-slate-50 flex-1">
                <div className="flex items-center gap-2 text-slate-500">
                    <User size={12} className="shrink-0 text-slate-300" />
                    <span className="text-[11px] font-bold truncate">{student.parentName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                    <Phone size={12} className="shrink-0 text-slate-300" />
                    <span className="text-[10px] font-bold truncate" dir="ltr">{student.phone}</span>
                </div>
            </div>

            {/* Actions - Slimmer Buttons */}
            <div className="mt-4 flex gap-1.5">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleOpenModal(student); }}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors shrink-0"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onStudentSelect(student); }}
                  className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-[10px] font-bold hover:bg-black transition-colors flex items-center justify-center gap-1.5"
                >
                  <Calendar size={12} />
                  {t('viewReport')}
                </button>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="p-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center">
          <Baby size={48} className="text-slate-200 mb-4" />
          <h3 className="text-lg font-bold text-slate-400">{t('noResults')}</h3>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl my-8 animate-fade-in overflow-hidden border-4 border-white">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{editingStudent ? t('editStudent') : t('addStudentTitle')}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-rose-500"><X size={20}/></button>
            </div>

            <form onSubmit={handleSaveStudent} className="p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="font-bold text-indigo-600 text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                    {language === 'ar' ? 'بيانات الطفل' : 'Child Information'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-full">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">{t('studentName')}</label>
                        <input required className="w-full p-2.5 bg-slate-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-indigo-400 transition-all outline-none font-bold text-sm" value={studentData.name} onChange={e => setStudentData({...studentData, name: e.target.value})} />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">{t('birthday')}</label>
                        <input type="date" className="w-full p-2.5 bg-slate-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-indigo-400 transition-all outline-none font-bold text-sm" value={studentData.birthday} onChange={e => {
                            const val = e.target.value;
                            setStudentData({...studentData, birthday: val, age: calculateDetailedAge(val)});
                        }} />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">{t('studentClass')}</label>
                        <select 
                            className="w-full p-2.5 bg-slate-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-indigo-400 transition-all outline-none font-bold text-sm"
                            value={studentData.classGroup} 
                            onChange={e => setStudentData({...studentData, classGroup: e.target.value})}
                        >
                            <option value="">{t('selectOption')}</option>
                            {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
              </div>

              <div className="space-y-5 pt-4 border-t border-slate-50">
                <h4 className="font-bold text-emerald-600 text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full"></div>
                    {t('parentAccount')}
                </h4>

                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                    <button type="button" onClick={() => setParentMode('existing')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold transition-all ${parentMode === 'existing' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><UserCheck size={14}/>{t('parentModeExisting')}</button>
                    <button type="button" onClick={() => setParentMode('new')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-bold transition-all ${parentMode === 'new' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><UserPlus size={14}/>{t('parentModeNew')}</button>
                </div>

                {parentMode === 'existing' ? (
                    <div className="space-y-3 animate-fade-in">
                        <div className="relative">
                            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400`} size={14} />
                            <input type="text" placeholder={t('selectParent')} className={`w-full ${language === 'ar' ? 'pr-10' : 'pl-10'} p-2.5 bg-slate-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-indigo-400 outline-none font-bold text-xs`} value={parentSearchTerm} onChange={(e) => setParentSearchTerm(e.target.value)} />
                        </div>
                        <div className="max-h-40 overflow-y-auto border-2 border-slate-50 rounded-xl p-1.5 space-y-1">
                            {filteredParents.map(p => (
                                <button key={p.id} type="button" onClick={() => { setSelectedParentId(p.id); setParentSearchTerm(p.name); }} className={`w-full flex items-center justify-between p-2 rounded-lg transition-all ${selectedParentId === p.id ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-2 text-start">
                                        <img src={p.avatar} className="w-6 h-6 rounded-lg border shadow-xs" alt="" />
                                        <div><p className="text-[11px] font-bold text-slate-800 leading-none">{p.name}</p></div>
                                    </div>
                                    {selectedParentId === p.id && <CheckCircle size={14} className="text-indigo-600" />}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                        <div className="col-span-full">
                            <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">{t('parentName')}</label>
                            <input className="w-full p-2.5 bg-slate-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-indigo-400 outline-none font-bold text-xs" value={newParentData.name} onChange={e => setNewParentData({...newParentData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">{t('parentUsername')}</label>
                            <input className="w-full p-2.5 bg-slate-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-indigo-400 outline-none font-bold text-xs" value={newParentData.username} onChange={e => setNewParentData({...newParentData, username: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">{t('parentPassword')}</label>
                            <input type="text" className="w-full p-2.5 bg-slate-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-indigo-400 outline-none font-bold text-xs" value={newParentData.password} onChange={e => setNewParentData({...newParentData, password: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 mb-1 ml-1">{t('phone')}</label>
                            <input type="tel" className="w-full p-2.5 bg-slate-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-indigo-400 outline-none font-bold text-xs" value={newParentData.phone} onChange={e => setNewParentData({...newParentData, phone: e.target.value})} />
                        </div>
                    </div>
                )}
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-[1.2rem] font-bold text-base shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Plus size={20} />
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
