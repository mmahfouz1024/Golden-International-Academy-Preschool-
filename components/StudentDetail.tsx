
import React, { useState, useRef, useEffect } from 'react';
import { 
  Smile, Frown, Meh, Sun, Cloud, Moon, 
  Utensils, Droplets, Clock, Plus, Trash2, 
  Gamepad2, Pencil, Check, Lock, Image, Save, Calendar, Cake, FileText, ChevronDown, BookOpen, X, Baby, Download, AlertTriangle, Share2, Info
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

  const [mealInputs, setMealInputs] = useState({
    breakfast: '',
    lunch: '',
    snack: ''
  });

  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // State for Download Preview Modal
  const [downloadPreview, setDownloadPreview] = useState<{data: string, index: number} | null>(null);

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
        bathroom: [],
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

  // STEP 1: Initiate Download (Open Modal)
  const initiateDownload = (photoData: string, index: number) => {
    setDownloadPreview({ data: photoData, index });
  };

  // Helper to convert Base64 to File object SYNCHRONOUSLY
  // This is crucial for `navigator.share` to work in some WebViews
  const dataURItoFile = (dataURI: string, filename: string): File | null => {
    try {
        const arr = dataURI.split(',');
        if (arr.length < 2) return null;
        
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, {type:mime});
    } catch (e) {
        console.error("Conversion failed", e);
        return null;
    }
  };

  // STEP 2: Execute Download (After Confirmation)
  // UPDATED for WebView/Appilix robustness
  const processDownload = async () => {
    if (!downloadPreview) return;
    
    const { data: photoData, index } = downloadPreview;
    
    // Attempt 1: Native Share (If supported)
    try {
        const fileName = `photo_${student.name.replace(/\s+/g, '_')}_${index + 1}.jpg`;
        // Try to construct file sync or async
        let file = dataURItoFile(photoData, fileName);
        if (!file) {
             const blob = await (await fetch(photoData)).blob();
             file = new File([blob], fileName, { type: blob.type });
        }

        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Save Photo',
            });
            return; // Success, user sees native sheet
        }
    } catch (e) {
        console.log("Share failed, trying legacy", e);
    }

    // Attempt 2: Anchor Download (Often blocked in simple WebViews)
    try {
        const link = document.createElement('a');
        link.href = photoData;
        link.download = `photo_${student.name}_${index + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Anchor failed", e);
    }
    
    // Note: If both fail, the user is already looking at the modal with instructions to Long Press.
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
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <img src={student.avatar} alt={student.name} className="w-16 h-16 rounded-full border-4 border-indigo-50 shadow-sm" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{student.name}</h2>
            {/* Display Age under name */}
            <p className="text-sm font-bold text-indigo-600 mb-1 flex items-center gap-1" dir="ltr">
               <Baby size={14} /> {getDetailedAge()}
            </p>
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
                ].map((meal) => {
                  const mealKey = meal.key as 'breakfast' | 'lunch' | 'snack';
                  const detailsKey = `${mealKey}Details` as MealDetailsKey;
                  const detailsList = report.meals[detailsKey] || [];

                  return (
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
                      
                      {/* New Meal Item Input with Add Button */}
                      {!readOnly && (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder={t('mealItemPlaceholder')}
                                className="flex-1 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                      )}

                      {/* Display Meal Items */}
                      <div className="flex flex-wrap gap-1.5 mt-1">
                          {detailsList.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100 shadow-sm">
                                  <span>{item}</span>
                                  {!readOnly && (
                                      <button 
                                          onClick={() => handleRemoveMealItem(mealKey, idx)}
                                          className="text-orange-400 hover:text-red-500 transition-colors"
                                      >
                                          <X size={12} />
                                      </button>
                                  )}
                              </div>
                          ))}
                          {detailsList.length === 0 && readOnly && (
                              <span className="text-xs text-gray-400 italic">--</span>
                          )}
                      </div>
                    </div>
                  );
                })}
                
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
                      disabled={isCompressing}
                    >
                      {isCompressing ? <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/> : <Plus size={16} />}
                      {isCompressing ? "Compressing..." : t('addPhoto')}
                    </button>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {report.photos && report.photos.length > 0 ? (
                  report.photos.map((photo, idx) => (
                    <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden bg-gray-100">
                      <img src={photo} alt="Daily activity" className="w-full h-full object-cover" />
                      
                      {/* Download Button - Visible for everyone - Triggers Preview */}
                      <button 
                        onClick={() => initiateDownload(photo, idx)}
                        className="absolute top-2 left-2 p-1.5 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60"
                        title={t('save')}
                      >
                        <Download size={14} />
                      </button>

                      {/* Delete Button - Only if editing */}
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
            <div className={`fixed bottom-6 ${language === 'ar' ? 'left-6' : 'right-6'} z-10 flex flex-col items-end gap-2`}>
              {saveError && (
                 <div className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg animate-bounce flex items-center gap-2">
                    <AlertTriangle size={16} />
                    {saveError}
                 </div>
              )}
              <button 
                onClick={handleSave}
                disabled={isCompressing}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg font-bold text-white transition-all transform hover:-translate-y-1 ${
                  isSaved ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'
                } ${isCompressing ? 'opacity-70 cursor-not-allowed' : ''}`}
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

      {/* DOWNLOAD PREVIEW MODAL */}
      {downloadPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative border-4 border-white transform transition-all scale-100">
               {/* Close Button */}
               <button 
                 onClick={() => setDownloadPreview(null)}
                 className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
               >
                 <X size={20} />
               </button>

               {/* Image Preview */}
               <div className="w-full bg-gray-100 flex items-center justify-center p-2 relative">
                  <img 
                    src={downloadPreview.data} 
                    alt="Preview" 
                    className="max-h-[50vh] w-auto object-contain rounded-lg shadow-sm"
                  />
                  {/* Long Press Hint Overlay */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none whitespace-nowrap flex items-center gap-1">
                     <Info size={12} />
                     {language === 'ar' ? 'اضغط مطولاً للحفظ' : 'Long press to save'}
                  </div>
               </div>

               {/* Confirmation Footer */}
               <div className="p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                     <Share2 size={24} />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-gray-800">
                        {language === 'ar' ? 'حفظ الصورة' : 'Save Photo'}
                    </h3>
                    <p className="text-sm text-gray-500 px-4">
                        {language === 'ar' 
                            ? 'اضغط مطولاً على الصورة أعلاه واختر "حفظ"، أو جرب زر المشاركة بالأسفل.' 
                            : 'Long press the image above and select "Save Image", or try the share button below.'}
                    </p>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                     <button 
                        onClick={() => setDownloadPreview(null)}
                        className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                     >
                        {t('cancel')}
                     </button>
                     <button 
                        onClick={processDownload}
                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors flex items-center justify-center gap-2"
                     >
                        {t('yes')}
                     </button>
                  </div>
               </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetail;
