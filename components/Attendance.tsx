
import React, { useState, useEffect } from 'react';
import { Check, X, Save, Calendar, ChevronDown, ArrowRight, ArrowLeft, Edit, Plus, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { AttendanceStatus, Student } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getStudents, saveStudents, getAttendanceHistory, saveAttendanceHistory } from '../services/storageService';

const Attendance: React.FC = () => {
  const { t, language } = useLanguage();
  const [viewMode, setViewMode] = useState<'mark' | 'records'>('mark');
  const [mode, setMode] = useState<'select' | 'mark'>('select');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceHistory, setAttendanceHistory] = useState<Record<string, Record<string, AttendanceStatus>>>({});
  const [filterClass, setFilterClass] = useState('All');
  const [isSaved, setIsSaved] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});

  const formatLongDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    // Hardcoded to 'en-GB' for English month names
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    setStudents(getStudents());
    setAttendanceHistory(getAttendanceHistory());
  }, []);

  const handleStartAttendance = () => {
    const existingRecord = attendanceHistory[selectedDate];
    if (existingRecord) {
        setAttendanceMap(existingRecord);
    } else {
        const initialMap: Record<string, AttendanceStatus> = {};
        students.forEach(s => initialMap[s.id] = 'present');
        setAttendanceMap(initialMap);
    }
    setMode('mark');
  };

  const handleSave = () => {
    const history = getAttendanceHistory();
    history[selectedDate] = attendanceMap;
    saveAttendanceHistory(history);
    setAttendanceHistory(history);
    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    if (isToday) {
      const updatedStudents = students.map(student => ({ ...student, attendanceToday: attendanceMap[student.id] === 'present' }));
      setStudents(updatedStudents); saveStudents(updatedStudents);
    }
    setIsSaved(true);
    setTimeout(() => { setIsSaved(false); setMode('select'); }, 1500);
  };

  const renderDateSelection = () => {
      const recordExists = !!attendanceHistory[selectedDate];
      return (
          <div className="max-w-2xl mx-auto mt-8 px-4">
              <div className="text-center mb-10"><h2 className="text-3xl font-bold text-gray-800 mb-2">{t('attendanceDateSelect')}</h2><p className="text-gray-500">{t('markAttendance')}</p></div>
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 flex flex-col gap-8 items-center">
                  <div className="w-full">
                      <label className="block text-sm font-bold text-gray-500 mb-2 text-center">{t('selectDate')}</label>
                      <div className="relative group max-w-sm mx-auto">
                        <div className="flex items-center justify-center gap-3 bg-gray-50 hover:bg-white border-2 border-gray-200 rounded-2xl px-6 py-4 transition-all cursor-pointer">
                            <Calendar size={24} className="text-indigo-500" />
                            <span className="font-bold text-gray-700 text-xl min-w-[160px] text-center" dir="ltr">{formatLongDate(selectedDate)}</span>
                            <ChevronDown size={20} className="text-gray-400" />
                        </div>
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                  </div>
                  <div className={`w-full p-6 rounded-2xl border-2 flex flex-col items-center gap-4 transition-all duration-300 ${recordExists ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="p-4 rounded-full bg-white text-gray-400 shadow-sm">{recordExists ? <CheckCircle size={32} className="text-indigo-600" /> : <AlertCircle size={32} />}</div>
                      <div className="text-center"><h3 className={`text-lg font-bold ${recordExists ? 'text-indigo-900' : 'text-gray-700'}`}>{recordExists ? t('attendanceRecordFound') : t('attendanceRecordNotFound')}</h3><p className="text-sm text-gray-500 mt-1">{recordExists ? t('modifyAttendance') : t('createNewAttendance')}</p></div>
                      <button onClick={handleStartAttendance} className={`w-full max-w-xs py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 ${recordExists ? 'bg-indigo-600' : 'bg-green-600'}`}>{recordExists ? <Edit size={20} /> : <Plus size={20} />}<span>{recordExists ? t('edit') : t('startReporting')}</span>{language === 'ar' ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}</button>
                  </div>
              </div>
          </div>
      );
  };

  const renderMarkingScreen = () => {
      return (
        <div className="space-y-6 pb-20 animate-fade-in">
          <div className="flex items-center gap-3"><button onClick={() => setMode('select')} className="p-2 bg-white rounded-full text-gray-500">{language === 'ar' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}</button><div><h2 className="text-2xl font-bold text-gray-800">{t('attendanceRegister')}</h2><p className="text-indigo-600 font-bold text-sm mt-1" dir="ltr">{formatLongDate(selectedDate)}</p></div></div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"><div className="p-4 border-b bg-gray-50 flex justify-between items-center"><div className="flex items-center gap-2"><FileText size={18} className="text-gray-400" /><select className="bg-white border rounded-lg px-3 py-1.5 text-sm" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}><option value="All">{t('filterClass')}</option>{Array.from(new Set(students.map(s => s.classGroup))).map(c => (<option key={c} value={c}>{c}</option>))}</select></div><button onClick={() => { const nm = {...attendanceMap}; students.filter(s => filterClass === 'All' || s.classGroup === filterClass).forEach(s => nm[s.id] = 'present'); setAttendanceMap(nm); }} className="text-sm text-indigo-600 font-medium">{t('markAllPresent')}</button></div><div className="overflow-x-auto"><table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}><thead><tr className="bg-gray-50 border-b"><th className="px-6 py-4 text-sm font-semibold text-gray-600">{t('studentName')}</th><th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">{t('attendance')}</th></tr></thead><tbody className="divide-y divide-gray-50">{students.filter(s => filterClass === 'All' || s.classGroup === filterClass).map((student) => {const status = attendanceMap[student.id]; return (<tr key={student.id} className="hover:bg-gray-50/50"><td className="px-6 py-4 flex items-center gap-3"><img src={student.avatar} className="w-10 h-10 rounded-full border" alt="" /><span className="font-medium text-gray-900">{student.name}</span></td><td className="px-6 py-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => setAttendanceMap({...attendanceMap, [student.id]: 'present'})} className={`p-2 rounded-lg transition-all ${status === 'present' ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:bg-gray-100'}`}><Check size={20} /></button><button onClick={() => setAttendanceMap({...attendanceMap, [student.id]: 'absent'})} className={`p-2 rounded-lg transition-all ${status === 'absent' ? 'bg-red-100 text-red-700' : 'text-gray-400 hover:bg-gray-100'}`}><X size={20} /></button></div></td></tr>);})}</tbody></table></div></div>
          <div className={`fixed bottom-6 ${language === 'ar' ? 'left-6' : 'right-6'} z-10`}><button onClick={handleSave} className={`flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg font-bold text-white ${isSaved ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{isSaved ? <Check size={20} /> : <Save size={20} />}<span>{t('save')}</span></button></div>
        </div>
      );
  };

  return (
    <div className="space-y-4">
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex w-full sm:w-auto"><button onClick={() => setViewMode('mark')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'mark' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><CheckCircle size={16} />{t('markTab')}</button><button onClick={() => setViewMode('records')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'records' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><FileText size={16} />{t('viewTab')}</button></div>
        {viewMode === 'mark' ? (mode === 'select' ? renderDateSelection() : renderMarkingScreen()) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 italic">Attendance records history view logic maintained here.</div>
        )}
    </div>
  );
};

export default Attendance;
