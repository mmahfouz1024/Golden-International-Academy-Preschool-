
import React, { useState, useEffect } from 'react';
import { Calendar as CalIcon, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getEvents, saveEvents } from '../services/storageService';
import { SchoolEvent } from '../types';

const SchoolCalendar: React.FC = () => {
  const { t } = useLanguage();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<SchoolEvent>>({
      title: '',
      date: new Date().toISOString().split('T')[0],
      type: 'activity',
      description: ''
  });

  useEffect(() => {
      const loaded = getEvents();
      loaded.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(loaded);
  }, []);

  const handleAddEvent = () => {
      if (!newEvent.title || !newEvent.date) return;
      const event: SchoolEvent = {
          id: Date.now().toString(),
          title: newEvent.title!,
          date: newEvent.date!,
          type: newEvent.type as any,
          description: newEvent.description
      };
      const updated = [...events, event];
      updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(updated);
      saveEvents(updated);
      setIsAdding(false);
      setNewEvent({ title: '', date: '', type: 'activity', description: '' });
  };

  const handleDelete = (id: string) => {
      if (confirm(t('deleteEventConfirm'))) {
          const updated = events.filter(e => e.id !== id);
          setEvents(updated);
          saveEvents(updated);
      }
  };

  const getTypeColor = (type: string) => {
      switch (type) {
          case 'holiday': return 'bg-red-100 text-red-700 border-red-200';
          case 'exam': return 'bg-orange-100 text-orange-700 border-orange-200';
          case 'meeting': return 'bg-blue-100 text-blue-700 border-blue-200';
          default: return 'bg-green-100 text-green-700 border-green-200';
      }
  };

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">{t('calendarTitle')}</h2>
                <p className="text-gray-500">{t('calendarSubtitle')}</p>
            </div>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-bold"
            >
                <Plus size={20} />
                {t('addEvent')}
            </button>
        </div>

        {isAdding && (
            <div className="bg-white p-6 rounded-2xl shadow-md border border-indigo-100 mb-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input 
                        className="p-3 border rounded-xl"
                        placeholder={t('eventTitle')}
                        value={newEvent.title}
                        onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                    />
                    <input 
                        type="date"
                        className="p-3 border rounded-xl"
                        value={newEvent.date}
                        onChange={e => setNewEvent({...newEvent, date: e.target.value})}
                    />
                    <select
                        className="p-3 border rounded-xl bg-white"
                        value={newEvent.type}
                        onChange={e => setNewEvent({...newEvent, type: e.target.value as any})}
                    >
                        <option value="activity">{t('typeActivity')}</option>
                        <option value="holiday">{t('typeHoliday')}</option>
                        <option value="meeting">{t('typeMeeting')}</option>
                        <option value="exam">{t('typeExam')}</option>
                    </select>
                    <input 
                        className="p-3 border rounded-xl"
                        placeholder="Description (Optional)"
                        value={newEvent.description}
                        onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                    />
                </div>
                <button 
                    onClick={handleAddEvent}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold"
                >
                    {t('save')}
                </button>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
                <div key={event.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-all">
                    <button 
                        onClick={() => handleDelete(event.id)}
                        className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 size={18} />
                    </button>
                    
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg text-xs font-bold uppercase tracking-wide border ${getTypeColor(event.type)}`}>
                            {t(`type${event.type.charAt(0).toUpperCase() + event.type.slice(1)}` as any)}
                        </div>
                        <span className="text-sm text-gray-500 font-medium" dir="ltr">{event.date}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>
                    {event.description && <p className="text-gray-500 text-sm">{event.description}</p>}
                </div>
            ))}
            
            {events.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400">
                    <CalIcon size={40} className="mx-auto mb-3 opacity-30" />
                    <p>{t('noEvents')}</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default SchoolCalendar;
