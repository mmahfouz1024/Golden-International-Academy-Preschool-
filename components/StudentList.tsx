
import React, { useState, useRef } from 'react';
import { Search, Plus, Phone, Star, ChevronLeft, ChevronRight, X, Save, Filter, Camera } from 'lucide-react';
import { MOCK_STUDENTS } from '../constants';
import { Student, StudentStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface StudentListProps {
  onStudentSelect: (student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ onStudentSelect }) => {
  const { t, language } = useLanguage();
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterClass, setFilterClass] = useState('All');
  const [filterAge, setFilterAge] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newStudentAvatar, setNewStudentAvatar] = useState<string>('');
  
  const [newStudentData, setNewStudentData] = useState({
    name: '',
    age: '',
    classGroup: 'البراعم',
    parentName: '',
    phone: ''
  });

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

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentData.name || !newStudentData.parentName) return;

    const newStudent: Student = {
      id: Date.now().toString(),
      name: newStudentData.name,
      age: parseInt(newStudentData.age) || 4,
      classGroup: newStudentData.classGroup,
      parentName: newStudentData.parentName,
      phone: newStudentData.phone,
      status: StudentStatus.Active,
      attendanceToday: false,
      // Use uploaded avatar or generate a random one
      avatar: newStudentAvatar || `https://picsum.photos/seed/${Date.now()}/200/200`
    };

    setStudents([newStudent, ...students]);
    setIsAddModalOpen(false);
    setNewStudentData({ name: '', age: '', classGroup: 'البراعم', parentName: '', phone: '' });
    setNewStudentAvatar('');
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.includes(searchTerm) || student.parentName.includes(searchTerm);
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
          onClick={() => setIsAddModalOpen(true)}
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
              <option value="البراعم">البراعم</option>
              <option value="العصافير">العصافير</option>
              <option value="النجوم">النجوم</option>
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
                    <button className="text-gray-400 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-lg transition-colors">
                      {language === 'ar' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
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

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">{t('addStudentTitle')}</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              
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
                  <img 
                    src={newStudentAvatar || "https://picsum.photos/seed/new/200/200"} 
                    alt="Preview" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-indigo-50"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                  </div>
                </div>
                <span className="text-xs text-gray-500 mt-2 hover:text-indigo-600 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {t('changePhoto')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('studentName')}</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newStudentData.name}
                    onChange={e => setNewStudentData({...newStudentData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('studentAge')}</label>
                  <input 
                    required
                    type="number" 
                    min="2" max="7"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newStudentData.age}
                    onChange={e => setNewStudentData({...newStudentData, age: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('studentClass')}</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    value={newStudentData.classGroup}
                    onChange={e => setNewStudentData({...newStudentData, classGroup: e.target.value})}
                  >
                    <option value="البراعم">البراعم</option>
                    <option value="العصافير">العصافير</option>
                    <option value="النجوم">النجوم</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('parentName')}</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newStudentData.parentName}
                    onChange={e => setNewStudentData({...newStudentData, parentName: e.target.value})}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
                  <input 
                    required
                    type="tel" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={newStudentData.phone}
                    onChange={e => setNewStudentData({...newStudentData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
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
