
import React, { useState, useEffect } from 'react';
import { Check, X, Clock, UserCheck, Filter, PieChart, Save, Calendar, ChevronDown, ArrowRight, ArrowLeft, Edit, Plus, AlertCircle, CheckCircle, FileText, LayoutList } from 'lucide-react';
import { AttendanceStatus, Student } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getStudents, saveStudents, getAttendanceHistory, saveAttendanceHistory } from '../services/storageService';

const Attendance: React.FC = () => {
  const { t, language } = useLanguage();
  const [viewMode, setViewMode] = useState<'mark' | 'records'>('mark'); // Tab Switcher
  
  // MARK MODE STATE
  const [mode, setMode] = useState<'select' | 'mark'>('select');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceHistory, setAttendanceHistory] = useState<Record<string, Record<string, AttendanceStatus>>>({});
  
  // RECORDS MODE STATE
  const [recordMonth, setRecordMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [recordClass, setRecordClass] = useState('All');

  // Marking State
  const [filterClass, setFilterClass] = useState('All');
  const [isSaved, setIsSaved] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});

  // Helper to format date: 25 October 2023
  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
  };

  useEffect(() => {
    // Load initial data
    setStudents(getStudents());
    setAttendanceHistory(getAttendanceHistory());
  }, []);

  const handleStartAttendance = () => {
    // Check if record exists
    const existingRecord = attendanceHistory[selectedDate];
    
    if (existingRecord) {
        setAttendanceMap(existingRecord);
    } else {
        // Initialize new record
        const initialMap: Record<string, AttendanceStatus> = {};
        const isToday = selectedDate === new Date().toISOString().split('T')[0];
        
        students.forEach(s => {
            // If creating for Today, use current status from student profile if available (legacy support)
            // Otherwise default to Present
            if (isToday) {
                initialMap[s.id] = s.attendanceToday ? 'present' : 'absent';
            } else {
                initialMap[s.id] = 'present';
            }
        });
        setAttendanceMap(initialMap);
    }
    setMode('mark');
  };

  const filteredStudents = students.filter(student => 
    filterClass === 'All' || student.classGroup === filterClass
  );

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    const newMap = { ...attendanceMap };
    filteredStudents.forEach(s => {
      newMap[s.id] = status;
    });
    setAttendanceMap(newMap);
  };

  const handleSave = () => {
    // 1. Save to History (Source of Truth for Dates)
    const history = getAttendanceHistory();
    history[selectedDate] = attendanceMap;
    saveAttendanceHistory(history);
    setAttendanceHistory(history); // Update local history state

    // 2. If Today, update legacy student record for easy access elsewhere
    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    if (isToday) {
      const updatedStudents = students.map(student => ({
        ...student,
        attendanceToday: attendanceMap[student.id] === 'present'
      }));
      setStudents(updatedStudents);
      saveStudents(updatedStudents);
    }

    setIsSaved(true);
    
    // Wait for visual feedback (1.5s), then return to selection screen
    setTimeout(() => {
        setIsSaved(false);
        setMode('select');
    }, 1500);
  };

  // --- RECORDS VIEW HELPERS ---
  const getDaysInMonth = (yearMonth: string) => {
      const [year, month] = yearMonth.split('-').map(Number);
      const days = new Date(year, month, 0).getDate();
      return Array.from({length: days}, (_, i) => i + 1);
  };

  const getStatusIcon = (status: AttendanceStatus | undefined) => {
      switch(status) {
          case 'present': return <Check size={14} className="text-green-600 mx-auto" strokeWidth={3} />;
          case 'absent': return <X size={14} className="text-red-500 mx-auto" strokeWidth={3} />;
          case 'late': return <Clock size={14} className="text-yellow-600 mx-auto" />;
          case 'excused': return <AlertCircle size={14} className="text-blue-500 mx-auto" />;
          default: return <span className="text-gray-200 text-xs">-</span>;
      }
  };

  const calculateMonthlyStats = (studentId: string, days: number[]) => {
      let present = 0;
      days.forEach(day => {
          const dateStr = `${recordMonth}-${String(day).padStart(2, '0')}`;
          const status = attendanceHistory[dateStr]?.[studentId];
          if (status === 'present') present++;
      });
      return present;
  };

  const renderDateSelection = () => {
      const recordExists = !!attendanceHistory[selectedDate];

      return (
          <div className="max-w-2xl mx-auto mt-8 px-4">
              <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('attendanceDateSelect')}</h2>
                  <p className="text-gray-500">{t('markAttendance')}</p>
              </div>

              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 flex flex-col gap-8 items-center">
                  
                  {/* Date Picker */}
                  <div className="w-full">
                      <label className="block text-sm font-bold text-gray-500 mb-2 text-center">{t('selectDate')}</label>
                      <div className="relative group max-w-sm mx-auto">
                        <div className="flex items-center justify-center gap-3 bg-gray-50 hover:bg-white border-2 border-gray-200 hover:border-indigo-300 rounded-2xl px-6 py-4 transition-all cursor-pointer shadow-sm group-hover:shadow-md">
                            <Calendar size={24} className="text-indigo-500" />
                            <span className="font-bold text-gray-700 text-xl min-w-[160px] text-center" dir="ltr">
                                {getFormattedDate(selectedDate)}
                            </span>
                            <ChevronDown size={20} className="text-gray-400 group-hover:text-indigo-500" />
                        </div>
                        <input 
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                  </div>

                  {/* Status & Action */}
                  <div className={`w-full p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-all duration-300 ${recordExists ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
                      <div className={`p-4 rounded-full ${recordExists ? 'bg-white text-indigo-600 shadow-sm' : 'bg-white text-gray-400 shadow-sm'}`}>
                          {recordExists ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                      </div>
                      
                      <div className="text-center">
                          <h3 className={`text-lg font-bold ${recordExists ? 'text-indigo-900' : 'text-gray-700'}`}>
                              {recordExists ? t('attendanceRecordFound') : t('attendanceRecordNotFound')}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                              {recordExists ? t('modifyAttendance') : t('createNewAttendance')}
                          </p>
                      </div>

                      <button 
                          onClick={handleStartAttendance}
                          className={`w-full max-w-xs py-4 rounded-xl font-bold text-white shadow-lg transform transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 ${
                              recordExists ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'
                          }`}
                      >
                          {recordExists ? <Edit size={20} /> : <Plus size={20} />}
                          <span>{recordExists ? t('edit') : t('startReporting')}</span>
                          {language === 'ar' ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                      </button>
                  </div>

              </div>
          </div>
      );
  };

  const renderMarkingScreen = () => {
      const stats = {
        present: Object.values(attendanceMap).filter(s => s === 'present').length,
        absent: Object.values(attendanceMap).filter(s => s === 'absent').length,
        late: Object.values(attendanceMap).filter(s => s === 'late').length,
        excused: Object.values(attendanceMap).filter(s => s === 'excused').length,
      };
      const total = Object.keys(attendanceMap).length || 1; 

      return (
        <div className="space-y-6 pb-20 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setMode('select')}
                className="p-2 bg-white rounded-full text-gray-500 hover:bg-gray-50 shadow-sm border border-gray-100 transition-all"
              >
                 {language === 'ar' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{t('attendanceRegister')}</h2>
                <p className="text-indigo-600 font-bold text-sm mt-1" dir="ltr">{getFormattedDate(selectedDate)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <UserCheck size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{t('present')}</p>
                <p className="text-xl font-bold text-gray-800">{stats.present} <span className="text-xs text-gray-400">/ {students.length}</span></p>
              </div>
            </div>
            {/* ... Other stats cards ... */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                <X size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{t('absent')}</p>
                <p className="text-xl font-bold text-gray-800">{stats.absent}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <PieChart size={24} />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">{t('stats')}</p>
                    <p className="text-xl font-bold text-gray-800">{Math.round((stats.present / total) * 100)}%</p>
                </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center bg-gray-50">
               <div className="flex items-center gap-2">
                 <Filter size={18} className="text-gray-400" />
                 <select 
                    className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                 >
                    <option value="All">{t('filterClass')}</option>
                    {Array.from(new Set(students.map(s => s.classGroup))).map(c => (
                       <option key={c} value={c}>{c}</option>
                    ))}
                 </select>
               </div>
               
               <button 
                 onClick={() => markAll('present')}
                 className="text-sm text-indigo-600 font-medium hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
               >
                 {t('markAllPresent')}
               </button>
            </div>

            <div className="overflow-x-auto">
              <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">{t('studentName')}</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">{t('studentClass')}</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">{t('attendance')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStudents.map((student) => {
                    const status = attendanceMap[student.id];
                    return (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                            <span className="font-medium text-gray-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                            {student.classGroup}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => updateStatus(student.id, 'present')}
                              className={`p-2 rounded-lg transition-all ${
                                status === 'present' 
                                  ? 'bg-green-100 text-green-700 ring-2 ring-green-500/20' 
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={t('present')}
                            >
                              <Check size={20} />
                            </button>
                            <button
                              onClick={() => updateStatus(student.id, 'absent')}
                              className={`p-2 rounded-lg transition-all ${
                                status === 'absent' 
                                  ? 'bg-red-100 text-red-700 ring-2 ring-red-500/20' 
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={t('absent')}
                            >
                              <X size={20} />
                            </button>
                            <button
                              onClick={() => updateStatus(student.id, 'late')}
                              className={`p-2 rounded-lg transition-all ${
                                status === 'late' 
                                  ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500/20' 
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={t('late')}
                            >
                              <Clock size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

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
                    <span>{t('save')}</span>
                  </>
                )}
              </button>
            </div>
        </div>
      );
  };

  const renderRecordsScreen = () => {
      const days = getDaysInMonth(recordMonth);
      const filteredRecordsStudents = students.filter(s => recordClass === 'All' || s.classGroup === recordClass);

      return (
          <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                      <LayoutList className="text-indigo-600" />
                      <h3 className="font-bold text-gray-800">{t('monthlyView')}</h3>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                      <input 
                          type="month" 
                          className="px-4 py-2 border rounded-xl bg-gray-50 focus:bg-white transition-colors"
                          value={recordMonth}
                          onChange={(e) => setRecordMonth(e.target.value)}
                      />
                      <select 
                          className="px-4 py-2 border rounded-xl bg-gray-50 focus:bg-white transition-colors"
                          value={recordClass}
                          onChange={(e) => setRecordClass(e.target.value)}
                      >
                          <option value="All">{t('filterClass')}</option>
                          {Array.from(new Set(students.map(s => s.classGroup))).map(c => (
                             <option key={c} value={c}>{c}</option>
                          ))}
                      </select>
                  </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                      <table className={`w-full text-center border-collapse text-sm`}>
                          <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                  <th className={`p-4 sticky ${language === 'ar' ? 'right-0' : 'left-0'} bg-gray-50 z-10 font-bold text-gray-700 border-r border-gray-200 min-w-[150px] text-start shadow-sm`}>
                                      {t('studentName')}
                                  </th>
                                  <th className="p-2 font-bold text-indigo-600 min-w-[80px] bg-indigo-50/50 border-r border-gray-200">
                                      {t('totalPresent')}
                                  </th>
                                  {days.map(d => (
                                      <th key={d} className="p-2 min-w-[40px] font-medium text-gray-500 border-r border-gray-100">
                                          {d}
                                      </th>
                                  ))}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {filteredRecordsStudents.map(student => {
                                  const totalPresent = calculateMonthlyStats(student.id, days);
                                  return (
                                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                          <td className={`p-3 sticky ${language === 'ar' ? 'right-0' : 'left-0'} bg-white z-10 text-start border-r border-gray-100 shadow-sm`}>
                                              <div className="flex items-center gap-2">
                                                  <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0">
                                                      <img src={student.avatar} alt="" className="w-full h-full object-cover" />
                                                  </div>
                                                  <span className="font-bold text-gray-800 text-xs truncate max-w-[120px]">{student.name}</span>
                                              </div>
                                          </td>
                                          <td className="p-2 font-bold text-indigo-600 bg-indigo-50/10 border-r border-gray-100">
                                              {totalPresent}
                                          </td>
                                          {days.map(d => {
                                              const dateStr = `${recordMonth}-${String(d).padStart(2, '0')}`;
                                              const status = attendanceHistory[dateStr]?.[student.id];
                                              return (
                                                  <td key={d} className="p-1 border-r border-gray-50">
                                                      {getStatusIcon(status)}
                                                  </td>
                                              );
                                          })}
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  </div>
                  {filteredRecordsStudents.length === 0 && (
                      <div className="p-12 text-center text-gray-400">
                          {t('noResults')}
                      </div>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-4">
        {/* Top Tabs */}
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex w-full sm:w-auto">
            <button 
                onClick={() => setViewMode('mark')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    viewMode === 'mark' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
                <CheckCircle size={16} />
                {t('markTab')}
            </button>
            <button 
                onClick={() => setViewMode('records')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    viewMode === 'records' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
                <FileText size={16} />
                {t('viewTab')}
            </button>
        </div>

        {viewMode === 'mark' ? (
            mode === 'select' ? renderDateSelection() : renderMarkingScreen()
        ) : (
            renderRecordsScreen()
        )}
    </div>
  );
};

export default Attendance;
