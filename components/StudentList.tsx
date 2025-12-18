
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X } from 'lucide-react';
import { Student, StudentStatus, User, ClassGroup } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getStudents, saveStudents, getUsers, saveUsers, getClasses } from '../services/storageService';

interface StudentListProps {
  onStudentSelect: (student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ onStudentSelect }) => {
  const { t } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [searchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  useEffect(() => {
    setStudents(getStudents());
    const loadedClasses = getClasses();
    setClasses(loadedClasses);
    if (loadedClasses.length > 0) setStudentData(prev => ({ ...prev, classGroup: loadedClasses[0].name }));
  }, []);

  const calculateDetailedAge = (birthDateStr: string) => {
    if (!birthDateStr) return '';
    const birth = new Date(birthDateStr); const now = new Date();
    let years = now.getFullYear() - birth.getFullYear(); let months = now.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) { years--; months += 12; }
    if (now.getDate() < birth.getDate()) { months--; if (months < 0) months += 12; }
    return `${years} Y, ${months} M`;
  };

  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    // Force English format
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleBirthdayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = e.target.value;
      setStudentData(prev => ({ ...prev, birthday: newDate, age: calculateDetailedAge(newDate) }));
  };

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      const allUsers = getUsers();
      const parentUser = allUsers.find(u => u.linkedStudentId === student.id && u.role === 'parent');
      setStudentData({ 
        name: student.name, 
        age: student.birthday ? calculateDetailedAge(student.birthday) : student.age.toString(), 
        birthday: student.birthday || '', 
        classGroup: student.classGroup, 
        parentName: student.parentName, 
        phone: student.phone, 
        parentUsername: parentUser ? parentUser.username : '', 
        parentPassword: '', 
        parentEmail: parentUser?.email || '' 
      });
    } else {
      setEditingStudent(null);
      setStudentData({ 
        name: '', 
        age: '', 
        birthday: '', 
        classGroup: classes.length > 0 ? classes[0].name : 'Birds', 
        parentName: '', 
        phone: '', 
        parentUsername: '', 
        parentPassword: '', 
        parentEmail: '' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData.name || !studentData.parentName) return;
    
    const allUsers = getUsers();
    if (studentData.parentUsername) {
      const isDup = allUsers.some(u => u.username.toLowerCase() === studentData.parentUsername.trim().toLowerCase() && (!editingStudent || u.linkedStudentId !== editingStudent.id));
      if (isDup) { alert(t('usernameExists' as any)); return; }
    }
    
    let currentStudentId = editingStudent ? editingStudent.id : Date.now().toString();
    const student: Student = { 
      id: currentStudentId, 
      name: studentData.name, 
      age: parseInt(studentData.age) || 4, 
      birthday: studentData.birthday, 
      classGroup: studentData.classGroup, 
      parentName: studentData.parentName, 
      phone: studentData.phone, 
      status: editingStudent?.status || StudentStatus.Active, 
      attendanceToday: editingStudent?.attendanceToday || false, 
      avatar: editingStudent?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.name)}` 
    };
    
    const updatedList = editingStudent ? students.map(s => s.id === editingStudent.id ? student : s) : [student, ...students];
    setStudents(updatedList); 
    saveStudents(updatedList);

    if (studentData.parentUsername && studentData.parentPassword) {
        const parentUser = editingStudent ? allUsers.find(u => u.linkedStudentId === currentStudentId && u.role === 'parent') : null;
        if (parentUser) {
            const upUsers = allUsers.map(u => u.id === parentUser.id ? { ...u, name: studentData.parentName, username: studentData.parentUsername, password: studentData.parentPassword || u.password, phone: studentData.phone, email: studentData.parentEmail } : u);
            saveUsers(upUsers);
        } else {
            const newUser: User = { 
              id: `u-${Date.now()}`, 
              name: studentData.parentName, 
              username: studentData.parentUsername.trim(), 
              password: studentData.parentPassword, 
              role: 'parent', 
              linkedStudentId: currentStudentId, 
              phone: studentData.phone, 
              email: studentData.parentEmail, 
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(studentData.parentName)}`, 
              interests: [] 
            };
            saveUsers([...allUsers, newUser]);
        }
    }
    setIsModalOpen(false);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.parentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">{t('studentRegistry')}</h2>
        <button onClick={() => handleOpenModal()} className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg"><Plus size={20}/></button>
      </div>
      <div className="bg-white rounded-[2rem] shadow-sm border overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
                <tr><th className="px-6 py-4">{t('studentName')}</th><th className="px-6 py-4">{t('studentClass')}</th><th className="px-6 py-4"></th></tr>
            </thead>
            <tbody className="divide-y">
                {filteredStudents.map(s => (
                  <tr key={s.id} onClick={() => onStudentSelect(s)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img src={s.avatar} className="w-8 h-8 rounded-full" alt={s.name} />
                      <span>{s.name}</span>
                    </td>
                    <td className="px-6 py-4">{s.classGroup}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={(e) => {e.stopPropagation(); handleOpenModal(s);}} className="text-gray-400 hover:text-indigo-600">
                        <Edit2 size={18}/>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
        </table>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b flex justify-between">
              <h3 className="font-bold">{editingStudent ? t('editStudent') : t('addStudentTitle')}</h3>
              <button onClick={() => setIsModalOpen(false)}><X/></button>
            </div>
            <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
              <input required className="w-full p-3 bg-gray-50 rounded-xl" placeholder={t('studentName')} value={studentData.name} onChange={e => setStudentData({...studentData, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input type="date" className="w-full p-3 bg-gray-50 rounded-xl opacity-0 absolute inset-0 cursor-pointer" value={studentData.birthday} onChange={handleBirthdayChange} />
                  <div className="p-3 bg-gray-50 rounded-xl text-sm" dir="ltr">{studentData.birthday ? getFormattedDate(studentData.birthday) : t('birthday')}</div>
                </div>
                <input readOnly className="w-full p-3 bg-gray-100 rounded-xl text-sm" value={studentData.age} placeholder="Auto Age" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">{t('studentClass')}</label>
                <select 
                  className="w-full p-3 bg-gray-50 rounded-xl text-sm" 
                  value={studentData.classGroup} 
                  onChange={e => setStudentData({...studentData, classGroup: e.target.value})}
                >
                  {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold">{t('saveData')}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
