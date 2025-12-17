
import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Save, Coffee, CheckCircle, Mic, Loader2, Sparkles, Gamepad2, BookOpen, Plus, Utensils, CheckSquare, Square, Calendar, ChevronDown, ArrowDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { getStudents, getReports, saveReports, getAttendanceHistory, saveAttendanceHistory, getClasses, getUsers } from '../services/storageService';
import { Student, AttendanceStatus, MealStatus } from '../types';
import { interpretVoiceCommand } from '../services/geminiService';

const TeacherFocusMode: React.FC = () => {
  const { t, language } = useLanguage();
  const { addNotification } = useNotification();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(''); 

  // Batch States
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [meals, setMeals] = useState<Record<string, MealStatus>>({});
  const [classActivities, setClassActivities] = useState<string[]>([]); 
  
  // Class Academic State
  const [classAcademic, setClassAcademic] = useState<{
    religion: string[];
    arabic: string[];
    english: string[];
    math: string[];
  }>({ religion: [], arabic: [], english: [], math: [] });

  const [academicInputs, setAcademicInputs] = useState({
    religion: '',
    arabic: '',
    english: '',
    math: ''
  });

  // Class Meals State
  const [classMeals, setClassMeals] = useState<{
    breakfast: string[];
    lunch: string[];
    snack: string[];
  }>({ breakfast: [], lunch: [], snack: [] });

  const [mealInputs, setMealInputs] = useState({
    breakfast: '',
    lunch: '',
    snack: ''
  });

  const [hasSaved, setHasSaved] = useState(false);

  // Voice Command States
  const [isListening, setIsListening] = useState(false);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Scroll & Highlight
  const studentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const attendanceRef = useRef<HTMLDivElement>(null);
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(null);

  // Activities List
  const ACTIVITIES_LIST = [
    'Montessori', 'Garden', 'Coloring', 'Art', 'Swimming', 
    'Puzzle', 'Blocks', 'Songs', 'Etiquette', 
    'Circle time', 'Learning center', 'P.E'
  ];

  // Helper for English Date Format (Day Month Year)
  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
  };

  // 1. Initialize Classes
  useEffect(() => {
    const currentUser = getUsers().find(u => u.id === localStorage.getItem('golden_session_uid'));
    const allClasses = getClasses();
    
    let relevantClassNames: string[] = [];
    if (currentUser?.role === 'teacher') {
       relevantClassNames = allClasses.filter(c => c.teacherId === currentUser.id).map(c => c.name);
       if (relevantClassNames.length === 0) relevantClassNames = allClasses.map(c => c.name);
    } else {
       relevantClassNames = allClasses.map(c => c.name);
    }
    
    setClasses(relevantClassNames);
    if (relevantClassNames.length > 0) {
        setSelectedClasses(relevantClassNames);
    } else {
        setLoading(false);
    }
  }, []);

  // 2. Load Data
  useEffect(() => {
    if (!selectedDate || selectedClasses.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
    }

    setLoading(true);
    
    const allStudents = getStudents();
    const classStudents = allStudents.filter(s => selectedClasses.includes(s.classGroup));
    
    setStudents(classStudents);

    const history = getAttendanceHistory();
    const reports = getReports();
    
    const initialAttendance: Record<string, AttendanceStatus> = {};
    const initialMeals: Record<string, MealStatus> = {};
    
    let loadedActivities: string[] = [];
    let loadedAcademic: any = { religion: [], arabic: [], english: [], math: [] };
    let loadedMeals: any = { breakfast: [], lunch: [], snack: [] };
    
    let activitiesFound = false;
    let academicFound = false;
    let mealsFound = false;

    classStudents.forEach(s => {
        // Attendance
        if (history[selectedDate] && history[selectedDate][s.id]) {
            initialAttendance[s.id] = history[selectedDate][s.id];
        } else {
            initialAttendance[s.id] = 'present';
        }

        // Meals
        const reportKey = `${s.id}_${selectedDate}`;
        if (reports[reportKey]) {
            initialMeals[s.id] = reports[reportKey].meals.lunch;
            
            if (!activitiesFound && reports[reportKey].activities && reports[reportKey].activities.length > 0) {
                loadedActivities = reports[reportKey].activities;
                activitiesFound = true;
            }

            if (!academicFound && reports[reportKey].academic) {
                const rAc = reports[reportKey].academic!;
                const hasData = (rAc.religion?.length || 0) + (rAc.arabic?.length || 0) + (rAc.english?.length || 0) + (rAc.math?.length || 0) > 0;
                if (hasData) {
                    loadedAcademic = {
                        religion: rAc.religion || [],
                        arabic: rAc.arabic || [],
                        english: rAc.english || [],
                        math: rAc.math || []
                    };
                    academicFound = true;
                }
            }

            if (!mealsFound && reports[reportKey].meals) {
                const rMeals = reports[reportKey].meals;
                const hasMealData = (rMeals.breakfastDetails?.length || 0) + (rMeals.lunchDetails?.length || 0) + (rMeals.snackDetails?.length || 0) > 0;
                if (hasMealData) {
                    loadedMeals = {
                        breakfast: rMeals.breakfastDetails || [],
                        lunch: rMeals.lunchDetails || [],
                        snack: rMeals.snackDetails || []
                    };
                    mealsFound = true;
                }
            }

        } else {
            initialMeals[s.id] = 'all';
        }
    });

    setAttendance(initialAttendance);
    setMeals(initialMeals);
    
    if (activitiesFound) setClassActivities(loadedActivities); else setClassActivities([]);
    if (academicFound) setClassAcademic(loadedAcademic); else setClassAcademic({ religion: [], arabic: [], english: [], math: [] });
    if (mealsFound) setClassMeals(loadedMeals); else setClassMeals({ breakfast: [], lunch: [], snack: [] });
    
    setLoading(false);

  }, [selectedClasses, selectedDate]);

  // Handlers
  const toggleClassSelection = (className: string) => {
    setSelectedClasses(prev => {
        if (prev.includes(className)) {
            return prev.filter(c => c !== className);
        } else {
            return [...prev, className];
        }
    });
  };

  const toggleSelectAllClasses = () => {
      if (selectedClasses.length === classes.length) {
          setSelectedClasses([]);
      } else {
          setSelectedClasses(classes);
      }
  };

  const toggleAttendance = (studentId: string, status?: AttendanceStatus) => {
      setAttendance(prev => ({
          ...prev,
          [studentId]: status ? status : (prev[studentId] === 'present' ? 'absent' : 'present')
      }));
      setHasSaved(false);
  };

  const setMealStatus = (studentId: string, status: MealStatus) => {
      setMeals(prev => ({ ...prev, [studentId]: status }));
      setHasSaved(false);
  };

  const cycleMeal = (studentId: string) => {
      setMeals(prev => {
          const current = prev[studentId];
          let next: MealStatus = 'all';
          if (current === 'all') next = 'some';
          else if (current === 'some') next = 'none';
          else next = 'all';
          return { ...prev, [studentId]: next };
      });
      setHasSaved(false);
  };

  const toggleClassActivity = (activity: string) => {
      setClassActivities(prev => {
          if (prev.includes(activity)) {
              return prev.filter(a => a !== activity);
          } else {
              return [...prev, activity];
          }
      });
      setHasSaved(false);
  };

  const handleAddAcademic = (subject: keyof typeof classAcademic) => {
      const val = academicInputs[subject].trim();
      if (!val) return;
      
      setClassAcademic(prev => ({
          ...prev,
          [subject]: [...prev[subject], val]
      }));
      setAcademicInputs(prev => ({ ...prev, [subject]: '' }));
      setHasSaved(false);
  };

  const handleRemoveAcademic = (subject: keyof typeof classAcademic, index: number) => {
      setClassAcademic(prev => ({
          ...prev,
          [subject]: prev[subject].filter((_, i) => i !== index)
      }));
      setHasSaved(false);
  };

  const handleAddMeal = (type: keyof typeof classMeals) => {
      const val = mealInputs[type].trim();
      if (!val) return;

      setClassMeals(prev => ({
          ...prev,
          [type]: [...prev[type], val]
      }));
      setMealInputs(prev => ({ ...prev, [type]: '' }));
      setHasSaved(false);
  };

  const handleRemoveMeal = (type: keyof typeof classMeals, index: number) => {
      setClassMeals(prev => ({
          ...prev,
          [type]: prev[type].filter((_, i) => i !== index)
      }));
      setHasSaved(false);
  };

  const markRestPresent = () => {
      setAttendance(prev => {
          const updated = { ...prev };
          students.forEach(s => updated[s.id] = 'present');
          return updated;
      });
      setHasSaved(false);
  };

  const saveAll = () => {
      const history = getAttendanceHistory();
      if (!history[selectedDate]) history[selectedDate] = {};
      history[selectedDate] = { ...history[selectedDate], ...attendance };
      saveAttendanceHistory(history);

      const allReports = getReports();
      const updatedReports = { ...allReports };

      students.forEach(s => {
          const currentMealStatus = attendance[s.id] === 'absent' ? 'none' : meals[s.id];
          const reportKey = `${s.id}_${selectedDate}`;
          
          if (updatedReports[reportKey]) {
              updatedReports[reportKey] = {
                  ...updatedReports[reportKey],
                  meals: {
                      ...updatedReports[reportKey].meals,
                      lunch: currentMealStatus,
                      breakfastDetails: classMeals.breakfast,
                      lunchDetails: classMeals.lunch,
                      snackDetails: classMeals.snack
                  },
                  activities: classActivities,
                  academic: classAcademic
              };
          } else {
              updatedReports[reportKey] = {
                  id: `rep-${Date.now()}-${s.id}`,
                  studentId: s.id,
                  date: selectedDate,
                  mood: 'neutral',
                  meals: {
                      breakfast: 'all', 
                      lunch: currentMealStatus,
                      snack: 'all',
                      waterCups: 2,
                      breakfastDetails: classMeals.breakfast,
                      lunchDetails: classMeals.lunch,
                      snackDetails: classMeals.snack,
                      notes: ''
                  },
                  bathroom: { urine: 0, stool: 0, notes: '' },
                  nap: { slept: false, notes: '' },
                  academic: classAcademic,
                  activities: classActivities,
                  photos: [],
                  notes: ''
              };
          }
      });

      saveReports(updatedReports);
      setHasSaved(true);
      addNotification(t('savedSuccessfully'), t('changesSaved'), 'success');
      setTimeout(() => setHasSaved(false), 3000);
  };

  const scrollToStudent = (studentId: string) => {
      const element = studentRefs.current[studentId];
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedStudentId(studentId);
          setTimeout(() => setHighlightedStudentId(null), 2000);
      }
  };

  const scrollToAttendance = () => {
      attendanceRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Voice Logic (unchanged but included)
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Voice commands are not supported in this browser.");
        return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-EG'; 
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        await processVoiceCommand(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
      if (recognitionRef.current) recognitionRef.current.stop();
  };

  const processVoiceCommand = async (text: string) => {
      setIsProcessingCommand(true);
      const studentContext = students.map(s => ({ id: s.id, name: s.name }));
      const result = await interpretVoiceCommand(text, studentContext);
      
      if (result.action === 'unknown' || !result.studentId) {
          addNotification("Voice Assistant", `Could not understand: "${text}"`, "warning");
      } else {
          if (result.studentId) scrollToStudent(result.studentId);
          const student = students.find(s => s.id === result.studentId);
          const studentName = student ? student.name : "Student";

          if (result.action === 'mark_attendance') {
              toggleAttendance(result.studentId, result.value as AttendanceStatus);
              addNotification("Voice Assistant", `Marked ${studentName} as ${result.value}`, "success");
          } 
          else if (result.action === 'update_meal') {
              setMealStatus(result.studentId, result.value as MealStatus);
              addNotification("Voice Assistant", `Updated ${studentName}'s meal to ${result.value}`, "success");
          }
      }
      setIsProcessingCommand(false);
  };

  // Render Helpers
  const renderAcademicBlock = (subject: keyof typeof classAcademic, title: string, colorClass: string) => (
      <div className={`p-4 rounded-2xl border-2 ${colorClass} bg-white dark:bg-gray-800 h-full flex flex-col`}>
          <h4 className="font-bold text-sm mb-3 uppercase opacity-80 flex items-center gap-2">
             {title}
          </h4>
          <div className="flex gap-2 mb-3">
              <input 
                  value={academicInputs[subject]}
                  onChange={e => setAcademicInputs({...academicInputs, [subject]: e.target.value})}
                  onKeyDown={e => e.key === 'Enter' && handleAddAcademic(subject)}
                  placeholder={t('add')}
                  className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2 text-sm border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              />
              <button 
                  onClick={() => handleAddAcademic(subject)} 
                  disabled={!academicInputs[subject].trim()}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
              >
                  <Plus size={18} />
              </button>
          </div>
          <div className="flex flex-wrap gap-2 content-start flex-1 min-h-[40px]">
              {classAcademic[subject].map((item, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 animate-fade-in">
                      {item}
                      <button onClick={() => handleRemoveAcademic(subject, idx)} className="hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50"><X size={12}/></button>
                  </span>
              ))}
              {classAcademic[subject].length === 0 && (
                  <span className="text-xs text-gray-400 italic self-center w-full text-center py-2">{t('noResults')}</span>
              )}
          </div>
      </div>
  );

  const renderMealBlock = (mealType: keyof typeof classMeals, title: string, colorClass: string) => (
      <div className={`p-4 rounded-2xl border-2 ${colorClass} bg-white dark:bg-gray-800 h-full flex flex-col`}>
          <h4 className="font-bold text-sm mb-3 uppercase opacity-80 flex items-center gap-2">
             {title}
          </h4>
          <div className="flex gap-2 mb-3">
              <input 
                  value={mealInputs[mealType]}
                  onChange={e => setMealInputs({...mealInputs, [mealType]: e.target.value})}
                  onKeyDown={e => e.key === 'Enter' && handleAddMeal(mealType)}
                  placeholder={t('add')}
                  className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2 text-sm border-transparent focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />
              <button 
                  onClick={() => handleAddMeal(mealType)} 
                  disabled={!mealInputs[mealType].trim()}
                  className="p-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-50"
              >
                  <Plus size={18} />
              </button>
          </div>
          <div className="flex flex-wrap gap-2 content-start flex-1 min-h-[40px]">
              {classMeals[mealType].map((item, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 animate-fade-in">
                      {item}
                      <button onClick={() => handleRemoveMeal(mealType, idx)} className="hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50"><X size={12}/></button>
                  </span>
              ))}
              {classMeals[mealType].length === 0 && (
                  <span className="text-xs text-gray-400 italic self-center w-full text-center py-2">{t('noResults')}</span>
              )}
          </div>
      </div>
  );

  // Initial View
  if (!selectedDate) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in p-6">
              <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-700 text-center max-w-md w-full">
                  <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Calendar size={48} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('selectDate')}</h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">Please choose a date to start managing the class.</p>
                  
                  <div className="relative group">
                      <input 
                          type="date"
                          className="w-full px-6 py-4 text-lg font-bold text-center bg-gray-50 dark:bg-gray-700 border-2 border-indigo-100 dark:border-indigo-900 rounded-2xl focus:outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-600 transition-all cursor-pointer text-gray-700 dark:text-gray-200"
                          onChange={(e) => setSelectedDate(e.target.value)}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                          <ChevronDown />
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (loading && selectedClasses.length > 0) return <div className="p-10 text-center">{t('loading')}</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-24">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 transition-colors">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto order-2 xl:order-1">
                {/* Date Display */}
                <div className="relative group w-full sm:w-auto">
                    <div className="flex items-center gap-3 bg-white dark:bg-gray-700 px-5 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-sm cursor-pointer w-full justify-between sm:justify-start">
                        <Calendar size={20} className="text-indigo-500" />
                        <span className="font-bold text-gray-700 dark:text-gray-200 text-sm sm:text-lg min-w-[120px] text-center" dir="ltr">
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

                {classes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-2xl border border-gray-100 dark:border-gray-600 w-full sm:w-auto">
                        <button
                            onClick={toggleSelectAllClasses}
                            className={`
                                px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1
                                ${selectedClasses.length === classes.length 
                                    ? 'bg-indigo-600 text-white shadow-md' 
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'}
                            `}
                        >
                            {selectedClasses.length === classes.length ? <CheckSquare size={14} /> : <Square size={14} />}
                            ALL
                        </button>
                        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                        {classes.map(c => (
                            <button
                                key={c}
                                onClick={() => toggleClassSelection(c)}
                                className={`
                                    px-3 py-2 rounded-xl text-xs font-bold transition-all
                                    ${selectedClasses.includes(c) 
                                        ? 'bg-indigo-600 text-white shadow-md' 
                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'}
                                `}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 w-full xl:w-auto justify-end order-1 xl:order-2 mb-4 xl:mb-0">
               {/* Quick Attendance Scroll Button */}
               <button 
                    onClick={scrollToAttendance}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-colors text-sm"
               >
                   <CheckCircle size={18} />
                   {t('attendance')}
                   <ArrowDown size={16} />
               </button>

               <button 
                    onClick={markRestPresent}
                    disabled={selectedClasses.length === 0}
                    className="hidden xl:block text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-gray-700 px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
                >
                    {t('markRestPresent')}
                </button>
            </div>
        </div>

        {/* 1. MEALS (Top Priority) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border-2 border-orange-50 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Utensils size={100} className="text-orange-500" />
            </div>
            
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 text-lg">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <Utensils size={24} />
                </div>
                {t('meals')}
                <span className="text-gray-400 mx-1">|</span>
                <span className="text-orange-600 dark:text-orange-400 underline decoration-wavy decoration-orange-300 underline-offset-4">
                    {selectedClasses.length === 0 ? "..." : selectedClasses.length === 1 ? selectedClasses[0] : "Multiple"}
                </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderMealBlock('breakfast', t('breakfast'), 'border-orange-100')}
                {renderMealBlock('lunch', t('lunch'), 'border-red-100')}
                {renderMealBlock('snack', t('snack'), 'border-yellow-100')}
            </div>
        </div>

        {/* 2. ACADEMIC */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border-2 border-teal-50 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <BookOpen size={100} className="text-teal-500" />
            </div>
            
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 text-lg">
                <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
                <BookOpen size={24} />
                </div>
                {t('academic')}
                <span className="text-gray-400 mx-1">|</span>
                <span className="text-teal-600 dark:text-teal-400 underline decoration-wavy decoration-teal-300 underline-offset-4">
                    {selectedClasses.length === 0 ? "..." : selectedClasses.length === 1 ? selectedClasses[0] : "Multiple"}
                </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {renderAcademicBlock('religion', t('religion'), 'border-purple-100')}
                {renderAcademicBlock('arabic', t('arabicSubject'), 'border-emerald-100')}
                {renderAcademicBlock('english', t('englishSubject'), 'border-blue-100')}
                {renderAcademicBlock('math', t('mathSubject'), 'border-orange-100')}
            </div>
        </div>

        {/* 3. ACTIVITIES */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border-2 border-indigo-50 dark:border-gray-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Gamepad2 size={100} className="text-indigo-500" />
            </div>
            
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 text-lg">
                <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                <Gamepad2 size={24} />
                </div>
                {t('activities')}
                <span className="text-gray-400 mx-1">|</span>
                <span className="text-indigo-600 dark:text-indigo-400 underline decoration-wavy decoration-indigo-300 underline-offset-4">
                    {selectedClasses.length === 0 ? "No Class Selected" : selectedClasses.length === 1 ? selectedClasses[0] : `${selectedClasses.length} Classes`}
                </span>
            </h3>
            
            <p className="text-sm text-gray-500 mb-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600 inline-block">
                Select activities below to apply them to <b>all present students</b> in the selected classes.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {ACTIVITIES_LIST.map(act => {
                    const isSelected = classActivities.includes(act);
                    return (
                        <button
                            key={act}
                            onClick={() => toggleClassActivity(act)}
                            disabled={selectedClasses.length === 0}
                            className={`
                                flex items-center gap-2 p-3 rounded-xl border-2 transition-all select-none
                                ${isSelected 
                                    ? 'border-pink-200 bg-pink-50 text-pink-700 transform scale-105 shadow-sm' 
                                    : 'border-transparent bg-gray-50 dark:bg-gray-700/50 text-gray-500 hover:bg-gray-100'}
                                ${selectedClasses.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            <div className={`
                                w-5 h-5 rounded-full flex items-center justify-center transition-colors
                                ${isSelected ? 'bg-pink-500 text-white' : 'bg-white border border-gray-200'}
                            `}>
                                {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span className="text-xs font-bold truncate">{t(act as any)}</span>
                        </button>
                    );
                })}
            </div>
        </div>

        {/* 4. STUDENT GRID (ATTENDANCE) */}
        <div ref={attendanceRef}>
            {selectedClasses.length === 0 ? (
                <div className="p-12 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p>Select a class above to start.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {students.map(student => {
                        const isPresent = attendance[student.id] === 'present';
                        const mealStatus = meals[student.id];
                        const isHighlighted = highlightedStudentId === student.id;
                        
                        return (
                            <div 
                                key={student.id} 
                                ref={el => studentRefs.current[student.id] = el}
                                className={`
                                    relative p-4 rounded-2xl border-2 transition-all duration-300
                                    ${isPresent 
                                        ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700' 
                                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-75'}
                                    ${isHighlighted ? 'ring-4 ring-yellow-400 scale-105 z-10 shadow-xl' : ''}
                                `}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <img 
                                        src={student.avatar} 
                                        alt={student.name} 
                                        className={`w-12 h-12 rounded-full object-cover border-2 ${isPresent ? 'border-green-400' : 'border-gray-300'}`} 
                                    />
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-800 dark:text-white truncate text-sm">{student.name}</h3>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">{student.classGroup}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => toggleAttendance(student.id)}
                                        className={`
                                            flex flex-col items-center justify-center p-3 rounded-xl transition-all
                                            ${isPresent 
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}
                                        `}
                                    >
                                        {isPresent ? <CheckCircle size={24} /> : <X size={24} />}
                                        <span className="text-[10px] font-bold mt-1 uppercase">
                                            {isPresent ? t('present') : t('absent')}
                                        </span>
                                    </button>

                                    <button
                                        onClick={() => cycleMeal(student.id)}
                                        disabled={!isPresent}
                                        className={`
                                            flex flex-col items-center justify-center p-3 rounded-xl transition-all
                                            ${!isPresent ? 'opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400' : ''}
                                            ${isPresent && mealStatus === 'all' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : ''}
                                            ${isPresent && mealStatus === 'some' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : ''}
                                            ${isPresent && mealStatus === 'none' ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : ''}
                                        `}
                                    >
                                        <Coffee size={24} />
                                        <span className="text-[10px] font-bold mt-1 uppercase truncate w-full text-center">
                                            {mealStatus === 'all' ? t('ateAll') : mealStatus === 'some' ? t('ateSome') : t('ateNone')}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Footer Controls */}
        <div className={`fixed bottom-6 ${language === 'ar' ? 'right-6' : 'left-6'} z-30 flex flex-col gap-3 ${language === 'ar' ? 'items-end' : 'items-start'}`}>
            <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessingCommand}
                className={`
                    p-4 rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 border-4 border-white
                    ${isListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-white text-indigo-600 hover:bg-indigo-50'}
                `}
                title="Voice Command"
            >
                {isProcessingCommand ? <Loader2 size={24} className="animate-spin" /> : <Mic size={24} />}
            </button>

            <button 
                onClick={saveAll}
                className={`
                    flex items-center gap-3 px-8 py-4 rounded-full shadow-2xl font-bold text-white transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95
                    ${hasSaved ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}
                `}
            >
                {hasSaved ? <Check size={24} /> : <Save size={24} />}
                <span className="text-lg">{t('saveAll')}</span>
            </button>
        </div>

        {isListening && (
            <div className="fixed inset-x-0 top-0 p-4 flex justify-center z-50 pointer-events-none">
                <div className="bg-black/80 backdrop-blur-md text-white px-6 py-2 rounded-full flex items-center gap-3 shadow-xl animate-fade-in">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    <span className="font-bold text-sm">Listening... (Say: "Mark Ahmed present")</span>
                </div>
            </div>
        )}

    </div>
  );
};

export default TeacherFocusMode;
