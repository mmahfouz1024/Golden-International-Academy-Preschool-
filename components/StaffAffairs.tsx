
import React, { useState, useEffect } from 'react';
/* Removed unused User import to fix TS6133 */
import { DollarSign, Plus, History, Check, Trash2, Calendar, UserCog, ChevronDown, AlertCircle, ShieldAlert, Wallet, Settings2, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getUsers, saveUsers, getPayroll, savePayroll } from '../services/storageService';
import { User as UserType, StaffSalary } from '../types';

const StaffAffairs: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'payroll' | 'base-salary'>('payroll');
  const [staff, setStaff] = useState<UserType[]>([]);
  const [history, setHistory] = useState<StaffSalary[]>([]);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Payment Form
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Edit Base Salary
  const [editingBaseId, setEditingBaseId] = useState<string | null>(null);
  const [baseSalaryInput, setBaseSalaryInput] = useState('');

  // Formatter for YYYY-MM to Readable Month Year
  const formatMonthYear = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, monthPart] = monthStr.split('-');
    const d = new Date(parseInt(year), parseInt(monthPart) - 1);
    return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' });
  };

  useEffect(() => {
      const allUsers = getUsers();
      const storedUid = localStorage.getItem('golden_session_uid');
      const foundUser = allUsers.find(u => u.id === storedUid);
      setCurrentUser(foundUser || null);

      const staffList = allUsers.filter(u => u.role !== 'parent' && u.role !== 'admin');
      setStaff(staffList);
      setHistory(getPayroll());
  }, []);

  const handleRecordPayment = () => {
      setFormError(null);
      if (!selectedStaffId || !amount) return;
      const staffMember = staff.find(s => s.id === selectedStaffId);
      if (!staffMember) return;

      // Duplicate Check
      const alreadyPaid = history.some(r => r.staffId === selectedStaffId && r.month === month);
      if (alreadyPaid) {
          setFormError(t('salaryExistsError'));
          return;
      }

      const record: StaffSalary = {
          id: Date.now().toString(),
          staffId: staffMember.id,
          staffName: staffMember.name,
          amount: parseFloat(amount),
          date: new Date().toISOString().split('T')[0],
          month: month,
          status: 'paid'
      };

      const updatedHistory = [record, ...history];
      setHistory(updatedHistory);
      savePayroll(updatedHistory);
      setAmount('');
      setSelectedStaffId('');
  };

  const handleUpdateBaseSalary = (id: string) => {
      const allUsers = getUsers();
      const updatedUsers = allUsers.map(u => {
          if (u.id === id) {
              return { ...u, salary: parseFloat(baseSalaryInput) };
          }
          return u;
      });
      saveUsers(updatedUsers);
      setStaff(updatedUsers.filter(u => u.role !== 'parent' && u.role !== 'admin'));
      setEditingBaseId(null);
  };

  const handleDeleteHistoryItem = (id: string) => {
      if (!window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this record?')) return;
      const updated = history.filter(item => item.id !== id);
      setHistory(updated);
      savePayroll(updated);
  };

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  if (!canManage) {
      return (
          <div className="p-20 text-center bg-white rounded-3xl border border-gray-100">
              <UserCog size={48} className="mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-bold text-gray-800">{t('contactAdmin')}</h2>
              <p className="text-gray-500">Only admins can manage staff payroll.</p>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
        <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-gray-800">{t('staffAffairs')}</h2>
            <p className="text-gray-500">{t('hrSubtitle')}</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-2xl w-fit">
            <button 
                onClick={() => setActiveTab('payroll')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'payroll' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                }`}
            >
                <Wallet size={18} />
                {t('recordSalaryTab' as any)}
            </button>
            <button 
                onClick={() => setActiveTab('base-salary')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                    activeTab === 'base-salary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                }`}
            >
                <Settings2 size={18} />
                {t('baseSalaryTab' as any)}
            </button>
        </div>

        {activeTab === 'payroll' ? (
            <div className="space-y-8">
                {/* 1. Record Payment Section */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 bg-indigo-50 rounded-bl-2xl">
                        <ShieldAlert size={16} className="text-indigo-400" />
                    </div>

                    <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        <div className="p-2 bg-green-100 text-green-600 rounded-lg"><DollarSign size={20}/></div>
                        {t('recordSalary')}
                    </h3>

                    <div className="mb-4 flex items-start gap-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                        <ShieldAlert size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] font-bold text-indigo-700 leading-tight">
                            {t('payrollNote' as any)}
                        </p>
                    </div>

                    {formError && (
                        <div className="mb-4 bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 flex items-center gap-2 text-sm font-bold animate-fade-in">
                            <AlertCircle size={18} />
                            {formError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{t('staffMember')}</label>
                            <select 
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:bg-white focus:outline-none transition-all text-sm font-bold"
                                value={selectedStaffId}
                                onChange={e => {
                                    setSelectedStaffId(e.target.value);
                                    setFormError(null);
                                    const s = staff.find(u => u.id === e.target.value);
                                    if (s && s.salary) setAmount(s.salary.toString());
                                }}
                            >
                                <option value="">{t('selectOption')}</option>
                                {staff.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({t(`role${s.role.charAt(0).toUpperCase() + s.role.slice(1)}` as any)})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{t('paymentMonth')}</label>
                            <div className="relative group">
                                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 cursor-pointer group-focus-within:bg-white transition-all">
                                    <Calendar size={18} className="text-indigo-500" />
                                    <span className="font-bold text-sm text-gray-700 whitespace-nowrap">{formatMonthYear(month)}</span>
                                    <ChevronDown size={14} className="text-gray-400 ml-auto" />
                                </div>
                                <input 
                                    type="month" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    value={month}
                                    onChange={e => { setMonth(e.target.value); setFormError(null); }}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">{t('salaryAmount')}</label>
                            <input 
                                type="number" 
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 focus:bg-white focus:outline-none transition-all text-sm font-bold"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={handleRecordPayment}
                            className="py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                        >
                            {t('save')}
                        </button>
                    </div>
                </div>

                {/* 2. History */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><History size={20}/></div>
                            {t('paymentHistory')}
                        </div>
                    </h3>
                    <div className="space-y-3">
                        {history.map((record) => (
                            <div key={record.id} className="group relative flex justify-between items-center p-4 bg-gray-50 hover:bg-indigo-50/50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{record.staffName}</p>
                                        <p className="text-[10px] text-gray-400" dir="ltr">{record.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="font-bold text-indigo-600">{record.amount} {t('currency')}</p>
                                        <span className="text-[10px] bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full font-bold uppercase" dir="ltr">
                                            {formatMonthYear(record.month)}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteHistoryItem(record.id)}
                                        className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        title={t('delete')}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {history.length === 0 && (
                            <div className="py-20 text-center text-gray-400">
                            <History size={40} className="mx-auto mb-3 opacity-20" />
                            <p>No payroll history found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            /* Base Salary Management Sub-Tab */
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <UserCog size={20} className="text-indigo-500" />
                            {t('baseSalary')}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Set the default monthly salary for each employee</p>
                    </div>
                </div>
                <div className="divide-y divide-gray-100">
                    <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                        <thead>
                            <tr className="text-xs text-gray-400 uppercase font-bold">
                                <th className="px-6 py-4">{t('staffMember')}</th>
                                <th className="px-6 py-4">{t('role')}</th>
                                <th className="px-6 py-4">{t('baseSalary')}</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {staff.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50/50 group transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border-2 border-white shadow-sm">
                                                {s.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-gray-800 text-sm">{s.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded-lg font-bold uppercase">
                                            {t(`role${s.role.charAt(0).toUpperCase() + s.role.slice(1)}` as any)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingBaseId === s.id ? (
                                            <div className="flex items-center gap-2 animate-fade-in">
                                                <input 
                                                    className="w-24 p-2 bg-white border border-indigo-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                                    type="number"
                                                    value={baseSalaryInput}
                                                    onChange={e => setBaseSalaryInput(e.target.value)}
                                                    autoFocus
                                                />
                                                <button onClick={() => handleUpdateBaseSalary(s.id)} className="p-2 bg-green-500 text-white rounded-lg shadow-sm hover:bg-green-600"><Check size={16}/></button>
                                                <button onClick={() => setEditingBaseId(null)} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300"><X size={16}/></button>
                                            </div>
                                        ) : (
                                            <span className="font-bold text-indigo-600 text-lg">{s.salary || 0} <span className="text-[10px] text-gray-400 font-normal uppercase">{t('currency')}</span></span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-left">
                                        {editingBaseId !== s.id && (
                                            <button 
                                                onClick={() => { setEditingBaseId(s.id); setBaseSalaryInput(s.salary?.toString() || ''); }}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:border-indigo-500 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Plus size={14} />
                                                {t('edit')}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {staff.length === 0 && <div className="p-20 text-center text-gray-400 italic">No staff members found.</div>}
                </div>
            </div>
        )}
    </div>
  );
};

export default StaffAffairs;
