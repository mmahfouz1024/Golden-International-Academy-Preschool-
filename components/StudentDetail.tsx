
import React, { useState, useRef, useEffect } from 'react';
import { 
  Smile, Frown, Meh, Sun, Cloud, Moon, 
  Utensils, Droplets, Clock, Plus, Trash2, 
  Gamepad2, Pencil, Check, Lock, Image, Save, Calendar, Cake, FileText, ChevronDown, BookOpen, X
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
  const [doesReportExist, setDoesReportExist] = useState(false);
  
  const [report, setReport] = useState<DailyReport>({
    id: `new-${Date.now()}`,
    studentId: student.id,
    date: selectedDate,
    mood: 'neutral',
    moodNotes: '',
    meals: { breakfast: 'none', lunch: 'none', snack: 'none', waterCups: 0, notes: '' },
    bathroom: [],
    nap: { slept: false, notes: '' },
    academic: { religion: [], arabic: [], english: [], math: [] },
    activities: [],
    photos: [],
    notes: ''
  });

  const [academicInputs, setAcademicInputs] = useState({
    religion: '',
    arabic: '',
    english: '',
    math: ''
  });

  const [isSaved, setIsSaved] = useState(false);

  // Predefined Activities List
  const activitiesList = [
    'Montessori', 'Garden', 'Coloring', 'Art', 'Swimming', 
    'Puzzle', 'Blocks', 'Songs', 'Etiquette', 
    'Circle time', 'Learning center', 'P.E'
  ];

  // Helper to format date for display
  const getFormattedDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Always display date in English as requested
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Load report when student or date changes
  useEffect(() => {
    const allReports = getReports();
    // Key pattern: studentId_date
    const reportKey = `${student.id}_${selectedDate}`;
    
    if (allReports[reportKey]) {
      const loadedReport = allReports[reportKey];
      
      // Ensure academic object exists and normalize strings to arrays for legacy support
      const normalizeAcademic = (val: string | string[] | undefined) => {
         if (Array.isArray(val)) return val;
         if (typeof val === 'string' && val.trim() !== '') return [val];
         return [];
      };

      if (!loadedReport.academic) {
        loadedReport.academic = { religion: [], arabic: [], english: [], math: [] };
      } else {
        loadedReport.academic.religion = normalizeAcademic(loadedReport.academic.religion as any);
        loadedReport.academic.arabic = normalizeAcademic(loadedReport.academic.arabic as any);
        loadedReport.academic.english = normalizeAcademic(loadedReport.academic.english as any);
        loadedReport.academic.math = normalizeAcademic(loadedReport.academic.math as any);
      }
      
      // Ensure activities array exists
      if (!Array.isArray(loadedReport.activities)) {
        loadedReport.activities = [];
      }
      
      setReport(loadedReport);
      setDoesReportExist(true);
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
        academic: { religion: [], arabic: [], english: [], math: [] },
        activities: [], // Ensure array is initialized
        photos: [],
        notes: ''
      });
      setDoesReportExist(false);
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
    setDoesReportExist(true);
    
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

  const toggleActivity = (activity: string) => {
    if (readOnly) return;
    setReport(prev => {
      const activities = prev.activities || [];
      if (activities.includes(activity)) {
        return { ...prev, activities: activities.filter(a => a !== activity) };
      } else {
        return { ...prev, activities: [...activities, activity] };
      }
    });
  };

  const handleAddAcademicItem = (subject: keyof typeof academicInputs) => {
    const val = academicInputs[subject].trim();
    if (!val) return;
    
    setReport(prev => {
      const currentList = prev.academic?.[subject] || [];
      return {
        ...prev,
        academic: {
          ...prev.academic,
          [subject]: [...currentList, val]
        }
      };
    });
    
    setAcademicInputs(prev => ({ ...prev, [subject]: '' }));
  };

  const handleRemoveAcademicItem = (subject: keyof typeof academicInputs, index: number) => {
    setReport(prev => {
      const currentList = prev.academic?.[subject] || [];
      return {
        ...prev,
        academic: {
          ...prev.academic,
          [subject]: currentList.filter((_, i) => i !== index)
        }
      };
    });
  };

  const renderAcademicSection = (subjectKey: keyof typeof academicInputs, title: string, isLtr: boolean = false) => {
    const items = report.academic?.[subjectKey] || [];
    
    return (
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 block">{title}</label>
        {!readOnly && (
          <div className="flex gap-2">
            <input 
              type="text"
              className={`flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm ${isLtr ? 'text-left font-sans' : ''}`}
              dir={isLtr ? 'ltr' : undefined}
              value={academicInputs[subjectKey]}
              onChange={e => setAcademicInputs({...academicInputs, [subjectKey]: e.target.value})}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAcademicItem(subjectKey);
                }
              }}
              placeholder={t('add')}
            />
            <button 
              onClick={() => handleAddAcademicItem(subjectKey)}
              disabled={!academicInputs[subjectKey].trim()}
              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => (
             <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border font-medium ${isLtr ? 'font-sans' : ''} bg-white border-gray-200 text-gray-700 shadow-sm`}>
               <span dir={isLtr ? 'ltr' : undefined}>{item}</span>
               {!readOnly && (
                 <button 
                   onClick={() => handleRemoveAcademicItem(subjectKey, idx)}
                   className="text-gray-400 hover:text-red-500 rounded-full p-0.5 hover:bg-red-50 transition-colors"
                 >
                   <X size={14} />
                 </button>
               )}
             </div>
          ))}
          {items.length === 0 && readOnly && (
             <span className="text-sm text-gray-400 italic">--</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <img src={student.avatar} alt={student.name} className="w-16 h-16 rounded-full border-4 border-indigo-50 shadow-sm" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{student.name}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-medium">{student.classGroup}</span>
              {student.birthday && (
                <span className="flex items-center gap-1">
                  <Cake size={12} className="text-pink-400" /> {student.birthday}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
           <label className="text-xs font-bold text-gray-400 mb-1">{t('reportDate')}</label>
           <div className="relative group">
              <div className="flex items-center gap-3 bg-gray-50 hover:bg-white border border-gray-200 hover:border-indigo-300 rounded-xl px-4 py-2 transition-all cursor-pointer shadow-sm">
                <Calendar size={20} className="text-indigo-500" />
                <span className="font-bold text-gray-700 min-w-[140px] text-center" dir="ltr">
                  {getFormattedDate(selectedDate)}
                </span>
                <ChevronDown size={16} className="text-gray-400 group-hover:text-indigo-500" />
              </div>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
           </div>
        </div>
      </div>

      {readOnly && !doesReportExist ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center animate-fade-in">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
               <FileText className="text-gray-300" size={36} />
           </div>
           <h3 className="text-lg font-bold text-gray-600">{t('noReportForDate')}</h3>
           <p className="text-sm text-gray-400 mt-1" dir="ltr">{getFormattedDate(selectedDate)}</p>
        </div>
      ) : (
        <>
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
                  <div key={meal.key} className="space-y-2 pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
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
                    {/* Specific Meal Item Input */}
                    <input
                        type="text"
                        disabled={readOnly}
                        placeholder={t('mealItemPlaceholder')}
                        className="w-full px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-70 disabled:bg-transparent"
                        value={(report.meals as any)[`${meal.key}Item`] || ''}
                        onChange={(e) => setReport({
                            ...report,
                            meals: { ...report.meals, [`${meal.key}Item`]: e.target.value }
                        })}
                    />
                  </div>
                ))}
                
                <div className="pt-2">
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

            {/* Bathroom Card (Separated) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Droplets className="text-indigo-500" />
                {t('bathroomLog')}
              </h3>
              
              <div className="mb-2">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-500">{t('details')}</span>
                  {!readOnly && (
                    <button onClick={addBathroomEntry} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded transition-colors" title={t('add')}>
                      <Plus size={20} />
                    </button>
                  )}
                </div>
                {report.bathroom.length === 0 && <p className="text-xs text-gray-400 italic mb-2 py-4 text-center bg-gray-50 rounded-lg">--</p>}
                <div className="space-y-2">
                  {report.bathroom.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-600 min-w-[50px]">{entry.time}</span>
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
                            className={`text-[10px] px-3 py-1 rounded-full transition-all ${
                              entry.type === type ? 'bg-indigo-100 text-indigo-700 font-bold shadow-sm' : 'text-gray-400 bg-white border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {t(type as any)}
                          </button>
                        ))}
                      </div>
                      {!readOnly && (
                        <button onClick={() => removeBathroomEntry(idx)} className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Nap Card (Separated) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                      <Moon className="text-purple-500" size={20} />
                      {t('nap')}
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={report.nap.slept}
                        disabled={readOnly}
                        onChange={(e) => setReport({...report, nap: { ...report.nap, slept: e.target.checked }})}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                </div>
                
                {report.nap.slept ? (
                  <div className="mt-4 animate-fade-in space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 font-bold mb-1 block uppercase tracking-wider">{t('napDuration')}</label>
                        <input 
                        type="text" 
                        disabled={readOnly}
                        placeholder="e.g. 1h 30m"
                        className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        value={report.nap.duration || ''}
                        onChange={e => setReport({...report, nap: { ...report.nap, duration: e.target.value }})}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-bold mb-1 block uppercase tracking-wider">{t('napNotes')}</label>
                        <textarea 
                        disabled={readOnly}
                        className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        rows={2}
                        placeholder="..."
                        value={report.nap.notes || ''}
                        onChange={e => setReport({...report, nap: { ...report.nap, notes: e.target.value }})}
                        />
                    </div>
                  </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-gray-300 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <Moon size={32} className="mb-2 opacity-50" />
                        <p className="text-sm italic">{t('no')}</p>
                    </div>
                )}
            </div>

            {/* Academic Card (Updated to allow list of items) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="text-indigo-500" />
                {t('academic')}
              </h3>
              
              <div className="space-y-6">
                {renderAcademicSection('religion', t('religion'))}
                {renderAcademicSection('arabic', t('arabicSubject'))}
                {renderAcademicSection('english', t('englishSubject'), true)}
                {renderAcademicSection('math', t('mathSubject'), true)}
              </div>
            </div>

            {/* Activities Card (Updated with Checkboxes) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Gamepad2 className="text-indigo-500" />
                {t('activities')}
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {activitiesList.map((act) => {
                  const isSelected = (report.activities || []).includes(act);
                  return (
                    <div 
                      key={act}
                      onClick={() => toggleActivity(act)}
                      className={`
                        cursor-pointer flex items-center gap-3 p-3 rounded-xl border-2 transition-all select-none
                        ${isSelected
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'}
                        ${readOnly ? 'cursor-default opacity-80' : ''}
                      `}
                    >
                      <div className={`
                        w-5 h-5 rounded border flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}
                      `}>
                        {isSelected && <Check size={14} className="text-white" />}
                      </div>
                      <span className={`text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
                        {t(act as any)}
                      </span>
                    </div>
                  );
                })}
              </div>
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
        </>
      )}
    </div>
  );
};

export default StudentDetail;
