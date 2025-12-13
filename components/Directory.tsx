
import React, { useState, useEffect } from 'react';
import { Search, Users, GraduationCap, Baby, Phone, Mail, School } from 'lucide-react';
import { getUsers, getStudents } from '../services/storageService';
import { User, Student } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const Directory: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'parents'>('students');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    setStudents(getStudents());
    setUsers(getUsers());
  }, []);

  const teachers = users.filter(u => u.role === 'teacher' || u.role === 'admin');
  const parents = users.filter(u => u.role === 'parent');

  const filterList = (list: any[]) => {
    return list.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.phone && item.phone.includes(searchTerm)) ||
      (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const filteredStudents = filterList(students);
  const filteredTeachers = filterList(teachers);
  const filteredParents = filterList(parents);

  const handleCall = (phoneNumber?: string) => {
    if (phoneNumber) {
        // Remove spaces and special chars for the dialer link
        window.location.href = `tel:${phoneNumber.replace(/\s+/g, '')}`;
    } else {
        alert("No phone number available");
    }
  };

  const handleEmail = (email?: string) => {
    if (email) {
        window.location.href = `mailto:${email}`;
    } else {
        alert("No email address available");
    }
  };

  const TabButton = ({ id, label, icon: Icon, count }: { id: string, label: string, icon: any, count: number }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl transition-all ${
        activeTab === id 
          ? 'bg-indigo-600 text-white shadow-md' 
          : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
      }`}
    >
      <div className={`p-2 rounded-full mb-2 ${activeTab === id ? 'bg-white/20' : 'bg-gray-100'}`}>
        <Icon size={24} />
      </div>
      <span className="font-bold text-sm">{label}</span>
      <span className={`text-xs mt-1 ${activeTab === id ? 'text-indigo-200' : 'text-gray-400'}`}>
        {count}
      </span>
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{t('directoryTitle')}</h2>
        <p className="text-gray-500 mt-1">{t('directorySubtitle')}</p>
      </div>

      <div className="flex gap-4">
        <TabButton id="students" label={t('allStudents')} icon={Baby} count={students.length} />
        <TabButton id="teachers" label={t('allTeachers')} icon={GraduationCap} count={teachers.length} />
        <TabButton id="parents" label={t('allParents')} icon={Users} count={parents.length} />
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
          <input 
            type="text" 
            placeholder={t('search')}
            className={`w-full ${language === 'ar' ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {activeTab === 'students' && filteredStudents.map(student => (
          <div key={student.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <img src={student.avatar} alt={student.name} className="w-16 h-16 rounded-full object-cover border-2 border-indigo-50" />
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{student.name}</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium mt-1">
                  <School size={10} /> {student.classGroup}
                </span>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-gray-50">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Users size={16} className="text-gray-400" />
                <span>{t('parentName')}: <span className="font-medium text-gray-800">{student.parentName}</span></span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Phone size={16} className="text-gray-400" />
                <span dir="ltr">{student.phone}</span>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => handleCall(student.phone)}
                  className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                >
                  {t('callNow')}
                </button>
              </div>
            </div>
          </div>
        ))}

        {activeTab === 'teachers' && filteredTeachers.map(teacher => (
          <div key={teacher.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <img src={teacher.avatar} alt={teacher.name} className="w-16 h-16 rounded-full object-cover border-2 border-purple-50" />
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{teacher.name}</h3>
                <span className="text-sm text-gray-500">{t(teacher.role === 'admin' ? 'roleAdmin' : 'roleTeacher')}</span>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-gray-50">
              {teacher.email && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail size={16} className="text-gray-400" />
                  <span className="truncate">{teacher.email}</span>
                </div>
              )}
              {teacher.phone && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={16} className="text-gray-400" />
                  <span dir="ltr">{teacher.phone}</span>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                 <button 
                   onClick={() => handleEmail(teacher.email)}
                   className="flex-1 py-2 bg-purple-50 text-purple-600 rounded-lg text-sm font-bold hover:bg-purple-100 transition-colors"
                 >
                   {t('sendEmail')}
                 </button>
                 {teacher.phone && (
                    <button 
                      onClick={() => handleCall(teacher.phone)}
                      className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                    >
                      {t('callNow')}
                    </button>
                 )}
              </div>
            </div>
          </div>
        ))}

        {activeTab === 'parents' && filteredParents.map(parent => (
          <div key={parent.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <img src={parent.avatar} alt={parent.name} className="w-16 h-16 rounded-full object-cover border-2 border-green-50" />
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{parent.name}</h3>
                <span className="text-sm text-gray-500">{t('roleParent')}</span>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-gray-50">
              {parent.linkedStudentId && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Baby size={16} className="text-gray-400" />
                  <span>{t('linkedStudent')}: 
                    <span className="font-medium text-gray-800 mx-1">
                      {students.find(s => s.id === parent.linkedStudentId)?.name || '-'}
                    </span>
                  </span>
                </div>
              )}
              {parent.phone && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={16} className="text-gray-400" />
                  <span dir="ltr">{parent.phone}</span>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                 <button 
                   onClick={() => handleCall(parent.phone)}
                   className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors"
                 >
                   {t('callNow')}
                 </button>
              </div>
            </div>
          </div>
        ))}
        
        {((activeTab === 'students' && filteredStudents.length === 0) ||
          (activeTab === 'teachers' && filteredTeachers.length === 0) ||
          (activeTab === 'parents' && filteredParents.length === 0)) && (
          <div className="col-span-full py-12 text-center text-gray-400">
            {t('noResults')}
          </div>
        )}
      </div>
    </div>
  );
};

export default Directory;
