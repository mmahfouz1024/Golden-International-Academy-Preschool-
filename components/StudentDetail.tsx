
import React, { useState, useRef, useEffect } from 'react';
import { 
  Smile, Frown, Meh, Sun, Cloud, Moon, 
  Utensils, Droplets, Plus, Trash2, 
  Gamepad2, Pencil, Check, Lock, Image, Save, Calendar, Cake, FileText, ChevronDown, BookOpen, X, Baby, Download, AlertTriangle, Coffee, Pizza, Apple, Minus
} from 'lucide-react';
import { Student, DailyReport, Mood, MealStatus } from '../types';
import { getReports, saveReports } from '../services/storageService';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';

interface StudentDetailProps {
  student: Student;
  readOnly?: boolean;
  initialDate?: string;
}

// Helper type for safe dynamic access
type MealDetailsKey = 'breakfastDetails' | 'lunchDetails' | 'snackDetails';

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
    meals: { breakfast: 'none', breakfastDetails: [], lunch: 'none', lunchDetails: [], snack: 'none', snackDetails: [], waterCups: 0, notes: '' },
    bathroom: { urine: 0, stool: 0, notes: '' },
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

  const [mealInputs, setMealInputs] = useState({
    breakfast: '',
    lunch: '',
    snack: ''
  });

  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Predefined Activities List
  const activitiesList = [
    'Montessori', 'Garden', 'Coloring', 'Art', 'Swimming', 
    'Puzzle', 'Blocks', 'Songs', 'Etiquette', 
    'Circle time', 'Learning center', 'P.E'
  ];

  // Helper to format date for display: 25 October 2025
  const getFormattedDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Helper to calculate age string for display
  const getDetailedAge = () => {
    if (student.birthday) {
      const birth = new Date(student.birthday);
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth();
      
      if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
          years--;
          months += 12;
      }
      
      if (now.getDate() < birth.getDate()) {
          months--;
          if (months < 0) months += 12;
      }
      return `${years} Y, ${months} M`;
    }
    return `${student.age} Years`;
  };

  // Load report when student or date changes
  useEffect(() => {
    const allReports = getReports();
    // Key pattern: studentId_date
    const reportKey = `${student.id}_${selectedDate}`;
    
    if (allReports[reportKey]) {
      const loadedReport = allReports[reportKey];
      
      // Normalization helpers for Array Data
      const normalizeArray = (val: string | string[] | undefined) => {
         if (Array.isArray(val)) return val;
         if (typeof val === 'string' && val.trim() !== '') return [val];
         return [];
      };

      // Normalize Academic
      if (!loadedReport.academic) {
        loadedReport.academic = { religion: [], arabic: [], english: [], math: [] };
      } else {
        loadedReport.academic.religion = normalizeArray(loadedReport.academic.religion as any);
        loadedReport.academic.arabic = normalizeArray(loadedReport.academic.arabic as any);
        loadedReport.academic.english = normalizeArray(loadedReport.academic.english as any);
        loadedReport.academic.math = normalizeArray(loadedReport.academic.math as any);
      }

      // Normalize Meals (Legacy support)
      // Check for old properties like breakfastItem and convert to array
      const mealsAny = loadedReport.meals as any;
      if (!loadedReport.meals.breakfastDetails && mealsAny.breakfastItem) loadedReport.meals.breakfastDetails = [mealsAny.breakfastItem];
      if (!loadedReport.meals.lunchDetails && mealsAny.lunchItem) loadedReport.meals.lunchDetails = [mealsAny.lunchItem];
      if (!loadedReport.meals.snackDetails && mealsAny.snackItem) loadedReport.meals.snackDetails = [mealsAny.snackItem];

      // Ensure arrays exist
      loadedReport.meals.breakfastDetails = normalizeArray(loadedReport.meals.breakfastDetails);
      loadedReport.meals.lunchDetails = normalizeArray(loadedReport.meals.lunchDetails);
      loadedReport.meals.snackDetails = normalizeArray(loadedReport.meals.snackDetails);
      
      // Ensure activities array exists
      if (!Array.isArray(loadedReport.activities)) {
        loadedReport.activities = [];
      }

      // Legacy Migration for Bathroom (Array -> Object)
      if (Array.isArray(loadedReport.bathroom)) {
         const oldArray = loadedReport.bathroom as any[];
         const urineCount = oldArray.filter(b => b.type === 'urine').length;
         const stoolCount = oldArray.filter(b => b.type === 'stool').length;
         loadedReport.bathroom = {
             urine: urineCount,
             stool: stoolCount,
             notes: ''
         };
      }
      
      setReport(loadedReport);
      setDoesReportExist(true);
    } else {
      // Reset to blank report if none exists for this date
      setReport({
        id: `new-${Date.now()}`,
        studentId: student.id,
        date: selectedDate,
        mood: 'neutral',
        moodNotes: '',
        meals: { breakfast: 'none', breakfastDetails: [], lunch: 'none', lunchDetails: [], snack: 'none', snackDetails: [], waterCups: 0, notes: '' },
        bathroom: { urine: 0, stool: 0, notes: '' },
        nap: { slept: false, notes: '' },
        academic: { religion: [], arabic: [], english: [], math: [] },
        activities: [], 
        photos: [],
        notes: ''
      });
      setDoesReportExist(false);
    }
  }, [student.id, selectedDate]);

  const handleSave = () => {
    setSaveError(null);
    
    // 1. Auto-save pending meal inputs
    const pendingMealsUpdates: Partial<typeof report.meals> = {};
    
    (['breakfast', 'lunch', 'snack'] as const).forEach(key => {
        const inputVal = mealInputs[key].trim();
        if (inputVal) {
            const detailsKey = `${key}Details` as MealDetailsKey;
            const currentList = report.meals[detailsKey] || [];
            pendingMealsUpdates[detailsKey] = [...currentList, inputVal];
        }
    });

    // 2. Auto-save pending academic inputs
    const pendingAcademicUpdates: Partial<typeof report.academic> = {};
    
    (Object.keys(academicInputs) as Array<keyof typeof academicInputs>).forEach(key => {
        const inputVal = academicInputs[key].trim();
        if (inputVal) {
            const currentList = report.academic?.[key] || [];
            pendingAcademicUpdates[key] = [...currentList, inputVal];
        }
    });

    // Construct final report with pending items included
    const finalReport = {
        ...report,
        date: selectedDate,
        meals: {
            ...report.meals,
            ...pendingMealsUpdates
        },
        academic: {
            ...report.academic,
            ...pendingAcademicUpdates
        }
    };

    // Update state to reflect auto-saves
    if (Object.keys(pendingMealsUpdates).length > 0 || Object.keys(pendingAcademicUpdates).length > 0) {
        setReport(finalReport);
        setMealInputs({ breakfast: '', lunch: '', snack: '' });
        setAcademicInputs({ religion: '', arabic: '', english: '', math: '' });
    }

    try {
      const allReports = getReports();
      const reportKey = `${student.id}_${selectedDate}`;
      
      const updatedReports = {
        ...allReports,
        [reportKey]: finalReport
      };
      
      saveReports(updatedReports); // This may throw QuotaExceededError
      setDoesReportExist(true);
      
      setIsSaved(true);
      addNotification(
        t('savedSuccessfully'), 
        `${t('newReportMsg')} ${student.name}`, 
        'success'
      );
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e: any) {
      console.error("Save failed:", e);
      let errorMsg = "Failed to save report.";
      if (e.name === 'QuotaExceededError' || e.message?.includes('quota')) {
        errorMsg = "Storage full! Photos are too large. Please delete some photos or use smaller ones.";
      }
      setSaveError(errorMsg);
      addNotification("Save Error", errorMsg, 'alert');
    }
  };

  const compressImage = (base64Str: string, maxWidth = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      const img = new globalThis.Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with reduced quality
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => {
        // Fallback to original if compression fails
        resolve(base64Str); 
      };
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsCompressing(true);
      const fileArray = Array.from(files) as File[];
      const newPhotos: string[] = [];
      
      // Process sequentially to manage memory
      for (const file of fileArray) {
        try {
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          
          // Compress the image before adding to state
          const compressed = await compressImage(base64);
          newPhotos.push(compressed);
        } catch (err) {
          console.error("Error reading file", err);
        }
      }

      setReport(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...newPhotos]
      }));
      setIsCompressing(false);
    }
    
    // Reset input
    if (e.target) e.target.value = '';
  };

  // Direct Download Function
  const handleDirectDownload = (photoData: string, index: number) => {
    try {
        const link = document.createElement('a');
        link.href = photoData;
        // Create a safe filename
        const safeName = student.name.replace(/\s+/g, '_');
        link.download = `photo_${safeName}_${selectedDate}_${index + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Direct download failed", e);
        // Fallback: Open in new tab if programmatic download is blocked
        window.open(photoData, '_blank');
    }
  };

  const removePhoto = (index: number) => {
    setReport(prev => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index)
    }));
  };

  const moods: { value: Mood; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'excited', label: t('excited'), icon: Sun, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { value: 'happy', label: t('happy'), icon: Smile, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
    { value: 'neutral', label: t('neutral'), icon: Meh, color: 'text-slate-500 bg-slate-50 border-slate-200' },
    { value: 'tired', label: t('tired'), icon: Moon, color: 'text-violet-500 bg-violet-50 border-violet-200' },
    { value: 'sad', label: t('sad'), icon: Frown, color: 'text-sky-500 bg-sky-50 border-sky-200' },
    { value: 'sick', label: t('sick'), icon: Cloud, color: 'text-rose-500 bg-rose-50 border-rose-200' },
  ];

  const mealOptions: { value: MealStatus; label: string }[] = [
    { value: 'all', label: t('mealAll') },
    { value: 'some', label: t('mealSome') },
    { value: 'none', label: t('mealNone') },
  ];

  const updateBathroomCount = (type: 'urine' | 'stool', delta: number) => {
    if (readOnly) return;
    setReport(prev => ({
      ...prev,
      bathroom: {
        ...prev.bathroom,
        [type]: Math.max(0, (prev.bathroom[type] || 0) + delta)
      }
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

  // --- ACADEMIC HANDLERS ---
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

  // --- MEAL HANDLERS ---
  const handleAddMealItem = (mealKey: keyof typeof mealInputs) => {
    const val = mealInputs[mealKey].trim();
    if (!val) return;

    // Map 'breakfast' -> 'breakfastDetails' and strictly cast
    const detailsKey = `${String(mealKey)}Details` as MealDetailsKey;

    setReport(prev => {
        const currentList = prev.meals[detailsKey] || [];
        return {
            ...prev,
            meals: {
                ...prev.meals,
                [detailsKey]: [...currentList, val]
            }
        };
    });

    setMealInputs(prev => ({ ...prev, [mealKey]: '' }));
  };

  const handleRemoveMealItem = (mealKey: keyof typeof mealInputs, index: number) => {
    const detailsKey = `${String(mealKey)}Details` as MealDetailsKey;
    
    setReport(prev => {
        const currentList = prev.meals[detailsKey] || [];
        return {
            ...prev,
            meals: {
                ...prev.meals,
                [detailsKey]: currentList.filter((_, i) => i !== index)
            }
        };
    });
  };

  const renderAcademicSection = (subjectKey: keyof typeof academicInputs, title: string, isLtr: boolean = false) => {
    const items = report.academic?.[subjectKey] || [];
    
    return (
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 block uppercase tracking-wide">{title}</label>
        {!readOnly && (
          <div className="flex gap-2">
            <input 
              type="text"
              className={`flex-1 p-2.5 bg-slate-50 rounded-lg border border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm ${isLtr ? 'text-left font-sans' : ''} transition-all`}
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
              className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Plus size={18} />
            </button>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2 pt-1">
          {items.map((item, idx) => (
             <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border font-medium ${isLtr ? 'font-sans' : ''} bg-white border-slate-200 text-slate-700 shadow-sm`}>
               <span dir={isLtr ? 'ltr' : undefined}>{item}</span>
               {!readOnly && (
                 <button 
                   onClick={() => handleRemoveAcademicItem(subjectKey, idx)}
                   className="text-slate-400 hover:text-rose-500 rounded-full p-0.5 hover:bg-rose-50 transition-colors"
                 >
                   <X size={14} />
                 </button>
               )}
             </div>
          ))}
          {items.length === 0 && readOnly && (
             <span className="text-sm text-slate-400 italic">--</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* Student Header Card */}
      <div className="relative overflow-hidden bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5 z-10">
          <div className="relative">
             <img src={student.avatar} alt={student.name} className="w-20 h-20 rounded-full border-4 border-indigo-50 shadow-md object-cover" />
             <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm">
                <div className={`w-3 h-3 rounded-full ${student.attendanceToday ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
             </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 font-display">{student.name}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
               <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">{student.classGroup}</span>
               <span className="text-xs font-bold text-slate-500 flex items-center gap-1" dir="ltr">
                  <Baby size={14} /> {getDetailedAge()}
               </span>
               {student.birthday && (
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Cake size={12} className="text-pink-400" /> {student.birthday}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end z-10">
           <label className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">{t('reportDate')}</label>
           <div className="relative group">
              <div className="flex items-center gap-3 bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-300 rounded-xl px-5 py-2.5 transition-all cursor-pointer shadow-sm">
                <Calendar size={20} className="text-indigo-500" />
                <span className="font-bold text-slate-700 min-w-[140px] text-center" dir="ltr">
                  {getFormattedDate(selectedDate)}
                </span>
                <ChevronDown size={16} className="text-slate-400 group-hover:text-indigo-500" />
              </div>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
           </div>
        </div>
        
        {/* Decorative Background Blob */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
      </div>

      {readOnly && !doesReportExist ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/60 backdrop-blur-sm rounded-[2rem] border-2 border-dashed border-slate-200 text-center animate-fade-in">
           <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
               <FileText className="text-slate-300" size={36} />
           </div>
           <h3 className="text-xl font-bold text-slate-600">{t('noReportForDate')}</h3>
           <p className="text-sm text-slate-400 mt-1" dir="ltr">{getFormattedDate(selectedDate)}</p>
        </div>
      ) : (
        <>
          {readOnly && (
            <div className="bg-sky-50 border border-sky-100 text-sky-700 px-5 py-3 rounded-2xl flex items-center gap-3 font-medium">
              <Lock size={18} />
              <span>{t('readOnlyReport')}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Mood Card */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-lg">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                   <Smile size={20} />
                </div>
                {t('mood')}
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {moods.map((m) => {
                  const Icon = m.icon;
                  const isSelected = report.mood === m.value;
                  return (
                    <button
                      key={m.value}
                      disabled={readOnly}
                      onClick={() => setReport({ ...report, mood: m.value })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border ${
                        isSelected 
                          ? `${m.color} shadow-sm transform scale-105` 
                          : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <Icon size={28} strokeWidth={1.5} />
                      <span className="text-xs font-bold">{m.label}</span>
                    </button>
                  );
                })}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1.5 block uppercase tracking-wide">{t('moodDetails')}</label>
                <textarea 
                  disabled={readOnly}
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-70 transition-all resize-none"
                  rows={2}
                  placeholder="..."
                  value={report.moodNotes}
                  onChange={e => setReport({...report, moodNotes: e.target.value})}
                />
              </div>
            </div>

            {/* Meals Card */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-lg">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                   <Utensils size={20} />
                </div>
                {t('meals')}
              </h3>
              <div className="space-y-5">
                {[
                  { key: 'breakfast', label: t('breakfast'), icon: Coffee },
                  { key: 'lunch', label: t('lunch'), icon: Pizza },
                  { key: 'snack', label: t('snack'), icon: Apple },
                ].map((meal) => {
                  const mealKey = meal.key as 'breakfast' | 'lunch' | 'snack';
                  const detailsKey = `${mealKey}Details` as MealDetailsKey;
                  const detailsList = report.meals[detailsKey] || [];

                  return (
                    <div key={meal.key} className="space-y-3 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-600">
                          <meal.icon size={18} className="text-orange-400" />
                          <span className="text-sm font-bold">{meal.label}</span>
                          </div>
                          <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                          {mealOptions.map((opt) => (
                              <button
                              key={opt.value}
                              disabled={readOnly}
                              onClick={() => setReport({ ...report, meals: { ...report.meals, [meal.key]: opt.value } })}
                              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all uppercase tracking-wide ${
                                  (report.meals as any)[meal.key] === opt.value
                                  ? 'bg-white text-orange-600 shadow-sm'
                                  : 'text-slate-400 hover:text-slate-600'
                              }`}
                              >
                              {opt.label}
                              </button>
                          ))}
                          </div>
                      </div>
                      
                      {/* New Meal Item Input with Add Button */}
                      {!readOnly && (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder={t('mealItemPlaceholder')}
                                className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-indigo-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                value={mealInputs[mealKey]}
                                onChange={(e) => setMealInputs({ ...mealInputs, [mealKey]: e.target.value })}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddMealItem(mealKey);
                                    }
                                }}
                            />
                            <button 
                                onClick={() => handleAddMealItem(mealKey)}
                                disabled={!mealInputs[mealKey].trim()}
                                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                      )}

                      {/* Display Meal Items */}
                      <div className="flex flex-wrap gap-2">
                          {detailsList.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-orange-700 border border-orange-100 shadow-sm">
                                  <span>{item}</span>
                                  {!readOnly && (
                                      <button 
                                          onClick={() => handleRemoveMealItem(mealKey, idx)}
                                          className="text-orange-300 hover:text-rose-500 transition-colors"
                                      >
                                          <X size={12} />
                                      </button>
                                  )}
                              </div>
                          ))}
                          {detailsList.length === 0 && readOnly && (
                              <span className="text-xs text-slate-300 italic px-2">--</span>
                          )}
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-400 mb-1.5 block uppercase tracking-wide">{t('mealNotes')}</label>
                  <textarea 
                    disabled={readOnly}
                    className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-70 transition-all resize-none"
                    rows={2}
                    placeholder="..."
                    value={report.meals.notes}
                    onChange={e => setReport({...report, meals: { ...report.meals, notes: e.target.value }})}
                  />
                </div>
              </div>
            </div>

            {/* Bathroom Card (Updated with Counters) */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg">
                <div className="p-2 bg-sky-100 rounded-lg text-sky-600">
                   <Droplets size={20} />
                </div>
                {t('bathroomLog')}
              </h3>
              
              <div className="flex items-center justify-around mb-6">
                 {/* Urine Counter */}
                 <div className="flex flex-col items-center gap-3">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">{t('urine')}</span>
                    <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-2 border border-slate-100">
                        <button 
                           onClick={() => updateBathroomCount('urine', -1)} 
                           disabled={readOnly || report.bathroom.urine === 0}
                           className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 shadow-sm flex items-center justify-center transition-all disabled:opacity-50"
                        >
                           <Minus size={20} />
                        </button>
                        <span className="text-2xl font-bold text-sky-600 w-8 text-center">{report.bathroom.urine}</span>
                        <button 
                           onClick={() => updateBathroomCount('urine', 1)} 
                           disabled={readOnly}
                           className="w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg flex items-center justify-center transition-all disabled:opacity-50"
                        >
                           <Plus size={20} />
                        </button>
                    </div>
                 </div>

                 {/* Divider */}
                 <div className="w-px h-16 bg-slate-100"></div>

                 {/* Stool Counter */}
                 <div className="flex flex-col items-center gap-3">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">{t('stool')}</span>
                    <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-2 border border-slate-100">
                        <button 
                           onClick={() => updateBathroomCount('stool', -1)} 
                           disabled={readOnly || report.bathroom.stool === 0}
                           className="w-10 h-10 rounded-xl bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 shadow-sm flex items-center justify-center transition-all disabled:opacity-50"
                        >
                           <Minus size={20} />
                        </button>
                        <span className="text-2xl font-bold text-amber-600 w-8 text-center">{report.bathroom.stool}</span>
                        <button 
                           onClick={() => updateBathroomCount('stool', 1)} 
                           disabled={readOnly}
                           className="w-10 h-10 rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg flex items-center justify-center transition-all disabled:opacity-50"
                        >
                           <Plus size={20} />
                        </button>
                    </div>
                 </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 mb-1.5 block uppercase tracking-wide">{t('notes') || 'Notes'}</label>
                <textarea 
                  disabled={readOnly}
                  className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-70 transition-all resize-none"
                  rows={2}
                  placeholder="..."
                  value={report.bathroom.notes || ''}
                  onChange={e => setReport({...report, bathroom: { ...report.bathroom, notes: e.target.value }})}
                />
              </div>
            </div>

            {/* Nap Card */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                      <div className="p-2 bg-violet-100 rounded-lg text-violet-600">
                         <Moon size={20} />
                      </div>
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
                      <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-violet-500"></div>
                    </label>
                </div>
                
                {report.nap.slept ? (
                  <div className="mt-4 animate-fade-in space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 font-bold mb-1.5 block uppercase tracking-wide">{t('napDuration')}</label>
                        <input 
                        type="text" 
                        disabled={readOnly}
                        placeholder="e.g. 1h 30m"
                        className="w-full p-4 text-sm bg-violet-50/50 border border-violet-100 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                        value={report.nap.duration || ''}
                        onChange={e => setReport({...report, nap: { ...report.nap, duration: e.target.value }})}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-bold mb-1.5 block uppercase tracking-wide">{t('napNotes')}</label>
                        <textarea 
                        disabled={readOnly}
                        className="w-full p-4 text-sm bg-violet-50/50 border border-violet-100 rounded-xl resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                        rows={2}
                        placeholder="..."
                        value={report.nap.notes || ''}
                        onChange={e => setReport({...report, nap: { ...report.nap, notes: e.target.value }})}
                        />
                    </div>
                  </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-300 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <Moon size={32} className="mb-2 opacity-30" />
                        <p className="text-sm font-medium italic">{t('no')}</p>
                    </div>
                )}
            </div>

            {/* Academic Card */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-lg">
                <div className="p-2 bg-teal-100 rounded-lg text-teal-600">
                   <BookOpen size={20} />
                </div>
                {t('academic')}
              </h3>
              
              <div className="space-y-6">
                {renderAcademicSection('religion', t('religion'))}
                {renderAcademicSection('arabic', t('arabicSubject'))}
                {renderAcademicSection('english', t('englishSubject'), true)}
                {renderAcademicSection('math', t('mathSubject'), true)}
              </div>
            </div>

            {/* Activities Card */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-lg">
                <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                   <Gamepad2 size={20} />
                </div>
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
                        cursor-pointer flex items-center gap-3 p-3 rounded-2xl border-2 transition-all select-none
                        ${isSelected
                          ? 'border-pink-200 bg-pink-50' 
                          : 'border-transparent bg-slate-50 hover:bg-slate-100'}
                        ${readOnly ? 'cursor-default opacity-90' : ''}
                      `}
                    >
                      <div className={`
                        w-6 h-6 rounded-lg flex items-center justify-center transition-colors shadow-sm
                        ${isSelected ? 'bg-pink-500 text-white' : 'bg-white border border-slate-200'}
                      `}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                      <span className={`text-sm font-bold ${isSelected ? 'text-pink-700' : 'text-slate-500'}`}>
                        {t(act as any)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                     <Image size={20} />
                  </div>
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
                      className="text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
                      disabled={isCompressing}
                    >
                      {isCompressing ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/> : <Plus size={18} />}
                      {isCompressing ? "Compressing..." : t('addPhoto')}
                    </button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {report.photos && report.photos.length > 0 ? (
                  report.photos.map((photo, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-slate-100">
                      <img src={photo} alt="Daily activity" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                      {/* Download Button - Direct Download */}
                      <button 
                        onClick={() => handleDirectDownload(photo, idx)}
                        className="absolute bottom-3 left-3 p-2 bg-white/20 backdrop-blur-md text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-white/40"
                        title={t('save')}
                      >
                        <Download size={16} />
                      </button>

                      {/* Delete Button - Only if editing */}
                      {!readOnly && (
                        <button 
                          onClick={() => removePhoto(idx)}
                          className="absolute top-3 right-3 p-2 bg-rose-500/80 backdrop-blur-md text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <Image className="mx-auto mb-3 opacity-30" size={40} />
                    <p className="text-sm font-medium">{t('noPhotos')}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow mb-8">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-lg">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                   <Pencil size={20} />
                </div>
                {t('teacherNotes')}
              </h3>
              <textarea 
                disabled={readOnly}
                className="w-full p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 disabled:opacity-80 transition-all leading-relaxed"
                rows={3}
                value={report.notes}
                onChange={(e) => setReport({ ...report, notes: e.target.value })}
                placeholder="..."
              />
            </div>

          </div>

          {!readOnly && (
            <div className={`fixed bottom-6 ${language === 'ar' ? 'left-6' : 'right-6'} z-30 flex flex-col items-end gap-3`}>
              {saveError && (
                 <div className="bg-rose-500 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-xl shadow-rose-200 animate-bounce flex items-center gap-2">
                    <AlertTriangle size={18} />
                    {saveError}
                 </div>
              )}
              <button 
                onClick={handleSave}
                disabled={isCompressing}
                className={`flex items-center gap-2 px-8 py-4 rounded-full shadow-2xl font-bold text-white transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95 ${
                  isSaved ? 'bg-emerald-500 shadow-emerald-200' : 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-300'
                } ${isCompressing ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSaved ? (
                  <>
                    <Check size={24} />
                    {t('savedSuccessfully')}
                  </>
                ) : (
                  <>
                    <Save size={24} />
                    <span className="text-lg">{t('saveReport')}</span>
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
