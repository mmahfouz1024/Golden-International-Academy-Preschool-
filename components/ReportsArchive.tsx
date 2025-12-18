
import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, FileText, Filter, X } from 'lucide-react';
import { getReports, getStudents } from '../services/storageService';
import { Student, DailyReport } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ReportsArchiveProps {
  onViewReport: (student: Student, date: string) => void;
}

const ReportsArchive: React.FC<ReportsArchiveProps> = ({ onViewReport }) => {
  const { t, language } = useLanguage();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  
  // Filters
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to format date strictly in English
  const getFormattedDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    // Force English months and numbers
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
  };

  useEffect(() => {
    setStudents(getStudents());
    const allReportsMap = getReports();
    const reportsArray = Object.values(allReportsMap);
    reportsArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setReports(reportsArray);
    
    const dates = Array.from(new Set(reportsArray.map(r => r.date))).sort().reverse();
    setAvailableDates(dates);
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesDate = selectedDate ? report.date === selectedDate : true;
    const matchesStudent = selectedStudentId !== 'all' ? report.studentId === selectedStudentId : true;
    
    const student = students.find(s => s.id === report.studentId);
    const matchesSearch = student ? student.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;

    return matchesDate && matchesStudent && (searchTerm ? matchesSearch : true);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{t('reportsArchive')}</h2>
        <p className="text-gray-500 mt-1">{t('searchReportsSubtitle')}</p>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          <div className="md:col-span-4 relative">
            <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')}
              className={`w-full ${language === 'ar' ? 'pl-4 pr-10' : 'pr-4 pl-10'} py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="md:col-span-3">
             <div className="relative">
                <User className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
                <select 
                  className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500 bg-white text-gray-600 appearance-none`}
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="all">{t('selectStudent')}</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <div className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 pointer-events-none`}>
                  <Filter size={14} className="text-gray-400" />
                </div>
             </div>
          </div>

          <div className="md:col-span-3">
            <div className="relative">
               <Calendar className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} size={18} />
               <select
                 className={`w-full ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-indigo-500 bg-white text-gray-600 appearance-none`}
                 value={selectedDate}
                 onChange={(e) => setSelectedDate(e.target.value)}
               >
                 <option value="">{t('allDates')}</option>
                 {availableDates.map(date => (
                   <option key={date} value={date}>{getFormattedDate(date)}</option>
                 ))}
               </select>
               <div className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 pointer-events-none`}>
                  <Filter size={14} className="text-gray-400" />
                </div>
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-end">
            <button 
              onClick={() => {setSelectedDate(''); setSelectedStudentId('all'); setSearchTerm('');}}
              className="text-sm text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
            >
              <X size={16} />
              {t('advancedFilter')}
            </button>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => {
          const student = students.find(s => s.id === report.studentId);
          if (!student) return null;

          return (
            <div key={report.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-4">
                <div className="flex items-center gap-3">
                  <img src={student.avatar} alt={student.name} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                  <div>
                    <h4 className="font-bold text-gray-800">{student.name}</h4>
                    <p className="text-xs text-gray-500">{student.classGroup}</p>
                  </div>
                </div>
                <div className="text-sm bg-gray-50 px-2 py-1 rounded text-gray-600 font-bold" dir="ltr">
                  {getFormattedDate(report.date)}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('mood')}:</span>
                  <span className="font-medium text-gray-800">{t(report.mood)}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-500">{t('activities')}:</span>
                   <span className="font-medium text-gray-800">{report.activities.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-500">{t('nap')}:</span>
                   <span className="font-medium text-gray-800">{report.nap.slept ? t('yes') : t('no')}</span>
                </div>
              </div>

              <button 
                onClick={() => onViewReport(student, report.date)}
                className="w-full py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
              >
                <FileText size={18} />
                {t('viewReport')}
              </button>
            </div>
          );
        })}
        
        {filteredReports.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
            <Search size={40} className="mx-auto mb-3 opacity-30" />
            <p>{t('noResults')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsArchive;
