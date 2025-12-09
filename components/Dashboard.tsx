
import React from 'react';
import { Users, UserCheck, DollarSign, GraduationCap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ATTENDANCE_DATA } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  
  const stats = [
    { label: t('statsTotalStudents'), value: '124', icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: t('statsPresentToday'), value: '112', icon: UserCheck, color: 'bg-green-100 text-green-600' },
    { label: t('statsTeachers'), value: '12', icon: GraduationCap, color: 'bg-purple-100 text-purple-600' },
    { label: t('statsRevenue'), value: '45,200', icon: DollarSign, color: 'bg-yellow-100 text-yellow-600', suffix: t('currency') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t('dashboard')}</h2>
          <p className="text-gray-500 mt-1">{t('overview')}</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
          {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`p-4 rounded-xl ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                  {stat.suffix && <span className="text-xs text-gray-400">{stat.suffix}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">{t('attendanceChart')}</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ATTENDANCE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="present" name={language === 'ar' ? "حضور" : "Present"} fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="absent" name={language === 'ar' ? "غياب" : "Absent"} fill="#fecaca" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">{t('dailySchedule')}</h3>
          <div className="space-y-4">
            {[
              { time: '08:00', title: 'استقبال الأطفال', color: 'border-green-500 bg-green-50' },
              { time: '09:00', title: 'الحلقة الصباحية', color: 'border-blue-500 bg-blue-50' },
              { time: '10:30', title: 'وجبة الإفطار', color: 'border-orange-500 bg-orange-50' },
              { time: '11:00', title: 'اللعب الحر', color: 'border-purple-500 bg-purple-50' },
            ].map((item, idx) => (
              <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border-r-4 ${item.color} ${language === 'en' ? 'border-r-0 border-l-4' : ''}`}>
                <span className="text-sm font-bold text-gray-600 bg-white px-2 py-0.5 rounded shadow-sm min-w-[60px] text-center">{item.time}</span>
                <span className="text-gray-800 font-medium">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
