
import React, { useState } from 'react';
import { Check, X, Clock, UserCheck, Filter, PieChart, Save } from 'lucide-react';
import { MOCK_STUDENTS } from '../constants';
import { AttendanceStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const Attendance: React.FC = () => {
  const { t, language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterClass, setFilterClass] = useState('All');
  const [isSaved, setIsSaved] = useState(false);
  
  // Local state to track attendance for the session
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>(
    MOCK_STUDENTS.reduce((acc, student) => ({
      ...acc,
      [student.id]: student.attendanceToday ? 'present' : 'absent'
    }), {})
  );

  const filteredStudents = MOCK_STUDENTS.filter(student => 
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
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const stats = {
    present: Object.values(attendanceMap).filter(s => s === 'present').length,
    absent: Object.values(attendanceMap).filter(s => s === 'absent').length,
    late: Object.values(attendanceMap).filter(s => s === 'late').length,
    excused: Object.values(attendanceMap).filter(s => s === 'excused').length,
  };

  const total = Object.keys(attendanceMap).length;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('attendanceRegister')}</h2>
          <p className="text-gray-500 mt-1">{t('markAttendance')}</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{t('present')}</p>
            <p className="text-xl font-bold text-gray-800">{stats.present} <span className="text-xs text-gray-400">/ {total}</span></p>
          </div>
        </div>
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
          <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{t('late')}</p>
            <p className="text-xl font-bold text-gray-800">{stats.late}</p>
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
                <option value="البراعم">البراعم</option>
                <option value="العصافير">العصافير</option>
                <option value="النجوم">النجوم</option>
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

export default Attendance;
