
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Save, School, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { getUsers, getClasses, saveClasses, getStudents, saveStudents } from '../services/storageService';
import { ClassGroup, User, Student } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const ClassManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);

  // Load classes, users, and students from storage on mount
  useEffect(() => {
    setClasses(getClasses());
    setUsers(getUsers());
    setStudents(getStudents());
  }, []);

  const [formData, setFormData] = useState<Partial<ClassGroup>>({
    name: '',
    ageRange: '',
    teacherId: '',
    capacity: 20
  });

  const teachers = users.filter(u => u.role === 'teacher' || u.role === 'admin' || u.role === 'manager');

  const handleOpenModal = (classGroup?: ClassGroup) => {
    if (classGroup) {
      setEditingClass(classGroup);
      setFormData({
        name: classGroup.name,
        ageRange: classGroup.ageRange,
        teacherId: classGroup.teacherId || '',
        capacity: classGroup.capacity
      });
    } else {
      setEditingClass(null);
      setFormData({
        name: '',
        ageRange: '',
        teacherId: '',
        capacity: 20
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    let updatedClasses: ClassGroup[];

    if (editingClass) {
      updatedClasses = classes.map(c => c.id === editingClass.id ? { ...c, ...formData } as ClassGroup : c);
      
      // If Class Name Changed, update all students belonging to this class
      const oldName = editingClass.name.trim();
      const newName = formData.name.trim();

      if (newName && oldName !== newName) {
        const allStudents = getStudents();
        const updatedStudents = allStudents.map(student => 
          student.classGroup.trim() === oldName 
            ? { ...student, classGroup: newName } 
            : student
        );
        saveStudents(updatedStudents);
        setStudents(updatedStudents); // Update local state as well
      }

    } else {
      const newClass: ClassGroup = {
        id: `c-${Date.now()}`,
        name: formData.name,
        ageRange: formData.ageRange || '',
        teacherId: formData.teacherId,
        capacity: formData.capacity || 20
      };
      updatedClasses = [...classes, newClass];
    }
    setClasses(updatedClasses);
    saveClasses(updatedClasses);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('deleteClassConfirm'))) {
      const updatedClasses = classes.filter(c => c.id !== id);
      setClasses(updatedClasses);
      saveClasses(updatedClasses);
    }
  };

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t('classManagement')}</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">{t('manageClasses')}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm sm:text-base"
        >
          <Plus size={18} />
          <span>{t('addClass')}</span>
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
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600">{t('className')}</th>
                <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600">{t('ageRange')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600">{t('assignedTeacher')}</th>
                <th className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600">{t('capacity')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredClasses.map((group) => {
                const teacher = teachers.find(t => t.id === group.teacherId);
                const currentCount = students.filter(s => s.classGroup === group.name).length;
                const capacityPercentage = Math.min(100, (currentCount / group.capacity) * 100);
                
                return (
                  <tr key={group.id} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => handleOpenModal(group)}>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                           <School size={20} />
                        </div>
                        <span className="font-bold text-gray-800 text-sm sm:text-base">{group.name}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4 text-gray-600 text-sm">
                      {group.ageRange}
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                      {teacher ? (
                        <div className="flex items-center gap-2">
                          <img src={teacher.avatar} alt={teacher.name} className="w-8 h-8 rounded-full border border-gray-100 shadow-sm object-cover" />
                          <div className="flex flex-col">
                             <span className="text-sm font-medium text-gray-700">{teacher.name}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">{t('noClassAssigned')}</span>
                      )}
                    </td>
                    <td className="hidden sm:table-cell px-3 py-3 sm:px-6 sm:py-4">
                       <div className="flex items-center gap-3">
                          <div className="flex-1 w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                             <div 
                               className={`h-full rounded-full ${capacityPercentage > 90 ? 'bg-red-500' : 'bg-green-500'}`} 
                               style={{ width: `${capacityPercentage}%` }}
                             ></div>
                          </div>
                          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                             {currentCount} / {group.capacity}
                          </span>
                       </div>
                    </td>
                    <td className="px-3 py-3 sm:px-6 sm:py-4 text-left">
                      <div className="flex items-center gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                         <button 
                           type="button"
                           onClick={(e) => { e.stopPropagation(); handleOpenModal(group); }}
                           className="text-gray-400 hover:text-indigo-600 p-1.5 sm:p-2 hover:bg-indigo-50 rounded-lg transition-colors pointer-events-auto"
                           title={t('edit')}
                         >
                           <Edit2 size={16} className="pointer-events-none" />
                         </button>
                         <button 
                           type="button"
                           onClick={(e) => { e.stopPropagation(); handleDelete(group.id); }}
                           className="text-gray-400 hover:text-red-600 p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors pointer-events-auto"
                           title={t('delete')}
                         >
                           <Trash2 size={16} className="pointer-events-none" />
                         </button>
                         <div className="text-gray-300 px-0.5 hidden sm:block">|</div>
                         <button 
                           type="button"
                           className="text-gray-300 hover:text-indigo-600 p-1.5 sm:p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                           onClick={() => handleOpenModal(group)}
                         >
                           {language === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                         </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredClasses.length === 0 && (
          <div className="p-8 sm:p-12 text-center text-gray-400">
            {t('noResults')}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">{editingClass ? t('editClass') : t('addClass')}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('className')}</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Birds"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('ageRange')}</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={formData.ageRange}
                    onChange={e => setFormData({...formData, ageRange: e.target.value})}
                    placeholder="Ex: 3-4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('capacity')}</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={formData.capacity}
                    onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('assignedTeacher')}</label>
                <select
                   className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                   value={formData.teacherId}
                   onChange={e => setFormData({...formData, teacherId: e.target.value})}
                >
                  <option value="">{t('assignedTeacher')}...</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
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
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
