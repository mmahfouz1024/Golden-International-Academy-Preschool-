
import React, { useState, useRef, useEffect } from 'react';
import { 
  Smile, Frown, Meh, Sun, Cloud, Moon, 
  Utensils, GlassWater, Droplets, Clock, Plus, Trash2, 
  Gamepad2, Pencil, Check, Lock, Image, Save, Calendar
} from 'lucide-react';
import { Student, DailyReport, Mood, MealStatus, BathroomType } from '../types';
import { getReports, saveReports } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';

interface StudentDetailProps {
  student: Student;
  readOnly?: boolean;
  initialDate?: string;
}

const StudentDetail: React.FC<StudentDetailProps> = ({ student, readOnly = false, initialDate }) => {
  const { t, language } = useLanguage();
  const { addNotification } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Helper to get local date string YYYY-MM-DD
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(initialDate || getTodayString());
  
  const [report, setReport] = useState<DailyReport>({
    id: `new-${Date.now()}`,
    studentId: student.id,
    date: selectedDate,
    mood: 'neutral',
    moodNotes: '',
    meals: { breakfast: 'none', lunch: 'none', snack: 'none', waterCups: 0, notes: '' },
    bathroom: [],
    nap: { slept: false, notes: '' },
    activities: [],
    photos: [],
    notes: ''
  });

  const [newActivity, setNewActivity] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // Load report when student or date changes
  useEffect(() => {
    const allReports = getReports();
    // Key pattern: studentId_date
    const reportKey = `${student.id}_${selectedDate}`;
    
    if (allReports[reportKey]) {
      setReport(allReports[reportKey]);
    } else {
      // Reset to blank report if none exists for this date
      setReport({
        id: `new-${Date.now()}`,
        studentId: student.id,
        date: selectedDate, // Ensure date matches selectedDate
        mood: 'neutral',
        moodNotes: '',
        meals: { breakfast: 'none', lunch: 'none', snack: 'none', waterCups: 0, notes: '' },
        bathroom: [],
        nap: { slept: false, notes: '' },
        activities: [],
        photos: [],
        notes: ''
      });
    }
  }, [student.id, selectedDate]);

  const handleSave = () => {
    const allReports = getReports();
    const reportKey = `${student.id}_${selectedDate}`;
    
    const updatedReports = {
      ...allReports,
      [reportKey]: { ...report, date: selectedDate }
    };
    
    saveReports(updatedReports);
    
    setIsSaved(true);
    addNotification(
      t('savedSuccessfully'), 
      `${t('newReportMsg')} ${student.name}`, 
      'success'
    );
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setReport(prev => ({
          ...prev,
          photos: [...(prev.photos || []), result]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (index: number) => {
    setReport(prev => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index)
    }));
  };

  const moods: { value: Mood; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'excited', label: t('excited'), icon: Sun, color: 'text-yellow-500 bg-yellow-50' },
    { value: 'happy', label: t('happy'), icon: Smile, color: 'text-green-500 bg-green-50' },
    { value: 'neutral', label: t('neutral'), icon: Meh, color: 'text-gray-500 bg-gray-50' },
    { value: 'tired', label: t('tired'), icon: Moon, color: 'text-purple-500 bg-purple-50' },
    { value: 'sad', label: t('sad'), icon: Frown, color: 'text-blue-500 bg-blue-50' },
    { value: 'sick', label: t('sick'), icon: Cloud, color: 'text-red-500 bg-red-50' },
  ];

  const mealOptions: { value: MealStatus; label: string }[] = [
    { value: 'all', label: t('mealAll') },
    { value: 'some', label: t('mealSome') },
    { value: 'none', label: t('mealNone') },
  ];

  const addBathroomEntry = () => {
    setReport(prev => ({
      ...prev,
      bathroom: [...prev.bathroom, { time: new Date().toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' }), type: 'urine' }]
    }));
  };

  const removeBathroomEntry = (index: number) => {
    setReport(prev => ({
      ...prev,
      bathroom: prev.bathroom.filter((_, i) => i !== index)
    }));
  };

  const addActivity = () => {
    if (newActivity.trim()) {
      setReport(prev => ({
        ...prev,
        activities: [...prev.activities, newActivity.trim()]
      }));
      setNewActivity('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex-wrap">
        <img src={student.avatar} alt={student.name} className="w-16 h-16 rounded-full border-2 border-indigo-100" />
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800">{student.name}</h2>
          <p className="text-gray-500">{student.classGroup}</p>
        </div>
        <div className="flex items-center gap-3">
           <div className={`text-${language === 'ar' ? 'left' : 'right'}`}>
            <div className="text-sm font-bold text-gray-400">{t('reportDate')}</div>
             {/* Date Picker Integration */}
             <div className="flex items-center gap-2 mt-1 relative">
               <Calendar size={18} className="text-indigo-500 absolute pointer-events-none" />
               <input 
                 type="date" 
                 value={selectedDate}
                 onChange={(e) => setSelectedDate(e.target.value)}
                 className={`bg-white border border-gray-200 rounded-lg px-2 py-1 ${language === 'ar' ? 'pr-8' : 'pl-8'} font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                 disabled={readOnly}
               />
             </div>
          </div>
        </div>
      </div>

      {readOnly && (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <Lock size={18} />
          <span>{t('readOnlyReport')}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Smile className="text-indigo-500" />
            {t('mood')}
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {moods.map((m) => {
              const Icon = m.icon;
              const isSelected = report.mood === m.value;
              return (
                <button
                  key={m.value}
                  disabled={readOnly}
                  onClick={() => setReport({ ...report, mood: m.value })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                    isSelected 
                      ? `${m.color} ring-2 ring-offset-1 ring-indigo-500 shadow-sm transform scale-105` 
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={24} />
                  <span className="text-xs font-medium">{m.label}</span>
                </button>
              );
            })}
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 mb-1 block">{t('moodDetails')}</label>
            <textarea 
              disabled={readOnly}
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-70"
              rows={2}
              placeholder="..."
              value={report.moodNotes}
              onChange={e => setReport({...report, moodNotes: e.target.value})}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Utensils className="text-indigo-500" />
            {t('meals')}
          </h3>
          <div className="space-y-4">
            {[
              { key: 'breakfast', label: t('breakfast'), icon: Sun },
              { key: 'lunch', label: t('lunch'), icon: Utensils },
              { key: 'snack', label: t('snack'), icon: Check },
            ].map((meal) => (
              <div key={meal.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                   <meal.icon size={16} />
                   <span className="text-sm font-medium">{meal.label}</span>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {mealOptions.map((opt) => (
                    <button
                      key={opt.value}
                      disabled={readOnly}
                      onClick={() => setReport({ ...report, meals: { ...report.meals, [meal.key]: opt.value } })}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                        (report.meals as any)[meal.key] === opt.value
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            
            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
               <div className="flex items-center gap-2 text-blue-500">
                 <GlassWater size={16} />
                 <span className="text-sm font-medium">{t('water')}</span>
               </div>
               <div className="flex items-center gap-3">
                 <button 
                  disabled={readOnly}
                  onClick={() => setReport(prev => ({ ...prev, meals: { ...prev.meals, waterCups: Math.max(0, prev.meals.waterCups - 1) } }))}
                  className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"
                 >
                   -
                 </button>
                 <span className="font-bold text-gray-700">{report.meals.waterCups}</span>
                 <button 
                  disabled={readOnly}
                  onClick={() => setReport(prev => ({ ...prev, meals: { ...prev.meals, waterCups: prev.meals.waterCups + 1 } }))}
                  className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"
                 >
                   +
                 </button>
               </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 mb-1 block">{t('mealNotes')}</label>
              <textarea 
                disabled={readOnly}
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-70"
                rows={2}
                placeholder="..."
                value={report.meals.notes}
                onChange={e => setReport({...report, meals: { ...report.meals, notes: e.target.value }})}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Droplets className="text-indigo-500" />
            {t('bathroomNap')}
          </h3>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-gray-700">{t('bathroomLog')}</span>
              {!readOnly && (
                <button onClick={addBathroomEntry} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded">
                  <Plus size={16} />
                </button>
              )}
            </div>
            {report.bathroom.length === 0 && <p className="text-xs text-gray-400 italic mb-2">--</p>}
            <div className="space-y-2">
              {report.bathroom.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-xs font-bold text-gray-600">{entry.time}</span>
                  <div className="flex-1 flex gap-1">
                    {(['urine', 'stool'] as BathroomType[]).map(type => (
                      <button
                        key={type}
                        disabled={readOnly}
                        onClick={() => {
                          const newBathroom = [...report.bathroom];
                          newBathroom[idx].type = type;
                          setReport({ ...report, bathroom: newBathroom });
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          entry.type === type ? 'bg-indigo-100 text-indigo-700 font-bold' : 'text-gray-400 bg-white border border-gray-100'
                        }`}
                      >
                         {t(type as any)}
                      </button>
                    ))}
                  </div>
                  {!readOnly && (
                    <button onClick={() => removeBathroomEntry(idx)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50">
             <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Moon className="text-purple-500" size={18} />
                  <span className="text-sm font-bold text-gray-700">{t('nap')}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={report.nap.slept}
                    disabled={readOnly}
                    onChange={(e) => setReport({...report, nap: { ...report.nap, slept: e.target.checked }})}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
             </div>
             {report.nap.slept && (
               <div className="mt-2 animate-fade-in space-y-2">
                 <input 
                   type="text" 
                   disabled={readOnly}
                   placeholder={t('napDuration')}
                   className="w-full p-2 text-xs border border-gray-200 rounded-lg"
                   value={report.nap.duration || ''}
                   onChange={e => setReport({...report, nap: { ...report.nap, duration: e.target.value }})}
                 />
                 <textarea 
                   disabled={readOnly}
                   className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-lg resize-none"
                   rows={2}
                   placeholder={t('napNotes')}
                   value={report.nap.notes || ''}
                   onChange={e => setReport({...report, nap: { ...report.nap, notes: e.target.value }})}
                 />
               </div>
             )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Gamepad2 className="text-indigo-500" />
            {t('activities')}
          </h3>
          
          <div className="space-y-2 mb-4">
            {report.activities.map((act, idx) => (
              <div key={idx} className="flex items-center justify-between bg-indigo-50 p-3 rounded-xl">
                 <span className="text-sm text-indigo-900">{act}</span>
                 {!readOnly && (
                   <button 
                    onClick={() => setReport({ ...report, activities: report.activities.filter((_, i) => i !== idx) })}
                    className="text-indigo-400 hover:text-indigo-600"
                   >
                     <Trash2 size={16} />
                   </button>
                 )}
              </div>
            ))}
             {report.activities.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">{t('noResults')}</p>}
          </div>

          {!readOnly && (
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder={t('addActivity')}
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addActivity()}
              />
              <button 
                onClick={addActivity}
                className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Image className="text-indigo-500" />
              {t('dailyPhotos')}
            </h3>
            {!readOnly && (
              <>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus size={16} />
                  {t('addPhoto')}
                </button>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {report.photos && report.photos.length > 0 ? (
              report.photos.map((photo, idx) => (
                <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <img src={photo} alt="Daily activity" className="w-full h-full object-cover" />
                  {!readOnly && (
                    <button 
                      onClick={() => removePhoto(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Image className="mx-auto mb-2 opacity-30" size={32} />
                <p className="text-sm">{t('noPhotos')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
           <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Pencil className="text-indigo-500" />
            {t('teacherNotes')}
          </h3>
          <textarea 
            disabled={readOnly}
            className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-700 disabled:opacity-80"
            rows={3}
            value={report.notes}
            onChange={(e) => setReport({ ...report, notes: e.target.value })}
            placeholder="..."
          />
        </div>

      </div>

      {!readOnly && (
        <div className={`fixed bottom-6 ${language === 'ar' ? 'left-6' : 'right-6'} z-10`}>
          <button 
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg font-bold text-white transition-all transform hover:-translate-y-1 ${
              isSaved ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isSaved ? (
              <>
                <Check size={20} />
                {t('savedSuccessfully')}
              </>
            ) : (
              <>
                <Save size={20} />
                <span>{t('saveReport')}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentDetail;
