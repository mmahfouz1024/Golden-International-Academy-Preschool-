import React, { useState, useEffect } from 'react';
import { 
  Smile, Frown, Meh, Sun, Cloud, Moon, 
  Utensils, Droplets, Plus, 
  Check, Save, Calendar, FileText, ChevronDown, X, Baby, Minus, Coffee, Pizza, Apple
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

type MealDetailsKey = 'breakfastDetails' | 'lunchDetails' | 'snackDetails';

const StudentDetail: React.FC<StudentDetailProps> = ({ student, readOnly = false, initialDate }) => {
  const { t } = useLanguage();
  const { addNotification } = useNotification();
  
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

  const [academicInputs, setAcademicInputs] = useState({ religion: '', arabic: '', english: '', math: '' });
  const [mealInputs, setMealInputs] = useState({ breakfast: '', lunch: '', snack: '' });
  const [isSaved, setIsSaved] = useState(false);

  const getFormattedDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    // Hardcoded to English per user request
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getDetailedAge = () => {
    if (student.birthday) {
      const birth = new Date(student.birthday);
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      let months = now.getMonth() - birth.getMonth();
      if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) { years--; months += 12; }
      if (now.getDate() < birth.getDate()) { months--; if (months < 0) months += 12; }
      return `${years} Y, ${months} M`;
    }
    return `${student.age} Years`;
  };

  useEffect(() => {
    const allReports = getReports();
    const reportKey = `${student.id}_${selectedDate}`;
    if (allReports[reportKey]) {
      const loadedReport = { ...allReports[reportKey] };
      const normalizeArray = (val: any) => Array.isArray(val) ? val : (val ? [val] : []);
      
      if (!loadedReport.academic) {
        loadedReport.academic = { religion: [], arabic: [], english: [], math: [] };
      } else {
        loadedReport.academic.religion = normalizeArray(loadedReport.academic.religion);
        loadedReport.academic.arabic = normalizeArray(loadedReport.academic.arabic);
        loadedReport.academic.english = normalizeArray(loadedReport.academic.english);
        loadedReport.academic.math = normalizeArray(loadedReport.academic.math);
      }

      const mealsAny = loadedReport.meals as any;
      if (!loadedReport.meals.breakfastDetails && mealsAny.breakfastItem) loadedReport.meals.breakfastDetails = [mealsAny.breakfastItem];
      if (!loadedReport.meals.lunchDetails && mealsAny.lunchItem) loadedReport.meals.lunchDetails = [mealsAny.lunchItem];
      if (!loadedReport.meals.snackDetails && mealsAny.snackItem) loadedReport.meals.snackDetails = [mealsAny.snackItem];
      
      loadedReport.meals.breakfastDetails = normalizeArray(loadedReport.meals.breakfastDetails);
      loadedReport.meals.lunchDetails = normalizeArray(loadedReport.meals.lunchDetails);
      loadedReport.meals.snackDetails = normalizeArray(loadedReport.meals.snackDetails);
      
      if (!Array.isArray(loadedReport.activities)) loadedReport.activities = [];
      
      if (Array.isArray(loadedReport.bathroom)) {
         const oldArray = loadedReport.bathroom as any[];
         loadedReport.bathroom = { urine: oldArray.filter(b => b.type === 'urine').length, stool: oldArray.filter(b => b.type === 'stool').length, notes: '' };
      }
      setReport(loadedReport);
      setDoesReportExist(true);
    } else {
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
    const pendingMealsUpdates: any = {};
    (['breakfast', 'lunch', 'snack'] as const).forEach(key => {
        const inputVal = mealInputs[key].trim();
        if (inputVal) {
            const detailsKey = `${key}Details` as MealDetailsKey;
            pendingMealsUpdates[detailsKey] = [...(report.meals[detailsKey] || []), inputVal];
        }
    });

    const pendingAcademicUpdates: any = {};
    (Object.keys(academicInputs) as Array<keyof typeof academicInputs>).forEach(key => {
        const inputVal = academicInputs[key].trim();
        if (inputVal) {
            pendingAcademicUpdates[key] = [...(report.academic?.[key] || []), inputVal];
        }
    });

    const finalReport = { 
      ...report, 
      date: selectedDate, 
      meals: { ...report.meals, ...pendingMealsUpdates }, 
      academic: { ...report.academic, ...pendingAcademicUpdates } 
    };

    try {
      const allReports = getReports();
      const reportKey = `${student.id}_${selectedDate}`;
      saveReports({ ...allReports, [reportKey]: finalReport });
      setDoesReportExist(true);
      setReport(finalReport);
      setMealInputs({ breakfast: '', lunch: '', snack: '' });
      setAcademicInputs({ religion: '', arabic: '', english: '', math: '' });
      setIsSaved(true);
      // Fix: Wrap translation results in String() to prevent implicit symbol to string conversion in template literals
      addNotification(String(t('savedSuccessfully')), `${String(t('newReportMsg'))} ${student.name}`, 'success');
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e: any) {
      alert("Failed to save report.");
    }
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
    { value: 'more', label: t('mealMore') }
  ];

  const renderAcademicSection = (subjectKey: keyof typeof academicInputs, title: string, isLtr: boolean = false) => {
    const items = report.academic?.[subjectKey] || [];
    return (
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 block uppercase tracking-wide">{title}</label>
        {!readOnly && (
          <div className="flex gap-2">
            <input 
              type="text" 
              className={`flex-1 p-2.5 bg-slate-50 rounded-lg border border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm ${isLtr ? 'text-left font-sans' : ''}`} 
              dir={isLtr ? 'ltr' : undefined} 
              value={academicInputs[subjectKey]} 
              onChange={e => setAcademicInputs({...academicInputs, [subjectKey]: e.target.value})} 
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (academicInputs[subjectKey].trim()) {
                    setReport(prev => ({...prev, academic: {...prev.academic, [subjectKey]: [...(prev.academic?.[subjectKey] || []), academicInputs[subjectKey]]}}));
                    setAcademicInputs({...academicInputs, [subjectKey]: ''});
                  }
                }
              }} 
              placeholder={t('add')} 
            />
            <button 
              onClick={() => {
                if (academicInputs[subjectKey].trim()) {
                  setReport(prev => ({...prev, academic: {...prev.academic, [subjectKey]: [...(prev.academic?.[subjectKey] || []), academicInputs[subjectKey]]}}));
                  setAcademicInputs({...academicInputs, [subjectKey]: ''});
                }
              }} 
              disabled={!academicInputs[subjectKey].trim()} 
              className="bg-indigo-600 text-white p-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Plus size={18} />
            </button>
          </div>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {items.map((item, idx) => (
            <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border font-medium bg-white border-slate-200 text-slate-700 shadow-sm`}>
              <span dir={isLtr ? 'ltr' : undefined}>{item}</span>
              {!readOnly && (
                <button onClick={() => setReport(prev => ({...prev, academic: {...prev.academic, [subjectKey]: (prev.academic?.[subjectKey] || []).filter((_, i) => i !== idx)}}))} className="text-slate-400 hover:text-rose-500 rounded-full p-0.5 hover:bg-rose-50 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="relative overflow-hidden bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5 z-10">
          <div className="relative"><img src={student.avatar} alt={student.name} className="w-20 h-20 rounded-full border-4 border-indigo-50 shadow-md object-cover" /></div>
          <div><h2 className="text-2xl font-bold text-slate-800 font-display">{student.name}</h2><div className="flex flex-wrap items-center gap-3 mt-1.5"><span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">{student.classGroup}</span><span className="text-xs font-bold text-slate-500 flex items-center gap-1" dir="ltr"><Baby size={14} /> {getDetailedAge()}</span></div></div>
        </div>
        <div className="flex flex-col items-end z-10">
           <label className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">{t('reportDate')}</label>
           <div className="relative group">
              <div className="flex items-center gap-3 bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-300 rounded-xl px-5 py-2.5 cursor-pointer shadow-sm">
                <Calendar size={20} className="text-indigo-500" /><span className="font-bold text-slate-700 min-w-[140px] text-center" dir="ltr">{getFormattedDate(selectedDate)}</span><ChevronDown size={16} className="text-gray-400" />
              </div>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
           </div>
        </div>
      </div>

      {readOnly && !doesReportExist ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 text-center">
           <FileText className="text-slate-200 mb-4" size={48} /><h3 className="text-xl font-bold text-slate-600">{t('noReportForDate')}</h3><p className="text-sm text-slate-400 mt-1" dir="ltr">{getFormattedDate(selectedDate)}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100"><h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-lg"><Smile size={20} className="text-purple-600" />{t('mood')}</h3><div className="grid grid-cols-3 gap-3 mb-5">{moods.map(m => (<button key={m.value} disabled={readOnly} onClick={() => setReport({ ...report, mood: m.value })} className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border ${report.mood === m.value ? `${m.color} shadow-sm` : 'bg-slate-50 text-slate-400'}`}><m.icon size={28} /><span className="text-xs font-bold">{m.label}</span></button>))}</div><textarea disabled={readOnly} className="w-full p-4 bg-slate-50 rounded-2xl border-transparent focus:bg-white text-sm outline-none resize-none" rows={2} value={report.moodNotes} onChange={e => setReport({...report, moodNotes: e.target.value})} placeholder="..." /></div>
            
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-lg"><Utensils size={20} className="text-orange-600" />{t('meals')}</h3>
              <div className="space-y-5">
                {[{ key: 'breakfast', label: t('breakfast'), icon: Coffee }, { key: 'lunch', label: t('lunch'), icon: Pizza }, { key: 'snack', label: t('snack'), icon: Apple }].map(meal => {
                  const mk = meal.key as keyof typeof mealInputs; 
                  // Fix: Wrap mk in String() to ensure it is treated as a string in template literals (prevents symbol error)
                  const dkey = `${String(mk)}Details` as MealDetailsKey;
                  const currentMealStatus = (report.meals as any)[mk] as MealStatus;
                  const currentDetails = (report.meals[dkey] || []) as string[];
                  
                  return (
                    <div key={meal.key} className="space-y-3 pb-3 border-b border-slate-50 last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-600"><meal.icon size={18} className="text-orange-400" /><span className="text-sm font-bold">{meal.label}</span></div>
                        <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                          {mealOptions.map(opt => (
                            <button 
                              key={opt.value} 
                              disabled={readOnly} 
                              onClick={() => setReport({ ...report, meals: { ...report.meals, [mk]: opt.value } })} 
                              className={`px-3 py-1 rounded-md text-[10px] font-bold ${currentMealStatus === opt.value ? 'bg-white text-orange-600' : 'text-slate-400'}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {!readOnly && (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            className="flex-1 px-3 py-2 bg-slate-50 rounded-xl text-xs outline-none" 
                            value={mealInputs[mk]} 
                            onChange={e => setMealInputs({...mealInputs, [mk]: e.target.value})} 
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (mealInputs[mk].trim()) {
                                  setReport(p => ({...p, meals: {...p.meals, [dkey]: [...(p.meals[dkey] || []), mealInputs[mk]]}}));
                                  setMealInputs({...mealInputs, [mk]: ''});
                                }
                              }
                            }} 
                            placeholder={t('mealItemPlaceholder')} 
                          />
                          <button 
                            onClick={() => {
                              if (mealInputs[mk].trim()) {
                                setReport(p => ({...p, meals: {...p.meals, [dkey]: [...(p.meals[dkey] || []), mealInputs[mk]]}}));
                                setMealInputs({...mealInputs, [mk]: ''});
                              }
                            }} 
                            className="bg-indigo-600 text-white p-2 rounded-lg"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {currentDetails.map((item, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-orange-50 text-orange-700">
                            {item}
                            {!readOnly && <button onClick={() => setReport(p => ({...p, meals: {...p.meals, [dkey]: (p.meals[dkey] || []).filter((_, idx) => idx !== i)}}))}><X size={12}/></button>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-lg"><Droplets size={20} className="text-sky-600" />{t('bathroomLog')}</h3>
              <div className="flex items-center justify-around mb-6">
                {(['urine', 'stool'] as const).map(type => (
                  <div key={type} className="flex flex-col items-center gap-3">
                    <span className="text-sm font-bold text-slate-500 uppercase">{t(type)}</span>
                    <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-2">
                      <button 
                        disabled={readOnly || (report.bathroom[type] === 0)} 
                        onClick={() => setReport(prev => ({...prev, bathroom: {...prev.bathroom, [type]: prev.bathroom[type] - 1}}))} 
                        className="w-10 h-10 bg-white rounded-xl shadow-sm"
                      >
                        <Minus size={20}/>
                      </button>
                      <span className="text-2xl font-bold text-indigo-600">{report.bathroom[type]}</span>
                      <button 
                        disabled={readOnly} 
                        onClick={() => setReport(prev => ({...prev, bathroom: {...prev.bathroom, [type]: prev.bathroom[type] + 1}}))} 
                        className="w-10 h-10 bg-indigo-600 text-white rounded-xl shadow-md"
                      >
                        <Plus size={20}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              {renderAcademicSection('religion', t('religion'))}
              {renderAcademicSection('arabic', t('arabicSubject'))}
              {renderAcademicSection('english', t('englishSubject'), true)}
              {renderAcademicSection('math', t('mathSubject'), true)}
            </div>
          </div>
          {!readOnly && (
            // Fix: Explicitly wrap labels in String() to prevent symbol to string conversion errors in ternary/template literal
            <div className={`fixed bottom-6 ${String(t('saveReport')) === 'Save Report' ? 'right-6' : 'left-6'} z-30 flex flex-col gap-3`}>
              <button onClick={handleSave} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full shadow-2xl font-bold flex items-center gap-3 transition-all hover:scale-105 active:scale-95">
                {isSaved ? <Check size={24} /> : <Save size={24} />}
                <span>{isSaved ? String(t('savedSuccessfully')) : String(t('saveReport'))}</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentDetail;