
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Save as SaveIcon, Clock, CalendarDays } from 'lucide-react';
import { getSchedule, saveSchedule } from '../services/storageService';
import { ScheduleItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const DailyScheduleManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    // Load schedule from storage
    const items = getSchedule();
    // Sort by time
    items.sort((a, b) => a.time.localeCompare(b.time));
    setSchedule(items);
  }, []);

  const [formData, setFormData] = useState<Partial<ScheduleItem>>({
    time: '',
    title: '',
    color: 'green'
  });

  const handleOpenModal = (item?: ScheduleItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        time: item.time,
        title: item.title,
        color: item.color
      });
    } else {
      setEditingItem(null);
      setFormData({
        time: '',
        title: '',
        color: 'green'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time || !formData.title) return;

    let updatedSchedule: ScheduleItem[];

    if (editingItem) {
      updatedSchedule = schedule.map(item => 
        item.id === editingItem.id ? { ...item, ...formData } as ScheduleItem : item
      );
    } else {
      const newItem: ScheduleItem = {
        id: Date.now().toString(),
        time: formData.time!,
        title: formData.title!,
        color: formData.color as any || 'green'
      };
      updatedSchedule = [...schedule, newItem];
    }

    // Sort again
    updatedSchedule.sort((a, b) => a.time.localeCompare(b.time));
    
    setSchedule(updatedSchedule);
    saveSchedule(updatedSchedule);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('deleteItemConfirm'))) {
      const updatedSchedule = schedule.filter(item => item.id !== id);
      setSchedule(updatedSchedule);
      saveSchedule(updatedSchedule);
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-50 text-green-700 border-green-200';
      case 'blue': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'orange': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'purple': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'red': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t('scheduleManagement')}</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">{t('manageSchedule')}</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm sm:text-base"
        >
          <Plus size={18} />
          <span>{t('addItem')}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs sm:text-sm">
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600">{t('time')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600">{t('activityTitle')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600">{t('colorLabel')}</th>
                <th className="px-3 py-3 sm:px-6 sm:py-4 font-semibold text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {schedule.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-2 text-gray-700 font-mono text-sm font-bold bg-gray-50 w-fit px-3 py-1 rounded-lg border border-gray-200">
                       <Clock size={14} className="text-gray-400" />
                       <span dir="ltr">{item.time}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <span className="font-bold text-gray-800">{item.title}</span>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getColorClass(item.color)}`}>
                      {t(`color${item.color.charAt(0).toUpperCase() + item.color.slice(1)}` as any)}
                    </span>
                  </td>
                  <td className="px-3 py-3 sm:px-6 sm:py-4 text-left">
                    <div className="flex items-center gap-1 sm:gap-2">
                       <button 
                         onClick={() => handleOpenModal(item)}
                         className="text-gray-400 hover:text-indigo-600 p-1.5 sm:p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                         title={t('edit')}
                       >
                         <Edit2 size={16} />
                       </button>
                       <button 
                         onClick={() => handleDelete(item.id)}
                         className="text-gray-400 hover:text-red-600 p-1.5 sm:p-2 hover:bg-red-50 rounded-lg transition-colors"
                         title={t('delete')}
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {schedule.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                    {t('noResults')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">{editingItem ? t('editItem') : t('addItem')}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('time')}</label>
                <input 
                  required
                  type="time" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('activityTitle')}</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('colorLabel')}</label>
                <select
                   className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                   value={formData.color}
                   onChange={e => setFormData({...formData, color: e.target.value as any})}
                >
                  <option value="green">{t('colorGreen')}</option>
                  <option value="blue">{t('colorBlue')}</option>
                  <option value="orange">{t('colorOrange')}</option>
                  <option value="purple">{t('colorPurple')}</option>
                  <option value="red">{t('colorRed')}</option>
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
                  <SaveIcon size={18} />
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

export default DailyScheduleManagement;
