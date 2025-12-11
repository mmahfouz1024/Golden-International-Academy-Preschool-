
import React, { useState, useEffect } from 'react';
import { FilePlus, FileEdit, Search, ArrowRight, ArrowLeft, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getStudents, getReports } from '../services/storageService';
import { Student } from '../types';
import StudentDetail from './StudentDetail';

const DailyReportManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const [mode, setMode] = useState<'menu' | 'select' | 'form'>('menu');
  const [action, setAction] = useState<'add' | 'edit'>('add');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    setStudents(getStudents());
  }, []);

  const handleActionSelect = (act: 'add' | 'edit') => {
    setAction(act);
    setMode('select');
    setWarning(null);
    setSearchTerm('');
    setSelectedStudent(null);
  };

  const handleStartReport = () => {
    if (!selectedStudent) return;
    
    const allReports = getReports();
    const reportKey = `${selectedStudent.id}_${selectedDate}`;
    const exists = !!allReports[reportKey];

    if (action === 'add' && exists) {
        setWarning(t('reportExistsWarning'));
        setTimeout(() => setWarning(null), 3000);
        // We still proceed, but user is warned they are editing existing
    } else if (action === 'edit' && !exists) {
        setWarning(t('reportNotFoundWarning'));
        setTimeout(() => setWarning(null), 3000);
        // We still proceed to create new
    }

    setMode('form');
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderMenu = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-10">
      <button 
        onClick={() => handleActionSelect('add')}
        className="bg-white p-8 rounded-3xl shadow-lg border-2 border-indigo-100 hover:border-indigo-500 hover:shadow-xl transition-all flex flex-col items-center gap-6 group"
      >
        <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <FilePlus size={48} />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('addNewReport')}</h3>
          <p className="text-gray-500">{t('dailyReportSubtitle')}</p>
        </div>
      </button>

      <button 
        onClick={() => handleActionSelect('edit')}
        className="bg-white p-8 rounded-3xl shadow-lg border-2 border-orange-100 hover:border-orange-500 hover:shadow-xl transition-all flex flex-col items-center gap-6 group"
      >
        <div className="w-24 h-24 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
          <FileEdit size={48} />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('editExistingReport')}</h3>
          <p className="text-gray-500">{t('searchReportsSubtitle')}</p>
        </div>
      </button>
    </div>
  );

  const renderSelection = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <button 
        onClick={() => setMode('menu')}
        className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors"
      >
         {language === 'ar' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
         {t('back')}
      </button>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
         <h3 className="text-lg font-bold text-gray-800 mb-4">{t('selectOption')}</h3>
         
         <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 w-full">
               <label className="block text-sm font-bold text-gray-500 mb-2">{t('reportDate')}</label>
               <div className="relative">
                  <Calendar className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} />
                  <input 
                    type="date" 
                    className={`w-full ${language === 'ar' ? 'pr-12' : 'pl-12'} p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-gray-700`}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
               </div>
            </div>
            
            <div className="flex-1 w-full">
               <label className="block text-sm font-bold text-gray-500 mb-2">{t('search')}</label>
               <div className="relative">
                  <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} />
                  <input 
                    type="text" 
                    placeholder={t('searchPlaceholder')}
                    className={`w-full ${language === 'ar' ? 'pr-12' : 'pl-12'} p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
        {filteredStudents.map(student => (
          <button
            key={student.id}
            onClick={() => setSelectedStudent(student)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-start ${
              selectedStudent?.id === student.id 
                ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                : 'border-white bg-white hover:border-gray-200 shadow-sm'
            }`}
          >
            <img src={student.avatar} alt={student.name} className="w-12 h-12 rounded-full border border-gray-100 object-cover" />
            <div>
               <h4 className="font-bold text-gray-800">{student.name}</h4>
               <p className="text-xs text-gray-500">{student.classGroup}</p>
            </div>
            {selectedStudent?.id === student.id && (
               <div className={`${language === 'ar' ? 'mr-auto' : 'ml-auto'} text-indigo-600`}>
                 <CheckCircle size={20} />
               </div>
            )}
          </button>
        ))}
        {filteredStudents.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-400">
             {t('noResults')}
          </div>
        )}
      </div>

      <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center pointer-events-none">
        <button
          onClick={handleStartReport}
          disabled={!selectedStudent}
          className="pointer-events-auto bg-indigo-600 text-white px-10 py-4 rounded-full font-bold shadow-xl shadow-indigo-200 transform transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
        >
          {t('startReporting')}
          {language === 'ar' ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
        </button>
      </div>

    </div>
  );

  return (
    <div className="pb-20">
      {/* Header */}
      {mode !== 'form' && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{t('dailyReportTitle')}</h2>
          <p className="text-gray-500 mt-1">{t('dailyReportSubtitle')}</p>
        </div>
      )}

      {warning && (
         <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-orange-100 text-orange-800 px-6 py-3 rounded-full shadow-lg border border-orange-200 flex items-center gap-2 animate-bounce">
            <AlertTriangle size={18} />
            <span className="text-sm font-bold">{warning}</span>
         </div>
      )}

      {mode === 'menu' && renderMenu()}
      {mode === 'select' && renderSelection()}
      {mode === 'form' && selectedStudent && (
        <div className="animate-fade-in">
           <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setMode('select')}
                className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors"
              >
                {language === 'ar' ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                {t('back')}
              </button>
              <h3 className="font-bold text-gray-800">{action === 'add' ? t('addNewReport') : t('editExistingReport')}</h3>
           </div>
           
           <StudentDetail 
             student={selectedStudent} 
             initialDate={selectedDate}
             readOnly={false} 
           />
        </div>
      )}
    </div>
  );
};

export default DailyReportManagement;
