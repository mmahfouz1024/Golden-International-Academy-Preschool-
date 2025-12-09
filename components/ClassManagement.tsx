
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Save, School, Users } from 'lucide-react';
import { getUsers, getClasses, saveClasses, getStudents, saveStudents } from '../services/storageService';
import { ClassGroup, User } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const ClassManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);

  // Load classes and users from storage on mount
  useEffect(() => {
    setClasses(getClasses());
    setUsers(getUsers());
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
    c.name.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('classManagement')}</h2>
          <p className="text-gray-500 mt-1">{t('manageClasses')}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium"
        >
          <Plus size={20} />
          <span>{t('addClass')}</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="relative max-w-md">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((group) => {
          const teacher = teachers.find(t => t.id === group.teacherId);
          return (
            <div key={group.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                  <School size={24} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleOpenModal(group)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(group.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-1">{group.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{t('ageRange')}: {group.ageRange}</p>

              <div className="space-y-3 mt-auto">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {teacher ? (
                    <>
                      <img src={teacher.avatar} alt={teacher.name} className="w-8 h-8 rounded-full border border-white" />
                      <div>
                        <p className="text-xs text-gray-500">{t('assignedTeacher')}</p>
                        <p className="text-sm font-medium text-gray-700">{teacher.name}</p>
                      </div>
                    </>
                  ) : (
                     <div className="flex items-center gap-2 text-gray-400">
                       <Users size={16} />
                       <span className="text-sm">{t('assignedTeacher')}: -</span>
                     </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm text-gray-600 pt-2 border-t border-gray-50">
                  <span>{t('capacity')}</span>
                  <span className="font-bold">{group.capacity}</span>
                </div>
              </div>
            </div>
          );
        })}
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
                  placeholder="مثال: الفراشات"
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
                    placeholder="مثال: 3-4"
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
